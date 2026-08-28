// 6단계 코퍼스 라우팅 평가 실행기.
//
// 사용:
//   node --experimental-strip-types --no-warnings tools/evaluate-routing.mjs validate
//     정답지·시나리오·실제 묶음 구성이 맞는지만 검사한다. API 호출 없음.
//
//   node --experimental-strip-types --no-warnings tools/evaluate-routing.mjs run-selection
//     선택 모델을 17회 호출하고 축 1~3을 채점한다. API 비용 발생.
//
//   node --experimental-strip-types --no-warnings tools/evaluate-routing.mjs run-generation
//     선택 결과를 사용해 완료 전 확인 3건과 블라인드 비교 12건을 만든다.
//     생성 모델을 15회 호출하므로 API 비용이 발생한다.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	patternBundles,
	referenceCategories,
} from "../src/data/reference-corpus.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const DATA = join(ROOT, "docs", "experiments", "data");
const EVAL = join(DATA, "2026-08-28-routing-eval");
const SELECTION_RESULTS = join(EVAL, "selection-results.json");
const ROUTE_ENDPOINT = "http://localhost:3000/api/route-preview";
const GENERATE_ENDPOINT = "http://localhost:3000/api/generate-skill";
const FREQUENT_BUNDLE_ID = "frequent-skill-budget";
const QUALITY_SCENARIO_IDS = ["01-testing", "05-design", "09-mismatch-office"];

const load = (path) => JSON.parse(readFileSync(path, "utf8"));
const originalScenarios = [
	...load(join(DATA, "2026-08-19-expand3", "scenarios.json")),
	...load(join(DATA, "2026-08-20-baseline-fill", "scenarios-extra.json")),
];
const routingScenarios = load(join(EVAL, "scenarios-routing.json"));
const answerKey = load(join(EVAL, "bundle-answer-key.json"));
const addedScenarios = routingScenarios.filter((scenario) => !scenario.basedOn);
const directSignalScenarios = routingScenarios.filter(
	(scenario) => scenario.basedOn,
);
const selectionScenarios = [...originalScenarios, ...addedScenarios];
const scenariosById = new Map(
	selectionScenarios.map((scenario) => [scenario.id, scenario]),
);
const resolvedDirectSignalScenarios = directSignalScenarios.map((scenario) => {
	const base = scenariosById.get(scenario.basedOn);
	if (!base)
		throw new Error(`${scenario.id}: basedOn ${scenario.basedOn} 없음`);
	return { ...base, ...scenario, situation: base.situation };
});

function sameMembers(actual, expected) {
	return (
		actual.length === expected.length &&
		actual.every((value) => expected.includes(value))
	);
}

function intersection(left, right) {
	const rightSet = new Set(right);
	return left.filter((value) => rightSet.has(value));
}

