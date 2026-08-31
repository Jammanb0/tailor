// Anthropic 오류 분류와 「어떤 오류에서 Sonnet을 부르지 않는가」 회귀 시험.
//
// 사용: node --experimental-strip-types --no-warnings --import ./tools/alias-loader.mjs tools/check-upstream-errors.mjs
//       (pnpm check:upstream-errors)
//
// 유료 호출은 없다. SDK의 실제 `APIError.generate()`가 만든 오류를 넣고,
// 생성 흐름에는 가짜 클라이언트를 넘긴다.
//
// 가짜 오류 객체를 직접 만들면 실제 SDK와 어긋난 채로 통과한다 — 로그 시험이
// 실제로 그 함정에 빠진 적이 있다(`requestID` vs `request_id`). 그래서 여기서도
// 오류는 SDK가 만들게 한다.

import { equal, ok } from "node:assert/strict";
import { APIError } from "@anthropic-ai/sdk";
import { runGeneration } from "../src/app/api/generate-skill/generate.ts";
import { SELECTION_MODEL } from "../src/app/api/generate-skill/routing.ts";
import { buildErrorLog } from "../src/app/api/generate-skill/telemetry.ts";
import { classifyUpstreamError } from "../src/app/api/generate-skill/upstream-error.ts";

// 새면 눈에 띄도록 실제 자료 대신 표식을 넣는다. 응답에도 로그에도 나오면 안 된다.
const SECRET = "SENSITIVE-UPSTREAM-MESSAGE-MARKER";

const failures = [];
async function check(label, run) {
	try {
		await run();
		console.log(`  ok   ${label}`);
	} catch (error) {
		failures.push(`${label}\n       ${String(error.message).split("\n")[0]}`);
		console.log(`  FAIL ${label}`);
	}
}

function apiError(status, body, headers = {}) {
	return APIError.generate(status, body, undefined, new Headers(headers));
}

function errorBody(type, message, details) {
	return {
		type: "error",
		error: details ? { type, message, details } : { type, message },
		request_id: "req_011Cabc",
	};
}

// ── 분류 ────────────────────────────────────────────────────────────

await check("티어 지출 상한 429는 사용량 소진으로 가른다", () => {
	// 공식 문서의 응답 형태. retry-after 헤더가 없다.
	const error = apiError(
		429,
		errorBody(
			"rate_limit_error",
			`You have reached your API usage limits: ${SECRET}`,
			{
				error_code: "enforced_spend_limit_reached",
			},
		),
	);
	const result = classifyUpstreamError(error);
	equal(result.category, "usage_exhausted");
	equal(result.stopsGeneration, true);
	equal(result.retryAfterSeconds, null);
});

await check("일반 429는 사용량 소진과 구분한다", () => {
	const error = apiError(429, errorBody("rate_limit_error", SECRET), {
		"retry-after": "42",
	});
	const result = classifyUpstreamError(error);
	equal(result.category, "rate_limited");
	equal(result.stopsGeneration, true);
	equal(result.retryAfterSeconds, 42);
});

await check("retry-after가 없거나 이상하면 숫자를 지어내지 않는다", () => {
	equal(
		classifyUpstreamError(apiError(429, errorBody("rate_limit_error", "x")))
			.retryAfterSeconds,
		null,
	);
	for (const value of [
		"",
		"  ",
		"soon",
		"-5",
		"Wed, 21 Oct 2026 07:28:00 GMT",
	]) {
		const result = classifyUpstreamError(
			apiError(429, errorBody("rate_limit_error", "x"), {
				"retry-after": value,
			}),
		);
		equal(result.retryAfterSeconds, null, `retry-after=${value}`);
	}
	// 터무니없이 긴 값은 한 시간으로 자른다.
	equal(
		classifyUpstreamError(
			apiError(429, errorBody("rate_limit_error", "x"), {
				"retry-after": "999999",
			}),
		).retryAfterSeconds,
		3600,
	);
});

await check("402는 결제 문제로 가른다", () => {
	const result = classifyUpstreamError(
		apiError(402, errorBody("billing_error", SECRET)),
	);
	equal(result.category, "billing_unavailable");
	equal(result.stopsGeneration, true);
});

