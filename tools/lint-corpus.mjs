// 코퍼스 저술 규칙 검사기.
//
// 사용: node --experimental-strip-types tools/lint-corpus.mjs
//       (pnpm lint:corpus)
//
// 왜 있나: 2026-08-18 원문 감사에서 두 소스 모두 "태도는 남고 형식은 빠졌다"는
// 같은 실패를 보였다. 원인은 스키마에 칸이 없었던 것과, 있어도 채우는지 아무도
// 확인하지 않은 것 둘 다다. 칸(examples/format/options)을 만들면서 이 검사기를
// 같은 커밋에 넣는 이유가 그것 — 필드만 늘리면 아무도 안 채운다.
//
// 이 검사기는 "빠뜨렸는가"를 잡지 "잘 썼는가"를 판정하지 않는다. 내용 품질은
// 생성 실험(docs/experiments/)에서 측정한다.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	baselineRoutingModes,
	getSourceById,
	patternBundleDeliveryModes,
	patternBundles,
	referenceCategories,
	structureArchetypes,
} from "../src/data/reference-corpus.ts";
import { allQuestions } from "../src/data/wizard-questions.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROMPT_TS = join(
	HERE,
	"..",
	"src",
	"app",
	"api",
	"generate-skill",
	"prompt.ts",
);

const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);

// ── 규칙 1: 사람만 보는 검토 필드는 프롬프트에 렌더되지 않는다 ───────
// 채점 기준이나 라우팅 판정 이유를 모델에게 주면 측정·선택이 자기충족이 된다.
// 주석에서 이 필드를 설명하는 것은 정상이므로, 주석을 걷어낸 코드만 본다.
const promptCode = readFileSync(PROMPT_TS, "utf8")
	.replace(/\/\*[\s\S]*?\*\//g, "")
	.replace(/\/\/.*$/gm, "");
if (promptCode.includes("verifyHint")) {
	fail(
		"prompt.ts",
		"verifyHint를 렌더러가 참조하고 있습니다 — 프롬프트에 넣지 않기로 한 필드입니다",
	);
}
if (promptCode.includes("reviewReason")) {
	fail(
		"prompt.ts",
		"reviewReason을 렌더러가 참조하고 있습니다 — 사람의 판정 기록이라 프롬프트에 넣지 않습니다",
	);
}

// ── 규칙 2~9: 패턴 단위 검사 ──────────────────────────────────────
const AUDIT_ID = /^[A-Z]{1,3}-\d{1,3}$/;
const STRUCTURED_FIELDS = [
	"examples",
	"format",
	"options",
	"exception",
	"auditIds",
	"verifyHint",
	"relations",
];

const seenIds = new Map();
const allPatternEntries = referenceCategories.flatMap((category) =>
	category.patterns.map((pattern) => ({ category, pattern })),
);
// flow.patternId 검사용 — 흐름은 카테고리 경계를 넘어 참조할 수 있으므로
// 카테고리별이 아니라 전역 집합으로 미리 모아둔다.
const allPatternIds = new Set(
	allPatternEntries.map(({ pattern }) => pattern.id),
);
const patternsById = new Map(
	allPatternEntries.map(({ category, pattern }) => [
		pattern.id,
		{ categoryId: category.id, pattern },
	]),
);
const baselineRoutingModeSet = new Set(baselineRoutingModes);
const baselineRoutingModeCounts = new Map(
	baselineRoutingModes.map((mode) => [mode, 0]),
);
const wizardQuestionsById = new Map(
	allQuestions.map((question) => [question.id, question]),
);
const bundleDeliveryModeSet = new Set(patternBundleDeliveryModes);
const bundleIds = new Set();
const bundlesByPatternId = new Map(
	[...allPatternIds].map((patternId) => [patternId, []]),
);
const mentionsPatternId = (text, patternId) => {
	let from = 0;
	while (from < text.length) {
		const index = text.indexOf(patternId, from);
		if (index < 0) return false;
		const before = text[index - 1] ?? "";
		const after = text[index + patternId.length] ?? "";
		if (!/[a-z0-9-]/.test(before) && !/[a-z0-9-]/.test(after)) return true;
		from = index + patternId.length;
	}
	return false;
};

// ── 규칙 10: 전달 묶음은 실존 패턴만 가지며 온라인/평가 경계를 넘지 않는다 ──
for (const bundle of patternBundles) {
	const where = `bundle/${bundle.id || "(빈 id)"}`;
	if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(bundle.id ?? "")) {
		fail(where, "id는 비어 있지 않은 kebab-case여야 합니다");
	}
	if (bundleIds.has(bundle.id)) fail(where, "bundle id가 중복입니다");
	bundleIds.add(bundle.id);
	if (!bundle.summary?.trim()) fail(where, "summary가 비어 있습니다");
	if (!bundle.when?.trim()) fail(where, "when이 비어 있습니다");
	if (!bundleDeliveryModeSet.has(bundle.delivery)) {
		fail(
			where,
			`delivery의 "${bundle.delivery}"는 허용되지 않습니다 (${patternBundleDeliveryModes.join(" | ")})`,
		);
	}
	if (!bundle.corePatternIds?.length) {
		fail(where, "corePatternIds가 비어 있습니다");
	}

	const memberIds = [
		...(bundle.corePatternIds ?? []),
		...(bundle.supportPatternIds ?? []),
	];
	const seenMembers = new Set();
	let hasEvaluationOnlyPattern = false;
	for (const patternId of memberIds) {
		if (seenMembers.has(patternId)) {
			fail(where, `패턴 "${patternId}"가 중심/보조 목록에 중복됐습니다`);
			continue;
		}
		seenMembers.add(patternId);
		const entry = patternsById.get(patternId);
		if (!entry) {
			fail(where, `패턴 "${patternId}"를 찾을 수 없습니다`);
			continue;
		}
		const mode = entry.pattern.baselineRouting?.mode;
		if (mode === "evaluation-only") hasEvaluationOnlyPattern = true;
		if (bundle.delivery === "online" && mode === "evaluation-only") {
			fail(
				where,
				`평가 전용 패턴 "${patternId}"를 온라인 묶음에 넣을 수 없습니다`,
			);
		}
		if (bundle.delivery === "online" && mode === "always") {
			fail(
				where,
				`항상 전달할 패턴 "${patternId}"를 온라인 묶음에 중복하지 않습니다`,
			);
		}
		bundlesByPatternId.get(patternId)?.push(bundle);
	}
	if (bundle.delivery === "evaluation-only" && !hasEvaluationOnlyPattern) {
		fail(
			where,
			"평가 전용 묶음에는 evaluation-only 패턴이 하나 이상 필요합니다",
		);
	}
}

