// 서버 로그 회귀 시험 — 남기면 안 되는 것이 로그로 새지 않는지 본다.
//
// 사용: node --experimental-strip-types --no-warnings --import ./tools/alias-loader.mjs tools/check-logging.mjs
//       (pnpm check:logging)
//
// 왜 있나: 2026-08-28까지 `/api/generate-skill`은 파싱이 깨졌을 때 **모델이 만든
// 문서 전문**을, 호출이 실패했을 때 **오류 객체 통째**를 서버 로그에 찍었다.
// 이 저장소는 공개이고 원문·생성 결과 전문을 남기지 않기로 했는데, 그 약속이
// 코드가 아니라 주석에만 있었다.
//
// 그래서 이 시험이 보는 것은 두 가지다.
//
//   1. telemetry.ts가 만든 값에 허용 목록 밖의 것이 없는가 (필드도, 값도)
//   2. console을 부르는 자리가 telemetry.ts 안에만 있는가
//
// 2번이 없으면 1번은 우회된다 — 새 console 한 줄을 옆에 붙이면 그만이다.
//
// 처음에는 route.ts의 console 호출을 정규식으로 뜯어 인자를 검사했다. **그
// 검사는 새는 줄을 놓쳤다** — 한 줄짜리 호출이 뒤에 오는 안전한 호출의 매치에
// 통째로 흡수돼 통과했다. 그래서 호출을 telemetry.ts 한 곳으로 모으고, 검사는
// 인자를 파싱하는 대신 **발생 횟수만 센다.** 셀 수 있는 것으로 판정한다.
//
// telemetry.ts는 오류 분류를 upstream-error.ts에서 가져온다. 확장자 없는 상대
// 경로라 node가 그대로는 못 찾으므로 tools/alias-loader.mjs를 함께 등록한다.
// 소스를 뽑아 돌리는 check-tag-parser.mjs 방식은 여기선 필요 없다.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { APIError } from "@anthropic-ai/sdk";
import {
	buildErrorLog,
	buildGenerationLog,
	buildParseFailureLog,
	buildPersistenceErrorLog,
	buildRoutingLog,
	ERROR_LOG_CATEGORIES,
	ERROR_LOG_FIELDS,
	ERROR_STAGES,
	GENERATION_LOG_FIELDS,
	KNOWN_ERROR_NAMES,
	PERSISTENCE_ERROR_LOG_FIELDS,
	PERSISTENCE_FAILURE_REASONS,
	PERSISTENCE_STAGES,
	pickUsage,
	ROUTING_LOG_FIELDS,
	SELECTION_PROCESSING_CATEGORY,
	USAGE_LOG_FIELDS,
} from "../src/app/api/generate-skill/telemetry.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const API_DIR = join(HERE, "..", "src", "app", "api", "generate-skill");
const ROUTE = join(API_DIR, "route.ts");
const GENERATE = join(API_DIR, "generate.ts");
const TELEMETRY = join(API_DIR, "telemetry.ts");
const STORE = join(API_DIR, "observation-store.ts");

// 새면 눈에 띄도록 실제 자료 대신 표식을 넣는다. 로그 어디에도 이 글자가
// 나오면 안 된다.
const SECRET = "SENSITIVE-USER-CONTENT-MARKER";

const failures = [];
function check(label, run) {
	try {
		run();
		console.log(`  ok   ${label}`);
	} catch (error) {
		failures.push(`${label}\n       ${String(error.message).split("\n")[0]}`);
		console.log(`  FAIL ${label}`);
	}
}

const sameMembers = (actual, expected) =>
	actual.length === expected.length &&
	actual.every((one) => expected.includes(one));

// ── 허용 목록: 최상위 ────────────────────────────────────────────────
check("성공 로그는 허용된 최상위 필드만 낸다", () => {
	const log = buildGenerationLog({
		kind: "create",
		corpusMode: "full",
		model: "claude-sonnet-5",
		ms: 1234,
		stopReason: "end_turn",
		usage: { input_tokens: 1, output_tokens: 2 },
	});
	if (!sameMembers(Object.keys(log), [...GENERATION_LOG_FIELDS])) {
		throw new Error(`필드가 다릅니다: ${Object.keys(log).join(", ")}`);
	}
});

