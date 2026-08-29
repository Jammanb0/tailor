// 코퍼스 라우팅 — 요청에 맞는 패턴 묶음을 고르고 전달 목록을 만든다.
//
// 6~9단계 평가를 통과해 최초 생성의 조건부 운영 경로에 연결됐다. 정제 요청은
// 여전히 전체 코퍼스를 쓰고, 미설정·오류 설정도 전체 주입으로 무너진다. 근거와
// 순서는 `.agents/plans/workstreams/corpus-routing/design.md`에 있다.
//
// 여기서 하는 일은 셋이다.
//   1) 선택 모델이 읽을 묶음 카드와 지시문을 만든다
//   2) 모델이 고른 묶음 id를 실제 전달 패턴 목록으로 편다
//   3) 원시 설문 값으로 바로 정해지는 패턴은 모델을 거치지 않고 켜고 끈다
//
// 3번을 코드가 맡는 이유: `answerSignals`는 "설문 답만 보면 판정이 끝나는"
// 조건이다. 그걸 모델에게 다시 묻는 것은 틀릴 여지만 만든다. 답이 없을 때
// (고급 모드를 안 켠 요청) 쓰는 `whenAnswersMissing`은 반대로 모델의 몫이고,
// 6단계는 이 둘의 정확도를 따로 잰다.

import type Anthropic from "@anthropic-ai/sdk";
import {
	patternBundles,
	type ReferencePattern,
	referenceCategories,
} from "@/data/reference-corpus";
import type { WizardAnswers } from "@/data/wizard-questions";
import { extractListTag, formatAnswersForPrompt, normalizeId } from "./prompt";

// 선택 전용 저비용 모델. 생성 모델(Sonnet 5)과 별개로 둔다 — 이 호출은 카드만
// 읽고 id만 뱉으므로 생성만큼의 능력이 필요 없고, 비용 비교의 전제가 이쪽이다.
export const SELECTION_MODEL = "claude-haiku-4-5";

// 고른 묶음 id는 짧다. 전부 고르더라도 넉넉하다.
const SELECTION_MAX_TOKENS = 512;

/** 선택이 이 시간 안에 끝나지 않으면 전체 코퍼스로 전환한다. */
export const SELECTION_DEADLINE_MS = 10_000;

export const onlineBundles = patternBundles.filter(
	(bundle) => bundle.delivery === "online",
);

const bundlesById = new Map(
	patternBundles.map((bundle) => [bundle.id, bundle]),
);

// 코퍼스 선언 순서. 전달 목록의 정렬 기준이자, 렌더 순서가 선택 순서에 따라
// 흔들리지 않게 하는 장치다.
const patternOrder = new Map<string, number>();
const patternsById = new Map<string, ReferencePattern>();
for (const category of referenceCategories) {
	for (const pattern of category.patterns) {
		patternOrder.set(pattern.id, patternOrder.size);
		patternsById.set(pattern.id, pattern);
	}
}

/** 요청 내용과 무관하게 매번 전달하는 공통 기본 패턴. */
export const alwaysPatternIds = [...patternsById.values()]
	.filter((pattern) => pattern.baselineRouting?.mode === "always")
	.map((pattern) => pattern.id);

function isEvaluationOnly(pattern: ReferencePattern): boolean {
	return pattern.baselineRouting?.mode === "evaluation-only";
}

function bundleMemberIds(bundleId: string): string[] {
	const bundle = bundlesById.get(bundleId);
	if (!bundle) return [];
	return [...bundle.corePatternIds, ...(bundle.supportPatternIds ?? [])];
}

/**
 * 선택 모델이 읽을 묶음 카드.
 *
 * 형식을 바꾸면 크기가 달라진다 — design.md가 인용하는 실측값은 이 형식의
 * 값이므로, 고칠 때 그쪽 수치도 함께 다시 잰다.
 */
export function buildBundleCards(): string {
	return onlineBundles
		.map(
			(bundle) => `[${bundle.id}] ${bundle.summary}\n선택 조건: ${bundle.when}`,
		)
		.join("\n");
}

export const SELECTION_SYSTEM_PROMPT = `당신은 사용자의 요청을 읽고, 그 사람에게 맞는 Claude Code Skill(SKILL.md)을 쓸 때 참고할 패턴 묶음을 고르는 역할입니다.
스킬을 직접 쓰지 마세요. 고른 묶음의 id만 보고하면 됩니다.

아래가 고를 수 있는 묶음 전부입니다. 한 줄 설명과 선택 조건이 붙어 있습니다.

${buildBundleCards()}

고르는 법:
- 요청이 실제로 시키는 일에 필요한 것만 고르세요. 주제가 가깝다는 이유로 덧붙이지 마세요.
- 요청이 여러 가지 일을 시키면 그만큼 여러 개를 고르세요.
- 맞는 묶음이 하나도 없으면 비워두세요. 억지로 하나 고르지 마세요.
- 위 목록에 없는 id는 적지 마세요.

응답은 아래 형식만 출력하세요. 다른 설명은 붙이지 마세요.

<bundles>
(고른 묶음 id를 한 줄에 하나씩. 없으면 비워둠)
</bundles>`;

