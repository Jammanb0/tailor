// 코퍼스를 고친 뒤 생성물을 눈으로 보기 위한 실행기.
// 회차식 실험(30건 + 블라인드 채점)이 아니라 소량 확인용이다.
// 앱이 실제로 쓰는 /api/generate-skill 을 그대로 호출한다.
//
// 사용: node run.mjs <출력폴더> [runs] [concurrency] [시나리오id,...]
//
//   node run.mjs round21                     12종 × 1회, 전부
//   node run.mjs round21 2                   12종 × 2회
//   node run.mjs round21 1 3 05-design,08-explanation   두 종만
//
// **시나리오를 좁혀 쓸 것.** 조건부 카테고리 하나를 고쳤으면 그 카테고리 시나리오
// 하나에 대조 한둘이면 충분하다. 12종 전부는 공통 칸(baseline)이나 골격을
// 건드렸을 때만 — 매번 전부 돌리면 API 비용이 그만큼 든다(2026-08-21 기록).
//
// 이 파일이 유일한 실행기다. **사본을 만들지 말 것** — 한때 run2~run20까지
// 스무 개가 출력 폴더만 다른 채로 쌓여 어느 것이 기준인지 흐려졌다.
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
const OUT = process.argv[2];
if (!OUT) {
	console.error("출력 폴더를 주세요: node run.mjs <출력폴더> [runs] [concurrency] [시나리오id,...]");
	process.exit(1);
}
const RUNS = Number(process.argv[3] ?? 1);
const CONCURRENCY = Number(process.argv[4] ?? 3);
const ONLY = process.argv[5]
	? new Set(process.argv[5].split(",").map((x) => x.trim()))
	: null;
const ENDPOINT = "http://localhost:3000/api/generate-skill";

// 3차 회차의 시나리오 10종은 그 실험의 자료이므로 건드리지 않는다. 여기서 보탠
// 것은 scenarios-extra.json에 따로 두고 이어 붙인다.
//
// 보탠 두 종은 **그것을 시키는 시나리오가 없어 확인이 불가능했던** 자리다 —
// 계획 문서 쓰기(7차에서 드러남)와 좋은 테스트 쓰기(16차). 한 소스에 성격이
// 다른 두 덩어리가 있으면 시나리오도 둘이어야 한다.
const all = [
	...JSON.parse(
		readFileSync(join(HERE, "..", "2026-08-19-expand3", "scenarios.json"), "utf8"),
	),
	...JSON.parse(readFileSync(join(HERE, "scenarios-extra.json"), "utf8")),
];
const scenarios = ONLY ? all.filter((x) => ONLY.has(x.id)) : all;
if (!scenarios.length) {
	console.error(`고른 시나리오가 없습니다. 있는 것: ${all.map((x) => x.id).join(", ")}`);
	process.exit(1);
}

// 채점자에게 보일 것 / 정답지를 물리적으로 분리한다.
const VISIBLE = join(HERE, OUT, "for-grader");
const KEY = join(HERE, OUT, "answer-key");
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
	join(HERE, OUT, "raw-results.json"),
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
