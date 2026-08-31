// 8단계 전체 주입 vs 선택 주입 비교 실행기.
//
// 무비용 검사:
//   node tools/evaluate-routing-comparison.mjs validate
//
// API 비용 발생 — 반드시 사전등록 승인 뒤 실행:
//   node tools/evaluate-routing-comparison.mjs run-quality
//   node tools/evaluate-routing-comparison.mjs run-e2e
//
// 두 실행이 모두 끝난 뒤 무비용 집계:
//   node tools/evaluate-routing-comparison.mjs summarize
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DATA = join(ROOT, "docs", "experiments", "data");
const STEP6 = join(DATA, "2026-08-28-routing-eval");
const STEP8 = join(DATA, "2026-08-28-routing-comparison");
const GENERATION = join(STEP8, "generation");
const QUALITY_RESULTS = join(GENERATION, "raw-results.json");
const E2E_RESULTS = join(GENERATION, "end-to-end-results.json");
const SUMMARY = join(GENERATION, "summary.json");
const ROUTE_ENDPOINT = "http://localhost:3000/api/route-preview";

const load = (path) => JSON.parse(readFileSync(path, "utf8"));
const writeJson = (path, value) => {
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const config = load(join(STEP8, "experiment-config.json"));
const originalScenarios = [
	...load(join(DATA, "2026-08-19-expand3", "scenarios.json")),
	...load(join(DATA, "2026-08-20-baseline-fill", "scenarios-extra.json")),
];
const routingScenarios = load(join(STEP6, "scenarios-routing.json")).filter(
	(scenario) => !scenario.basedOn,
);
const scenariosById = new Map(
	[...originalScenarios, ...routingScenarios].map((scenario) => [
		scenario.id,
		scenario,
	]),
);

function sameMembersInOrder(actual, expected) {
	return JSON.stringify(actual) === JSON.stringify(expected);
}

function sameMembers(actual, expected) {
	return (
		actual.length === expected.length &&
		actual.every((value) => expected.includes(value))
	);
}

function validateSourceParity(errors) {
	const previewSource = readFileSync(
		join(ROOT, "src", "app", "api", "route-preview", "route.ts"),
		"utf8",
	);
	// 프로덕션 생성 흐름은 route.ts와 generate.ts에 나뉘어 있다. 라우트는
	// 입력 검사와 응답 변환만 하고 실제 호출은 generate.ts가 한다. 한 파일만
	// 읽으면 멀쩡한 코드를 「누락」으로 센다.
	const productionSource = ["route.ts", "generate.ts"]
		.map((name) =>
			readFileSync(
				join(ROOT, "src", "app", "api", "generate-skill", name),
				"utf8",
			),
		)
		.join("\n");
	const sharedFragments = [
		'const GENERATION_MODEL = "claude-sonnet-5";',
		"max_tokens: 8192",
		'thinking: { type: "disabled" }',
	];
	for (const fragment of sharedFragments) {
		if (!previewSource.includes(fragment)) {
			errors.push(`route-preview 생성 설정 누락: ${fragment}`);
		}
		if (!productionSource.includes(fragment)) {
			errors.push(`generate-skill 생성 설정 누락: ${fragment}`);
		}
	}
	const previewOnly = [
		'body.mode ?? "routed"',
		"text: generationSection",
		'{ type: "text", text: SYSTEM_PROMPT }',
		"content: buildUserContent(answers, wantsAdvanced)",
	];
	for (const fragment of previewOnly) {
		if (!previewSource.includes(fragment)) {
			errors.push(`route-preview full 비교 경로 누락: ${fragment}`);
		}
	}
	const productionOnly = [
		"prepareGenerationCorpus({",
		"text: preparedCorpus.section",
		"cacheCorpus: preparedCorpus.cacheCorpus",
		"text: refinement ? REFINE_SYSTEM_PROMPT : SYSTEM_PROMPT",
		"const userContent = buildUserContent(",
		'messages: [{ role: "user", content: userContent }]',
	];
	for (const fragment of productionOnly) {
		if (!productionSource.includes(fragment)) {
			errors.push(`generate-skill create 경로 누락: ${fragment}`);
		}
	}
}

function validateInputs() {
	const errors = [];
	const fail = (message) => errors.push(message);
	const qualityIds = config.qualityScenarios.map((entry) => entry.id);
	const uniqueQualityIds = new Set(qualityIds);
	if (config.qualityScenarios.length !== 6 || uniqueQualityIds.size !== 6) {
		fail("품질 시나리오는 중복 없이 6건이어야 합니다");
	}
	if (
		config.endToEndScenarioIds.length !== 3 ||
		new Set(config.endToEndScenarioIds).size !== 3
	) {
		fail("end-to-end 시나리오는 중복 없이 3건이어야 합니다");
	}
	for (const id of config.endToEndScenarioIds) {
		if (!uniqueQualityIds.has(id)) {
			fail(`end-to-end 시나리오가 품질 6건에 없습니다: ${id}`);
		}
	}
	if (config.observedBudgetStopUsd !== 2.8) {
		fail("관측 실행 비용 중단선은 $2.80이어야 합니다");
	}
	const expectedPrices = {
		sonnet: { input: 2, output: 10 },
		haiku: { input: 1, output: 5 },
		cacheWriteMultiplier: 1.25,
		cacheReadMultiplier: 0.1,
	};
	if (
		JSON.stringify(config.pricesPerMillionTokens) !==
		JSON.stringify(expectedPrices)
	) {
		fail("가격 설정이 2026-08-28 사전등록값과 다릅니다");
	}

	const selectionResults = load(join(STEP6, "selection-results.json"));
	const selectionAnswerKey = load(join(STEP6, "bundle-answer-key.json"));
	if (config.sourceSelectionCommit !== selectionAnswerKey.corpusCommit) {
		fail(
			`선택 결과 커밋 ${config.sourceSelectionCommit} != 정답지 커밋 ${selectionAnswerKey.corpusCommit}`,
		);
	}
	const selectionById = new Map(
		selectionResults.map((result) => [result.id, result]),
	);
	for (const entry of config.qualityScenarios) {
		if (!scenariosById.has(entry.id)) {
			fail(`시나리오 원문을 찾을 수 없습니다: ${entry.id}`);
		}
		const source = selectionById.get(entry.id);
		if (!source?.ok) {
			fail(`6단계의 성공한 선택 결과가 없습니다: ${entry.id}`);
			continue;
		}
		if (!sameMembersInOrder(entry.bundleIds, source.response.plan.bundleIds)) {
			fail(`${entry.id}: 고정 묶음이 6단계 선택 결과와 다릅니다`);
		}
		if (entry.routedBytes !== source.response.render.routedBytes) {
			fail(
				`${entry.id}: routedBytes ${entry.routedBytes} != ${source.response.render.routedBytes}`,
			);
		}
	}
	validateSourceParity(errors);

	const syntheticBlindInput = config.qualityScenarios.flatMap((entry) =>
		[1, 2].flatMap((run) =>
			["full", "routed"].map((condition) => ({
				scenarioId: entry.id,
				run,
				condition,
			})),
		),
	);
	const syntheticBlind = shuffledResults(syntheticBlindInput);
	if (syntheticBlind.length !== 24) {
		fail(
			`블라인드 자체 검사의 결과가 24건이 아닙니다: ${syntheticBlind.length}`,
		);
	}
	for (let index = 1; index < syntheticBlind.length; index += 1) {
		if (
			syntheticBlind[index].scenarioId === syntheticBlind[index - 1].scenarioId
		) {
			fail(
				`블라인드 자체 검사에서 ${index}번 자리에 같은 시나리오가 이웃합니다`,
			);
		}
	}
	const priceCases = [
		[
			"Sonnet 일반 입력",
			priceForUsage(
				{
					input_tokens: 1_000_000,
					cache_creation_input_tokens: 0,
					cache_read_input_tokens: 0,
					output_tokens: 0,
				},
				"sonnet",
			),
			2,
		],
		[
			"Sonnet 5분 캐시 생성",
			priceForUsage(
				{
					input_tokens: 0,
					cache_creation_input_tokens: 1_000_000,
					cache_read_input_tokens: 0,
					output_tokens: 0,
				},
				"sonnet",
			),
			2.5,
		],
		[
			"Sonnet 캐시 읽기",
			priceForUsage(
				{
					input_tokens: 0,
					cache_creation_input_tokens: 0,
					cache_read_input_tokens: 1_000_000,
					output_tokens: 0,
				},
				"sonnet",
			),
			0.2,
		],
	];
	for (const [label, actual, expected] of priceCases) {
		if (Math.abs(actual - expected) > Number.EPSILON) {
			fail(`${label} 계산이 $${actual}입니다. 기대값은 $${expected}입니다`);
		}
	}

	if (errors.length > 0) {
		for (const error of errors) console.error(`FAIL ${error}`);
		throw new Error(`8단계 정적 검사 ${errors.length}건 실패`);
	}
	console.log("OK  8단계 사전등록 정적 검사 통과");
	console.log("    품질 6시나리오 × 2조건 × 2회 = 24건");
	console.log("    end-to-end 3건 · 관측 실행 비용 중단선 $2.80");
	console.log("    full/create 모델·max_tokens·thinking·system·user 경로 확인");
}

function requestAnswers(scenario) {
	return {
		tool: "cli",
		situation: scenario.situation,
		language: "ko",
	};
}

async function postJson(body) {
	const startedAt = Date.now();
	try {
		const response = await fetch(ROUTE_ENDPOINT, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body),
		});
		const responseText = await response.text();
		let json;
		try {
			json = JSON.parse(responseText);
		} catch {
			json = { error: responseText };
		}
		if (!response.ok) {
			throw new Error(json?.error ?? `HTTP ${response.status}`);
		}
		return { ok: true, clientMs: Date.now() - startedAt, response: json };
	} catch (error) {
		return {
			ok: false,
			clientMs: Date.now() - startedAt,
			error: String(error),
		};
	}
}