for (const category of referenceCategories) {
	for (const p of category.patterns) {
		const where = `${category.id}/${p.id}`;

		// 9. 라우팅 동작과 조건이 조용히 빠지거나 다른 카테고리에 번지지 않게 한다.
		if (category.id === "baseline") {
			const routing = p.baselineRouting;
			if (routing === undefined) {
				fail(where, "baselineRouting이 비어 있습니다");
			} else {
				const mode = routing.mode;
				if (mode === undefined) {
					fail(where, "baselineRouting.mode가 비어 있습니다");
				} else if (!baselineRoutingModeSet.has(mode)) {
					fail(
						where,
						`baselineRouting.mode의 "${mode}"는 허용되지 않습니다 (${baselineRoutingModes.join(" | ")})`,
					);
				} else {
					baselineRoutingModeCounts.set(
						mode,
						baselineRoutingModeCounts.get(mode) + 1,
					);

					if (mode === "conditional") {
						const condition = routing.condition;
						if (!condition?.when?.trim()) {
							fail(where, "conditional 모드에는 condition.when이 필요합니다");
						}

						const answerSignals = condition?.answerSignals ?? [];
						for (const [i, signal] of answerSignals.entries()) {
							const signalWhere = `${where}/answerSignals[${i}]`;
							const question = wizardQuestionsById.get(signal.questionId);
							if (!question) {
								fail(
									signalWhere,
									`질문 "${signal.questionId}"를 찾을 수 없습니다`,
								);
								continue;
							}
							if (!signal.values?.length) {
								fail(signalWhere, "values가 비어 있습니다");
							}
							const allowedValues = new Set(
								(question.options ?? []).map((option) => option.value),
							);
							for (const value of signal.values ?? []) {
								if (!allowedValues.has(value)) {
									fail(
										signalWhere,
										`"${value}"는 ${signal.questionId} 질문의 원시 option.value가 아닙니다`,
									);
								}
							}
						}
						if (
							answerSignals.length &&
							!condition?.whenAnswersMissing?.trim()
						) {
							fail(
								where,
								"answerSignals를 썼다면 답이 없을 때의 whenAnswersMissing도 필요합니다",
							);
						}
						if (
							!answerSignals.length &&
							condition?.whenAnswersMissing !== undefined
						) {
							fail(
								where,
								"answerSignals 없이 whenAnswersMissing만 둘 수 없습니다",
							);
						}
					} else if (routing.condition !== undefined) {
						fail(
							where,
							`${mode} 모드에는 온라인 선택 조건 condition을 적지 않습니다`,
						);
					}
				}
				if (!routing.reviewReason?.trim()) {
					fail(where, "baselineRouting.reviewReason이 비어 있습니다");
				}
			}
		} else if (p.baselineRouting !== undefined) {
			fail(where, "baselineRouting은 baseline 카테고리에서만 사용합니다");
		}

		// 11. 산문에 숨은 패턴 참조와 구조화된 관계가 갈라지지 않게 한다.
		const relationTargets = new Map();
		for (const relation of ["requires", "related", "excludes"]) {
			const targets = p.relations?.[relation];
			if (targets !== undefined && targets.length === 0) {
				fail(
					where,
					`relations.${relation}가 비어 있습니다 — 안 쓸 거면 지우세요`,
				);
			}
			const seenTargets = new Set();
			for (const targetId of targets ?? []) {
				if (seenTargets.has(targetId)) {
					fail(where, `relations.${relation}의 "${targetId}"가 중복입니다`);
				}
				seenTargets.add(targetId);
				if (!allPatternIds.has(targetId)) {
					fail(
						where,
						`relations.${relation}의 "${targetId}"를 찾을 수 없습니다`,
					);
				}
				if (targetId === p.id) {
					fail(
						where,
						`relations.${relation}에서 자기 자신을 가리킬 수 없습니다`,
					);
				}
				const previous = relationTargets.get(targetId);
				if (previous && previous !== relation) {
					fail(
						where,
						`관계 대상 "${targetId}"가 ${previous}와 ${relation}에 함께 있습니다`,
					);
				}
				relationTargets.set(targetId, relation);
			}
		}
		const flowTargets = new Set(
			(p.flow ?? []).flatMap((step) =>
				step.patternId === undefined ? [] : [step.patternId],
			),
		);
		const structuredTargets = new Set([
			...relationTargets.keys(),
			...flowTargets,
		]);
		for (const targetId of allPatternIds) {
			if (
				targetId !== p.id &&
				mentionsPatternId(p.detail, targetId) &&
				!structuredTargets.has(targetId)
			) {
				fail(
					where,
					`detail의 패턴 id "${targetId}"가 flow나 relations에 구조화되지 않았습니다`,
				);
			}
		}

		// 5-a. id 중복 — 중복되면 출처 되짚기가 엉뚱한 패턴을 가리킨다.
		if (seenIds.has(p.id)) {
			fail(where, `id가 ${seenIds.get(p.id)}와 중복입니다`);
		}
		seenIds.set(p.id, where);

		// 5-b. 출처가 실존해야 한다. 못 찾으면 화면에서 크레딧이 조용히 사라진다.
		if (!p.sourceIds?.length) fail(where, "sourceIds가 비어 있습니다");
		for (const sid of p.sourceIds ?? []) {
			if (!getSourceById(sid))
				fail(where, `sourceIds의 "${sid}"를 찾을 수 없습니다`);
		}

		// 6. adapted(가공)는 원 소스가 있어야 성립한다.
		// "원 소스 + Tailor 가공" 표기의 앞쪽이 비면 표기 자체가 거짓이 된다.
		// Tailor가 처음부터 만든 것은 가공이 아니라 self(=Tailor-made)다.
		if (p.adapted) {
			const external = (p.sourceIds ?? []).filter(
				(sid) => getSourceById(sid) && !getSourceById(sid).self,
			);
			if (!external.length) {
				fail(
					where,
					"adapted인데 원 소스가 없습니다 — 처음부터 만든 것이라면 self 출처를 쓰세요",
				);
			}
		}

		// 4. 구조화된 칸을 하나라도 썼다면 kind를 명시해야 한다.
		// 기본값(artifact)에 기대면, 결과물로 검증할 수 없는 항목이 크레딧에
		// 섞여 들어간다(2026-08-18 출처 정직성 실험의 거짓 크레딧 원인).
		const usesStructured = STRUCTURED_FIELDS.some(
			(f) => p[f] !== undefined && p[f] !== null,
		);
		if (usesStructured && p.kind === undefined) {
			fail(
				where,
				"구조화된 칸을 썼다면 kind를 명시해야 합니다(artifact | process)",
			);
		}

		// 2-a. 값에는 성격 서술이 반드시 붙는다.
		// 값만 있으면 사용자 상황에 맞는지 판단할 수 없어 참고 자체가 불가능하다.
		for (const [i, o] of (p.options ?? []).entries()) {
			if (!o.value?.trim()) fail(where, `options[${i}].value가 비어 있습니다`);
			if (!o.character?.trim()) {
				fail(
					where,
					`options[${i}]("${o.value}")에 성격 서술(character)이 없습니다`,
				);
			}
		}

		// 2-b. 예시는 극성과 본문이 모두 있어야 한다.
		// 극성이 없으면 나쁜 예로 적은 값이 권장값으로 읽힌다.
		for (const [i, e] of (p.examples ?? []).entries()) {
			if (e.polarity !== "good" && e.polarity !== "bad") {
				fail(where, `examples[${i}].polarity는 "good" 또는 "bad"여야 합니다`);
			}
			if (!e.text?.trim()) fail(where, `examples[${i}].text가 비어 있습니다`);
		}

		// 2-c. format을 열었으면 최소 한 조각은 채운다(빈 껍데기 방지).
		if (p.format) {
			const filled =
				p.format.count?.trim() ||
				p.format.sections?.length ||
				p.format.template?.trim();
			if (!filled)
				fail(where, "format이 비어 있습니다 — 안 쓸 거면 필드를 지우세요");
		}

		// 3. 감사 항목 id는 항목 단위 형식만 받는다(파일 경로 금지).
		for (const aid of p.auditIds ?? []) {
			if (!AUDIT_ID.test(aid)) {
				fail(where, `auditIds의 "${aid}"는 항목 id 형식이 아닙니다(예: D-17)`);
			}
		}

		// 8. flow 검사 — 순서를 담는 칸이 조용히 낡는 것을 막는다.
		// 이 칸을 만든 이유가 "산문으로 적으면 패턴 이름이 바뀌어도 아무도 못 잡는다"
		// 였으므로, 검사가 없으면 칸을 만든 값이 없다.
		if (p.flow?.length) {
			const stepIds = new Set();
			for (const step of p.flow) {
				// 8-a. 흐름 안에서 단계 id가 유일해야 goto가 한 곳을 가리킨다.
				if (stepIds.has(step.id)) {
					fail(where, `flow의 단계 id "${step.id}"가 중복입니다`);
				}
				stepIds.add(step.id);
			}
			for (const step of p.flow) {
				// 8-b. patternId가 실존해야 한다. 안 그러면 렌더에 죽은 참조가 실린다.
				if (step.patternId && !allPatternIds.has(step.patternId)) {
					fail(
						where,
						`flow 단계 "${step.id}"의 patternId "${step.patternId}"를 찾을 수 없습니다`,
					);
				}
				// 8-c. goto는 같은 흐름의 단계이거나 done/stop이어야 한다.
				for (const b of step.branches ?? []) {
					if (b.goto !== "done" && b.goto !== "stop" && !stepIds.has(b.goto)) {
						fail(
							where,
							`flow 단계 "${step.id}"의 goto "${b.goto}"가 이 흐름에 없습니다(done/stop도 아님)`,
						);
					}
				}
			}
			// 8-d. 순서의 집은 하나여야 한다. 순서형 template과 겹치면 둘이 갈라진다.
			if (p.format?.template?.includes("→")) {
				fail(
					where,
					"flow와 순서형 format.template을 함께 갖고 있습니다 — 순서는 한 곳에만 둡니다",
				);
			}
			// 8-e. 지어낸 순서에 원 소스 크레딧이 붙는 것을 막는다.
			// context-appropriate-theme 가필 사고와 같은 종류의 위험이다.
			if (!p.auditIds?.length) {
				fail(
					where,
					"flow가 있는데 auditIds가 비어 있습니다 — 원문 근거 없는 순서는 담지 않습니다",
				);
			}
		}

		// 7. 라이선스 미확인 소스(summaryOnly)에서 온 패턴은 요약본임을 표시한다.
		// 정책 B 등급 2 — 그 소스에서는 개념만 우리 말로 다시 써서 담기로 했다.
		// 검사기가 "이 문장이 원문 복사인가"까지 볼 수는 없다. 대신 "요약본이라고
		// 표시했는가"는 확실히 잡는다. 표시가 강제되면 나중에 값 리터럴을 넣을 때
		// 최소한 그것이 요약 소스라는 사실이 코드에 보인다.
		for (const sid of p.sourceIds ?? []) {
			const src = getSourceById(sid);
			if (src?.summaryOnly && !p.adapted) {
				fail(
					where,
					`"${sid}"는 라이선스 미확인 소스(summaryOnly)입니다 — 개념만 요약해 담고 adapted: true로 표시하세요`,
				);
			}
		}
	}
}

