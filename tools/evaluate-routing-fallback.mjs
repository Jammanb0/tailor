// 9단계 전체 코퍼스 전환 안전장치의 무비용 검사.
//
// 사용: node tools/evaluate-routing-fallback.mjs
// 전제: dev 서버가 3000 포트에 떠 있어야 한다.
//
// 선택 모델과 생성 모델은 부르지 않는다. 실패 응답 21건과 저장된 실제 선택
// 응답 20건을 개발 전용 /api/route-preview에 주입한다.

import { deepStrictEqual, equal, ok } from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "docs/experiments/data/2026-08-29-routing-fallback");
const STEP6 = join(
	ROOT,
	"docs/experiments/data/2026-08-28-routing-eval/selection-results.json",
);
const STEP8 = join(
	ROOT,
	"docs/experiments/data/2026-08-28-routing-comparison/generation/end-to-end-results.json",
);
const OUTPUT = join(DATA, "free-check-results.json");
const PAID_OUTPUT = join(DATA, "paid-generation-results.json");
const ENDPOINT = "http://localhost:3000/api/route-preview";
const FULL_BYTES = 141_597;
const BASE_ANSWERS = {
	tool: "cli",
	situation: "9단계 안전장치 무비용 검사",
	language: "ko",
};
const OBSERVED_BUDGET_STOP_USD = 0.5;

const load = (path) => JSON.parse(readFileSync(path, "utf8"));
const sorted = (values) => [...values].sort();

async function post(body) {
	const response = await fetch(ENDPOINT, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(body),
	});
	const text = await response.text();
	if (!response.ok) throw new Error(`HTTP ${response.status}: ${text}`);
	return JSON.parse(text);
}

const failure = (id, fixture, reasonIds) => ({
	id,
	fixture,
	expected: {
		status: "failure",
		fallback: true,
		fallbackReasonIds: reasonIds,
		ambiguityIds: [],
	},
});

const ambiguous = (id, rawText) => ({
	id,
	fixture: { rawText, stopReason: "end_turn" },
	expected: {
		status: "ambiguous",
		fallback: false,
		fallbackReasonIds: [],
		ambiguityIds: ["F7"],
	},
});

const fixtures = [
	failure("F1-network", { error: "network" }, ["F1"]),
	failure("F1-http-500", { error: "http-500" }, ["F1"]),
	failure("F1-auth-401", { error: "auth-401" }, ["F1"]),
	failure(
		"F2-10.5-seconds",
		{
			delayMs: 10_500,
			rawText: "<bundles>\n[tdd-cycle]\n</bundles>",
			stopReason: "end_turn",
		},
		["F2"],
	),
	failure("F2-no-response", { hang: true }, ["F2"]),
	failure(
		"F2-12-seconds-valid",
		{
			delayMs: 12_000,
			rawText: "<bundles>\n[tdd-cycle]\n</bundles>",
			stopReason: "end_turn",
		},
		["F2"],
	),
	failure("F3-plain-text", { rawText: "tdd-cycle", stopReason: "end_turn" }, [
		"F3",
	]),
	failure(
		"F3-wrong-tag",
		{ rawText: "<bundle>\n[tdd-cycle]\n</bundle>", stopReason: "end_turn" },
		["F3"],
	),
	failure("F3-close-only", { rawText: "</bundles>", stopReason: "end_turn" }, [
		"F3",
	]),
	failure(
		"F4-empty-closed",
		{ rawText: "<bundles></bundles>", stopReason: "end_turn" },
		["F4"],
	),
	failure(
		"F4-whitespace",
		{ rawText: "<bundles>   </bundles>", stopReason: "end_turn" },
		["F4"],
	),
	failure(
		"F4-empty-lines",
		{ rawText: "<bundles>\n\n</bundles>", stopReason: "end_turn" },
		["F4"],
	),
	failure(
		"F5-two-unknown",
		{
			rawText: "<bundles>\n[not-a-real-bundle]\n[missing-bundle]\n</bundles>",
			stopReason: "end_turn",
		},
		["F5"],
	),
	failure(
		"F5-evaluation-only",
		{
			rawText: "<bundles>\n[skill-authoring-evaluation]\n</bundles>",
			stopReason: "end_turn",
		},
		["F5"],
	),
	failure(
		"F5-unknown-and-evaluation-only",
		{
			rawText:
				"<bundles>\n[not-a-real-bundle]\n[skill-authoring-evaluation]\n</bundles>",
			stopReason: "end_turn",
		},
		["F5"],
	),
	failure(
		"F6-two-valid",
		{
			rawText: "<bundles>\n[tdd-cycle]\n[test-discipline]",
			stopReason: "max_tokens",
		},
		["F6"],
	),
	failure(
		"F6-empty",
		{ rawText: "<bundles></bundles>", stopReason: "max_tokens" },
		["F4", "F6"],
	),
	failure(
		"F6-truncated-id",
		{
			rawText: "<bundles>\n[implementation-plan-struc",
			stopReason: "max_tokens",
		},
		["F5", "F6"],
	),
	ambiguous(
		"F7-valid-and-unknown",
		"<bundles>\n[tdd-cycle]\n[not-a-real-bundle]\n</bundles>",
	),
	ambiguous(
		"F7-valid-and-evaluation-only",
		"<bundles>\n[tdd-cycle]\n[skill-authoring-evaluation]\n</bundles>",
	),
	ambiguous(
		"F7-valid-unknown-and-evaluation-only",
		"<bundles>\n[tdd-cycle]\n[not-a-real-bundle]\n[skill-authoring-evaluation]\n</bundles>",
	),
];