function generationDoc(label, scenario, call) {
	const body = call.response?.generation;
	return {
		label,
		category: scenario.category,
		situation: scenario.situation,
		filename: body?.suggestedFilename ?? null,
		skillMarkdown: body?.skillMarkdown ?? null,
		needsMoreInfo: body?.needsMoreInfo ?? false,
		clarifyingQuestions: body?.clarifyingQuestions ?? [],
		reviewNotes: body?.reviewNotes ?? [],
	};
}

function priceForUsage(usage, model, cacheMode = "observed") {
	if (!usage) return 0;
	const price = config.pricesPerMillionTokens[model];
	const cacheWrite = usage.cache_creation_input_tokens ?? 0;
	const cacheRead = usage.cache_read_input_tokens ?? 0;
	const inputCost =
		cacheMode === "no-cache"
			? (usage.input_tokens + cacheWrite + cacheRead) * price.input
			: usage.input_tokens * price.input +
				cacheWrite *
					price.input *
					config.pricesPerMillionTokens.cacheWriteMultiplier +
				cacheRead *
					price.input *
					config.pricesPerMillionTokens.cacheReadMultiplier;
	return (inputCost + usage.output_tokens * price.output) / 1_000_000;
}

function observedCallCost(call) {
	if (!call) return 0;
	return (
		priceForUsage(call.response?.generation?.usage, "sonnet") +
		priceForUsage(call.response?.selection?.usage, "haiku")
	);
}