/**
 * 선택 모델에게 줄 요청 본문.
 *
 * 생성 프롬프트와 같은 요약을 쓴다. 두 모델이 다른 표현의 요청을 보면 선택이
 * 틀렸을 때 원인이 선택 능력인지 표현 차이인지 가릴 수 없다.
 */
export function buildSelectionUserContent(
	answers: WizardAnswers,
	wantsAdvanced: boolean,
): string {
	return `사용자가 답한 내용:\n\n${formatAnswersForPrompt(answers, wantsAdvanced)}`;
}

/** 모델 응답에서 고른 묶음 id만 꺼낸다. 중복은 없앤다. */
export function extractSelectedBundleIds(text: string): string[] {
	const ids = extractListTag(text, "bundles").map(normalizeId).filter(Boolean);
	return [...new Set(ids)];
}

export type DirectSignalResult = {
	/** 원시 설문 값이 조건과 맞아 켜진 패턴. */
	on: string[];
	/** 답은 있는데 조건과 맞지 않아 꺼진 패턴. 묶음이 골라도 싣지 않는다. */
	off: string[];
	/** 조건에 걸린 질문에 답이 없어 모델 판단(whenAnswersMissing)에 맡긴 패턴. */
	undecided: string[];
};

function hasAnswer(value: string | string[] | undefined): boolean {
	if (value === undefined) return false;
	return Array.isArray(value) ? value.length > 0 : value.trim() !== "";
}

function answerMatches(
	value: string | string[] | undefined,
	wanted: string[],
): boolean {
	const values = Array.isArray(value) ? value : [value ?? ""];
	return values.some((one) => wanted.includes(one));
}

/**
 * 원시 설문 값으로 패턴의 전달 여부를 판정한다.
 *
 * 답이 있으면 판정이 **끝난다** — 맞으면 켜고, 맞지 않으면 끈다. 켜기만 하고
 * 끄기를 모델에 맡기면 "가끔 쓴다"고 답한 사람에게도 자주 쓰는 스킬용 분량
 * 규칙이 실려간다. 묶음이 그 패턴을 데려와도 마찬가지다.
 *
 * 답이 하나도 없을 때만 켜지도 꺼지도 않는다. 그 자리의 판정은
 * `whenAnswersMissing`을 읽는 묶음 선택(모델)의 몫이라, 여기서 끄면 두 경로가
 * 서로를 지운다.
 */
export function directSignalPatterns(
	answers: WizardAnswers,
): DirectSignalResult {
	const on: string[] = [];
	const off: string[] = [];
	const undecided: string[] = [];
	for (const pattern of patternsById.values()) {
		const routing = pattern.baselineRouting;
		if (routing?.mode !== "conditional") continue;
		const signals = routing.condition.answerSignals;
		if (!signals?.length) continue;
		const answered = signals.filter((signal) =>
			hasAnswer(answers[signal.questionId]),
		);
		if (!answered.length) {
			undecided.push(pattern.id);
			continue;
		}
		const matched = answered.some((signal) =>
			answerMatches(answers[signal.questionId], signal.values),
		);
		if (matched) on.push(pattern.id);
		else off.push(pattern.id);
	}
	return { on, off, undecided };
}

export type DeliveryPlan = {
	/** 실제로 반영한 온라인 묶음. */
	bundleIds: string[];
	/** 목록에 없는 id. 지어냈거나 이름이 바뀐 것이므로 관측 대상이다. */
	unknownBundleIds: string[];
	/** 평가 전용이라 온라인 전달에서 뺀 묶음. */
	rejectedBundleIds: string[];
	alwaysPatternIds: string[];
	/** 고른 묶음이 데려온 패턴의 합집합. */
	bundlePatternIds: string[];
	/** 원시 설문 값으로 켠 패턴. */
	directSignalPatternIds: string[];
	/** 원시 설문 값으로 끈 패턴. 묶음이 골라 왔더라도 뺀다. */
	directSignalOffPatternIds: string[];
	/** 설문에 답이 없어 모델 판단에 맡긴 패턴. */
	undecidedSignalPatternIds: string[];
	/** requires·flow를 닫으면서 추가로 딸려 온 패턴. */
	addedByRequires: string[];
	/** 최종 전달 목록. 코퍼스 선언 순서다. */
	patternIds: string[];
};

