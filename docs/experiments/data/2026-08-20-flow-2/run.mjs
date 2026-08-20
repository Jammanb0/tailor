// flow 필드 A/B 생성 실행기 — 2차 (2026-08-20). 1차는 ../2026-08-20-flow/
//
// 사용: node run.mjs [concurrency]   기본 3.
//
// /api/eval-flow 를 호출한다. 두 조건의 차이는 시스템 프롬프트의 코퍼스 블록
// 하나뿐이고, 그 분기는 라우트가 갖는다 — 여기서 프롬프트를 만들지 않는다.
//
// 동시 실행을 3으로 낮게 잡는 이유: 2026-08-18 headings 실험에서 한도 소진으로
// 30건 중 22건이 깨졌다. 실패가 보이면 올리지 말고 내릴 것.
//
// 한 건 끝날 때마다 즉시 저장한다. 중간에 한도에 걸려도 거기까지는 남는다.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONCURRENCY = Number(process.argv[2] ?? 3);
const ENDPOINT = "http://localhost:3000/api/eval-flow";

const scenarios = JSON.parse(readFileSync(join(HERE, "scenarios.json"), "utf8"));

// 채점자에게 보일 것 / 정답지를 물리적으로 분리한다.
const VISIBLE = join(HERE, "for-grader");
const KEY = join(HERE, "answer-key");
mkdirSync(VISIBLE, { recursive: true });
mkdirSync(KEY, { recursive: true });

const jobs = [];
for (const s of scenarios) {
	for (const corpus of ["on", "off"]) {
		for (let run = 1; run <= s.runs; run++) {
			jobs.push({ scenario: s, corpus, run });
		}
	}
}
// 실행 순서를 섞는다. 조건별로 몰아 돌리면 시간대 차이가 조건 차이로 섞여든다.
for (let i = jobs.length - 1; i > 0; i--) {
	const j = Math.floor(Math.random() * (i + 1));
	[jobs[i], jobs[j]] = [jobs[j], jobs[i]];
}

const results = [];
let done = 0;

async function execute(job) {
	const label = `${job.scenario.id}-${job.corpus}-run${job.run}`;
	let json = null;
	let error = null;
	try {
		const res = await fetch(ENDPOINT, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				situation: job.scenario.situation,
				corpus: job.corpus,
			}),
		});
		json = await res.json();
		if (json.error) error = json.error;
	} catch (e) {
		error = String(e);
	}
	done += 1;
	const ok = !error && json?.skillMarkdown;
	console.log(
		`[${done}/${jobs.length}] ${ok ? "OK " : "FAIL"} ${label}` +
			(error ? ` — ${error.slice(0, 90)}` : ` (${json?.skillMarkdown?.length ?? 0}자)`),
	);
	results.push({
		scenarioId: job.scenario.id,
		role: job.scenario.role,
		corpus: job.corpus,
		run: job.run,
		error,
		elapsedMs: json?.elapsedMs ?? null,
		costUsd: json?.costUsd ?? null,
		archetype: json?.archetype ?? null,
		usedPatterns: json?.usedPatterns ?? [],
		skillMarkdown: json?.skillMarkdown ?? "",
		review: json?.review ?? [],
		questions: json?.questions ?? [],
	});
	writeFileSync(
		join(HERE, "raw-results.json"),
		JSON.stringify(results, null, "\t"),
	);
}

const queue = [...jobs];
await Promise.all(
	Array.from({ length: CONCURRENCY }, async () => {
		while (queue.length) await execute(queue.shift());
	}),
);

// ── 블라인드 자료 만들기 ──────────────────────────────────────────
// 조건 라벨을 떼고 섞는다. 어느 구간을 잘라도 두 조건이 섞이도록 무작위 배치한다.
const measured = results.filter((r) => r.skillMarkdown);
for (let i = measured.length - 1; i > 0; i--) {
	const j = Math.floor(Math.random() * (i + 1));
	[measured[i], measured[j]] = [measured[j], measured[i]];
}
const key = [];
measured.forEach((r, i) => {
	const item = `item-${String(i + 1).padStart(3, "0")}`;
	writeFileSync(join(VISIBLE, `${item}.md`), r.skillMarkdown);
	key.push({
		item,
		scenarioId: r.scenarioId,
		role: r.role,
		corpus: r.corpus,
		run: r.run,
		archetype: r.archetype,
	});
});
writeFileSync(join(KEY, "key.json"), JSON.stringify(key, null, "\t"));

const failed = results.filter((r) => !r.skillMarkdown).length;
const cost = results.reduce((n, r) => n + (r.costUsd ?? 0), 0);
console.log(
	`\n완료 ${measured.length}/${jobs.length} (실패 ${failed}) — 비용 $${cost.toFixed(3)}`,
);
console.log("먼저 성공 건수를 확인할 것. 8/30만 완료된 적이 있다(2026-08-18).");
