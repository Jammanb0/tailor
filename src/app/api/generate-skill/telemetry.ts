// 서버 로그에 나가는 값을 만드는 곳. 로그로 나가는 것은 전부 여기를 거친다.
//
// **허용 목록 방식이다.** 객체를 통째로 넘기지 않고 필요한 필드만 골라 새
// 객체를 만든다. 통째로 넘기면 SDK가 필드를 하나 더하는 것만으로 로그 범위가
// 저절로 넓어진다 — 무엇이 나가는지 코드를 읽어도 알 수 없게 된다.
//
// 남기지 않는 것 셋이다.
//
//   1. 사용자가 쓴 글
//   2. 모델이 만든 문서 전문
//   3. 오류 객체의 `message`
//
// 앞의 둘은 제품 방향이다 — 이 저장소는 공개이고, 원문과 생성 결과 전문을
// 남기지 않기로 했다(`.agents/plans/workstreams/corpus-routing/decisions.md`,
// 2026-08-27). 셋째는 API가 만드는 임의 문자열이라 요청 내용이 섞이지 않는다는
// 보증이 없다. 대신 종류·상태 코드·request id를 남긴다 — 장애를 가리는 데는
// 그쪽이 실제로 쓰인다.
//
// 파싱이 깨졌을 때 응답 전문을 찍던 자리가 있었다. 원인을 가리는 데 필요한 것은
// 전문이 아니라 「길이와 태그가 있었는가」였다.
//
// 회귀 시험: `pnpm check:logging`

import type Anthropic from "@anthropic-ai/sdk";
import type { SelectionDecision, SelectionFallbackReasonId } from "./routing";
import type { CorpusRoutingMode } from "./routing-policy";
import {
	classifyUpstreamError,
	UPSTREAM_ERROR_CATEGORIES,
} from "./upstream-error";

/**
 * 모든 이벤트에 붙는 요청 식별자.
 *
 * Vercel 로그와 Supabase 행을 맞추는 값이다. 우리가 만든 uuid라 요청 내용이
 * 섞이지 않는다. 형태가 어긋나면 버린다 — 밖에서 들어온 값이 실려 나가지
 * 않게 하려는 것이다.
 */
const OPERATION_ID_SHAPE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function pickOperationId(value: string | null | undefined): string | null {
	return typeof value === "string" && OPERATION_ID_SHAPE.test(value)
		? value
		: null;
}

/** 성공 계측 이벤트의 최상위 필드. 여기 없는 것은 로그에 나가지 않는다. */
export const GENERATION_LOG_FIELDS = [
	"event",
	"operationId",
	"kind",
	"corpusMode",
	"model",
	"ms",
	"stopReason",
	"usage",
] as const;

/** 선택 계측 이벤트의 최상위 필드. */
export const ROUTING_LOG_FIELDS = [
	"event",
	"operationId",
	"model",
	"ms",
	"status",
	"fallback",
	"fallbackReasonIds",
	"ambiguityIds",
	"usage",
] as const;

/**
 * 실패 계측 이벤트의 최상위 필드.
 *
 * `stage`는 Haiku 선택과 Sonnet 생성을 가른다. 둘을 같은 이벤트로 찍으면서
 * 구분을 안 두면 「선택이 죽은 것」과 「생성이 죽은 것」이 한 통에 섞인다.
 */
export const ERROR_LOG_FIELDS = [
	"event",
	"operationId",
	"stage",
	"errorName",
	"status",
	"code",
	"category",
	"retryAfterSeconds",
	"requestId",
] as const;

/**
 * 계측 저장이 실패했을 때의 최상위 필드.
 *
 * Supabase 응답 본문과 오류 message는 담지 않는다. 원인을 가리는 데 필요한
 * 것은 어느 단계에서 왜 실패했고 어느 요청이었는가다.
 *
 * `kind`·`configuredMode`·`isSmoke`가 함께 있어야 pending insert가 실패해
 * **표에 행이 아예 없는** 요청도 첫 100건에 속하는지 사후에 복원할 수 있다.
 */
export const PERSISTENCE_ERROR_LOG_FIELDS = [
	"event",
	"stage",
	"reason",
	"status",
	"operationId",
	"startedAt",
	"kind",
	"configuredMode",
	"deploymentId",
	"isSmoke",
] as const;

/** 저장이 실패할 수 있는 두 자리. */
export const PERSISTENCE_STAGES = ["pending-insert", "final-update"] as const;
export type PersistenceStage = (typeof PERSISTENCE_STAGES)[number];

/**
 * 저장이 실패한 까닭.
 *
 * `not_configured`는 환경변수가 없어 저장을 아예 시도하지 않은 경우다. 오류는
 * 아니지만 조용히 넘어가면 배포에서 계측이 통째로 비는 것을 100건을 다 센
 * 다음에야 알게 된다.
 */