async function runFixtureChecks(fullText) {
	const results = [];
	for (const fixture of fixtures) {
		const response = await post({
			answers: BASE_ANSWERS,
			selectionFixture: fixture.fixture,
			includeText: true,
		});
		const decision = response.routingDecision;
		equal(decision.status, fixture.expected.status, `${fixture.id}: status`);
		equal(
			decision.fallback,
			fixture.expected.fallback,
			`${fixture.id}: fallback`,
		);
		deepStrictEqual(
			sorted(decision.fallbackReasonIds),
			sorted(fixture.expected.fallbackReasonIds),
			`${fixture.id}: fallbackReasonIds`,
		);
		deepStrictEqual(
			sorted(decision.ambiguityIds),
			sorted(fixture.expected.ambiguityIds),
			`${fixture.id}: ambiguityIds`,
		);
		ok(Number.isFinite(decision.selectionMs), `${fixture.id}: selectionMs`);
		if (fixture.id.startsWith("F2-")) {
			equal(
				decision.selectionAbortObserved,
				true,
				`${fixture.id}: abort signal`,
			);
			equal(
				decision.selectionCompletedNaturally,
				false,
				`${fixture.id}: background completion`,
			);
		}
		if (decision.fallback) {
			equal(response.render.injectedBytes, FULL_BYTES, `${fixture.id}: bytes`);
			equal(
				response.render.injectedText,
				fullText,
				`${fixture.id}: full render`,
			);
		}
		results.push({
			id: fixture.id,
			status: decision.status,
			fallback: decision.fallback,
			fallbackReasonIds: decision.fallbackReasonIds,
			ambiguityIds: decision.ambiguityIds,
			selectionMs: decision.selectionMs,
			selectionAbortObserved: decision.selectionAbortObserved,
			selectionCompletedNaturally: decision.selectionCompletedNaturally,
			injectedBytes: response.render.injectedBytes,
		});
		console.log(`OK  ${fixture.id}`);
	}
	return results;
}

function storedSelections() {
	const step6 = load(STEP6)
		.filter((entry) => entry.ok)
		.map((entry) => ({
			id: `step6-${entry.id}`,
			selection: entry.response.selection,
			expectedBundleIds: entry.response.plan.bundleIds,
		}));
	const step8 = load(STEP8).results.map((entry) => ({
		id: `step8-${entry.scenarioId}`,
		selection: entry.response.selection,
		expectedBundleIds: entry.response.plan.bundleIds,
	}));
	equal(step6.length, 17, "6단계 선택 결과 수");
	equal(step8.length, 3, "8단계 end-to-end 선택 결과 수");
	return [...step6, ...step8];
}