await check("401·403은 인증·권한 문제로 가른다", () => {
	equal(
		classifyUpstreamError(
			apiError(401, errorBody("authentication_error", SECRET)),
		).category,
		"authentication_unavailable",
	);
	equal(
		classifyUpstreamError(apiError(403, errorBody("permission_error", SECRET)))
			.category,
		"authentication_unavailable",
	);
});

await check("문구가 확인된 400만 사용량 소진으로 본다", () => {
	// 공식 문서에 적힌 시작 문구 두 가지.
	for (const message of [
		"You have reached your specified API usage limits. Access resumes on 2026-09-01.",
		"You have reached your specified workspace API usage limits.",
	]) {
		const result = classifyUpstreamError(
			apiError(400, errorBody("invalid_request_error", message)),
		);
		equal(result.category, "usage_exhausted", message);
		equal(result.stopsGeneration, true);
	}
});

await check("그 밖의 400은 크레딧 문제로 단정하지 않는다", () => {
	for (const message of [
		`messages: roles must alternate: ${SECRET}`,
		`You have reached something else entirely ${SECRET}`,
		"",
	]) {
		const result = classifyUpstreamError(
			apiError(400, errorBody("invalid_request_error", message)),
		);
		equal(result.category, "invalid_upstream_request", message);
		// 400은 같은 요청을 다시 보내도 같은 결과다. 중단 대상은 아니지만
		// 재시도 대상도 아니다.
		equal(result.stopsGeneration, false);
	}
});

await check("일시 장애는 기존 폴백 대상으로 남는다", () => {
	for (const status of [500, 502, 503, 529]) {
		const result = classifyUpstreamError(
			apiError(status, errorBody("api_error", SECRET)),
		);
		equal(result.category, "upstream_unavailable", `status=${status}`);
		equal(result.stopsGeneration, false);
	}
	// 상태가 없는 오류 = 연결 실패. SDK는 APIConnectionError를 만든다.
	const connection = APIError.generate(undefined, undefined, SECRET, undefined);
	equal(classifyUpstreamError(connection).category, "upstream_unavailable");
	equal(classifyUpstreamError(connection).stopsGeneration, false);
	// deadline이 만드는 중단도 마찬가지다.
	const aborted = new DOMException("selection deadline reached", "AbortError");
	equal(classifyUpstreamError(aborted).category, "upstream_unavailable");
	equal(classifyUpstreamError(aborted).stopsGeneration, false);
});

await check("모양이 다른 값에도 터지지 않는다", () => {
	for (const one of [null, undefined, "문자열", 42, {}, []]) {
		const result = classifyUpstreamError(one);
		ok(typeof result.category === "string", `${one}에서 깨집니다`);
	}
});

// ── message는 판정에만 쓴다 ──────────────────────────────────────────

await check(
	"판정에 message를 읽어도 분류 결과와 로그에는 담기지 않는다",
	() => {
		const error = apiError(
			400,
			errorBody(
				"invalid_request_error",
				`You have reached your specified API usage limits ${SECRET}`,
			),
		);
		const result = classifyUpstreamError(error);
		equal(result.category, "usage_exhausted");
		ok(
			!JSON.stringify(result).includes(SECRET),
			"분류 결과에 message가 들어갔습니다",
		);
		const log = buildErrorLog(error, "selection");
		ok(!JSON.stringify(log).includes(SECRET), "로그에 message가 들어갔습니다");
		equal(log.stage, "selection");
		equal(log.category, "usage_exhausted");
	},
);

// ── 생성 흐름: 어떤 오류에서 Sonnet을 부르는가 ───────────────────────

const BASE_REQUEST = {
	answers: { tool: "cli", situation: "오류 처리 회귀 시험", language: "ko" },
	wantsAdvanced: false,
	refinement: undefined,
	clarifications: undefined,
};

function stubMessage(text) {
	return {
		content: [{ type: "text", text }],
		usage: { input_tokens: 1, output_tokens: 1 },
		stop_reason: "end_turn",
	};
}

/** 선택·생성 호출을 기록하는 가짜 클라이언트. 실제 API는 부르지 않는다. */
function stubClient({ onSelection, onGeneration }) {
	const calls = [];
	const client = {
		messages: {
			create: async (params, options) => {
				calls.push({ model: params.model, options });
				if (params.model === SELECTION_MODEL) return onSelection();
				return onGeneration();
			},
		},
	};
	return { calls, client };
}