export const PERSISTENCE_FAILURE_REASONS = [
	"not_configured",
	"request_failed",
	"http_error",
] as const;
export type PersistenceFailureReason =
	(typeof PERSISTENCE_FAILURE_REASONS)[number];

/**
 * 실패가 난 자리.
 *
 * `selection`은 Haiku 호출 자체, `selection-processing`은 그 뒤 전달 목록·
 * 렌더에서 난 우리 코드의 오류, `generation`은 Sonnet 호출이다. 앞의 둘은
 * 라우팅 로그에서 똑같이 F1로 보이지만 고칠 곳이 다르다.
 */
export const ERROR_STAGES = [
	"selection",
	"selection-processing",
	"generation",
] as const;
export type ErrorStage = (typeof ERROR_STAGES)[number];

/**
 * 우리 코드가 만든 선택 후처리 오류의 category.
 *
 * 업스트림 분류에 넣지 않는다. 상태 코드가 없는 평범한 `Error`는
 * `upstream_unavailable`로 떨어지는데, 그러면 렌더 결함이 Anthropic 장애나
 * 네트워크 문제로 집계된다.
 */
export const SELECTION_PROCESSING_CATEGORY = "selection_processing_error";

/** 실패 로그의 category에 나갈 수 있는 값 전부. */
export const ERROR_LOG_CATEGORIES = [
	...UPSTREAM_ERROR_CATEGORIES,
	SELECTION_PROCESSING_CATEGORY,
] as const;

export const FALLBACK_REASON_IDS = [
	"F1",
	"F2",
	"F3",
	"F4",
	"F5",
	"F6",
] as const;
export const AMBIGUITY_IDS = ["F7"] as const;

/**
 * 로그에 남기는 usage 필드.
 *
 * SDK 이름을 그대로 쓴다. 2026-08-28 평가 기록(`full-usage-log.jsonl`)이 같은
 * 이름으로 남아 있어, 이름을 바꾸면 옛 로그와 새 로그를 함께 집계할 수 없다.
 */
export const USAGE_LOG_FIELDS = [
	"input_tokens",
	"output_tokens",
	"cache_creation_input_tokens",
	"cache_read_input_tokens",
] as const;

export type UsageLog = Record<(typeof USAGE_LOG_FIELDS)[number], number>;

