// 프로덕션 생성 라우팅 정책 회귀 시험.
//
// 사용: node --experimental-strip-types --no-warnings tools/check-production-routing.mjs
//       (dev 서버가 3000 포트에 떠 있어야 한다)
//
// 실제 모델은 부르지 않는다. 순수 정책 함수와 개발 전용 route-preview fixture로
// full/routed/전환/정제 분기를 확인한다.

import { deepStrictEqual, equal, ok } from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	buildCorpusSystemBlock,
	readCorpusRoutingMode,
	resolveCorpusDeliveryPolicy,
	shouldSelectCorpus,
} from "../src/app/api/generate-skill/routing-policy.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ENDPOINT = "http://localhost:3000/api/route-preview";
const FULL_TEXT = readFileSync(
	join(ROOT, "tools/corpus-section.golden.txt"),
	"utf8",
);
const BASE = {
	answers: {
		tool: "cli",
		situation: "프로덕션 라우팅 회귀 시험",
		language: "ko",
	},
	wantsAdvanced: true,
};

const failures = [];
async function check(label, run) {
	try {
		await run();
		console.log(`  ok   ${label}`);
	} catch (error) {
		failures.push(`${label}\n       ${String(error.message).split("\n")[0]}`);
		console.log(`  FAIL ${label}`);
	}
}

async function post(body) {
	const response = await fetch(ENDPOINT, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ ...BASE, ...body }),
	});
	const text = await response.text();
	if (!response.ok) throw new Error(`HTTP ${response.status}: ${text}`);
	return JSON.parse(text);
}

await check("미설정·오류 설정은 full로 무너진다", () => {
	equal(readCorpusRoutingMode(undefined), "full");
	equal(readCorpusRoutingMode("FULL"), "full");
	equal(readCorpusRoutingMode("route"), "full");
	equal(readCorpusRoutingMode("routed"), "routed");
});

await check("full 설정은 선택기를 실행하지 않는다", () => {
	equal(
		shouldSelectCorpus({ configuredMode: "full", isRefinement: false }),
		false,
	);
});

await check("full system 블록은 기존 캐시 형태와 같다", () => {
	deepStrictEqual(
		buildCorpusSystemBlock({ text: "corpus", cacheCorpus: true }),
		{
			type: "text",
			text: "corpus",
			cache_control: { type: "ephemeral" },
		},
	);
});

await check("full 미리보기 본문은 현재 golden과 완전히 같다", async () => {
	const result = await post({ mode: "full", includeText: true });
	equal(result.selectionEnabled, false);
	equal(result.selection, null);
	equal(result.render.corpusMode, "full");
	equal(result.render.cacheCorpus, true);
	equal(result.render.injectedText, FULL_TEXT);
});

await check("routed 성공은 캐시 없이 선택 코퍼스를 쓴다", async () => {
	const result = await post({ mode: "routed", bundleIds: ["tdd-cycle"] });
	equal(result.selectionEnabled, true);
	equal(result.routingDecision.fallback, false);
	equal(result.render.corpusMode, "routed");
	equal(result.render.cacheCorpus, false);
	ok(result.render.injectedBytes < result.render.fullBytes);
	deepStrictEqual(
		buildCorpusSystemBlock({ text: "corpus", cacheCorpus: false }),
		{ type: "text", text: "corpus" },
	);
});

const fallbackFixtures = [
	["F1", { error: "network" }],
	["F2", { hang: true }],
	["F3", { rawText: "</bundles>", stopReason: "end_turn" }],
	["F4", { rawText: "<bundles>\n</bundles>", stopReason: "end_turn" }],
	[
		"F5",
		{
			rawText: "<bundles>\n[made-up-bundle]\n</bundles>",
			stopReason: "end_turn",
		},
	],
	[
		"F6",
		{ rawText: "<bundles>\n[tdd-cycle]\n</bundles>", stopReason: "max_tokens" },
	],
];

for (const [reasonId, selectionFixture] of fallbackFixtures) {
	await check(`${reasonId}은 기존 full 본문과 캐시로 전환한다`, async () => {
		const result = await post({
			mode: "routed",
			selectionFixture,
			includeText: true,
		});
		equal(result.routingDecision.fallback, true);
		ok(result.routingDecision.fallbackReasonIds.includes(reasonId));
		equal(result.render.corpusMode, "full");
		equal(result.render.cacheCorpus, true);
		equal(result.render.injectedText, FULL_TEXT);
	});
}

