// 코퍼스 라우팅 회귀 시험.
//
// 사용: node tools/check-routing.mjs   (dev 서버가 3000 포트에 떠 있어야 한다)
//
// 선택 모델을 부르지 않는다 — 묶음 id를 직접 넘겨 「고른 뒤에 벌어지는 일」만
// 본다. 그래서 API 키도, 비용도 들지 않는다. 모델이 잘 고르는지는 여기서 잴 수
// 없고 6단계 사람 판정의 몫이다.
//
// 라우팅 모듈은 `@/` 별칭과 TS로 쓰여 있어 node가 그대로 불러오지 못한다.
// check-tag-parser.mjs처럼 소스를 뽑아 돌리는 방법은 여기선 못 쓴다 —
// resolveDelivery는 코퍼스 전체로 만든 모듈 상태에 기대기 때문이다. 그래서
// check-corpus-render.mjs와 같이 앱 안에서 돌리고 HTTP로 확인한다. 사본을
// 시험하면 파일을 안 고쳐도 통과해서 시험의 뜻이 없어진다.
//
// 잡는 것 중 첫 번째가 실제로 났던 결함이다. 직접 신호가 「켜기」만 하고
// 「끄기」를 안 해서, "가끔 쓴다"고 답한 사람에게도 묶음이 token-budget을
// 데려오면 자주 쓰는 스킬용 분량 규칙이 그대로 실렸다.
import { deepStrictEqual } from "node:assert";

const ENDPOINT = "http://localhost:3000/api/route-preview";
const BASE = { tool: "cli", situation: "회귀 시험용", language: "ko" };

async function plan({ answers = {}, bundleIds }) {
	const res = await fetch(ENDPOINT, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			answers: { ...BASE, ...answers },
			wantsAdvanced: true,
			bundleIds,
		}),
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
	return (await res.json()).plan;
}

const failures = [];
async function check(label, run) {
	try {
		await run();
		console.log(`  ok   ${label}`);
	} catch (e) {
		failures.push(`${label}\n       ${e.message.split("\n")[0]}`);
		console.log(`  FAIL ${label}`);
	}
}

const has = (p, id) => p.patternIds.includes(id);

// ── 직접 신호: 답이 있으면 판정이 끝난다 ────────────────────────────
await check("frequency=often이면 token-budget을 켠다", async () => {
	const p = await plan({ answers: { frequency: "often" }, bundleIds: [] });
	if (!has(p, "token-budget")) throw new Error("켜지지 않았습니다");
	deepStrictEqual(p.directSignalPatternIds, ["token-budget"]);
});

await check(
	"frequency=rarely면 묶음이 데려와도 token-budget을 끈다",
	async () => {
		const p = await plan({
			answers: { frequency: "rarely" },
			bundleIds: ["frequent-skill-budget"],
		});
		if (has(p, "token-budget")) throw new Error("꺼지지 않고 실렸습니다");
		deepStrictEqual(p.directSignalOffPatternIds, ["token-budget"]);
	},
);

await check("빈도 답이 없으면 켜지도 끄지도 않는다", async () => {
	const p = await plan({ bundleIds: [] });
	deepStrictEqual(p.directSignalPatternIds, []);
	deepStrictEqual(p.directSignalOffPatternIds, []);
	deepStrictEqual(p.undecidedSignalPatternIds, ["token-budget"]);
	if (has(p, "token-budget")) throw new Error("답이 없는데 실렸습니다");
});

await check("빈도 답이 없으면 묶음 선택이 판정을 대신한다", async () => {
	const p = await plan({ bundleIds: ["frequent-skill-budget"] });
	if (!has(p, "token-budget")) throw new Error("묶음이 골랐는데 빠졌습니다");
});

// ── 전달 목록 만들기 ────────────────────────────────────────────────
await check("공통 기본(always)은 묶음을 안 골라도 실린다", async () => {
	const p = await plan({ bundleIds: [] });
	if (!p.alwaysPatternIds.length) throw new Error("always가 비었습니다");
	for (const id of p.alwaysPatternIds) {
		if (!has(p, id)) throw new Error(`${id}가 빠졌습니다`);
	}
});

await check("같은 패턴이 여러 묶음에 있어도 한 번만 싣는다", async () => {
	const p = await plan({
		bundleIds: ["completion-evidence", "delegated-verification"],
	});
	const seen = new Set(p.patternIds);
	if (seen.size !== p.patternIds.length) throw new Error("중복이 남았습니다");
	if (!has(p, "verify-before-done")) throw new Error("공통 멤버가 빠졌습니다");
});

await check("같은 묶음 id를 두 번 넘겨도 한 번만 센다", async () => {
	const p = await plan({ bundleIds: ["tdd-cycle", "tdd-cycle"] });
	deepStrictEqual(p.bundleIds, ["tdd-cycle"]);
});

await check("requires·flow는 전달 목록 안에서 닫힌다", async () => {
	const p = await plan({ bundleIds: ["skill-authoring-discipline"] });
	if (!has(p, "rationalization-table") || !has(p, "red-flags-list")) {
		throw new Error("bulletproofing-toolkit의 짝이 빠졌습니다");
	}
});

// ── 온라인/평가 경계 ────────────────────────────────────────────────
await check("평가 전용 묶음은 온라인 전달에서 뺀다", async () => {
	const p = await plan({ bundleIds: ["skill-authoring-evaluation"] });
	deepStrictEqual(p.rejectedBundleIds, ["skill-authoring-evaluation"]);
	deepStrictEqual(p.bundleIds, []);
	if (has(p, "skill-creation-checklist") || has(p, "skill-type-testing")) {
		throw new Error("평가 전용 패턴이 실렸습니다");
	}
});

await check("목록에 없는 묶음 id는 버리고 남긴다", async () => {
	const p = await plan({ bundleIds: ["made-up-bundle", "tdd-cycle"] });
	deepStrictEqual(p.unknownBundleIds, ["made-up-bundle"]);
	deepStrictEqual(p.bundleIds, ["tdd-cycle"]);
});

if (failures.length) {
	console.error(`\nFAIL ${failures.length}건\n`);
	for (const one of failures) console.error(`  - ${one}`);
	process.exit(1);
}
console.log("\nOK  라우팅 회귀 시험 통과");
