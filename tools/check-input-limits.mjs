// 서버 입력 길이 상한 회귀 시험.
//
// 사용: node --experimental-strip-types --no-warnings --import ./tools/alias-loader.mjs tools/check-input-limits.mjs
//       (pnpm check:input-limits)
//
// 경계값을 양쪽에서 본다. 상한과 정확히 같은 입력은 통과해야 하고, 한 글자·
// 한 바이트만 넘겨도 막혀야 한다. 한쪽만 보면 상한이 실제로 어디 있는지
// 알 수 없다.

import { equal, ok } from "node:assert/strict";
import {
	readValidatedRequest,
	validateParsedBody,
} from "../src/app/api/generate-skill/request-validation.ts";
import {
	MAX_ANSWER_LENGTH,
	MAX_FEEDBACK_LENGTH,
	MAX_FOLLOW_UP_ANSWER_LENGTH,
	MAX_FOLLOW_UP_ITEMS,
	MAX_FOLLOW_UP_QUESTION_LENGTH,
	MAX_PREVIOUS_SKILL_LENGTH,
	MAX_REFERENCE_LENGTH,
	MAX_REQUEST_BODY_BYTES,
	MAX_TOTAL_INPUT_LENGTH,
} from "../src/lib/input-limits.ts";

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

const fill = (length) => "가".repeat(length);
const ascii = (length) => "a".repeat(length);

function body(overrides = {}) {
	return {
		answers: {
			tool: "cli",
			situation: "정상 입력",
			language: "ko",
			...overrides.answers,
		},
		wantsAdvanced: false,
		...overrides.rest,
	};
}

function expectOk(input, label) {
	const result = validateParsedBody(input);
	ok(result.ok, `${label}: ${result.ok ? "" : result.code}로 거절됐습니다`);
	return result.value;
}

function expectCode(input, code, label) {
	const result = validateParsedBody(input);
	ok(!result.ok, `${label}: 통과했습니다`);
	equal(result.code, code, label);
}

// ── 항목별 상한 ─────────────────────────────────────────────────────

await check("자유 서술 답변은 상한까지 받고 한 글자 넘으면 막는다", () => {
	for (const id of ["situation", "autonomyDetail", "constraints"]) {
		expectOk(body({ answers: { [id]: fill(MAX_ANSWER_LENGTH) } }), id);
		expectCode(
			body({ answers: { [id]: fill(MAX_ANSWER_LENGTH + 1) } }),
			"input_too_large",
			id,
		);
	}
});

await check("참고 스킬은 더 긴 상한을 쓴다", () => {
	expectOk(
		body({ answers: { reference: fill(MAX_REFERENCE_LENGTH) } }),
		"reference",
	);
	expectCode(
		body({ answers: { reference: fill(MAX_REFERENCE_LENGTH + 1) } }),
		"input_too_large",
		"reference",
	);
});

await check("목록에 없는 자유 입력도 기본 상한을 적용한다", () => {
	expectOk(
		body({ answers: { somethingNew: fill(MAX_ANSWER_LENGTH) } }),
		"기본 상한",
	);
	expectCode(
		body({ answers: { somethingNew: fill(MAX_ANSWER_LENGTH + 1) } }),
		"input_too_large",
		"기본 상한",
	);
});

await check("되물음 질문과 답변에 각각의 상한을 적용한다", () => {
	const item = (question, answer) => ({ question, answer });
	expectOk(
		body({
			rest: {
				clarifications: [
					item(
						fill(MAX_FOLLOW_UP_QUESTION_LENGTH),
						fill(MAX_FOLLOW_UP_ANSWER_LENGTH),
					),
				],
			},
		}),
		"경계",
	);
	expectCode(
		body({
			rest: {
				clarifications: [item(fill(MAX_FOLLOW_UP_QUESTION_LENGTH + 1), "답")],
			},
		}),
		"input_too_large",
		"질문 초과",
	);
	expectCode(
		body({
			rest: {
				clarifications: [item("질문", fill(MAX_FOLLOW_UP_ANSWER_LENGTH + 1))],
			},
		}),
		"input_too_large",
		"답변 초과",
	);
});