for (const [mode, count] of baselineRoutingModeCounts) {
	if (count === 0) {
		fail("baseline", `baselineRouting 모드 "${mode}"에 패턴이 하나도 없습니다`);
	}
}

// 묶음이 모든 온라인 후보를 덮고 평가 전용 패턴을 격리하는지 확인한다.
for (const { category, pattern } of allPatternEntries) {
	const where = `${category.id}/${pattern.id}`;
	const memberships = bundlesByPatternId.get(pattern.id) ?? [];
	const onlineBundles = memberships.filter(
		(bundle) => bundle.delivery === "online",
	);
	const evaluationBundles = memberships.filter(
		(bundle) => bundle.delivery === "evaluation-only",
	);
	const baselineMode = pattern.baselineRouting?.mode;
	if (
		(category.id !== "baseline" || baselineMode === "conditional") &&
		onlineBundles.length === 0
	) {
		fail(where, "온라인에서 선택할 패턴인데 속한 online 묶음이 없습니다");
	}
	if (baselineMode === "evaluation-only" && evaluationBundles.length === 0) {
		fail(where, "evaluation-only 패턴인데 평가 전용 묶음이 없습니다");
	}
	if (baselineMode === "evaluation-only" && onlineBundles.length > 0) {
		fail(where, "evaluation-only 패턴이 online 묶음에도 들어 있습니다");
	}
}