/** 로그를 삼켜 출력이 묻히지 않게 하고, 새는 값이 있는지 함께 본다. */
async function withCapturedLogs(run) {
	const lines = [];
	const { log, error } = console;
	console.log = (...args) => lines.push(args.join(" "));
	console.error = (...args) => lines.push(args.join(" "));
	try {
		return { result: await run(), lines };
	} finally {
		console.log = log;
		console.error = error;
	}
}

async function runWithStub({ selection, generation }) {
	const stub = stubClient({
		onSelection: selection,
		onGeneration:
			generation ?? (() => stubMessage("<skill_md>\n# 결과\n</skill_md>")),
	});
	const { result, lines } = await withCapturedLogs(() =>
		runGeneration({
			client: stub.client,
			request: BASE_REQUEST,
			configuredMode: "routed",
		}),
	);
	return { ...stub, outcome: result, lines };
}

await check("중단 대상 오류에서는 Sonnet을 부르지 않는다", async () => {
	const cases = [
		{
			label: "사용량 소진",
			error: apiError(
				429,
				errorBody("rate_limit_error", SECRET, {
					error_code: "enforced_spend_limit_reached",
				}),
			),
			code: "usage_exhausted",
			status: 503,
			retryable: false,
		},
		{
			label: "결제",
			error: apiError(402, errorBody("billing_error", SECRET)),
			code: "billing_unavailable",
			status: 503,
			retryable: false,
		},
		{
			label: "인증",
			error: apiError(401, errorBody("authentication_error", SECRET)),
			code: "authentication_unavailable",
			status: 503,
			retryable: false,
		},
		{
			label: "일반 429",
			error: apiError(429, errorBody("rate_limit_error", SECRET), {
				"retry-after": "7",
			}),
			code: "rate_limited",
			status: 429,
			retryable: true,
		},
	];
	for (const one of cases) {
		const run = await runWithStub({
			selection: () => {
				throw one.error;
			},
		});
		equal(
			run.calls.length,
			1,
			`${one.label}: 호출이 ${run.calls.length}번입니다`,
		);
		equal(
			run.calls[0].model,
			SELECTION_MODEL,
			`${one.label}: 부른 모델이 다릅니다`,
		);
		equal(run.outcome.status, one.status, one.label);
		equal(run.outcome.body.errorCode, one.code, one.label);
		equal(run.outcome.body.retryable, one.retryable, one.label);
		ok(
			!JSON.stringify(run.outcome.body).includes(SECRET),
			`${one.label}: 응답에 원문 message가 들어갔습니다`,
		);
		ok(
			!run.lines.join("\n").includes(SECRET),
			`${one.label}: 로그에 원문 message가 들어갔습니다`,
		);
	}
});

await check("일반 429는 남은 시간을 문구와 필드에 함께 담는다", async () => {
	const run = await runWithStub({
		selection: () => {
			throw apiError(429, errorBody("rate_limit_error", "x"), {
				"retry-after": "7",
			});
		},
	});
	equal(run.outcome.body.retryAfterSeconds, 7);
	equal(
		run.outcome.body.error,
		"요청이 잠시 몰렸어요. 7초 후 다시 시도해주세요.",
	);
});

await check("retry-after가 없는 429는 기본 30초로 안내한다", async () => {
	const run = await runWithStub({
		selection: () => {
			throw apiError(429, errorBody("rate_limit_error", "x"));
		},
	});
	equal(run.outcome.body.retryAfterSeconds, 30);
	equal(
		run.outcome.body.error,
		"요청이 잠시 몰렸어요. 30초 후 다시 시도해주세요.",
	);
});

