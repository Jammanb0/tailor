import type Anthropic from "@anthropic-ai/sdk";
import type { WizardAnswers } from "@/data/wizard-questions";
import { buildRoutedCorpusSection, CORPUS_SECTION } from "./prompt";
import {
	type DeliveryPlan,
	decideSelectionFallback,
	resolveDelivery,
	runSelectionWithDeadline,
	SELECTION_MODEL,
	type SelectionDecision,
	type SelectionResult,
	selectBundles,
} from "./routing";
import {
	buildCorpusSystemBlock,
	type CorpusDeliveryPolicy,
	readCorpusRoutingMode,
	resolveCorpusDeliveryPolicy,
	shouldSelectCorpus,
} from "./routing-policy";

export type RoutingTelemetryInput = {
	model: typeof SELECTION_MODEL;
	ms: number;
	usage: Anthropic.Usage | null;
	decision: SelectionDecision;
};

export type PreparedGenerationCorpus = CorpusDeliveryPolicy & {
	section: string;
	deliveredPatternIds: string[] | null;
	routing: RoutingTelemetryInput | null;
};

/**
 * 운영 설정, 정제 여부, 선택 안전장치를 한곳에서 적용한다.
 *
 * 선택 호출부터 전달 목록 렌더까지 어느 한 단계라도 실패하면 full로 전환한다.
 * 사용자 요청 자체는 오류가 아니므로 선택 실패 때문에 502를 돌려주지 않는다.
 */
export async function prepareGenerationCorpus(input: {
	client: Anthropic;
	answers: WizardAnswers;
	wantsAdvanced: boolean;
	isRefinement: boolean;
	configuredMode?: string;
}): Promise<PreparedGenerationCorpus> {
	const mode = readCorpusRoutingMode(input.configuredMode);
	const selectionEnabled = shouldSelectCorpus({
		configuredMode: mode,
		isRefinement: input.isRefinement,
	});
	if (!selectionEnabled) {
		return {
			mode: "full",
			cacheCorpus: true,
			section: CORPUS_SECTION,
			deliveredPatternIds: null,
			routing: null,
		};
	}

	const attempt = await runSelectionWithDeadline((signal) =>
		selectBundles(
			input.client,
			{ answers: input.answers, wantsAdvanced: input.wantsAdvanced },
			{ signal },
		),
	);
	let result: SelectionResult | null = attempt.result;
	const selectionUsage = result?.usage ?? null;
	let plan: DeliveryPlan | null = null;
	let selectionError = attempt.error;
	let routedSection: string | null = null;

	if (result) {
		try {
			plan = resolveDelivery({
				selectedBundleIds: result.bundleIds,
				answers: input.answers,
			});
			routedSection = buildRoutedCorpusSection(plan.patternIds);
		} catch (error) {
			// 선택 뒤의 전달 목록·렌더 오류도 선택 경로 실패로 보고 full로 전환한다.
			selectionError = error;
			result = null;
			plan = null;
			routedSection = null;
		}
	}

	const decision = decideSelectionFallback({
		result,
		plan,
		error: selectionError,
		timedOut: attempt.timedOut,
	});
	const policy = resolveCorpusDeliveryPolicy({
		selectionEnabled,
		selectionFallback: decision.fallback,
		hasRoutedSection: routedSection !== null,
	});

	return {
		...policy,
		section:
			policy.mode === "routed"
				? (routedSection ?? CORPUS_SECTION)
				: CORPUS_SECTION,
		deliveredPatternIds:
			policy.mode === "routed" && plan ? plan.patternIds : null,
		routing: {
			model: SELECTION_MODEL,
			ms: attempt.ms,
			usage: selectionUsage,
			decision,
		},
	};
}

export { buildCorpusSystemBlock };