await check("수정 요청의 이전 초안과 피드백에 상한을 적용한다", () => {
	const refinement = (overrides) => ({
		refinement: {
			previousSkillMarkdown: "# 초안",
			userFeedback: "더 짧게",
			answeredQuestions: [],
			...overrides,
		},
	});
	expectOk(
		body({
			rest: refinement({
				previousSkillMarkdown: fill(MAX_PREVIOUS_SKILL_LENGTH),
			}),
		}),
		"이전 초안 경계",
	);
	expectCode(
		body({
			rest: refinement({
				previousSkillMarkdown: fill(MAX_PREVIOUS_SKILL_LENGTH + 1),
			}),
		}),
		"input_too_large",
		"이전 초안 초과",
	);
	expectOk(
		body({ rest: refinement({ userFeedback: fill(MAX_FEEDBACK_LENGTH) }) }),
		"피드백 경계",
	);
	expectCode(
		body({ rest: refinement({ userFeedback: fill(MAX_FEEDBACK_LENGTH + 1) }) }),
		"input_too_large",
		"피드백 초과",
	);
});

// ── 개수와 타입 ─────────────────────────────────────────────────────

await check("누적 항목 수는 상한까지만 받는다", () => {
	const items = (count) =>
		Array.from({ length: count }, (_, i) => ({
			question: `q${i}`,
			answer: `a${i}`,
		}));
	expectOk(
		body({ rest: { clarifications: items(MAX_FOLLOW_UP_ITEMS) } }),
		"경계",
	);
	expectCode(
		body({ rest: { clarifications: items(MAX_FOLLOW_UP_ITEMS + 1) } }),
		"invalid_request",
		"초과",
	);
	expectCode(
		body({
			rest: {
				refinement: {
					previousSkillMarkdown: "# 초안",
					userFeedback: "",
					answeredQuestions: items(MAX_FOLLOW_UP_ITEMS + 1),
				},
			},
		}),
		"invalid_request",
		"수정 요청 초과",
	);
});

await check("타입이 어긋난 값은 거절한다", () => {
	expectCode({ answers: [] }, "invalid_request", "answers가 배열");
	expectCode("문자열", "invalid_request", "본문이 문자열");
	expectCode(
		body({ answers: { situation: 42 } }),
		"invalid_request",
		"숫자 답변",
	);
	expectCode(
		body({ answers: { audience: [1, 2] } }),
		"invalid_request",
		"배열 안 숫자",
	);
	expectCode(
		body({ rest: { wantsAdvanced: "yes" } }),
		"invalid_request",
		"boolean이 아닌 값",
	);
	expectCode(
		body({ rest: { clarifications: [{ question: "q" }] } }),
		"invalid_request",
		"answer 없음",
	);
	expectCode(
		body({ answers: { audience: Array.from({ length: 40 }, () => "x") } }),
		"invalid_request",
		"배열 항목 과다",
	);
	expectCode(
		{
			answers: Object.fromEntries(
				Array.from({ length: 40 }, (_, i) => [`k${i}`, "x"]),
			),
		},
		"invalid_request",
		"키 과다",
	);
});

await check("필수 답변이 없으면 길이 오류가 아니라 필수 누락이다", () => {
	expectCode(
		{ answers: { language: "ko" } },
		"missing_required_answers",
		"situation 없음",
	);
	expectCode(
		{ answers: { situation: "x" } },
		"missing_required_answers",
		"language 없음",
	);
});

await check("잘못 전달된 refinement는 정제로 치지 않는다", () => {
	// 이벤트 객체 같은 것이 들어와도 거절하지 않고 「정제 아님」으로 본다.
	const value = expectOk(
		body({ rest: { refinement: { nativeEvent: {}, type: "click" } } }),
		"정제 아님",
	);
	equal(value.refinement, undefined);
});

// ── 전체 합계 ───────────────────────────────────────────────────────