function validateInputs() {
	const errors = [];
	const fail = (message) => errors.push(message);
	const onlineBundleIds = patternBundles
		.filter((bundle) => bundle.delivery === "online")
		.map((bundle) => bundle.id);
	const onlineBundleIdSet = new Set(onlineBundleIds);
	const patternIds = new Set(
		referenceCategories.flatMap((category) =>
			category.patterns.map((pattern) => pattern.id),
		),
	);
	const scenarioIds = selectionScenarios.map((scenario) => scenario.id);
	const keyScenarioIds = answerKey.scenarios.map((scenario) => scenario.id);

	if (onlineBundleIds.length !== 36) {
		fail(`온라인 묶음이 36개가 아니라 ${onlineBundleIds.length}개입니다`);
	}
	if (!onlineBundleIdSet.has(FREQUENT_BUNDLE_ID)) {
		fail(`${FREQUENT_BUNDLE_ID} 묶음이 없습니다`);
	}
	if (!sameMembers(scenarioIds, keyScenarioIds)) {
		fail("14개 선택 시나리오와 정답지의 id가 일치하지 않습니다");
	}
	if (scenarioIds.length !== 14) {
		fail(`선택 시나리오가 14건이 아니라 ${scenarioIds.length}건입니다`);
	}

	let requiredUnits = 0;
	for (const scenario of answerKey.scenarios) {
		const requiredGroups = [
			...scenario.required.map((id) => [id]),
			...scenario.requiredAnyOf,
		];
		requiredUnits += requiredGroups.length;
		const classified = [
			...scenario.required,
			...scenario.requiredAnyOf.flat(),
			...scenario.allowed,
		];
		const duplicates = classified.filter(
			(id, index) => classified.indexOf(id) !== index,
		);
		if (duplicates.length) {
			fail(`${scenario.id}: 판정 칸에 중복 id ${[...new Set(duplicates)]}`);
		}
		for (const id of classified) {
			if (!onlineBundleIdSet.has(id)) {
				fail(`${scenario.id}: 실제 온라인 묶음에 없는 id ${id}`);
			}
			if (id === FREQUENT_BUNDLE_ID) {
				fail(`${scenario.id}: frequent 묶음은 축 2 판정 칸에 두지 않습니다`);
			}
		}
	}
	if (requiredUnits !== 19) {
		fail(`필수 판정 단위가 19개가 아니라 ${requiredUnits}개입니다`);
	}

	const fallbackCounts = { yes: 0, no: 0, hold: 0 };
	for (const scenario of answerKey.scenarios) {
		if (!(scenario.fallbackInference in fallbackCounts)) {
			fail(`${scenario.id}: 알 수 없는 fallbackInference`);
			continue;
		}
		fallbackCounts[scenario.fallbackInference] += 1;
	}
	if (
		fallbackCounts.yes !== 1 ||
		fallbackCounts.no !== 12 ||
		fallbackCounts.hold !== 1
	) {
		fail(
			`대체 추론 분포가 yes 1/no 12/hold 1이 아닙니다: ${JSON.stringify(fallbackCounts)}`,
		);
	}

	if (
		!sameMembers(
			answerKey.directSignal.map((entry) => entry.id),
			resolvedDirectSignalScenarios.map((scenario) => scenario.id),
		)
	) {
		fail("직접 신호 정답지와 변형 시나리오의 id가 일치하지 않습니다");
	}
	for (const id of answerKey.verificationPatternIds) {
		if (!patternIds.has(id)) fail(`검증 패턴 id가 코퍼스에 없습니다: ${id}`);
	}

	if (errors.length) {
		for (const error of errors) console.error(`FAIL ${error}`);
		throw new Error(`사전등록 정적 검사 ${errors.length}건 실패`);
	}

	console.log("OK  사전등록 정적 검사 통과");
	console.log(
		`    온라인 묶음 ${onlineBundleIds.length}개 · 축 2 대상 ${onlineBundleIds.length - 1}개 × 시나리오 ${scenarioIds.length}건`,
	);
	console.log(
		`    필수 판정 ${requiredUnits}단위 · 대체 추론 yes/no/hold=${fallbackCounts.yes}/${fallbackCounts.no}/${fallbackCounts.hold}`,
	);
}

function requestAnswers(scenario) {
	return {
		tool: "cli",
		situation: scenario.situation,
		language: "ko",
		...(scenario.answers ?? {}),
	};
}