function observedQualityCost(attempts) {
	return attempts.reduce(
		(total, attempt) =>
			total +
			attempt.calls.reduce((sum, call) => sum + observedCallCost(call), 0),
		0,
	);
}

async function qualityPair(entry, run, attempt) {
	const scenario = scenariosById.get(entry.id);
	const answers = requestAnswers(scenario);
	const specifications = [
		{
			condition: "full",
			body: { mode: "full", answers, wantsAdvanced: false, generate: true },
		},
		{
			condition: "routed",
			body: {
				mode: "routed",
				answers,
				wantsAdvanced: false,
				bundleIds: entry.bundleIds,
				generate: true,
			},
		},
	];
	const calls = await Promise.all(
		specifications.map(async ({ condition, body }) => {
			const label = `${entry.id}-${condition}-run${run}-attempt${attempt}`;
			const call = await postJson(body);
			const doc = call.ok ? generationDoc(label, scenario, call) : null;
			const ok = Boolean(call.ok && doc?.skillMarkdown);
			console.log(`${ok ? "OK  " : "FAIL"} ${label} (${call.clientMs}ms)`);
			return { ...call, ok, condition, label, doc };
		}),
	);
	return {
		scenarioId: entry.id,
		run,
		attempt,
		bundleIds: entry.bundleIds,
		calls,
	};
}