function toCount(value: unknown): number {
	return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

// 함수도 받는다 — 오류의 종류를 가리는 값이 `constructor.name`이고 생성자는
// 객체가 아니라 함수다. object만 받으면 조용히 null이 되어 전부 "Error"가 된다.
function readString(source: unknown, key: string): string | null {
	if (source === null) return null;
	if (typeof source !== "object" && typeof source !== "function") return null;
	const value = (source as Record<string, unknown>)[key];
	return typeof value === "string" ? value : null;
}

function readNumber(source: unknown, key: string): number | null {
	if (typeof source !== "object" || source === null) return null;
	const value = (source as Record<string, unknown>)[key];
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** 캐시 토큰은 없는 응답도 있다. 빠지면 0으로 채워 집계에서 구멍이 나지 않게 한다. */
export function pickUsage(usage: Anthropic.Usage | undefined | null): UsageLog {
	const picked = {} as UsageLog;
	for (const field of USAGE_LOG_FIELDS) {
		picked[field] = toCount(readNumber(usage, field));
	}
	return picked;
}

/** 생성이 성공했을 때 남기는 한 줄. */
export function buildGenerationLog(input: {
	operationId?: string | null;
	kind: "create" | "refine";
	corpusMode: CorpusRoutingMode;
	model: string;
	ms: number;
	stopReason: string | null;
	usage: Anthropic.Usage | undefined | null;
}) {
	return {
		event: "generate-skill" as const,
		operationId: pickOperationId(input.operationId),
		kind: input.kind,
		corpusMode: input.corpusMode,
		model: input.model,
		ms: input.ms,
		stopReason: input.stopReason,
		usage: pickUsage(input.usage),
	};
}

function pickIds<T extends string>(
	values: readonly string[],
	allowed: readonly T[],
): T[] {
	return values.filter((value): value is T => allowed.includes(value as T));
}

/** 선택 호출과 전체 전환 판정을 원문 없이 남기는 한 줄. */
export function buildRoutingLog(input: {
	operationId?: string | null;
	model: string;
	ms: number;
	usage: Anthropic.Usage | undefined | null;
	decision: SelectionDecision;
}) {
	return {
		event: "generate-skill-routing" as const,
		operationId: pickOperationId(input.operationId),
		model: input.model,
		ms: toCount(input.ms),
		status: input.decision.status,
		fallback: input.decision.fallback,
		fallbackReasonIds: pickIds<SelectionFallbackReasonId>(
			input.decision.fallbackReasonIds,
			FALLBACK_REASON_IDS,
		),
		ambiguityIds: pickIds<"F7">(input.decision.ambiguityIds, AMBIGUITY_IDS),
		usage: pickUsage(input.usage),
	};
}

/**
 * 응답에서 `<skill_md>`를 못 꺼냈을 때 남기는 한 줄.
 *
 * 본문 대신 진단값만 남긴다. 여는 태그는 있는데 닫는 태그가 없는 경우와, 아예
 * 태그를 안 쓴 경우는 원인이 다르므로 둘을 가를 수 있게 따로 센다.
 */
export function buildParseFailureLog(input: {
	operationId?: string | null;
	text: string;
	stopReason: string | null;
}) {
	return {
		event: "generate-skill-parse-failure" as const,
		operationId: pickOperationId(input.operationId),
		textLength: input.text.length,
		hasOpenTag: /^<skill_md>/m.test(input.text),
		hasCloseTag: /^<\/skill_md>/m.test(input.text),
		stopReason: input.stopReason,
	};
}

/**
 * SDK가 정의한 오류 클래스 이름. 이 목록에 없는 이름은 `other`로 적는다.
 *
 * 키만 허용 목록으로 잡고 값을 그대로 흘리면 방어가 절반만 된다 — `name`은
 * 결국 임의 문자열이라 무엇이 담길지 우리가 정하지 못한다.
 *
 * 근거: `node_modules/@anthropic-ai/sdk/core/error.d.ts`
 */
export const KNOWN_ERROR_NAMES = [
	"AnthropicError",
	"APIError",
	"APIUserAbortError",
	"APIConnectionError",
	"APIConnectionTimeoutError",
	"RetryableError",
	"BadRequestError",
	"AuthenticationError",
	"PermissionDeniedError",
	"NotFoundError",
	"ConflictError",
	"UnprocessableEntityError",
	"RateLimitError",
	"InternalServerError",
	"Error",
	"TypeError",
	// 선택 deadline이 만드는 중단. 우리가 던지는 값이라 종류를 안다.
	"DOMException",
	"AbortError",
] as const;

/**
 * API가 돌려주는 오류 종류. `ErrorType` 유니온과 같다.
 *
 * 근거: `node_modules/@anthropic-ai/sdk/resources/shared.d.ts`의 `ErrorType`
 */
export const KNOWN_ERROR_TYPES = [
	"invalid_request_error",
	"authentication_error",
	"permission_error",
	"not_found_error",
	"rate_limit_error",
	"timeout_error",
	"overloaded_error",
	"api_error",
	"billing_error",
] as const;

/** request id는 헤더에서 온 값이라 형태로 거른다. 어긋나면 버린다. */
const REQUEST_ID_SHAPE = /^[A-Za-z0-9_-]{1,64}$/;

function pickKnown(value: string | null, allowed: readonly string[]) {
	return value !== null && allowed.includes(value) ? value : null;
}

/**
 * 호출이 실패했을 때 남기는 한 줄.
 *
 * `message`는 담지 않는다. Anthropic의 오류 본문은 서버가 만드는 임의 문자열이라
 * 요청 내용이 되비쳐 나올 수 있고, 그 여부를 우리가 보증할 수 없다. 장애를
 * 가릴 때 실제로 쓰이는 것은 상태 코드와 request id다.
 *
 * 나머지 문자열 필드도 값을 그대로 쓰지 않는다. 이름과 종류는 아는 목록에
 * 있을 때만 적고, request id는 형태가 맞을 때만 적는다.
 */
export function buildErrorLog(
	error: unknown,
	stage: ErrorStage = "generation",
	operationId?: string | null,
) {
	// SDK의 오류 클래스는 `name`을 세팅하지 않아 전부 "Error"로 나온다. 종류를
	// 가리는 값은 생성자 이름이다. 빌드가 이름을 뭉개면 허용 목록에서 걸러져
	// "other"가 되는데, 덜 알려주는 쪽이라 안전한 방향으로 무너진다.
	const name =
		readString(
			(error as { constructor?: unknown } | null)?.constructor,
			"name",
		) ?? readString(error, "name");
	// APIError는 응답 본문의 `error.type`을 최상위 `type`으로 이미 꺼내 둔다.
	// 본문을 직접 파고들 필요가 없다. `requestID`가 실제 속성명이고,
	// `request_id`는 SDK 밖에서 온 오류를 위한 대비다.
	const requestId =
		readString(error, "requestID") ?? readString(error, "request_id");
	const stageName = ERROR_STAGES.includes(stage) ? stage : "generation";
	// 우리 코드가 만든 오류는 업스트림 분류에 태우지 않는다. 태우면 상태
	// 코드가 없다는 이유만으로 「일시 장애」가 되어 원인이 뒤바뀐다.
	const isProcessing = stageName === "selection-processing";
	// 분류 결과는 코드가 정한 고정 집합이라 그대로 남겨도 된다. 그 판정에
	// 쓰인 오류 message는 upstream-error.ts 밖으로 나오지 않는다.
	const classification = isProcessing ? null : classifyUpstreamError(error);
	return {
		event: "generate-skill-error" as const,
		operationId: pickOperationId(operationId),
		stage: stageName,
		errorName: pickKnown(name, KNOWN_ERROR_NAMES) ?? "other",
		status: readNumber(error, "status"),
		code: pickKnown(readString(error, "type"), KNOWN_ERROR_TYPES),
		category: isProcessing
			? SELECTION_PROCESSING_CATEGORY
			: pickKnown(classification?.category ?? null, UPSTREAM_ERROR_CATEGORIES),
		retryAfterSeconds: classification?.retryAfterSeconds ?? null,
		requestId:
			requestId !== null && REQUEST_ID_SHAPE.test(requestId) ? requestId : null,
	};
}

/**
 * 계측 저장이 실패했을 때 남기는 한 줄.
 *
 * Supabase 응답 본문을 담지 않는다. 우리가 만들지 않은 문자열이라 무엇이
 * 들어올지 정하지 못한다. HTTP 상태 코드로 충분하다.
 *
 * **이 로그가 곧 유실은 아니다.** 요청이 타임아웃돼도 Supabase 쪽에서는 저장이
 * 이미 끝났을 수 있다. 유실을 판정할 때는 이 로그의 operationId로 실제 행이
 * 있는지 대조한다 — 그 절차는 사전등록 문서에 있다.
 */
export function buildPersistenceErrorLog(input: {
	stage: PersistenceStage;
	reason: PersistenceFailureReason;
	status?: number | null;
	operationId?: string | null;
	startedAt?: string | null;
	kind?: "create" | "refine" | null;
	configuredMode?: CorpusRoutingMode | null;
	deploymentId?: string | null;
	isSmoke?: boolean;
}) {
	return {
		event: "generate-skill-persistence-error" as const,
		stage: pickKnown(input.stage, PERSISTENCE_STAGES) ?? "final-update",
		reason:
			pickKnown(input.reason, PERSISTENCE_FAILURE_REASONS) ?? "request_failed",
		status: typeof input.status === "number" ? input.status : null,
		operationId: pickOperationId(input.operationId),
		// 우리가 만든 ISO 문자열이지만 형태로 한 번 거른다.
		startedAt:
			typeof input.startedAt === "string" &&
			!Number.isNaN(Date.parse(input.startedAt))
				? input.startedAt
				: null,
		kind: pickKnown(input.kind ?? null, ["create", "refine"]),
		configuredMode: pickKnown(input.configuredMode ?? null, ["full", "routed"]),
		deploymentId:
			typeof input.deploymentId === "string" &&
			/^[A-Za-z0-9_-]{1,64}$/.test(input.deploymentId)
				? input.deploymentId
				: null,
		isSmoke: input.isSmoke === true,
	};
}

// ── 여기서만 console을 쓴다 ──────────────────────────────────────────
//
// route.ts는 console을 직접 부르지 않는다. 부르는 자리를 한 곳에 모아야
// "무엇이 로그로 나가는가"를 파일 하나만 읽고 판정할 수 있다. 검사도 route.ts에
// console이 0개인지만 세면 되어, 호출 인자를 정규식으로 뜯어볼 필요가 없다.

export function logGeneration(
	input: Parameters<typeof buildGenerationLog>[0],
): void {
	console.log(JSON.stringify(buildGenerationLog(input)));
}

export function logRouting(input: Parameters<typeof buildRoutingLog>[0]): void {
	console.log(JSON.stringify(buildRoutingLog(input)));
}

export function logParseFailure(
	input: Parameters<typeof buildParseFailureLog>[0],
): void {
	console.error(JSON.stringify(buildParseFailureLog(input)));
}

export function logRequestFailure(
	error: unknown,
	stage: ErrorStage = "generation",
	operationId?: string | null,
): void {
	console.error(JSON.stringify(buildErrorLog(error, stage, operationId)));
}

/**
 * 계측 저장 실패를 남긴다.
 *
 * 저장 모듈이 console을 직접 부르지 않고 이 함수를 거친다. console을 부르는
 * 자리를 telemetry.ts 안에만 두어야 「무엇이 로그로 나가는가」를 파일 하나만
 * 읽고 판정할 수 있다.
 */
export function logPersistenceFailure(
	input: Parameters<typeof buildPersistenceErrorLog>[0],
): void {
	console.error(JSON.stringify(buildPersistenceErrorLog(input)));
}