// requires와 flow 참조는 실제 전달 단위 안에서 닫혀 있어야 한다.
// always 패턴은 온라인 호출에 별도로 항상 붙으므로 online 묶음 안에 중복하지 않는다.
for (const bundle of patternBundles) {
	const where = `bundle/${bundle.id}`;
	const memberIds = new Set([
		...(bundle.corePatternIds ?? []),
		...(bundle.supportPatternIds ?? []),
	]);
	for (const patternId of memberIds) {
		const pattern = patternsById.get(patternId)?.pattern;
		if (!pattern) continue;
		const requiredIds = new Set([
			...(pattern.relations?.requires ?? []),
			...(pattern.flow ?? []).flatMap((step) =>
				step.patternId === undefined ? [] : [step.patternId],
			),
		]);
		for (const requiredId of requiredIds) {
			const required = patternsById.get(requiredId)?.pattern;
			if (
				bundle.delivery === "online" &&
				required?.baselineRouting?.mode === "always"
			) {
				continue;
			}
			if (!memberIds.has(requiredId)) {
				fail(
					where,
					`"${patternId}"에 필요한 "${requiredId}"가 같은 묶음에 없습니다`,
				);
			}
		}
		for (const excludedId of pattern.relations?.excludes ?? []) {
			if (memberIds.has(excludedId)) {
				fail(
					where,
					`서로 배타적인 "${patternId}"와 "${excludedId}"가 함께 있습니다`,
				);
			}
			const reverse =
				patternsById.get(excludedId)?.pattern.relations?.excludes ?? [];
			if (!reverse.includes(patternId)) {
				fail(
					`${patternsById.get(patternId)?.categoryId}/${patternId}`,
					`excludes의 "${excludedId}" 쪽에도 역방향 관계가 필요합니다`,
				);
			}
		}
	}
}

// ── 구조 골격도 출처 실존 검사만 함께 ───────────────────────────────
for (const a of structureArchetypes) {
	for (const sid of a.sourceIds ?? []) {
		if (!getSourceById(sid)) {
			fail(`archetype/${a.id}`, `sourceIds의 "${sid}"를 찾을 수 없습니다`);
		}
	}
}

const patternCount = referenceCategories.reduce(
	(n, c) => n + c.patterns.length,
	0,
);

if (errors.length) {
	console.error(`FAIL ${errors.length}건\n`);
	for (const e of errors) console.error(`  - ${e}`);
	process.exit(1);
}

console.log(
	`OK  패턴 ${patternCount}개, 묶음 ${patternBundles.length}개, 골격 ${structureArchetypes.length}개 검사 통과`,
);