// ── 허용 목록: 중첩된 usage ──────────────────────────────────────────
check("SDK가 필드를 더해도 usage는 네 개만 나간다", () => {
	const log = buildGenerationLog({
		kind: "create",
		corpusMode: "routed",
		model: "claude-sonnet-5",
		ms: 1,
		stopReason: "end_turn",
		// 실제 응답에 있는 필드 + 앞으로 늘어날 수 있는 자리를 함께 넣는다.
		usage: {
			input_tokens: 1809,
			output_tokens: 3438,
			cache_creation_input_tokens: 63999,
			cache_read_input_tokens: 0,
			cache_creation: { ephemeral_5m_input_tokens: 63999 },
			output_tokens_details: { thinking_tokens: 0 },
			service_tier: "standard",
			inference_geo: "global",
			future_field_nobody_planned_for: SECRET,
		},
	});
	if (!sameMembers(Object.keys(log.usage), [...USAGE_LOG_FIELDS])) {
		throw new Error(
			`usage 필드가 다릅니다: ${Object.keys(log.usage).join(", ")}`,
		);
	}
	if (JSON.stringify(log).includes(SECRET)) {
		throw new Error("허용 목록 밖의 값이 딸려 나왔습니다");
	}
});

// ── 선택·전환 계측 ─────────────────────────────────────────────────
check("라우팅 로그는 허용된 필드와 고정 id만 낸다", () => {
	const log = buildRoutingLog({
		model: "claude-haiku-4-5",
		ms: 1085,
		usage: {
			input_tokens: 3000,
			output_tokens: 40,
			future_field_nobody_planned_for: SECRET,
		},
		decision: {
			status: "failure",
			fallback: true,
			fallbackReasonIds: ["F4", `F5-${SECRET}`],
			ambiguityIds: ["F7", `F7-${SECRET}`],
		},
	});
	if (!sameMembers(Object.keys(log), [...ROUTING_LOG_FIELDS])) {
		throw new Error(`필드가 다릅니다: ${Object.keys(log).join(", ")}`);
	}
	if (JSON.stringify(log).includes(SECRET)) {
		throw new Error("허용 목록 밖의 라우팅 값이 딸려 나왔습니다");
	}
	if (JSON.stringify(log.fallbackReasonIds) !== '["F4"]') {
		throw new Error("전환 이유 허용 목록이 어긋났습니다");
	}
	if (JSON.stringify(log.ambiguityIds) !== '["F7"]') {
		throw new Error("애매 이유 허용 목록이 어긋났습니다");
	}
});

check("캐시 토큰이 없는 응답도 0으로 채운다", () => {
	const usage = pickUsage({ input_tokens: 10, output_tokens: 20 });
	if (usage.cache_read_input_tokens !== 0) {
		throw new Error("빠진 캐시 필드가 0이 아닙니다");
	}
	if (pickUsage(undefined).input_tokens !== 0) {
		throw new Error("usage가 없을 때 터집니다");
	}
});

// ── 응답 전문이 새지 않는가 ──────────────────────────────────────────
check("형식 파손 로그에 응답 전문이 담기지 않는다", () => {
	const text = `<skill_md>\n# ${SECRET}\n본문이 길게 이어진다`;
	const log = buildParseFailureLog({ text, stopReason: "end_turn" });
	if (JSON.stringify(log).includes(SECRET)) {
		throw new Error("응답 본문이 로그에 들어갔습니다");
	}
	if (log.textLength !== text.length) throw new Error("길이가 틀립니다");
	if (!log.hasOpenTag || log.hasCloseTag) {
		throw new Error("태그 진단이 틀립니다");
	}
});