async function runFalsePositiveChecks() {
	const results = [];
	for (const entry of storedSelections()) {
		const response = await post({
			answers: BASE_ANSWERS,
			selectionFixture: {
				rawText: entry.selection.rawText,
				stopReason: "end_turn",
				usage: entry.selection.usage,
			},
		});
		const decision = response.routingDecision;
		equal(decision.fallback, false, `${entry.id}: 오탐`);
		equal(decision.status, "success", `${entry.id}: status`);
		deepStrictEqual(
			response.plan.bundleIds,
			entry.expectedBundleIds,
			`${entry.id}: bundles`,
		);
		deepStrictEqual(
			decision.selectionUsage,
			entry.selection.usage,
			`${entry.id}: usage 계측`,
		);
		results.push({
			id: entry.id,
			fallback: false,
			bundleIds: response.plan.bundleIds,
		});
	}

	const nearDeadline = await post({
		answers: BASE_ANSWERS,
		selectionFixture: {
			delayMs: 9_500,
			rawText: "<bundles>\n[tdd-cycle]\n</bundles>",
			stopReason: "end_turn",
		},
	});
	equal(nearDeadline.routingDecision.fallback, false, "9.5초 정상 응답 오탐");
	equal(
		nearDeadline.routingDecision.selectionCompletedNaturally,
		true,
		"9.5초 정상 응답 완료",
	);

	const minimum = await post({
		answers: BASE_ANSWERS,
		selectionFixture: {
			rawText: "<bundles>\n[tdd-cycle]\n</bundles>",
			stopReason: "end_turn",
		},
	});
	equal(minimum.routingDecision.fallback, false, "유효 묶음 1개 오탐");
	deepStrictEqual(minimum.plan.bundleIds, ["tdd-cycle"]);

	results.push(
		{
			id: "boundary-9.5-seconds",
			fallback: false,
			selectionMs: nearDeadline.routingDecision.selectionMs,
		},
		{ id: "boundary-one-valid", fallback: false, bundleIds: ["tdd-cycle"] },
	);
	return results;
}

async function runFreeChecks() {
	const full = await post({
		mode: "full",
		answers: BASE_ANSWERS,
		includeText: true,
	});
	equal(full.render.fullBytes, FULL_BYTES, "전체 코퍼스 기준 바이트");
	equal(full.render.injectedBytes, FULL_BYTES, "full 주입 바이트");
	const fixtureResults = await runFixtureChecks(full.render.injectedText);
	const replayResults = await runFalsePositiveChecks();

	const result = {
		createdAt: new Date().toISOString(),
		complete: true,
		axes: {
			fixtureBranches: { passed: fixtureResults.length, total: 21 },
			falsePositives: { count: 0, replayed: 20, boundaries: 2 },
			fullRender: {
				fallbackCasesCompared: fixtureResults.filter((entry) => entry.fallback)
					.length,
				bytes: FULL_BYTES,
				exactTextMatch: true,
			},
			telemetry: {
				exactReasonSets: true,
				timeoutAbortObserved: true,
				usageReplayPreserved: true,
			},
		},
		fixtureResults,
		replayResults,
	};
	writeFileSync(OUTPUT, `${JSON.stringify(result, null, 2)}\n`);
	console.log("\nOK  9단계 무비용 축 1~4 통과");
	console.log("    fixture 21/21 · 실제 선택 재생 20건 오탐 0 · 경계 2/2");
	console.log(
		`    전환 렌더 ${result.axes.fullRender.fallbackCasesCompared}건 모두 ${FULL_BYTES}바이트 일치`,
	);
}

function observedGenerationCost(usage) {
	if (!usage) return 0;
	return (
		((usage.input_tokens ?? 0) * 2 +
			(usage.cache_creation_input_tokens ?? 0) * 2 * 1.25 +
			(usage.cache_read_input_tokens ?? 0) * 2 * 0.1 +
			(usage.output_tokens ?? 0) * 10) /
		1_000_000
	);
}

