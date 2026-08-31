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
import {
	classifyUpstreamError,
	type UpstreamErrorClassification,
} from "./upstream-error";

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
	/**
	 * 선택 호출이 「지금은 어떤 모델도 못 부른다」는 오류로 실패했을 때의 분류.
	 *
	 * 값이 있으면 생성 호출을 하지 않는다. 결제·사용량 상한·인증·429는 full
	 * 코퍼스로 다시 시도해도 같은 결과가 나오고, 그 재시도는 사용자를 40초 더
	 * 기다리게 만든 뒤 같은 실패를 돌려준다.
	 */
	selectionStop: UpstreamErrorClassification | null;
	/**
	 * 선택 **호출**이 남긴 오류. 허용 목록을 거쳐 로그에만 쓴다.
	 *
	 * 중단하지 않고 full로 이어 가는 실패에도 값이 있다. 라우팅 로그의 F1은
	 * 「선택이 실패했다」만 말할 뿐 크레딧인지 429인지 일시 장애인지 가르지
	 * 못하므로, 그 원인은 이쪽 오류 로그가 맡는다.
	 */
	selectionError: unknown;
	/**
	 * 선택 **뒤**의 전달 목록·렌더에서 난 오류. 우리 코드의 문제다.
	 *
	 * `selectionError`와 한 칸에 담으면 안 된다. 상태 코드가 없는 평범한
	 * `Error`는 업스트림 분류에서 `upstream_unavailable`로 떨어지므로, 우리
	 * 렌더 결함이 운영 로그에 Anthropic 장애처럼 남는다. 둘은 같은 F1을
	 * 만들지만 고쳐야 할 곳이 다르다.
	 *
	 * 선택 호출이 실패하면 여기까지 오지 않으므로 둘은 동시에 값을 갖지 않는다.
	 */
	selectionProcessingError: unknown;
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
			selectionStop: null,
			selectionError: null,
			selectionProcessingError: null,
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
	// 선택 호출의 실패와 그 뒤 우리 코드의 실패를 따로 든다. 전환 판정에는
	// 둘 다 같은 F1이지만, 로그에서 섞이면 고칠 곳을 못 찾는다.
	let processingError: unknown = null;
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
			processingError = error;
			result = null;
			plan = null;
			routedSection = null;
		}
	}

	// 분류는 실제 호출이 남긴 오류에만 적용한다. deadline이 만든 중단과 전달
	// 목록·렌더 오류는 우리 쪽 사정이라 「모델을 못 부른다」는 신호가 아니다.
	const selectionStop =
		!attempt.timedOut && attempt.error !== undefined && attempt.error !== null
			? classifyUpstreamError(attempt.error)
			: null;

	const decision = decideSelectionFallback({
		result,
		plan,
		error: attempt.error ?? processingError,
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
		selectionStop:
			selectionStop?.stopsGeneration === true ? selectionStop : null,
		// 중단하지 않고 full로 이어 가는 경우에도 원인을 남겨야 F1이
		// 「무엇 때문에」 났는지 나중에 가릴 수 있다.
		selectionError: attempt.error ?? null,
		selectionProcessingError: processingError,
	};
}

export { buildCorpusSystemBlock };