function shuffledResults(items) {
	let seed = 2026082808;
	const rand = () => {
		seed += 0x6d2b79f5;
		let value = seed;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
	const shuffle = (array) => {
		for (let index = array.length - 1; index > 0; index -= 1) {
			const other = Math.floor(rand() * (index + 1));
			[array[index], array[other]] = [array[other], array[index]];
		}
		return array;
	};
	const full = items.filter((item) => item.condition === "full");
	const routed = items.filter((item) => item.condition === "routed");
	if (full.length !== routed.length) {
		throw new Error(
			`조건별 건수가 다릅니다: full ${full.length}, routed ${routed.length}`,
		);
	}
	const firstClash = (order) => {
		for (let index = 1; index < order.length; index += 1) {
			if (order[index].scenarioId === order[index - 1].scenarioId) return index;
		}
		return -1;
	};
	for (let attempt = 0; attempt < 1_000; attempt += 1) {
		shuffle(full);
		shuffle(routed);
		const order = full.flatMap((item, index) =>
			rand() < 0.5 ? [item, routed[index]] : [routed[index], item],
		);
		if (firstClash(order) === -1) return order;
	}
	throw new Error(
		"같은 시나리오가 이웃하지 않는 블라인드 배치를 만들지 못했습니다",
	);
}

function writeBlindMaterials(qualityResults) {
	const visibleDir = join(GENERATION, "for-grader");
	const keyDir = join(GENERATION, "answer-key");
	const mixed = shuffledResults(qualityResults);
	const blind = [];
	const mapping = [];
	mixed.forEach((item, index) => {
		const id = `item-${String(index + 1).padStart(3, "0")}`;
		blind.push({
			id,
			situation: item.doc.situation,
			skillMarkdown: item.doc.skillMarkdown,
			needsMoreInfo: item.doc.needsMoreInfo,
			clarifyingQuestions: item.doc.clarifyingQuestions,
		});
		mapping.push({
			id,
			condition: item.condition,
			scenarioId: item.scenarioId,
			run: item.run,
			sourceLabel: item.label,
		});
	});
	writeJson(join(visibleDir, "blind-items.json"), blind);
	writeJson(join(keyDir, "blind-mapping.json"), mapping);
}

async function runQuality() {
	if (existsSync(QUALITY_RESULTS)) {
		throw new Error("8단계 품질 결과가 이미 있습니다. 덮어쓰지 않습니다");
	}
	const attempts = [];
	const qualityResults = [];
	for (const entry of config.qualityScenarios) {
		for (let run = 1; run <= 2; run += 1) {
			const costBefore = observedQualityCost(attempts);
			if (costBefore > config.observedBudgetStopUsd) {
				writeJson(QUALITY_RESULTS, {
					complete: false,
					attempts,
					qualityResults,
				});
				throw new Error(
					`관측 실행 비용 $${costBefore.toFixed(4)}가 중단선 $${config.observedBudgetStopUsd.toFixed(2)}를 넘었습니다`,
				);
			}
			let successfulPair = null;
			for (let attempt = 1; attempt <= 2; attempt += 1) {
				const pair = await qualityPair(entry, run, attempt);
				attempts.push(pair);
				if (pair.calls.every((call) => call.ok)) {
					successfulPair = pair;
					break;
				}
				if (attempt === 1) {
					console.warn(
						`RETRY ${entry.id} run${run}: 쌍 전체를 한 번 다시 실행`,
					);
				}
			}
			if (!successfulPair) {
				writeJson(QUALITY_RESULTS, {
					complete: false,
					attempts,
					qualityResults,
				});
				throw new Error(
					`${entry.id} run${run}: 재시도 뒤에도 쌍이 완성되지 않았습니다`,
				);
			}
			qualityResults.push(
				...successfulPair.calls.map((call) => ({
					scenarioId: entry.id,
					run,
					bundleIds: entry.bundleIds,
					...call,
				})),
			);
			writeJson(QUALITY_RESULTS, { complete: false, attempts, qualityResults });
		}
	}
	const result = {
		complete: qualityResults.length === 24,
		createdAt: new Date().toISOString(),
		attempts,
		qualityResults,
		observedExecutionCostUsd: observedQualityCost(attempts),
	};
	writeJson(QUALITY_RESULTS, result);
	writeBlindMaterials(qualityResults);
	console.log(
		`품질 비교 24/24 완료 · 관측 실행 비용 $${result.observedExecutionCostUsd.toFixed(4)}`,
	);
}

async function runEndToEnd() {
	if (!existsSync(QUALITY_RESULTS) || !load(QUALITY_RESULTS).complete) {
		throw new Error("완성된 품질 비교 24건이 먼저 필요합니다");
	}
	if (existsSync(E2E_RESULTS)) {
		throw new Error("8단계 end-to-end 결과가 이미 있습니다. 덮어쓰지 않습니다");
	}
	const quality = load(QUALITY_RESULTS);
	const results = [];
	let observedCost = observedQualityCost(quality.attempts);
	for (const scenarioId of config.endToEndScenarioIds) {
		if (observedCost > config.observedBudgetStopUsd) {
			writeJson(E2E_RESULTS, {
				complete: false,
				results,
				observedCostUsd: observedCost,
			});
			throw new Error(
				`관측 실행 비용 $${observedCost.toFixed(4)}가 중단선 $${config.observedBudgetStopUsd.toFixed(2)}를 넘었습니다`,
			);
		}
		const scenario = scenariosById.get(scenarioId);
		const fixed = config.qualityScenarios.find(
			(entry) => entry.id === scenarioId,
		);
		const call = await postJson({
			mode: "routed",
			answers: requestAnswers(scenario),
			wantsAdvanced: false,
			generate: true,
		});
		const ok = Boolean(call.ok && call.response?.generation?.skillMarkdown);
		const selectedBundleIds = call.response?.plan?.bundleIds ?? [];
		const result = {
			...call,
			scenarioId,
			ok,
			fixedBundleIds: fixed.bundleIds,
			selectedBundleIds,
			selectionChanged: !sameMembers(fixed.bundleIds, selectedBundleIds),
		};
		results.push(result);
		observedCost += observedCallCost(result);
		writeJson(E2E_RESULTS, {
			complete: false,
			results,
			observedCostUsd: observedCost,
		});
		console.log(
			`${ok ? "OK  " : "FAIL"} ${scenarioId} end-to-end (${call.clientMs}ms)`,
		);
		if (!ok) {
			throw new Error(`${scenarioId}: end-to-end 호출 실패`);
		}
	}
	writeJson(E2E_RESULTS, {
		complete: results.length === 3 && results.every((result) => result.ok),
		createdAt: new Date().toISOString(),
		results,
		observedCostUsd: observedCost,
	});
	console.log(
		`end-to-end 3/3 완료 · 누적 관측 실행 비용 $${observedCost.toFixed(4)}`,
	);
}

const mean = (values) =>
	values.length > 0
		? values.reduce((total, value) => total + value, 0) / values.length
		: null;
const median = (values) => {
	if (values.length === 0) return null;
	const sorted = [...values].sort((left, right) => left - right);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 === 0
		? (sorted[middle - 1] + sorted[middle]) / 2
		: sorted[middle];
};

function summarize() {
	if (!existsSync(QUALITY_RESULTS) || !existsSync(E2E_RESULTS)) {
		throw new Error("품질과 end-to-end 결과가 모두 필요합니다");
	}
	const quality = load(QUALITY_RESULTS);
	const endToEnd = load(E2E_RESULTS);
	if (!quality.complete || !endToEnd.complete) {
		throw new Error("부분 자료는 집계하지 않습니다");
	}
	const byCondition = Object.fromEntries(
		["full", "routed"].map((condition) => [
			condition,
			quality.qualityResults.filter((result) => result.condition === condition),
		]),
	);
	const conditionCosts = {};
	for (const [condition, results] of Object.entries(byCondition)) {
		conditionCosts[condition] = {
			count: results.length,
			observedMeanUsd: mean(
				results.map((result) =>
					priceForUsage(result.response.generation.usage, "sonnet"),
				),
			),
			noCacheMeanUsd: mean(
				results.map((result) =>
					priceForUsage(result.response.generation.usage, "sonnet", "no-cache"),
				),
			),
			generationMs: results.map((result) => result.response.generation.ms),
		};
	}
	const selectorObservedCosts = endToEnd.results.map((result) =>
		priceForUsage(result.response.selection.usage, "haiku"),
	);
	const selectorNoCacheCosts = endToEnd.results.map((result) =>
		priceForUsage(result.response.selection.usage, "haiku", "no-cache"),
	);
	const selectorObservedMean = mean(selectorObservedCosts);
	const selectorNoCacheMean = mean(selectorNoCacheCosts);
	const routedWithSelectionNoCache =
		conditionCosts.routed.noCacheMeanUsd + selectorNoCacheMean;

	const fullUsages = byCondition.full.map(
		(result) => result.response.generation.usage,
	);
	const fullGeneralInputMean = mean(
		fullUsages.map((usage) => usage.input_tokens),
	);
	const fullCorpusInputMean = mean(
		fullUsages.map(
			(usage) =>
				(usage.cache_creation_input_tokens ?? 0) +
				(usage.cache_read_input_tokens ?? 0),
		),
	);
	const fullOutputMean = mean(fullUsages.map((usage) => usage.output_tokens));
	const sonnetPrice = config.pricesPerMillionTokens.sonnet;
	const fullNonCorpusCost =
		(fullGeneralInputMean * sonnetPrice.input +
			fullOutputMean * sonnetPrice.output) /
		1_000_000;
	const fullCorpusBaseCost =
		(fullCorpusInputMean * sonnetPrice.input) / 1_000_000;
	const equalCorpusMultiplier =
		(routedWithSelectionNoCache - fullNonCorpusCost) / fullCorpusBaseCost;
	const breakEvenHitRate =
		(config.pricesPerMillionTokens.cacheWriteMultiplier -
			equalCorpusMultiplier) /
		(config.pricesPerMillionTokens.cacheWriteMultiplier -
			config.pricesPerMillionTokens.cacheReadMultiplier);

	const e2eClientMs = endToEnd.results.map((result) => result.clientMs);
	const e2eRows = endToEnd.results.map((result) => {
		const selectionMs = result.response.selection.ms;
		const generationMs = result.response.generation.ms;
		return {
			scenarioId: result.scenarioId,
			clientMs: result.clientMs,
			selectionMs,
			generationMs,
			unaccountedMs: result.clientMs - selectionMs - generationMs,
			fixedBundleIds: result.fixedBundleIds,
			selectedBundleIds: result.selectedBundleIds,
			selectionChanged: result.selectionChanged,
		};
	});
	const comparableIds = new Set(config.endToEndScenarioIds);
	const comparableFullMs = byCondition.full
		.filter((result) => comparableIds.has(result.scenarioId))
		.map((result) => result.response.generation.ms);
	const summary = {
		createdAt: new Date().toISOString(),
		counts: {
			quality: quality.qualityResults.length,
			endToEnd: endToEnd.results.length,
		},
		cost: {
			observedExperimentTotalUsd: endToEnd.observedCostUsd,
			conditions: conditionCosts,
			selectorObservedMeanUsd: selectorObservedMean,
			selectorNoCacheMeanUsd: selectorNoCacheMean,
			routedWithSelectionNoCacheMeanUsd: routedWithSelectionNoCache,
			fullNoCacheMeanUsd: conditionCosts.full.noCacheMeanUsd,
			breakEvenFullCacheHitRate: breakEvenHitRate,
		},
		latency: {
			endToEndClientMs: e2eClientMs,
			endToEndMeanMs: mean(e2eClientMs),
			endToEndMedianMs: median(e2eClientMs),
			endToEndRangeMs: [Math.min(...e2eClientMs), Math.max(...e2eClientMs)],
			comparableFullGenerationMeanMs: mean(comparableFullMs),
			rows: e2eRows,
		},
	};
	writeJson(SUMMARY, summary);
	console.log(JSON.stringify(summary, null, 2));
}

const command = process.argv[2] ?? "validate";
validateInputs();
if (command === "run-quality") {
	await runQuality();
} else if (command === "run-e2e") {
	await runEndToEnd();
} else if (command === "summarize") {
	summarize();
} else if (command !== "validate") {
	console.error(
		"명령은 validate | run-quality | run-e2e | summarize 중 하나여야 합니다",
	);
	process.exit(1);
}