await check("사용자 제어 문자열의 총합에도 상한이 있다", () => {
	// 항목별 상한은 모두 지키면서 language("ko") 2자를 포함해 딱 상한에 맞춘다.
	const rest =
		MAX_TOTAL_INPUT_LENGTH - MAX_REFERENCE_LENGTH - MAX_ANSWER_LENGTH * 2 - 2;
	ok(rest > 0 && rest <= MAX_ANSWER_LENGTH, "시험 전제가 어긋났습니다");
	const atLimit = {
		answers: {
			language: "ko",
			situation: fill(MAX_ANSWER_LENGTH),
			reference: fill(MAX_REFERENCE_LENGTH),
			constraints: fill(MAX_ANSWER_LENGTH),
			autonomyDetail: fill(rest),
		},
	};
	expectOk(atLimit, "총합 경계");
	expectCode(
		{ answers: { ...atLimit.answers, autonomyDetail: fill(rest + 1) } },
		"input_too_large",
		"총합 초과",
	);
});

// ── 원시 본문 바이트 ─────────────────────────────────────────────────

function request(raw, headers = {}) {
	return new Request("http://localhost/api/generate-skill", {
		method: "POST",
		headers: { "content-type": "application/json", ...headers },
		body: raw,
	});
}

/** 정확히 `bytes` 바이트인 JSON 본문을 만든다. 남는 자리는 ASCII로 채운다. */
function rawBodyOfBytes(bytes) {
	const base = { answers: { situation: "x", language: "ko" }, _pad: "" };
	const padLength = bytes - Buffer.byteLength(JSON.stringify(base), "utf8");
	return JSON.stringify({ ...base, _pad: ascii(padLength) });
}

await check(
	"원시 본문은 512 KiB까지 받고 한 바이트 넘으면 막는다",
	async () => {
		const atLimit = rawBodyOfBytes(MAX_REQUEST_BODY_BYTES);
		equal(Buffer.byteLength(atLimit, "utf8"), MAX_REQUEST_BODY_BYTES);
		const okResult = await readValidatedRequest(request(atLimit));
		ok(
			okResult.ok,
			`경계에서 거절됐습니다: ${okResult.ok ? "" : okResult.code}`,
		);

		const over = rawBodyOfBytes(MAX_REQUEST_BODY_BYTES + 1);
		const overResult = await readValidatedRequest(request(over));
		ok(!overResult.ok, "한 바이트 초과를 통과시켰습니다");
		equal(overResult.code, "input_too_large");
	},
);

await check("Content-Length가 상한을 넘으면 파싱 전에 막는다", async () => {
	const result = await readValidatedRequest(
		request(JSON.stringify(body()), {
			"content-length": String(MAX_REQUEST_BODY_BYTES + 1),
		}),
	);
	ok(!result.ok, "통과했습니다");
	equal(result.code, "input_too_large");
});

await check(
	"Content-Length가 거짓이어도 실제 바이트로 다시 막는다",
	async () => {
		const raw = rawBodyOfBytes(MAX_REQUEST_BODY_BYTES + 1024);
		const result = await readValidatedRequest(
			request(raw, { "content-length": "10" }),
		);
		ok(!result.ok, "통과했습니다");
		equal(result.code, "input_too_large");
	},
);

await check("글자 수가 아니라 바이트로 잰다", async () => {
	// 한글은 UTF-8에서 3바이트다. 글자 수로 재면 통과하지만 바이트로는 넘는다.
	const chars = Math.ceil(MAX_REQUEST_BODY_BYTES / 3) + 10;
	const raw = JSON.stringify({
		answers: { situation: "x", language: "ko" },
		_pad: fill(chars),
	});
	ok(raw.length < MAX_REQUEST_BODY_BYTES, "시험 전제가 어긋났습니다");
	const result = await readValidatedRequest(request(raw));
	ok(!result.ok, "통과했습니다");
	equal(result.code, "input_too_large");
});

await check("깨진 JSON은 형식 오류로 거절한다", async () => {
	const result = await readValidatedRequest(request("{not json"));
	ok(!result.ok, "통과했습니다");
	equal(result.code, "invalid_request");
});

if (failures.length) {
	console.error(`\nFAIL ${failures.length}건\n`);
	for (const one of failures) console.error(`  - ${one}`);
	process.exit(1);
}
console.log("\nOK  입력 길이 상한 회귀 시험 통과");