/**
 * 고른 묶음 id를 실제 전달 패턴 목록으로 편다.
 *
 * 같은 패턴이 여러 묶음에 있어도 한 번만 싣는다. `requires`는 묶음 안에서 이미
 * 닫혀 있지만(lint 규칙 10), 직접 신호로 켠 패턴은 묶음을 거치지 않으므로
 * 여기서 한 번 더 닫는다.
 *
 * 순서는 「직접 신호 판정 → 관계 닫기」다. 신호로 끈 패턴이라도 함께 실린 다른
 * 패턴이 `requires`로 걸고 있으면 다시 들어온다 — 하나만 보내면 뜻이 깨지는
 * 짝을 신호가 갈라놓지 않게 하기 위해서다. 그렇게 들어온 것은 조용히 섞이지
 * 않고 `addedByRequires`에 남는다.
 *
 * 같은 묶음 id가 두 번 들어오면 한 번만 센다. 패턴은 어차피 중복이 제거되지만
 * 선택 횟수 통계가 흐려진다.
 */
export function resolveDelivery(input: {
	selectedBundleIds: string[];
	answers: WizardAnswers;
}): DeliveryPlan {
	const unknownBundleIds: string[] = [];
	const rejectedBundleIds: string[] = [];
	const bundleIds: string[] = [];
	for (const id of new Set(input.selectedBundleIds)) {
		const bundle = bundlesById.get(id);
		if (!bundle) {
			unknownBundleIds.push(id);
			continue;
		}
		if (bundle.delivery !== "online") {
			rejectedBundleIds.push(id);
			continue;
		}
		bundleIds.push(id);
	}

	const bundlePatternIds = [
		...new Set(bundleIds.flatMap((id) => bundleMemberIds(id))),
	];
	const signals = directSignalPatterns(input.answers);

	// 골라서 넣기로 한 것과 관계를 닫다가 딸려온 것을 가르는 기준. 묶음 안에서
	// 흐름 참조를 먼저 따라가다 만나는 멤버까지 "딸려왔다"고 세면, 실제로는
	// 묶음이 데려온 패턴이 관계 때문에 들어온 것처럼 보인다.
	const off = new Set(signals.off);
	const seeded = new Set(
		[...alwaysPatternIds, ...bundlePatternIds, ...signals.on].filter(
			(id) => !off.has(id),
		),
	);

	const delivered = new Set<string>();
	const addedByRequires: string[] = [];
	const add = (patternId: string) => {
		const pattern = patternsById.get(patternId);
		// 평가 전용 패턴은 어떤 경로로도 온라인 전달에 들어가지 않는다.
		if (!pattern || isEvaluationOnly(pattern)) return;
		if (delivered.has(patternId)) return;
		delivered.add(patternId);
		if (!seeded.has(patternId)) addedByRequires.push(patternId);
		for (const requiredId of pattern.relations?.requires ?? []) {
			add(requiredId);
		}
		for (const step of pattern.flow ?? []) {
			if (step.patternId) add(step.patternId);
		}
	};

	for (const id of seeded) add(id);

	const patternIds = [...delivered].sort(
		(a, b) => (patternOrder.get(a) ?? 0) - (patternOrder.get(b) ?? 0),
	);

	return {
		bundleIds,
		unknownBundleIds,
		rejectedBundleIds,
		alwaysPatternIds: [...alwaysPatternIds],
		bundlePatternIds,
		directSignalPatternIds: signals.on,
		directSignalOffPatternIds: signals.off,
		undecidedSignalPatternIds: signals.undecided,
		addedByRequires,
		patternIds,
	};
}

export type SelectionResult = {
	bundleIds: string[];
	/** 모델이 실제로 뱉은 글. 선택이 이상할 때 원인을 보려고 남긴다. */
	rawText: string;
	usage: Anthropic.Usage | null;
	ms: number;
	stopReason: string | null;
};

export type SelectionFallbackReasonId = "F1" | "F2" | "F3" | "F4" | "F5" | "F6";

export type SelectionDecision = {
	status: "success" | "ambiguous" | "failure";
	fallback: boolean;
	fallbackReasonIds: SelectionFallbackReasonId[];
	ambiguityIds: Array<"F7">;
};

/**
 * `<bundles>` 파서가 블록의 존재를 인식할 수 있는가.
 *
 * 닫힌 블록은 위치를 가리지 않고, 닫히지 않은 블록은 여는 태그가 줄 머리에
 * 있을 때만 복구한다. `extractTag`가 빈 본문에는 null을 돌려주므로 F3과 F4를
 * 가르려면 추출 결과와 별도로 이 신호가 필요하다.
 */
