// baseline 1차 채우기 후 생성 확인 — 회차식 실험이 아니라 눈으로 보기 위한 소량 실행.
// 코퍼스 렌더 93,845바이트 조건(직전 84,980). 시나리오는 3차 회차 것을 그대로 쓴다.
// 앱이 실제로 쓰는 /api/generate-skill 을 그대로 호출한다.
//
// 사용: node run.mjs [runs] [concurrency]
//       기본 3회 × 시나리오 10종 = 30건, 동시 3건.
//
// 동시 실행을 넣은 이유: 순차로 30건이면 대기가 길다. 다만 2026-08-18 headings
// 실험에서 한도 소진으로 30건 중 22건이 invalid_request_error로 깨진 적이 있어,
// 동시 수를 낮게(3) 잡는다. 실패가 보이면 올리지 말고 내릴 것.
//
// 결과 순서는 시나리오 선언 순서 → run 번호 순으로 정렬해 저장한다. 동시 실행이라
// 완료 순서가 뒤섞이는데, 파일 순서가 실행마다 달라지면 자료 대조가 번거로워진다.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNS = Number(process.argv[2] ?? 3);
const CONCURRENCY = Number(process.argv[3] ?? 3);
const ENDPOINT = "http://localhost:3000/api/generate-skill";

// 3차 회차의 시나리오 10종은 그 실험의 자료이므로 건드리지 않는다. 이 폴더에서
// 보탠 것은 scenarios-extra.json에 따로 두고 여기서 이어 붙인다.
//
// 11번을 보탠 이유: 시나리오 10종에 「계획 문서를 쓰게 하는」 것이 없어서
// plan-writing-flow를 확인할 방법이 없었다(7차에서 드러났다). 03-planning은
// 계획 문서 쓰기가 아니라 코드 전 설계 합의를 시키는 시나리오다.
const scenarios = [
	...JSON.parse(
		readFileSync(join(HERE, "..", "2026-08-19-expand3", "scenarios.json"), "utf8"),
	),
	...JSON.parse(readFileSync(join(HERE, "scenarios-extra.json"), "utf8")),
];

// 채점자에게 보일 것 / 정답지를 물리적으로 분리한다.
const VISIBLE = join(HERE, "round17", "for-grader");
const KEY = join(HERE, "round17", "answer-key");
mkdirSync(VISIBLE, { recursive: true });
mkdirSync(KEY, { recursive: true });

const jobs = [];
for (const [si, s] of scenarios.entries()) {
	for (let run = 1; run <= RUNS; run++) {
		jobs.push({ order: si * 1000 + run, scenario: s, run });
	}
}

async function execute({ order, scenario: s, run }) {
	const label = `${s.id}-run${run}`;
	const startedAt = Date.now();
	let res;
	let json;
	let error = null;
	try {
		res = await fetch(ENDPOINT, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				answers: { tool: "cli", situation: s.situation, language: "ko" },
				wantsAdvanced: false,
			}),
		});
		json = await res.json();
	} catch (e) {
		error = String(e);
	}
	const ms = Date.now() - startedAt;

	if (error || !res?.ok) {
		console.log(`FAIL ${label} (${ms}ms) ${error ?? res.status}`);
		return {
			order,
			raw: {
				label,
				ok: false,
				ms,
				status: res?.status ?? null,
				error,
				body: json ?? null,
			},
		};
	}

	console.log(
		`OK   ${label} (${ms}ms) ${(json.skillMarkdown ?? "").length}자` +
			` 출처=${(json.referencedSources ?? []).length}` +
			` 구조출처=${(json.structureSources ?? []).length}` +
			(json.needsMoreInfo ? " [되물음]" : ""),
	);

	return {
		order,
		// 채점자용: 스킬 본문과 되물음만. 모델의 자가 보고는 제외한다.
		doc: {
			label,
			category: s.category,
			situation: s.situation,
			filename: json.suggestedFilename ?? null,
			skillMarkdown: json.skillMarkdown ?? null,
			needsMoreInfo: json.needsMoreInfo ?? false,
			clarifyingQuestions: json.clarifyingQuestions ?? [],
			reviewNotes: json.reviewNotes ?? [],
		},
		// 정답지: 화면에 뜰 출처. 채점자에게 주지 않는다.
		// (패턴 id는 API 응답에 없다 — 패턴 반영 여부는 문서 기계 집계로 따로 센다.)
		key: {
			label,
			category: s.category,
			referencedSources: json.referencedSources ?? null,
			structureSources: json.structureSources ?? null,
		},
		raw: { label, ok: true, ms, chars: (json.skillMarkdown ?? "").length, json },
	};
}

// 동시 실행 풀 — 앞에서부터 하나씩 집어간다.
const results = [];
let next = 0;
await Promise.all(
	Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, async () => {
		while (next < jobs.length) {
			const job = jobs[next++];
			results.push(await execute(job));
		}
	}),
);

results.sort((a, b) => a.order - b.order);
const docs = results.filter((r) => r.doc).map((r) => r.doc);
const key = results.filter((r) => r.key).map((r) => r.key);
const raw = results.map((r) => r.raw);

writeFileSync(
	join(VISIBLE, "generated-docs.json"),
	JSON.stringify(docs, null, 2),
	"utf8",
);
writeFileSync(
	join(KEY, "self-report.json"),
	JSON.stringify(key, null, 2),
	"utf8",
);
writeFileSync(
	join(HERE, "round17", "raw-results.json"),
	JSON.stringify(raw, null, 2),
	"utf8",
);

const okCount = raw.filter((r) => r.ok).length;
console.log(`\n완료: ${okCount}/${raw.length} 성공`);
if (okCount < raw.length) {
	console.log(
		"⚠ 실패가 있다. 부분 자료로 수치를 내지 말 것 — 한도 복구 후 처음부터 다시 받는다.",
	);
}