await check("일시 장애·중단에서는 기존 full 폴백을 유지한다", async () => {
	for (const error of [
		apiError(500, errorBody("api_error", SECRET)),
		APIError.generate(undefined, undefined, SECRET, undefined),
		new DOMException("selection deadline reached", "AbortError"),
	]) {
		const run = await runWithStub({
			selection: () => {
				throw error;
			},
		});
		equal(run.calls.length, 2, "Sonnet을 부르지 않았습니다");
		equal(run.outcome.status, 200);
		// full로 전환했으므로 코퍼스 캐시가 다시 켜진다.
		const routing = run.lines.find((line) =>
			line.includes("generate-skill-routing"),
		);
		ok(routing, "라우팅 계측이 남지 않았습니다");
		const generation = run.lines.find((line) =>
			line.includes('"event":"generate-skill"'),
		);
		ok(
			generation?.includes('"corpusMode":"full"'),
			"full로 전환하지 않았습니다",
		);
	}
});

// ── F1의 원인을 가릴 수 있는가 ───────────────────────────────────────
//
// 라우팅 로그의 F1은 「선택이 실패했다」까지만 말한다. 중단하지 않고 full로
// 이어 가는 실패에도 오류 로그가 남지 않으면, 크레딧이 떨어진 것과 네트워크가
// 끊긴 것이 운영 자료에서 같은 한 칸에 들어간다.
await check("full로 폴백하는 실패도 선택 단계 원인을 남긴다", async () => {
	const cases = [
		{
			label: "Haiku 500",
			error: apiError(500, errorBody("api_error", SECRET)),
			status: 500,
			category: "upstream_unavailable",
		},
		{
			label: "네트워크 장애",
			error: APIError.generate(undefined, undefined, SECRET, undefined),
			status: null,
			category: "upstream_unavailable",
		},
		{
			label: "선택 deadline 중단",
			error: new DOMException("selection deadline reached", "AbortError"),
			status: null,
			category: "upstream_unavailable",
		},
		{
			label: "분류되지 않은 400",
			error: apiError(400, errorBody("invalid_request_error", SECRET)),
			status: 400,
			category: "invalid_upstream_request",
		},
	];
	for (const one of cases) {
		const run = await runWithStub({
			selection: () => {
				throw one.error;
			},
		});
		// 중단 대상이 아니므로 Sonnet은 그대로 부른다.
		equal(run.calls.length, 2, `${one.label}: full 폴백이 깨졌습니다`);
		const errorLines = run.lines.filter((line) =>
			line.includes("generate-skill-error"),
		);
		equal(errorLines.length, 1, `${one.label}: 오류 로그가 한 줄이 아닙니다`);
		const log = JSON.parse(errorLines[0]);
		equal(log.stage, "selection", one.label);
		equal(log.status, one.status, one.label);
		equal(log.category, one.category, one.label);
		ok(
			!errorLines[0].includes(SECRET),
			`${one.label}: 로그에 원문 message가 들어갔습니다`,
		);
	}
});

// 선택 **뒤**의 우리 코드 오류는 업스트림 장애와 다른 칸에 들어가야 한다.
// `frequency`에 문자열이 아닌 값을 넣으면 전달 목록을 펴는 도중 실제로
// TypeError가 난다(`hasAnswer`가 `.trim()`을 부른다). 라우트는 이런 값을
// 입력 검사에서 막지만, 여기서는 그 뒤 경로를 일부러 밟는다.
await check("선택 후처리 오류는 업스트림 장애와 따로 기록한다", async () => {
	const stub = stubClient({
		onSelection: () => stubMessage("<bundles>\n[tdd-cycle]\n</bundles>"),
		onGeneration: () => stubMessage("<skill_md>\n# 결과\n</skill_md>"),
	});
	const { result, lines } = await withCapturedLogs(() =>
		runGeneration({
			client: stub.client,
			request: {
				answers: { situation: "x", language: "ko", frequency: 42 },
				wantsAdvanced: false,
				refinement: undefined,
				clarifications: undefined,
			},
			configuredMode: "routed",
		}),
	);
	// 우리 오류여도 사용자 요청은 full로 이어 간다.
	equal(stub.calls.length, 2, "full 폴백이 깨졌습니다");
	equal(result.status, 200);
	const errorLines = lines.filter((line) =>
		line.includes("generate-skill-error"),
	);
	equal(errorLines.length, 1, "오류 로그가 한 줄이 아닙니다");
	const log = JSON.parse(errorLines[0]);
	equal(log.stage, "selection-processing");
	equal(log.category, "selection_processing_error");
	equal(log.errorName, "TypeError");
	// 라우팅 로그에서는 여전히 F1이다 — 그래서 원인을 이쪽에 남긴다.
	const routing = lines.find((line) => line.includes("generate-skill-routing"));
	ok(routing?.includes('"fallbackReasonIds":["F1"]'), "F1로 세지 않았습니다");
});