// ── 오류 객체가 통째로 새지 않는가 ───────────────────────────────────
//
// 가짜 객체를 쓰면 실제 SDK와 어긋난 채로 통과한다. 실제로 그랬다 —
// `request_id`로 읽고 있었는데 APIError의 속성명은 `requestID`라서, 시험은
// 통과하고 운영 로그에는 늘 null이 찍혔을 것이다. 그래서 여기서는 SDK가
// 실제로 만드는 오류를 쓴다.
check("실제 APIError에서 진단값을 읽는다", () => {
	const headers = new Headers({ "request-id": "req_011CabcXYZ" });
	const error = APIError.generate(
		429,
		{ type: "error", error: { type: "rate_limit_error", message: SECRET } },
		undefined,
		headers,
	);
	const log = buildErrorLog(error);
	if (JSON.stringify(log).includes(SECRET)) {
		throw new Error("오류 message가 로그에 들어갔습니다");
	}
	if (log.status !== 429) throw new Error(`status가 ${log.status}입니다`);
	if (log.code !== "rate_limit_error")
		throw new Error(`code가 ${log.code}입니다`);
	if (log.requestId !== "req_011CabcXYZ") {
		throw new Error(`requestId가 ${log.requestId}입니다`);
	}
	if (log.errorName !== "RateLimitError") {
		throw new Error(`errorName이 ${log.errorName}입니다`);
	}
});

check("실패 로그는 허용된 최상위 필드만 낸다", () => {
	const log = buildErrorLog(
		APIError.generate(
			429,
			{
				type: "error",
				error: {
					type: "rate_limit_error",
					message: SECRET,
					details: { error_code: `enforced_spend_limit_reached ${SECRET}` },
				},
			},
			undefined,
			new Headers({ "retry-after": `13 ${SECRET}` }),
		),
		"selection",
	);
	if (!sameMembers(Object.keys(log), [...ERROR_LOG_FIELDS])) {
		throw new Error(`필드가 다릅니다: ${Object.keys(log).join(", ")}`);
	}
	if (JSON.stringify(log).includes(SECRET)) {
		throw new Error("허용 목록 밖의 값이 딸려 나왔습니다");
	}
	// 형태가 어긋난 retry-after는 버린다. 지어낸 숫자로 버튼을 잠그지 않는다.
	if (log.retryAfterSeconds !== null) {
		throw new Error(`retryAfterSeconds가 ${log.retryAfterSeconds}입니다`);
	}
	// error_code도 값을 그대로 흘리지 않는다 — 아는 값과 정확히 같을 때만 센다.
	if (log.category !== "rate_limited") {
		throw new Error(`category가 ${log.category}입니다`);
	}
});

// ── 우리 코드의 오류를 남의 장애로 적지 않는가 ───────────────────────
//
// 전달 목록·렌더에서 난 오류는 상태 코드가 없다. 그대로 업스트림 분류에
// 태우면 `upstream_unavailable`이 되어, 우리 렌더 결함이 Anthropic 장애나
// 네트워크 문제로 집계된다. 라우팅 로그에서는 둘 다 F1이라 구분이 안 된다.
check("선택 후처리 오류는 업스트림 장애로 적지 않는다", () => {
	const ours = buildErrorLog(
		new TypeError("cannot read patternIds"),
		"selection-processing",
	);
	if (ours.category !== SELECTION_PROCESSING_CATEGORY) {
		throw new Error(`category가 ${ours.category}입니다`);
	}
	if (ours.stage !== "selection-processing") {
		throw new Error(`stage가 ${ours.stage}입니다`);
	}
	if (ours.retryAfterSeconds !== null) {
		throw new Error("우리 오류에 재시도 대기 시간이 붙었습니다");
	}
	// 같은 오류라도 선택 호출 단계였다면 업스트림 분류를 그대로 쓴다.
	const upstream = buildErrorLog(new TypeError("x"), "selection");
	if (upstream.category !== "upstream_unavailable") {
		throw new Error(`업스트림 분류가 바뀌었습니다: ${upstream.category}`);
	}
});

check("category는 허용 목록 밖으로 나가지 않는다", () => {
	const allowed = [...ERROR_LOG_CATEGORIES, null];
	for (const stage of [...ERROR_STAGES, SECRET]) {
		for (const one of [
			null,
			undefined,
			"그냥 문자열",
			42,
			new Error("x"),
			APIError.generate(429, {}, undefined, new Headers()),
		]) {
			const { category } = buildErrorLog(one, stage);
			if (!allowed.includes(category)) {
				throw new Error(`허용 목록 밖의 category: ${category}`);
			}
		}
	}
});

check("단계 이름은 아는 값만 남긴다", () => {
	if (buildErrorLog(new Error("x"), SECRET).stage !== "generation") {
		throw new Error("모르는 단계 이름이 그대로 나갔습니다");
	}
	if (buildErrorLog(new Error("x")).stage !== "generation") {
		throw new Error("기본 단계가 틀립니다");
	}
});

