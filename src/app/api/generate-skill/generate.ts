// 생성 한 번의 전체 흐름. 라우트는 이 함수를 부르기만 한다.
//
// 왜 라우트에서 떼어 냈나: 클라이언트를 인자로 받으면 「이 오류에서 Sonnet을
// 부르지 않는가」를 실제 코드로 확인할 수 있다. 라우트 안에서 클라이언트를
// 만들면 그 확인은 유료 호출 없이는 불가능하고, 결국 아무도 확인하지 않는다.
//
// 회귀 시험: `pnpm check:upstream-errors`

import type Anthropic from "@anthropic-ai/sdk";
import {
	type AttributedSource,
	type SkillArchetype,
	sourcesForArchetype,
	sourcesForUsedPatterns,
} from "@/data/reference-corpus";
import {
	buildGenerationErrorPayload,
	type GenerationErrorCode,
	generationErrorStatus,
} from "@/lib/generation-errors";
import {
	buildCorpusSystemBlock,
	type PreparedGenerationCorpus,
	prepareGenerationCorpus,
} from "./generation-routing";
import type { GenerationObservation } from "./observation";
import {
	buildUserContent,
	extractArchetypeId,
	extractFilename,
	extractListTag,
	extractTag,
	extractUsedPatternIds,
	MAX_CLARIFYING_QUESTIONS,
	REFINE_SYSTEM_PROMPT,
	SYSTEM_PROMPT,
} from "./prompt";
import type { ValidatedRequest } from "./request-validation";
import {
	logGeneration,
	logParseFailure,
	logRequestFailure,
	logRouting,
	pickUsage,
	SELECTION_PROCESSING_CATEGORY,
} from "./telemetry";
import { classifyUpstreamError } from "./upstream-error";

// 생성 모델. A/B 비교 중에는 이 값과 thinking 설정을 함께 맞춰야 공정한 비교가 된다.
export const GENERATION_MODEL = "claude-sonnet-5";

export type GenerationOutcome = { status: number; body: unknown };

/**
 * 응답과 관측값을 **다른 자리에 담는다.**
 *
 * 한 객체에 섞으면 계측값이 응답 body로 새는 것을 사람이 눈으로 막아야 한다.
 * 형으로 갈라 두면 `route.ts`가 `result.outcome.body`만 내보내고 `observation`은
 * 저장에만 쓰게 되어, 실수할 자리 자체가 없어진다.
 */
export type GenerationRunResult = {
	outcome: GenerationOutcome;
	observation: GenerationObservation;
};

/** 선택 단계에서 알아낸 것. 어느 경로로 끝나든 관측값에 그대로 실린다. */
type SelectionFacts = Pick<
	GenerationObservation,
	| "selectionStatus"
	| "selectionFallback"
	| "fallbackReasonIds"
	| "ambiguityIds"
	| "selectionErrorStage"
	| "selectionErrorCategory"
	| "selectionMs"
	| "selectionUsage"
>;

const NO_SELECTION: SelectionFacts = {
	selectionStatus: null,
	selectionFallback: null,
	fallbackReasonIds: null,
	ambiguityIds: null,
	selectionErrorStage: null,
	selectionErrorCategory: null,
	selectionMs: null,
	selectionUsage: null,
};

function readSelectionFacts(
	prepared: PreparedGenerationCorpus,
): SelectionFacts {
	if (!prepared.routing) return NO_SELECTION;
	// 선택 호출의 실패와 그 뒤 우리 코드의 실패는 고칠 곳이 다르다. 어느 쪽이
	// 값을 가졌는지로 stage를 가른다 — 둘이 동시에 값을 갖지는 않는다.
	const hasUpstream =
		prepared.selectionError !== null && prepared.selectionError !== undefined;
	const hasProcessing =
		prepared.selectionProcessingError !== null &&
		prepared.selectionProcessingError !== undefined;
	return {
		selectionStatus: prepared.routing.decision.status,
		selectionFallback: prepared.routing.decision.fallback,
		fallbackReasonIds: [...prepared.routing.decision.fallbackReasonIds],
		ambiguityIds: [...prepared.routing.decision.ambiguityIds],
		selectionErrorStage: hasUpstream
			? "selection"
			: hasProcessing
				? "selection-processing"
				: null,
		selectionErrorCategory: hasUpstream
			? classifyUpstreamError(prepared.selectionError).category
			: hasProcessing
				? SELECTION_PROCESSING_CATEGORY
				: null,
		selectionMs: prepared.routing.ms,
		// usage가 없으면 null을 지킨다. pickUsage는 빠진 값을 0으로 채우는데,
		// 선택 호출이 응답 전에 죽으면 그 0이 「불렀고 토큰을 안 썼다」로 읽힌다.
		// 실제로는 「모른다」다. 둘을 섞으면 자료에서 다시 가를 수 없다.
		selectionUsage:
			prepared.routing.usage === null
				? null
				: pickUsage(prepared.routing.usage),
	};
}