await check("중단 대상 오류의 원인 로그도 한 줄만 남는다", async () => {
	const run = await runWithStub({
		selection: () => {
			throw apiError(402, errorBody("billing_error", SECRET));
		},
	});
	const errorLines = run.lines.filter((line) =>
		line.includes("generate-skill-error"),
	);
	equal(errorLines.length, 1, "오류 로그가 한 줄이 아닙니다");
	equal(JSON.parse(errorLines[0]).stage, "selection");
});

await check("선택이 성공하면 선택 단계 오류 로그는 남지 않는다", async () => {
	const run = await runWithStub({
		selection: () => stubMessage("<bundles>\n[tdd-cycle]\n</bundles>"),
	});
	ok(
		!run.lines.some((line) => line.includes('"stage":"selection"')),
		"성공한 선택에 오류 로그가 남았습니다",
	);
});

await check("선택 호출은 SDK 자동 재시도를 쓰지 않는다", async () => {
	const run = await runWithStub({
		selection: () => stubMessage("<bundles>\n[tdd-cycle]\n</bundles>"),
	});
	equal(run.calls[0].model, SELECTION_MODEL);
	equal(run.calls[0].options?.maxRetries, 0);
	// 생성 호출의 재시도 정책은 이번 작업에서 건드리지 않는다.
	equal(run.calls[1].options, undefined);
});

await check("선택이 성공하면 routed로 생성한다", async () => {
	const run = await runWithStub({
		selection: () => stubMessage("<bundles>\n[tdd-cycle]\n</bundles>"),
	});
	equal(run.outcome.status, 200);
	equal(run.outcome.body.skillMarkdown, "# 결과");
	const generation = run.lines.find((line) =>
		line.includes('"event":"generate-skill"'),
	);
	ok(
		generation?.includes('"corpusMode":"routed"'),
		"routed로 생성하지 않았습니다",
	);
});

await check("생성 호출 실패도 같은 분류를 쓴다", async () => {
	const run = await runWithStub({
		selection: () => stubMessage("<bundles>\n[tdd-cycle]\n</bundles>"),
		generation: () => {
			throw apiError(402, errorBody("billing_error", SECRET));
		},
	});
	equal(run.calls.length, 2);
	equal(run.outcome.body.errorCode, "billing_unavailable");
	equal(run.outcome.body.retryable, false);
	ok(!JSON.stringify(run.outcome.body).includes(SECRET));
	const errorLine = run.lines.find((line) =>
		line.includes("generate-skill-error"),
	);
	ok(errorLine?.includes('"stage":"generation"'), "단계가 기록되지 않았습니다");
});

await check("파싱 실패는 재시도 가능한 실패로 내려간다", async () => {
	const run = await runWithStub({
		selection: () => stubMessage("<bundles>\n[tdd-cycle]\n</bundles>"),
		generation: () => stubMessage(`형식이 깨진 응답 ${SECRET}`),
	});
	equal(run.outcome.status, 502);
	equal(run.outcome.body.errorCode, "parse_failure");
	equal(run.outcome.body.retryable, true);
	ok(
		!run.lines.join("\n").includes(SECRET),
		"응답 전문이 로그에 새어 나갔습니다",
	);
});

await check("되물음은 실패가 아니라 200으로 내려간다", async () => {
	const run = await runWithStub({
		selection: () => stubMessage("<bundles>\n[tdd-cycle]\n</bundles>"),
		generation: () =>
			stubMessage("<questions>\n- 무엇을 자동화하고 싶으세요?\n</questions>"),
	});
	equal(run.outcome.status, 200);
	equal(run.outcome.body.needsMoreInfo, true);
});

if (failures.length) {
	console.error(`\nFAIL ${failures.length}건\n`);
	for (const one of failures) console.error(`  - ${one}`);
	process.exit(1);
}
console.log("\nOK  오류 분류·중단 회귀 시험 통과");