// ── 키만이 아니라 값도 허용 목록으로 거르는가 ────────────────────────
check("임의 문자열이 담긴 필드는 흘리지 않는다", () => {
	const log = buildErrorLog(
		Object.assign(new Error("x"), {
			name: `Error${SECRET}`,
			type: `rate_limit_error ${SECRET}`,
			requestID: `req_ ${SECRET}`,
			status: 500,
		}),
	);
	if (JSON.stringify(log).includes(SECRET)) {
		throw new Error(`임의 문자열이 그대로 나갔습니다: ${JSON.stringify(log)}`);
	}
	if (log.code !== null) throw new Error("모르는 종류를 버리지 않았습니다");
	if (log.requestId !== null) {
		throw new Error("형태가 어긋난 id를 버리지 않았습니다");
	}
	// 진단에 쓰는 숫자까지 버리면 장애를 못 가린다.
	if (log.status !== 500) throw new Error("상태 코드까지 버렸습니다");
});

check("모르는 오류 클래스는 other로 적는다", () => {
	class SomethingWeAnticipatedNever extends Error {}
	const log = buildErrorLog(new SomethingWeAnticipatedNever("x"));
	if (log.errorName !== "other") {
		throw new Error(`errorName이 ${log.errorName}입니다`);
	}
});

check("errorName은 언제나 아는 값 아니면 other다", () => {
	const allowed = [...KNOWN_ERROR_NAMES, "other"];
	for (const one of [
		null,
		undefined,
		"그냥 문자열",
		42,
		{},
		new Error("x"),
		new TypeError("x"),
		Object.assign(new Error("x"), { name: SECRET }),
	]) {
		const { errorName } = buildErrorLog(one);
		if (!allowed.includes(errorName)) {
			throw new Error(`허용 목록 밖의 이름: ${errorName}`);
		}
	}
});

check("모양이 다른 오류에도 터지지 않는다", () => {
	for (const one of [null, undefined, "그냥 문자열", 42, {}]) {
		const log = buildErrorLog(one);
		if (typeof log.event !== "string") throw new Error(`${one}에서 깨집니다`);
	}
});

// ── 계측 저장 실패 로그 ──────────────────────────────────────────────
//
// 이 이벤트는 Supabase 응답을 다룬다. 응답 본문이나 오류 message가 실려 나가면
// 우리가 만들지 않은 문자열이 로그에 들어간다.

check("저장 실패 로그의 필드는 허용 목록뿐이다", () => {
	const log = buildPersistenceErrorLog({
		stage: "pending-insert",
		reason: "http_error",
		status: 503,
		operationId: "018f2b6a-1c2d-4e5f-8a9b-0c1d2e3f4a5b",
		startedAt: "2026-09-01T00:00:00.000Z",
		kind: "create",
		configuredMode: "routed",
		deploymentId: "dpl_abc123",
		isSmoke: false,
	});
	if (!sameMembers(Object.keys(log), [...PERSISTENCE_ERROR_LOG_FIELDS])) {
		throw new Error(`필드가 다릅니다: ${Object.keys(log).join(", ")}`);
	}
});

check("저장 실패 로그는 stage·reason을 허용 목록으로 가둔다", () => {
	const log = buildPersistenceErrorLog({
		stage: "made-up-stage",
		reason: "made-up-reason",
	});
	if (!PERSISTENCE_STAGES.includes(log.stage)) {
		throw new Error(`stage가 새어 나갔습니다: ${log.stage}`);
	}
	if (!PERSISTENCE_FAILURE_REASONS.includes(log.reason)) {
		throw new Error(`reason이 새어 나갔습니다: ${log.reason}`);
	}
});

check("저장 실패 로그는 형태가 어긋난 값을 버린다", () => {
	const log = buildPersistenceErrorLog({
		stage: "final-update",
		reason: "request_failed",
		// uuid가 아닌 값, 날짜가 아닌 값, 목록에 없는 kind, 형태가 어긋난 배포 id.
		operationId: SECRET,
		startedAt: SECRET,
		kind: SECRET,
		configuredMode: SECRET,
		deploymentId: `${SECRET} with spaces`,
	});
	const text = JSON.stringify(log);
	if (text.includes(SECRET)) {
		throw new Error(`표식이 로그에 남았습니다: ${text}`);
	}
	for (const key of ["operationId", "startedAt", "kind", "configuredMode"]) {
		if (log[key] !== null) throw new Error(`${key}가 null이 아닙니다`);
	}
});