export function hasRecognizableBundlesTag(rawText: string): boolean {
	return (
		/<bundles>[\s\S]*?<\/bundles>/.test(rawText) ||
		/^[ \t]*<bundles>/m.test(rawText)
	);
}

/** 선택 결과를 성공·애매·실패로 가르고 전체 전환 이유를 전부 남긴다. */
export function decideSelectionFallback(input: {
	result?: SelectionResult | null;
	plan?: DeliveryPlan | null;
	error?: unknown;
	timedOut?: boolean;
}): SelectionDecision {
	const fallbackReasonIds: SelectionFallbackReasonId[] = [];
	const ambiguityIds: Array<"F7"> = [];

	if (input.timedOut) {
		// deadline이 만든 AbortError를 호출 실패로도 세면 장애 집계가 부풀려진다.
		fallbackReasonIds.push("F2");
	} else if (input.error !== undefined && input.error !== null) {
		fallbackReasonIds.push("F1");
	}

	if (input.result && input.plan) {
		const invalidCount =
			input.plan.unknownBundleIds.length + input.plan.rejectedBundleIds.length;
		if (input.result.bundleIds.length === 0) {
			fallbackReasonIds.push(
				hasRecognizableBundlesTag(input.result.rawText) ? "F4" : "F3",
			);
		} else if (input.plan.bundleIds.length === 0 && invalidCount > 0) {
			fallbackReasonIds.push("F5");
		}

		if (input.result.stopReason === "max_tokens") {
			fallbackReasonIds.push("F6");
		}

		if (input.plan.bundleIds.length > 0 && invalidCount > 0) {
			ambiguityIds.push("F7");
		}
	}

	const fallback = fallbackReasonIds.length > 0;
	return {
		status: fallback
			? "failure"
			: ambiguityIds.length > 0
				? "ambiguous"
				: "success",
		fallback,
		fallbackReasonIds,
		ambiguityIds,
	};
}

export type SelectionAttempt = {
	result: SelectionResult | null;
	error: unknown;
	timedOut: boolean;
	ms: number;
};

/**
 * 선택 호출을 deadline과 경주시킨다.
 *
 * 신호를 무시하는 구현이어도 10초에 반환하되, 실제 SDK 호출에는 AbortSignal을
 * 전달해 네트워크 요청도 취소한다.
 */
export async function runSelectionWithDeadline(
	run: (signal: AbortSignal) => Promise<SelectionResult>,
	deadlineMs = SELECTION_DEADLINE_MS,
): Promise<SelectionAttempt> {
	const startedAt = Date.now();
	const controller = new AbortController();
	let timeout: ReturnType<typeof setTimeout> | undefined;
	let deadlineReached = false;
	const deadline = new Promise<never>((_resolve, reject) => {
		timeout = setTimeout(() => {
			deadlineReached = true;
			controller.abort();
			reject(new DOMException("selection deadline reached", "AbortError"));
		}, deadlineMs);
	});

	try {
		const result = await Promise.race([run(controller.signal), deadline]);
		return {
			result,
			error: null,
			timedOut: false,
			ms: Date.now() - startedAt,
		};
	} catch (error) {
		return {
			result: null,
			error,
			timedOut: deadlineReached,
			ms: Date.now() - startedAt,
		};
	} finally {
		if (timeout !== undefined) clearTimeout(timeout);
	}
}

/**
 * 선택 모델을 한 번 호출해 묶음을 고른다.
 *
 * 카드에 캐시를 걸지 않았다. 조합 반복률을 재기 전에 캐시를 켜면 다시 읽히지
 * 않는 블록에 1.25배를 내게 될 수 있다(design.md 「캐시는 반복되는 부분에만
 * 건다」). 반복률을 잰 뒤에 정한다.
 */
export async function selectBundles(
	client: Anthropic,
	input: { answers: WizardAnswers; wantsAdvanced?: boolean },
	options?: { signal?: AbortSignal },
): Promise<SelectionResult> {
	const startedAt = Date.now();
	const response = await client.messages.create(
		{
			model: SELECTION_MODEL,
			max_tokens: SELECTION_MAX_TOKENS,
			system: SELECTION_SYSTEM_PROMPT,
			messages: [
				{
					role: "user",
					content: buildSelectionUserContent(
						input.answers,
						Boolean(input.wantsAdvanced),
					),
				},
			],
		},
		options?.signal ? { signal: options.signal } : undefined,
	);
	const rawText = response.content
		.filter((block) => block.type === "text")
		.map((block) => block.text)
		.join("");
	return {
		bundleIds: extractSelectedBundleIds(rawText),
		rawText,
		usage: response.usage,
		ms: Date.now() - startedAt,
		stopReason: response.stop_reason,
	};
}