async function postJson(url, body) {
	const response = await fetch(url, {
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
	return json;
}

function scoreSelection(results) {
	if (results.some((result) => !result.ok)) {
		throw new Error("실패한 선택 호출이 있어 부분 자료는 채점하지 않습니다");
	}
	const resultById = new Map(results.map((result) => [result.id, result]));
	const directCases = [];
	for (const expected of answerKey.directSignal) {
		const result = resultById.get(expected.id);
		const plan = result.response.plan;
		const checks = {
			on: expected.expectOn.every((id) =>
				plan.directSignalPatternIds.includes(id),
			),
			off: (expected.expectOff ?? []).every((id) =>
				plan.directSignalOffPatternIds.includes(id),
			),
			delivered: (expected.expectDelivered ?? []).every((id) =>
				plan.patternIds.includes(id),
			),
			notDelivered: (expected.expectNotDelivered ?? []).every(
				(id) => !plan.patternIds.includes(id),
			),
		};
		directCases.push({
			id: expected.id,
			pass: Object.values(checks).every(Boolean),
			checks,
		});
	}

	let requiredMisses = 0;
	let noRequiredHitScenarios = 0;
	let unnecessaryTotal = 0;
	let scenariosWithFiveUnnecessary = 0;
	let unknownTotal = 0;
	let rejectedTotal = 0;
	const predictionCases = [];
	for (const scenario of answerKey.scenarios) {
		const result = resultById.get(scenario.id);
		const plan = result.response.plan;
		const selected = new Set(plan.bundleIds);
		const requiredGroups = [
			...scenario.required.map((id) => [id]),
			...scenario.requiredAnyOf,
		];
		const missedGroups = requiredGroups.filter(
			(group) => !group.some((id) => selected.has(id)),
		);
		const hitGroups = requiredGroups.length - missedGroups.length;
		const nonPenalized = new Set([
			...scenario.required,
			...scenario.requiredAnyOf.flat(),
			...scenario.allowed,
			FREQUENT_BUNDLE_ID,
		]);
		const unnecessary = plan.bundleIds.filter((id) => !nonPenalized.has(id));

		requiredMisses += missedGroups.length;
		if (requiredGroups.length > 0 && hitGroups === 0) {
			noRequiredHitScenarios += 1;
		}
		unnecessaryTotal += unnecessary.length;
		if (unnecessary.length >= 5) scenariosWithFiveUnnecessary += 1;
		unknownTotal += plan.unknownBundleIds.length;
		rejectedTotal += plan.rejectedBundleIds.length;
		predictionCases.push({
			id: scenario.id,
			selected: plan.bundleIds,
			missedRequiredGroups: missedGroups,
			unnecessary,
			unknownBundleIds: plan.unknownBundleIds,
			rejectedBundleIds: plan.rejectedBundleIds,
		});
	}

	const fallbackCases = answerKey.scenarios
		.filter((scenario) => scenario.fallbackInference !== "hold")
		.map((scenario) => {
			const selected = resultById
				.get(scenario.id)
				.response.plan.bundleIds.includes(FREQUENT_BUNDLE_ID);
			return {
				id: scenario.id,
				expected: scenario.fallbackInference,
				selected,
				pass: selected === (scenario.fallbackInference === "yes"),
			};
		});
	const fallbackPositive = fallbackCases.filter(
		(result) => result.expected === "yes",
	);
	const fallbackNegative = fallbackCases.filter(
		(result) => result.expected === "no",
	);
	const fallbackFalsePositives = fallbackNegative.filter(
		(result) => !result.pass,
	).length;

	const score = {
		axis1: {
			pass:
				directCases.length === 3 && directCases.every((result) => result.pass),
			passed: directCases.filter((result) => result.pass).length,
			total: directCases.length,
			cases: directCases,
		},
		axis2: {
			pass:
				requiredMisses <= 1 &&
				noRequiredHitScenarios === 0 &&
				unnecessaryTotal <= 21 &&
				scenariosWithFiveUnnecessary === 0 &&
				unknownTotal === 0 &&
				rejectedTotal === 0,
			requiredMisses,
			requiredUnits: 19,
			noRequiredHitScenarios,
			unnecessaryTotal,
			averageUnnecessary: unnecessaryTotal / answerKey.scenarios.length,
			scenariosWithFiveUnnecessary,
			unknownTotal,
			rejectedTotal,
			cases: predictionCases,
		},
		axis3: {
			pass:
				fallbackPositive.every((result) => result.pass) &&
				fallbackFalsePositives <= 2,
			positivePassed: fallbackPositive.filter((result) => result.pass).length,
			positiveTotal: fallbackPositive.length,
			negativeFalsePositives: fallbackFalsePositives,
			negativeTotal: fallbackNegative.length,
			cases: fallbackCases,
		},
	};
	return score;
}

async function runSelection() {
	const jobs = [...selectionScenarios, ...resolvedDirectSignalScenarios];
	const results = [];
	for (const scenario of jobs) {
		const startedAt = Date.now();
		try {
			const response = await postJson(ROUTE_ENDPOINT, {
				answers: requestAnswers(scenario),
				wantsAdvanced: Boolean(scenario.wantsAdvanced),
			});
			results.push({ id: scenario.id, ok: true, response });
			console.log(
				`OK   ${scenario.id} (${Date.now() - startedAt}ms) 묶음=${response.plan.bundleIds.length}`,
			);
		} catch (error) {
			results.push({ id: scenario.id, ok: false, error: String(error) });
			console.error(
				`FAIL ${scenario.id} (${Date.now() - startedAt}ms) ${error}`,
			);
		}
	}

	writeFileSync(SELECTION_RESULTS, JSON.stringify(results, null, 2), "utf8");
	const okCount = results.filter((result) => result.ok).length;
	console.log(`\n선택 호출 ${okCount}/${results.length} 성공`);
	if (okCount !== results.length) {
		throw new Error(
			"부분 자료로 수치를 내지 않습니다. 실패 원인을 해결한 뒤 전부 다시 실행하세요",
		);
	}

	const score = scoreSelection(results);
	writeFileSync(
		join(EVAL, "selection-score.json"),
		JSON.stringify(score, null, 2),
		"utf8",
	);
	console.log(
		`축 1 ${score.axis1.passed}/${score.axis1.total} ${score.axis1.pass ? "PASS" : "FAIL"}`,
	);
	console.log(
		`축 2 필수누락=${score.axis2.requiredMisses}/19 오선택=${score.axis2.unnecessaryTotal}/14 평균=${score.axis2.averageUnnecessary.toFixed(2)} ${score.axis2.pass ? "PASS" : "FAIL"}`,
	);
	console.log(
		`축 3 양성=${score.axis3.positivePassed}/${score.axis3.positiveTotal} 음성오선택=${score.axis3.negativeFalsePositives}/${score.axis3.negativeTotal} ${score.axis3.pass ? "PASS" : "FAIL"}`,
	);
}

function generationDoc(label, scenario, json, condition) {
	const body = condition === "routed" ? json.generation : json;
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

// 채점용 배치. 조건별 목록을 따로 섞은 뒤 지퍼로 엮는다.
//
// **같은 시나리오의 결과물을 나란히 놓지 않는다.** 붙여 놓으면 채점자가 같은
// 상황 글을 연속으로 두 번 보게 되어 축별 절대 채점이 아니라 머리를 맞댄 비교가
// 되고, 길이 차이 같은 단서가 12건 내내 같은 방향으로 작용한다. 조건별로 섞어
// 엮으면 어느 구간을 잘라도 두 조건이 반반이면서 짝은 드러나지 않는다.
// 3차 확장 회차의 make-blind.mjs와 같은 방식이다.
//
// 이웃 판정은 **인접한 모든 자리**를 본다. 짝 안(2i-1, 2i)만 보면 모자란다 —
// 짝과 짝 사이(2i, 2i+1)도 이웃이고, 회차가 달라도 상황 글은 같기 때문이다.
// 처음 구현이 짝 안만 봐서 01-testing 두 건이 붙은 배치가 통과했다.
function shuffledPairs(items) {
	let seed = 20260828;
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
			`조건별 건수가 달라 지퍼로 엮을 수 없습니다: full ${full.length} · routed ${routed.length}`,
		);
	}

	// 이웃한 두 자리가 같은 시나리오면 -1이 아닌 뒤쪽 자리를 돌려준다.
	const firstClash = (order) => {
		for (let index = 1; index < order.length; index += 1) {
			if (order[index].scenarioId === order[index - 1].scenarioId) return index;
		}
		return -1;
	};

	// 조건이 만족될 때까지 다시 섞는다. rand()가 고정 시드라 시도 횟수까지
	// 결정적이고, 같은 자료에서 같은 배치가 다시 나온다.
	const MAX_ATTEMPTS = 500;
	let order = null;
	for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
		shuffle(full);
		shuffle(routed);
		const candidate = full.flatMap((item, index) =>
			rand() < 0.5 ? [item, routed[index]] : [routed[index], item],
		);
		if (firstClash(candidate) === -1) {
			order = candidate;
			break;
		}
	}
	if (!order) {
		throw new Error(
			`같은 시나리오가 이웃하지 않는 배치를 ${MAX_ATTEMPTS}번 안에 찾지 못했습니다`,
		);
	}

	// 최종 확인. 위 반복이 나중에 바뀌어도 여기서 걸린다.
	const clash = firstClash(order);
	if (clash !== -1) {
		throw new Error(
			`같은 시나리오가 ${clash}번과 ${clash + 1}번에 나란히 놓였습니다: ${order[clash].scenarioId}`,
		);
	}
	return order;
}

