// Anthropic 오류를 한 곳에서 분류한다. Haiku 선택 호출과 Sonnet 생성 호출이
// 같은 함수를 쓴다 — 두 벌로 나누면 한쪽만 고쳐진 채 남는다.
//
// 순수 함수다. 네트워크도 로그도 없다. 회귀 시험은 SDK의 실제
// `APIError.generate()`가 만든 오류를 넣어 확인한다(`pnpm check:upstream-errors`).
//
// **오류 message는 판정에만 읽는다.** 400이 지출 상한 때문인지 가리려면 문구를
// 봐야 하는데(공식 문서가 상태 코드로는 구분할 수 없다고 적어 뒀다), 그 문구는
// 서버가 만드는 임의 문자열이라 저장하지도 응답에 담지도 않는다. 이 파일이
// 밖으로 내보내는 값은 코드가 정한 고정 집합뿐이다.
//
// 근거 (2026-08-31 확인):
//   - https://platform.claude.com/docs/en/api/errors
//   - https://platform.claude.com/docs/en/api/rate-limits
//     · 티어 지출 상한: HTTP 429, `error.details.error_code`가
//       `enforced_spend_limit_reached`이고 `retry-after` 헤더가 없다
//     · 직접 설정한 지출 상한: HTTP 400 `invalid_request_error`,
//       message가 `You have reached your specified API usage limits`
//       (워크스페이스 한도는 `... your specified workspace API usage limits`)로 시작
//     · 402는 `billing_error`, 401은 `authentication_error`, 403은 `permission_error`

/** 분류 결과. 이 여섯 가지 밖으로는 나가지 않는다. */
export type UpstreamErrorCategory =
	| "usage_exhausted"
	| "billing_unavailable"
	| "authentication_unavailable"
	| "rate_limited"
	| "upstream_unavailable"
	| "invalid_upstream_request";

export const UPSTREAM_ERROR_CATEGORIES: readonly UpstreamErrorCategory[] = [
	"usage_exhausted",
	"billing_unavailable",
	"authentication_unavailable",
	"rate_limited",
	"upstream_unavailable",
	"invalid_upstream_request",
];

/**
 * 선택 호출이 이 종류로 실패하면 Sonnet을 부르지 않는다.
 *
 * 전부 「지금은 어떤 모델도 부를 수 없다」는 신호다. 여기서 full 코퍼스로
 * 폴백하면 실패할 것이 뻔한 비싼 호출을 한 번 더 하는 셈이 된다. 반대로
 * 네트워크·타임아웃·5xx는 Sonnet이 성공할 수 있으므로 기존 full 폴백을 지킨다.
 */
const STOPS_GENERATION: Record<UpstreamErrorCategory, boolean> = {
	usage_exhausted: true,
	billing_unavailable: true,
	authentication_unavailable: true,
	rate_limited: true,
	upstream_unavailable: false,
	invalid_upstream_request: false,
};

/** 공식 문서에 적힌 지출 상한 400의 message 시작 문구. */
const SPEND_LIMIT_MESSAGE_PREFIXES = [
	"You have reached your specified API usage limits",
	"You have reached your specified workspace API usage limits",
] as const;

/** 티어 지출 상한 429를 일반 429와 가르는 값. */
const SPEND_LIMIT_ERROR_CODE = "enforced_spend_limit_reached";