check("저장 실패 로그에 Supabase 응답 본문 자리가 없다", () => {
	// status는 숫자만 받는다. 본문을 담을 문자열 필드가 아예 없어야 한다.
	const log = buildPersistenceErrorLog({
		stage: "pending-insert",
		reason: "http_error",
		status: SECRET,
	});
	if (log.status !== null)
		throw new Error("status가 숫자가 아닌데 통과했습니다");
	if (JSON.stringify(log).includes(SECRET)) {
		throw new Error("표식이 로그에 남았습니다");
	}
});

// ── operationId 배선 ─────────────────────────────────────────────────
//
// Vercel 로그와 Supabase 행을 맞추는 값이다. 우리가 만든 uuid만 실린다.

check("네 이벤트 모두 operationId를 싣는다", () => {
	const id = "018f2b6a-1c2d-4e5f-8a9b-0c1d2e3f4a5b";
	const logs = [
		buildGenerationLog({
			operationId: id,
			kind: "create",
			corpusMode: "routed",
			model: "m",
			ms: 1,
			stopReason: "end_turn",
			usage: null,
		}),
		buildRoutingLog({
			operationId: id,
			model: "m",
			ms: 1,
			usage: null,
			decision: {
				status: "success",
				fallback: false,
				fallbackReasonIds: [],
				ambiguityIds: [],
			},
		}),
		buildErrorLog(new Error("x"), "generation", id),
		buildParseFailureLog({ operationId: id, text: "", stopReason: null }),
	];
	for (const log of logs) {
		if (log.operationId !== id) {
			throw new Error(`${log.event}에 operationId가 없습니다`);
		}
	}
});

check("uuid가 아닌 operationId는 버린다", () => {
	// 밖에서 들어온 값이 이 자리에 실려 나가지 않게 형태로 거른다.
	if (
		buildErrorLog(new Error("x"), "generation", SECRET).operationId !== null
	) {
		throw new Error("uuid가 아닌 값이 통과했습니다");
	}
	if (
		buildParseFailureLog({ operationId: SECRET, text: "", stopReason: null })
			.operationId !== null
	) {
		throw new Error("uuid가 아닌 값이 통과했습니다");
	}
});

// ── 우회 경로 막기 ───────────────────────────────────────────────────
//
// 인자를 파싱하지 않고 발생 횟수만 센다. 파싱은 한 번 놓쳤다.
const countConsole = (path) =>
	(readFileSync(path, "utf8").match(/console\s*\./g) ?? []).length;

check("route.ts는 console을 직접 부르지 않는다", () => {
	const found = countConsole(ROUTE);
	if (found !== 0) throw new Error(`console이 ${found}군데 있습니다`);
});

check("generate.ts도 console을 직접 부르지 않는다", () => {
	const found = countConsole(GENERATE);
	if (found !== 0) throw new Error(`console이 ${found}군데 있습니다`);
});

check("console을 부르는 자리는 telemetry.ts의 다섯뿐이다", () => {
	const found = countConsole(TELEMETRY);
	// logGeneration · logRouting · logParseFailure · logRequestFailure ·
	// logPersistenceFailure. 늘리려면 이 숫자를 함께 고쳐야 하고, 그 자리에서
	// 무엇이 나가는지 다시 보게 된다.
	if (found !== 5)
		throw new Error(`console이 5군데가 아니라 ${found}군데입니다`);
});

check("저장 모듈도 console을 직접 부르지 않는다", () => {
	// 저장 실패는 telemetry.ts의 logPersistenceFailure를 거쳐야 한다. 여기서
	// 직접 찍으면 「무엇이 로그로 나가는가」를 두 파일을 읽어야 판정하게 된다.
	const found = countConsole(STORE);
	if (found !== 0) throw new Error(`console이 ${found}군데 있습니다`);
});

if (failures.length) {
	console.error(`\nFAIL ${failures.length}건\n`);
	for (const one of failures) console.error(`  - ${one}`);
	process.exit(1);
}
console.log("\nOK  로그 회귀 시험 통과");