function toLiteSource(source: AttributedSource) {
	return {
		name: source.name,
		author: source.author,
		url: source.url,
		license: source.license,
		self: source.self ?? false,
		// 원문을 번역·재해석해 담은 패턴에서 온 출처. 화면에 "Tailor 가공"으로 붙는다.
		adapted: source.adapted ?? false,
	};
}

/** 실패 응답은 전부 여기를 거친다 — 문구와 코드가 한 벌로만 나가게. */
export function generationErrorOutcome(input: {
	code: GenerationErrorCode;
	retryAfterSeconds?: number | null;
}): GenerationOutcome {
	return {
		status: generationErrorStatus(input.code),
		body: buildGenerationErrorPayload(input),
	};
}

export async function runGeneration(input: {
	client: Anthropic;
	request: ValidatedRequest;
	configuredMode?: string;
	operationId?: string;
}): Promise<GenerationRunResult> {
	const { answers, wantsAdvanced, refinement, clarifications } = input.request;
	const operationId = input.operationId ?? null;

	const userContent = buildUserContent(
		answers,
		wantsAdvanced,
		refinement,
		clarifications,
	);
	const preparedCorpus = await prepareGenerationCorpus({
		client: input.client,
		answers,
		wantsAdvanced,
		isRefinement: refinement !== undefined,
		configuredMode: input.configuredMode,
	});
	if (preparedCorpus.routing) {
		logRouting({ ...preparedCorpus.routing, operationId });
	}

	const selection = readSelectionFacts(preparedCorpus);
	// 생성 단계에서 채워 나가는 값. 어느 경로로 끝나든 finish()가 이것을 읽는다.
	let generationMs: number | null = null;
	let generationUsage: GenerationObservation["generationUsage"] = null;
	let attempted = false;

	/**
	 * 반환을 한 자리로 모은다.
	 *
	 * 조기 반환이 다섯 갈래인데 각자 관측값을 만들면, 하나를 빠뜨려도 응답은
	 * 정상이라 아무도 모른다. 표에는 영영 pending으로 남는다.
	 */
	const finish = (
		outcome: GenerationOutcome,
		result: {
			status: GenerationObservation["status"];
			errorCode?: GenerationErrorCode | null;
			stopReason?: string | null;
		},
	): GenerationRunResult => ({
		outcome,
		observation: {
			...selection,
			deliveredMode: attempted ? preparedCorpus.mode : null,
			generationAttempted: attempted,
			status: result.status,
			errorCode: result.errorCode ?? null,
			generationMs,
			generationStopReason: result.stopReason ?? null,
			generationUsage,
			// Sonnet을 부르지 않았으면 주입한 것도 없다. attempted를 안 보면
			// selectionStop 경로가 「full 코퍼스 141,597바이트를 넣었다」고 적는데,
			// 그 요청은 코퍼스를 한 글자도 보내지 않았다.
			deliveredPatternCount: attempted
				? (preparedCorpus.deliveredPatternIds?.length ?? null)
				: null,
			injectedBytes: attempted
				? Buffer.byteLength(preparedCorpus.section, "utf8")
				: null,
		},
	});

	// 선택이 실패했으면 중단 여부와 무관하게 원인을 한 번 남긴다.
	//
	// 라우팅 로그의 F1은 「선택이 실패했다」까지만 말한다. full로 이어 가는
	// 실패에도 이 줄이 없으면, 크레딧이 떨어진 것과 네트워크가 끊긴 것이
	// 운영 자료에서 같은 한 칸에 들어간다.
	// 선택 호출의 실패와 그 뒤 우리 코드의 실패는 따로 남긴다. 렌더 결함이
	// 업스트림 장애로 집계되면 고칠 곳을 엉뚱한 데서 찾게 된다.
	if (
		preparedCorpus.selectionError !== null &&
		preparedCorpus.selectionError !== undefined
	) {
		logRequestFailure(preparedCorpus.selectionError, "selection", operationId);
	}
	if (
		preparedCorpus.selectionProcessingError !== null &&
		preparedCorpus.selectionProcessingError !== undefined
	) {
		logRequestFailure(
			preparedCorpus.selectionProcessingError,
			"selection-processing",
			operationId,
		);
	}

	// 결제·사용량 상한·인증·429면 여기서 끝낸다. full 코퍼스로 이어 가 봐야
	// 같은 벽에 부딪히고, 사용자는 그 실패를 40초 뒤에 본다.
	if (preparedCorpus.selectionStop) {
		// Sonnet을 부르지 않고 끝낸다. attempted가 false로 남아 관측값의
		// deliveredMode도 null이 된다 — DB의 불변식과 같은 짝이다.
		return finish(
			generationErrorOutcome({
				code: preparedCorpus.selectionStop.category,
				retryAfterSeconds: preparedCorpus.selectionStop.retryAfterSeconds,
			}),
			{ status: "error", errorCode: preparedCorpus.selectionStop.category },
		);
	}

	let text: string;
	// 파싱이 깨졌을 때도 종료 이유는 남겨야 원인을 가른다. try 밖에서 쓰므로
	// 여기에 둔다.
	let stopReason: string | null = null;
	try {
		const startedAt = Date.now();
		// 호출을 시작한 시점에 참이 된다. 여기서 던져도 「불렀다」는 사실은 남는다.
		attempted = true;
		const response = await input.client.messages.create({
			model: GENERATION_MODEL,
			max_tokens: 8192,
			// Sonnet 5는 이 필드를 생략하면 adaptive thinking이 켜지고, thinking
			// 토큰이 max_tokens를 함께 잡아먹어 <skill_md>가 잘린다. 명시적으로 끈다.
			thinking: { type: "disabled" },
			system: [
				buildCorpusSystemBlock({
					text: preparedCorpus.section,
					cacheCorpus: preparedCorpus.cacheCorpus,
				}),
				{
					type: "text",
					text: refinement ? REFINE_SYSTEM_PROMPT : SYSTEM_PROMPT,
				},
			],
			messages: [{ role: "user", content: userContent }],
		});
		stopReason = response.stop_reason;
		generationMs = Date.now() - startedAt;
		generationUsage = pickUsage(response.usage);
		// 코퍼스 라우팅 전환 전의 기준값을 남기기 위한 한 줄. 생성 결과에는
		// 영향을 주지 않고 서버 로그에만 찍는다. 무엇이 나가는지는 telemetry.ts가
		// 허용 목록으로 정한다 — 사용자가 쓴 글과 생성 결과 전문은 담기지 않는다.
		logGeneration({
			operationId,
			kind: refinement ? "refine" : "create",
			corpusMode: preparedCorpus.mode,
			model: GENERATION_MODEL,
			ms: generationMs,
			stopReason,
			usage: response.usage,
		});
		text = response.content
			.filter((block) => block.type === "text")
			.map((block) => block.text)
			.join("");
	} catch (error) {
		logRequestFailure(error, "generation", operationId);
		const classification = classifyUpstreamError(error);
		return finish(
			generationErrorOutcome({
				code: classification.category,
				retryAfterSeconds: classification.retryAfterSeconds,
			}),
			{ status: "error", errorCode: classification.category, stopReason },
		);
	}

	const skillMarkdown = extractTag(text, "skill_md");
	const reviewNotes = extractListTag(text, "review");
	// 프롬프트로 최대 3개를 걸어두지만 모델이 넘겨 보내는 일이 있다 — 실제로
	// 같은 질문을 문장만 바꿔 두 번 적고 4개를 낸 응답이 있었다. 사용자는 같은
	// 것에 두 번 답하게 되므로 여기서 잘라 상한을 지킨다.
	const clarifyingQuestions = extractListTag(text, "questions").slice(
		0,
		MAX_CLARIFYING_QUESTIONS,
	);

	if (!skillMarkdown) {
		// 입력이 부실하면 모델은 <skill_md>를 비우고 <questions>로 되묻는다.
		// 이건 실패가 아니라 정당한 요구다 — 에러로 뭉개면 모델이 만든 되물음이
		// 그대로 버려지고 사용자는 같은 입력으로 재시도하는 것 말고 할 게 없다.
		if (clarifyingQuestions.length > 0) {
			return finish(
				{
					status: 200,
					body: { needsMoreInfo: true, clarifyingQuestions, reviewNotes },
				},
				{ status: "needs_more_info", stopReason },
			);
		}
		// 되물음조차 없으면 진짜 형식 파손이다.
		logParseFailure({ operationId, text, stopReason });
		return finish(generationErrorOutcome({ code: "parse_failure" }), {
			status: "error",
			errorCode: "parse_failure",
			stopReason,
		});
	}

	const filename = extractFilename(text);

	// 이번 생성에 AI가 실제로 참고했다고 보고한 것만 출처로 표기(정직).
	const archetypeId = extractArchetypeId(text);
	const usedPatternIds = extractUsedPatternIds(text);
	// routed에서는 실제 전달한 패턴만 출처 조회 대상으로 인정한다. 모델이 보지
	// 않은 유효 id를 우연히 출력해도 거짓 출처가 붙지 않는다.
	const attributablePatternIds = preparedCorpus.deliveredPatternIds
		? usedPatternIds.filter((id) =>
				preparedCorpus.deliveredPatternIds?.includes(id),
			)
		: usedPatternIds;
	const referencedSources = sourcesForUsedPatterns(attributablePatternIds).map(
		toLiteSource,
	);
	const structureSources = archetypeId
		? sourcesForArchetype(archetypeId as SkillArchetype).map(toLiteSource)
		: [];

	return finish(
		{
			status: 200,
			body: {
				skillMarkdown,
				reviewNotes,
				clarifyingQuestions,
				suggestedFilename: filename,
				referencedSources,
				structureSources,
			},
		},
		{ status: "success", stopReason },
	);
}