await check("F7은 기록만 하고 routed를 유지한다", async () => {
	const result = await post({
		mode: "routed",
		selectionFixture: {
			rawText: "<bundles>\n[tdd-cycle]\n[made-up-bundle]\n</bundles>",
			stopReason: "end_turn",
		},
	});
	deepStrictEqual(result.routingDecision.ambiguityIds, ["F7"]);
	equal(result.routingDecision.fallback, false);
	equal(result.render.corpusMode, "routed");
	equal(result.render.cacheCorpus, false);
});

await check("정제는 routed 설정이어도 선택 없이 full을 쓴다", async () => {
	equal(
		shouldSelectCorpus({ configuredMode: "routed", isRefinement: true }),
		false,
	);
	const result = await post({
		mode: "routed",
		simulateRefinement: true,
		selectionFixture: { error: "network" },
	});
	equal(result.selectionEnabled, false);
	equal(result.selection, null);
	equal(result.routingDecision, null);
	equal(result.render.corpusMode, "full");
	equal(result.render.cacheCorpus, true);
});

await check("full→routed→full 양방향 정책이 결정적이다", () => {
	const full = resolveCorpusDeliveryPolicy({
		selectionEnabled: false,
		selectionFallback: false,
		hasRoutedSection: false,
	});
	const routed = resolveCorpusDeliveryPolicy({
		selectionEnabled: true,
		selectionFallback: false,
		hasRoutedSection: true,
	});
	const restored = resolveCorpusDeliveryPolicy({
		selectionEnabled: false,
		selectionFallback: false,
		hasRoutedSection: false,
	});
	deepStrictEqual(full, { mode: "full", cacheCorpus: true });
	deepStrictEqual(routed, { mode: "routed", cacheCorpus: false });
	deepStrictEqual(restored, full);
});

await check("프로덕션 라우트가 공용 정책·계측·출처 방어를 사용한다", () => {
	// 흐름은 generate.ts로 옮겼고 라우트는 그것을 부르기만 한다. 두 파일을
	// 함께 읽어야 「프로덕션 경로가 무엇을 쓰는가」를 그대로 확인할 수 있다.
	const source = ["route.ts", "generate.ts"]
		.map((name) =>
			readFileSync(join(ROOT, "src/app/api/generate-skill", name), "utf8"),
		)
		.join("\n");
	for (const fragment of [
		"process.env.CORPUS_ROUTING_MODE",
		"prepareGenerationCorpus({",
		"buildCorpusSystemBlock({",
		// operationId를 함께 싣게 되면서 인자가 객체 펼침으로 바뀌었다. 확인해야
		// 할 것은 「라우팅 계측이 실제 선택 결과를 받는가」이므로 그 부분만 본다.
		"logRouting({ ...preparedCorpus.routing",
		"preparedCorpus.deliveredPatternIds",
		// 선택이 중단 대상 오류로 죽으면 생성 호출로 넘어가지 않는다.
		"preparedCorpus.selectionStop",
		// 선택 호출의 실패와 우리 코드의 후처리 실패를 따로 남긴다.
		"preparedCorpus.selectionError",
		"preparedCorpus.selectionProcessingError",
		'"selection-processing"',
		// 운영 관찰 계측. 배선이 빠지면 요청은 정상인데 표만 비므로, 프로덕션
		// 경로를 보는 이 검사에서 함께 확인한다. 저장의 세부는
		// `pnpm check:observation`이 본다.
		"savePendingObservation(",
		"saveFinalObservation({",
	]) {
		ok(source.includes(fragment), `프로덕션 연결 누락: ${fragment}`);
	}
});

await check("라우트는 입력 상한 검사를 거친 요청만 넘긴다", () => {
	const source = readFileSync(
		join(ROOT, "src/app/api/generate-skill/route.ts"),
		"utf8",
	);
	for (const fragment of ["readValidatedRequest(request)", "runGeneration({"]) {
		ok(source.includes(fragment), `프로덕션 연결 누락: ${fragment}`);
	}
});

if (failures.length) {
	console.error(`\nFAIL ${failures.length}건\n`);
	for (const failure of failures) console.error(`  - ${failure}`);
	process.exit(1);
}
console.log("\nOK  프로덕션 라우팅 회귀 시험 통과");
