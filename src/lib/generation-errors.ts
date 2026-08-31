// 생성 실패를 사용자에게 전달하는 계약. 서버와 클라이언트가 함께 읽는다.
//
// **문구를 클라이언트가 해석하지 않는다.** 서버는 고정된 코드를 내려주고,
// 클라이언트는 코드로 재시도 가능 여부를 판정한다. 문자열을 비교해 분기하면
// 문구를 다듬는 순간 조용히 동작이 바뀐다.
//
// 이 파일에는 서버 전용 코드가 없다. Anthropic 오류를 실제로 분류하는 일은
// `src/app/api/generate-skill/upstream-error.ts`가 맡는다 — 그쪽은 SDK를
// 읽으므로 클라이언트 번들에 들어가면 안 된다.
//
// 회귀 시험: `pnpm check:upstream-errors`

/** 사용자에게 내려보내는 실패 종류. 이 목록 밖의 값은 응답에 담기지 않는다. */
export const GENERATION_ERROR_CODES = [
	"usage_exhausted",
	"billing_unavailable",
	"authentication_unavailable",
	"rate_limited",
	"upstream_unavailable",
	"invalid_upstream_request",
	"parse_failure",
	"input_too_large",
	"invalid_request",
	"missing_required_answers",
] as const;

export type GenerationErrorCode = (typeof GENERATION_ERROR_CODES)[number];

/** retry-after가 없는 429에 쓰는 기본 대기 시간. */
export const DEFAULT_RETRY_AFTER_SECONDS = 30;

/** 화면에 그대로 나가는 문구. 남는 시간이 필요한 429만 따로 만든다. */
const MESSAGES: Record<Exclude<GenerationErrorCode, "rate_limited">, string> = {
	usage_exhausted:
		"현재 사용할 수 있는 AI 토큰이 모두 소진되어 스킬 생성 기능을 이용할 수 없어요.",
	billing_unavailable:
		"AI 서비스 결제 문제로 현재 스킬 생성 기능을 이용할 수 없어요.",
	authentication_unavailable:
		"AI 서비스 설정 문제로 현재 스킬 생성 기능을 이용할 수 없어요.",
	upstream_unavailable:
		"스킬을 생성하는 중 일시적인 문제가 생겼어요. 다시 시도해주세요.",
	invalid_upstream_request: "AI 서비스가 현재 요청을 처리하지 못했어요.",
	parse_failure: "생성 결과를 이해할 수 없었어요. 다시 시도해주세요.",
	input_too_large:
		"입력한 내용이 너무 길어요. 참고 스킬이나 답변을 조금 줄여주세요.",
	invalid_request: "요청 형식이 올바르지 않아요.",
	missing_required_answers: "필수 질문에 답하지 않은 항목이 있어요.",
};

export function buildRateLimitedMessage(retryAfterSeconds: number): string {
	return `요청이 잠시 몰렸어요. ${retryAfterSeconds}초 후 다시 시도해주세요.`;
}

/**
 * 다시 눌러서 풀릴 수 있는 실패인가.
 *
 * 토큰 소진·결제·인증은 사용자가 무엇을 해도 지금은 안 된다. 분류되지 않은
 * 400은 같은 요청을 다시 보내면 같은 결과가 나오므로 재시도로 치지 않는다.
 * 입력 길이 초과는 답변을 고쳐야 풀린다 — 그 경로는 화면에 그대로 남는다.
 */
const RETRYABLE: Record<GenerationErrorCode, boolean> = {
	usage_exhausted: false,
	billing_unavailable: false,
	authentication_unavailable: false,
	rate_limited: true,
	upstream_unavailable: true,
	invalid_upstream_request: false,
	parse_failure: true,
	input_too_large: false,
	invalid_request: false,
	missing_required_answers: false,
};

/**
 * 입력을 고치면 결과가 달라질 수 있는 실패인가.
 *
 * 답변을 고치면 요청 자체가 달라지므로 이 실패들은 화면에서 지운다. 반대로
 * 토큰 소진·결제·인증은 무엇을 고쳐도 지금은 안 되고, 재시도 가능한 실패는
 * 배너의 「다시 시도하기」가 맡는다 — 그쪽을 답변 수정으로 지우면 429
 * 대기 시간이 조용히 사라진다.
 */
const CLEARED_BY_INPUT_CHANGE: Record<GenerationErrorCode, boolean> = {
	usage_exhausted: false,
	billing_unavailable: false,
	authentication_unavailable: false,
	rate_limited: false,
	upstream_unavailable: false,
	invalid_upstream_request: true,
	parse_failure: false,
	input_too_large: true,
	invalid_request: true,
	missing_required_answers: true,
};

export function isClearedByInputChange(code: GenerationErrorCode): boolean {
	return CLEARED_BY_INPUT_CHANGE[code];
}

/** 코드마다 고정된 HTTP 상태. 상태로 분기하지 말고 코드로 분기한다. */
const HTTP_STATUS: Record<GenerationErrorCode, number> = {
	usage_exhausted: 503,
	billing_unavailable: 503,
	authentication_unavailable: 503,
	rate_limited: 429,
	upstream_unavailable: 502,
	invalid_upstream_request: 502,
	parse_failure: 502,
	input_too_large: 413,
	invalid_request: 400,
	missing_required_answers: 400,
};

export type GenerationErrorPayload = {
	error: string;
	errorCode: GenerationErrorCode;
	retryable: boolean;
	retryAfterSeconds?: number;
};

export function isGenerationErrorCode(
	value: unknown,
): value is GenerationErrorCode {
	return (
		typeof value === "string" &&
		(GENERATION_ERROR_CODES as readonly string[]).includes(value)
	);
}

export function generationErrorStatus(code: GenerationErrorCode): number {
	return HTTP_STATUS[code];
}

/**
 * 응답 본문을 만든다.
 *
 * 429는 남은 시간을 문구에 넣고 필드로도 내려준다. 값이 없으면 기본 대기
 * 시간을 쓴다 — 버튼을 영영 잠그지 않으려면 숫자가 하나는 있어야 한다.
 */
export function buildGenerationErrorPayload(input: {
	code: GenerationErrorCode;
	retryAfterSeconds?: number | null;
}): GenerationErrorPayload {
	if (input.code === "rate_limited") {
		const seconds =
			typeof input.retryAfterSeconds === "number" &&
			Number.isFinite(input.retryAfterSeconds) &&
			input.retryAfterSeconds > 0
				? Math.ceil(input.retryAfterSeconds)
				: DEFAULT_RETRY_AFTER_SECONDS;
		return {
			error: buildRateLimitedMessage(seconds),
			errorCode: "rate_limited",
			retryable: true,
			retryAfterSeconds: seconds,
		};
	}
	return {
		error: MESSAGES[input.code],
		errorCode: input.code,
		retryable: RETRYABLE[input.code],
	};
}