async function runGeneration() {
	const selectionResults = load(SELECTION_RESULTS);
	if (
		selectionResults.length !== 17 ||
		selectionResults.some((result) => !result.ok)
	) {
		throw new Error("성공한 selection-results.json 17건이 먼저 필요합니다");
	}
	const selectionById = new Map(
		selectionResults.map((result) => [result.id, result]),
	);
	const generationRoot = join(EVAL, "generation");
	const visibleDir = join(generationRoot, "for-grader");
	const keyDir = join(generationRoot, "answer-key");
	mkdirSync(visibleDir, { recursive: true });
	mkdirSync(keyDir, { recursive: true });

	const floorScenario = scenariosById.get("14-three-line-memo");
	const floorResults = [];
	for (let run = 1; run <= 3; run += 1) {
		const label = `14-three-line-memo-run${run}`;
		try {
			const response = await postJson(ROUTE_ENDPOINT, {
				answers: requestAnswers(floorScenario),
				wantsAdvanced: false,
				bundleIds: [],
				generate: true,
			});
			const verificationPatterns = intersection(
				response.plan.patternIds,
				answerKey.verificationPatternIds,
			);
			const ok =
				Boolean(response.generation?.skillMarkdown) &&
				verificationPatterns.length === 0;
			floorResults.push({ label, ok, verificationPatterns, response });
			console.log(`FLOOR ${ok ? "OK  " : "FAIL"} ${label}`);
		} catch (error) {
			floorResults.push({ label, ok: false, error: String(error) });
			console.error(`FLOOR FAIL ${label} ${error}`);
		}
	}
	writeFileSync(
		join(visibleDir, "verification-floor.json"),
		JSON.stringify(
			floorResults.map((result) =>
				result.response
					? generationDoc(
							result.label,
							floorScenario,
							result.response,
							"routed",
						)
					: { label: result.label, error: result.error },
			),
			null,
			2,
		),
		"utf8",
	);

	const qualityResults = [];
	for (const scenarioId of QUALITY_SCENARIO_IDS) {
		const scenario = scenariosById.get(scenarioId);
		const bundleIds = selectionById.get(scenarioId).response.plan.bundleIds;
		for (let run = 1; run <= 2; run += 1) {
			const answers = requestAnswers(scenario);
			const calls = [
				[
					"full",
					() =>
						postJson(GENERATE_ENDPOINT, {
							answers,
							wantsAdvanced: false,
						}),
				],
				[
					"routed",
					() =>
						postJson(ROUTE_ENDPOINT, {
							answers,
							wantsAdvanced: false,
							bundleIds,
							generate: true,
						}),
				],
			];
			const pair = await Promise.all(
				calls.map(async ([condition, call]) => {
					const label = `${scenarioId}-${condition}-run${run}`;
					const startedAt = Date.now();
					try {
						const response = await call();
						const doc = generationDoc(label, scenario, response, condition);
						const ok = Boolean(doc.skillMarkdown);
						console.log(
							`${ok ? "OK  " : "FAIL"} ${label} (${Date.now() - startedAt}ms)`,
						);
						return { scenarioId, run, condition, ok, bundleIds, doc, response };
					} catch (error) {
						console.error(`FAIL ${label} ${error}`);
						return {
							scenarioId,
							run,
							condition,
							ok: false,
							bundleIds,
							error: String(error),
						};
					}
				}),
			);
			qualityResults.push(...pair);
		}
	}

	writeFileSync(
		join(generationRoot, "raw-results.json"),
		JSON.stringify({ floorResults, qualityResults }, null, 2),
		"utf8",
	);
	const allSuccessful =
		floorResults.every((result) => result.ok) &&
		qualityResults.every((result) => result.ok);
	console.log(
		`\n생성 성공: 바닥 규칙 ${floorResults.filter((result) => result.ok).length}/${floorResults.length} · 품질 비교 ${qualityResults.filter((result) => result.ok).length}/${qualityResults.length}`,
	);
	if (!allSuccessful) {
		throw new Error(
			"실패한 생성이 있어 부분 자료로 블라인드 묶음을 만들지 않습니다",
		);
	}

	const mixed = shuffledPairs(qualityResults);
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
			sourceLabel: item.doc.label,
		});
	});
	writeFileSync(
		join(visibleDir, "blind-items.json"),
		JSON.stringify(blind, null, 2),
		"utf8",
	);
	writeFileSync(
		join(keyDir, "blind-mapping.json"),
		JSON.stringify(mapping, null, 2),
		"utf8",
	);
	console.log("블라인드 12건 생성 (조건 라벨 제거, 시드 20260828)");
}

const command = process.argv[2] ?? "validate";
validateInputs();
if (command === "run-selection") {
	await runSelection();
} else if (command === "run-generation") {
	await runGeneration();
} else if (command !== "validate") {
	console.error(
		"명령은 validate | run-selection | run-generation 중 하나여야 합니다",
	);
	process.exit(1);
}