/** 로그에 남겨도 되는 종류. SDK의 `ErrorType` 유니온과 같다. */
const KNOWN_TYPES = [
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

export type UpstreamErrorClassification = {
	category: UpstreamErrorCategory;
	/** true면 이어지는 생성 호출을 하지 않는다. */
	stopsGeneration: boolean;
	status: number | null;
	/** 아는 종류일 때만 채운다. */
	type: (typeof KNOWN_TYPES)[number] | null;
	/** 초 단위로 정규화한 재시도 대기 시간. */
	retryAfterSeconds: number | null;
};

function readRecord(source: unknown): Record<string, unknown> | null {
	if (typeof source !== "object" || source === null) return null;
	return source as Record<string, unknown>;
}

function readString(source: unknown, key: string): string | null {
	const record = readRecord(source);
	const value = record?.[key];
	return typeof value === "string" ? value : null;
}

function readNumber(source: unknown, key: string): number | null {
	const record = readRecord(source);
	const value = record?.[key];
	return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * `retry-after` 헤더를 초 숫자로 바꾼다.
 *
 * 문서상 값은 초다. 초가 아닌 값(HTTP-date 등)이나 음수는 버린다 — 잘못
 * 읽은 숫자로 버튼을 몇 시간씩 잠그는 것보다 기본값으로 돌아가는 편이 낫다.
 * 상한은 한 시간으로 자른다.
 */
export function normalizeRetryAfterSeconds(value: unknown): number | null {
	if (typeof value === "number") {
		return Number.isFinite(value) && value > 0
			? Math.min(Math.ceil(value), 3600)
			: null;
	}
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	if (!/^\d+$/.test(trimmed)) return null;
	const seconds = Number(trimmed);
	if (!Number.isFinite(seconds) || seconds <= 0) return null;
	return Math.min(seconds, 3600);
}

function readRetryAfter(error: unknown): number | null {
	const headers = readRecord(error)?.headers;
	if (headers instanceof Headers) {
		return normalizeRetryAfterSeconds(headers.get("retry-after"));
	}
	// SDK 밖에서 온 오류를 위한 대비. 평범한 객체로 헤더를 들고 있을 수 있다.
	const plain = readRecord(headers);
	if (plain) {
		return normalizeRetryAfterSeconds(
			plain["retry-after"] ?? plain["Retry-After"],
		);
	}
	return null;
}

/** 응답 본문의 `error` 객체. APIError는 본문 전체를 `error`에 담아 둔다. */
function readErrorBody(error: unknown): Record<string, unknown> | null {
	const body = readRecord(readRecord(error)?.error);
	if (!body) return null;
	return readRecord(body.error) ?? body;
}

function readErrorCode(error: unknown): string | null {
	const body = readErrorBody(error);
	return (
		readString(body?.details, "error_code") ??
		readString(readRecord(readRecord(error)?.error)?.details, "error_code")
	);
}

/**
 * 판정에만 쓰는 원문 message.
 *
 * `APIError.message`는 앞에 상태 코드를 붙여 두므로 벗겨 낸다. 이 값은 이
 * 파일 밖으로 나가지 않는다.
 */
function readJudgementMessage(error: unknown): string {
	const fromBody = readString(readErrorBody(error), "message");
	if (fromBody !== null) return fromBody;
	const fromError = readString(error, "message") ?? "";
	return fromError.replace(/^\d{3}\s+/, "");
}

function isSpendLimitMessage(message: string): boolean {
	const trimmed = message.trimStart();
	return SPEND_LIMIT_MESSAGE_PREFIXES.some((prefix) =>
		trimmed.startsWith(prefix),
	);
}

function readType(error: unknown): (typeof KNOWN_TYPES)[number] | null {
	const value =
		readString(error, "type") ?? readString(readErrorBody(error), "type");
	return value !== null && (KNOWN_TYPES as readonly string[]).includes(value)
		? (value as (typeof KNOWN_TYPES)[number])
		: null;
}

function decide(input: {
	status: number | null;
	type: (typeof KNOWN_TYPES)[number] | null;
	errorCode: string | null;
	message: string;
}): UpstreamErrorCategory {
	// 티어 지출 상한. 상태는 429지만 일반 429와 처리가 다르므로 먼저 본다.
	if (input.errorCode === SPEND_LIMIT_ERROR_CODE) return "usage_exhausted";

	if (input.status === 402 || input.type === "billing_error") {
		return "billing_unavailable";
	}
	if (
		input.status === 401 ||
		input.status === 403 ||
		input.type === "authentication_error" ||
		input.type === "permission_error"
	) {
		return "authentication_unavailable";
	}
	if (input.status === 429 || input.type === "rate_limit_error") {
		return "rate_limited";
	}
	if (input.status === 400) {
		// 문구가 확인된 것만 지출 상한으로 본다. 나머지 400은 크레딧 문제로
		// 단정하지 않는다 — 잘못 단정하면 고칠 수 있는 요청 오류를 「토큰이
		// 소진됐다」고 알려 사용자를 막아 세운다.
		return isSpendLimitMessage(input.message)
			? "usage_exhausted"
			: "invalid_upstream_request";
	}
	if (
		input.status === null ||
		input.status >= 500 ||
		input.status === 408 ||
		input.status === 409 ||
		input.type === "api_error" ||
		input.type === "overloaded_error" ||
		input.type === "timeout_error"
	) {
		// 상태가 없는 것은 연결 실패·중단·타임아웃이다. 기존 F1/F2 성격이라
		// full 코퍼스로 이어 간다.
		return "upstream_unavailable";
	}
	return "invalid_upstream_request";
}

/** 어떤 모양의 값이 와도 터지지 않고 분류한다. */
export function classifyUpstreamError(
	error: unknown,
): UpstreamErrorClassification {
	const status = readNumber(error, "status");
	const type = readType(error);
	const category = decide({
		status,
		type,
		errorCode: readErrorCode(error),
		message: readJudgementMessage(error),
	});
	return {
		category,
		stopsGeneration: STOPS_GENERATION[category],
		status,
		type,
		// 대기 시간은 실제로 기다릴 수 있는 429에만 의미가 있다.
		retryAfterSeconds:
			category === "rate_limited" ? readRetryAfter(error) : null,
	};
}