function paidScenarios() {
	const scenarios = [
		...load(
			join(ROOT, "docs/experiments/data/2026-08-19-expand3/scenarios.json"),
		),
		...load(
			join(
				ROOT,
				"docs/experiments/data/2026-08-20-baseline-fill/scenarios-extra.json",
			),
		),
		...load(
			join(
				ROOT,
				"docs/experiments/data/2026-08-28-routing-eval/scenarios-routing.json",
			),
		),
	];
	const byId = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
	return [
		{
			conditionId: "F1",
			scenario: byId.get("14-three-line-memo"),
			selectionFixture: { error: "network" },
		},
		{
			conditionId: "F3",
			scenario: byId.get("10-mismatch-setup"),
			selectionFixture: { rawText: "tdd-cycle", stopReason: "end_turn" },
		},
	];
}

async function runPaidGeneration() {
	if (!existsSync(OUTPUT) || !load(OUTPUT).complete) {
		throw new Error("통과한 무비용 축 1~4 결과가 먼저 필요합니다");
	}
	const previous = existsSync(PAID_OUTPUT) ? load(PAID_OUTPUT) : null;
	if (previous?.complete) {
		throw new Error("유료 생성 결과가 이미 있습니다. 덮어쓰지 않습니다");
	}

	let observedCostUsd = previous?.observedCostUsd ?? 0;
	const results = previous?.results ?? [];
	const scenarios = paidScenarios();
	for (const entry of scenarios.slice(results.length)) {
		ok(entry.scenario, `${entry.conditionId}: 시나리오 원문`);
		if (observedCostUsd > OBSERVED_BUDGET_STOP_USD) {
			throw new Error(
				`관측 실행 비용 $${observedCostUsd.toFixed(4)}가 중단선 $${OBSERVED_BUDGET_STOP_USD.toFixed(2)}를 넘었습니다`,
			);
		}
		const response = await post({
			answers: {
				tool: "cli",
				language: "ko",
				situation: entry.scenario.situation,
			},
			selectionFixture: entry.selectionFixture,
			generate: true,
		});
		equal(
			response.routingDecision.fallback,
			true,
			`${entry.conditionId}: fallback`,
		);
		deepStrictEqual(response.routingDecision.fallbackReasonIds, [
			entry.conditionId,
		]);
		equal(
			response.render.injectedBytes,
			FULL_BYTES,
			`${entry.conditionId}: bytes`,
		);
		ok(response.generation?.skillMarkdown, `${entry.conditionId}: <skill_md>`);
		const callCostUsd = observedGenerationCost(response.generation.usage);
		observedCostUsd += callCostUsd;
		results.push({
			conditionId: entry.conditionId,
			scenarioId: entry.scenario.id,
			callCostUsd,
			routingDecision: response.routingDecision,
			injectedBytes: response.render.injectedBytes,
			generation: response.generation,
		});
		writeFileSync(
			PAID_OUTPUT,
			`${JSON.stringify(
				{
					createdAt: new Date().toISOString(),
					complete: false,
					observedBudgetStopUsd: OBSERVED_BUDGET_STOP_USD,
					observedCostUsd,
					results,
				},
				null,
				2,
			)}\n`,
		);
		console.log(
			`OK  ${entry.conditionId} ${entry.scenario.id} · 관측 $${callCostUsd.toFixed(4)}`,
		);
	}

	const result = {
		createdAt: new Date().toISOString(),
		complete: results.length === scenarios.length,
		observedBudgetStopUsd: OBSERVED_BUDGET_STOP_USD,
		observedCostUsd,
		results,
	};
	writeFileSync(PAID_OUTPUT, `${JSON.stringify(result, null, 2)}\n`);
	console.log(
		`\nOK  9단계 유료 축 5 ${results.length}/2 · 관측 $${observedCostUsd.toFixed(4)}`,
	);
}

const command = process.argv[2] ?? "run-free";
if (command === "run-free") {
	await runFreeChecks();
} else if (command === "run-paid") {
	await runPaidGeneration();
} else {
	throw new Error("명령은 run-free | run-paid 중 하나여야 합니다");
}
