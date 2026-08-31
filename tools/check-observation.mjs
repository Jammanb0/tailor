// 계측 저장 회귀 시험.
//
// 확인하는 것 넷이다.
//
//   1. 저장 행에 허용된 열만 있는가 (사용자 원문·묶음 id가 새지 않는가)
//   2. 어느 경로로 끝나든 관측값이 만들어지는가
//   3. 관측값이 응답 body로 새지 않는가
//   4. DB의 CHECK와 코드의 값 집합이 같은가
//
// 2번이 이 검사의 핵심이다. 조기 반환 하나가 관측값을 빠뜨려도 응답은 정상이라
// 눈으로는 아무 문제가 없다. 표에만 영영 pending으로 남는다 — 그리고 그것은
// 100건을 다 센 다음에야 드러난다.
//
// 실제 Anthropic 호출은 하지 않는다. 클라이언트를 가짜로 만들어 모든 분기를
// 강제로 통과시킨다. 비용이 들지 않는다.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { APIError } from "@anthropic-ai/sdk";
import { runGeneration } from "../src/app/api/generate-skill/generate.ts";
import {
	buildFinalRow,
	buildPendingRow,
	FINAL_ROW_COLUMNS,
	OBSERVATION_STATUSES,
	PENDING_ROW_COLUMNS,
	SELECTION_ERROR_STAGES,
} from "../src/app/api/generate-skill/observation.ts";
import {
	FINAL_TIMEOUT_MS,
	PENDING_TIMEOUT_MS,
	saveFinalObservation,
	savePendingObservation,
} from "../src/app/api/generate-skill/observation-store.ts";
import { GENERATION_ERROR_CODES } from "../src/lib/generation-errors.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const SQL = readFileSync(
	join(ROOT, "docs/operations/generations-table.sql"),
	"utf8",
);
const ROUTE = readFileSync(
	join(ROOT, "src/app/api/generate-skill/route.ts"),
	"utf8",
);

/** 주석을 걷어낸 route.ts. 배선을 볼 때는 실제 코드만 본다. */
const ROUTE_CODE = ROUTE.replace(/^\s*(\/\/|\*|\/\*).*$/gm, "");

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
async function checkAsync(label, run) {
	try {
		await run();
		console.log(`  ok   ${label}`);
	} catch (error) {
		failures.push(`${label}\n       ${String(error.message).split("\n")[0]}`);
		console.log(`  FAIL ${label}`);
	}
}

const sameMembers = (actual, expected) =>
	actual.length === expected.length &&
	actual.every((one) => expected.includes(one));

// ── 1. 저장 행의 열 ──────────────────────────────────────────────────

check("pending 행은 허용된 열만 낸다", () => {
	const row = buildPendingRow({
		operationId: "018f2b6a-1c2d-4e5f-8a9b-0c1d2e3f4a5b",
		startedAt: "2026-09-01T00:00:00.000Z",
		kind: "create",
		configuredMode: "routed",
		deploymentId: "dpl_abc",
		isSmoke: false,
	});
	if (!sameMembers(Object.keys(row), [...PENDING_ROW_COLUMNS])) {
		throw new Error(`열이 다릅니다: ${Object.keys(row).join(", ")}`);
	}
});

check("최종 행은 허용된 열만 낸다", () => {
	const row = buildFinalRow({ observation: blankObservation(), totalMs: 1 });
	if (!sameMembers(Object.keys(row), [...FINAL_ROW_COLUMNS])) {
		throw new Error(`열이 다릅니다: ${Object.keys(row).join(", ")}`);
	}
});

check("저장 행에 묶음·패턴 id를 담을 자리가 없다", () => {
	// 개수만 남긴다. 묶음 조합은 그 사람이 무엇을 만들려 했는지를 드러낸다.
	const forbidden = ["pattern_ids", "bundle_ids", "patternIds", "bundleIds"];
	const all = [...PENDING_ROW_COLUMNS, ...FINAL_ROW_COLUMNS];
	for (const name of forbidden) {
		if (all.includes(name)) throw new Error(`${name} 열이 있습니다`);
	}
	if (!FINAL_ROW_COLUMNS.includes("delivered_pattern_count")) {
		throw new Error("개수 열이 없습니다");
	}
});

check("최종 행은 불변식을 스스로 지킨다", () => {
	// generation_attempted가 false인데 delivered_mode가 남으면 DB가 400으로
	// 튕긴다. 값이 만들어지는 자리에서 미리 맞춰 그 왕복을 없앤다.
	const row = buildFinalRow({
		observation: {
			...blankObservation(),
			generationAttempted: false,
			deliveredMode: "routed",
		},
		totalMs: 1,
	});
	if (row.delivered_mode !== null || row.generation_attempted !== false) {
		throw new Error(
			`짝이 어긋납니다: ${row.delivered_mode} / ${row.generation_attempted}`,
		);
	}
});

// ── 2·3. 모든 경로가 관측값을 만드는가 ───────────────────────────────

function blankObservation() {
	return {
		deliveredMode: null,
		generationAttempted: false,
		status: "error",
		errorCode: null,
		selectionStatus: null,
		selectionFallback: null,
		fallbackReasonIds: null,
		ambiguityIds: null,
		selectionErrorStage: null,
		selectionErrorCategory: null,
		selectionMs: null,
		selectionUsage: null,
		generationMs: null,
		generationStopReason: null,
		generationUsage: null,
		deliveredPatternCount: null,
		injectedBytes: null,
	};
}

const ANSWERS = {
	whatFor: `${SECRET} 테스트 요청`,
	whenToUse: SECRET,
	howToDo: SECRET,
	whatToAvoid: SECRET,
};

/** 응답 한 번을 흉내내는 가짜 클라이언트. 실제 호출은 하지 않는다. */
function fakeClient(reply) {
	return {
		messages: {
			create: async () => {
				if (reply instanceof Error) throw reply;
				return {
					stop_reason: "end_turn",
					usage: { input_tokens: 10, output_tokens: 20 },
					content: [{ type: "text", text: reply }],
				};
			},
		},
	};
}

const SKILL_REPLY = `<filename>x</filename>\n<skill_md>\n# ${SECRET}\n</skill_md>`;
const QUESTIONS_REPLY = "<questions>\n- 하나 더 알려주세요\n</questions>";

const PATHS = [
	{
		name: "성공",
		client: fakeClient(SKILL_REPLY),
		expect: { status: "success", generationAttempted: true },
	},
	{
		name: "되물음",
		client: fakeClient(QUESTIONS_REPLY),
		expect: { status: "needs_more_info", generationAttempted: true },
	},
	{
		name: "파싱 실패",
		client: fakeClient("아무 태그도 없는 답"),
		expect: {
			status: "error",
			errorCode: "parse_failure",
			generationAttempted: true,
		},
	},
	{
		name: "생성 오류",
		client: fakeClient(
			new APIError(
				500,
				{ error: { type: "api_error" } },
				"boom",
				new Headers(),
			),
		),
		expect: {
			status: "error",
			errorCode: "upstream_unavailable",
			generationAttempted: true,
		},
	},
];

for (const path of PATHS) {
	await checkAsync(`${path.name} 경로가 관측값을 만든다`, async () => {
		const result = await runGeneration({
			client: path.client,
			request: {
				answers: ANSWERS,
				wantsAdvanced: false,
				refinement: undefined,
				clarifications: undefined,
			},
			// full이면 선택 호출이 없어 가짜 클라이언트 하나로 모든 분기를 돈다.
			configuredMode: "full",
			operationId: "018f2b6a-1c2d-4e5f-8a9b-0c1d2e3f4a5b",
		});

		if (!result.observation) throw new Error("observation이 없습니다");
		for (const [key, want] of Object.entries(path.expect)) {
			if (result.observation[key] !== want) {
				throw new Error(
					`${key}가 ${want}가 아니라 ${result.observation[key]}입니다`,
				);
			}
		}
		// 열 집합이 형과 어긋나면 저장에서 조용히 빠진다.
		const row = buildFinalRow({ observation: result.observation, totalMs: 1 });
		if (!sameMembers(Object.keys(row), [...FINAL_ROW_COLUMNS])) {
			throw new Error("최종 행의 열이 어긋납니다");
		}
	});

	await checkAsync(
		`${path.name} 경로의 저장 행에 사용자 원문이 없다`,
		async () => {
			const result = await runGeneration({
				client: path.client,
				request: {
					answers: ANSWERS,
					wantsAdvanced: false,
					refinement: undefined,
					clarifications: undefined,
				},
				configuredMode: "full",
				operationId: "018f2b6a-1c2d-4e5f-8a9b-0c1d2e3f4a5b",
			});
			const row = buildFinalRow({
				observation: result.observation,
				totalMs: 1,
			});
			if (JSON.stringify(row).includes(SECRET)) {
				throw new Error("표식이 저장 행에 남았습니다");
			}
		},
	);
}

// ── 선택 단계에서 중단된 요청 ────────────────────────────────────────
//
// 429·결제·인증이면 Sonnet을 부르지 않고 끝낸다. 이 경로가 「부른 것처럼」
// 기록되면 운영 자료가 조용히 부풀려진다 — 넣지도 않은 코퍼스 크기가 쌓이고,
// 하지도 않은 호출의 usage가 0토큰으로 남는다.

await checkAsync(
	"선택 중단 경로는 부르지 않은 것을 기록하지 않는다",
	async () => {
		// 선택 호출(Haiku)이 429로 죽는다. routed 설정이라 선택을 실제로 시도한다.
		const rateLimited = APIError.generate(
			429,
			{
				type: "error",
				error: { type: "rate_limit_error", message: "slow down" },
			},
			undefined,
			new Headers(),
		);
		const result = await runGeneration({
			client: {
				messages: {
					create: async () => {
						throw rateLimited;
					},
				},
			},
			request: {
				answers: ANSWERS,
				wantsAdvanced: false,
				refinement: undefined,
				clarifications: undefined,
			},
			configuredMode: "routed",
			operationId: "018f2b6a-1c2d-4e5f-8a9b-0c1d2e3f4a5b",
		});

		const o = result.observation;
		const want = {
			generationAttempted: false,
			// 부르지 않았으면 전달한 코퍼스도 없다.
			deliveredMode: null,
			injectedBytes: null,
			deliveredPatternCount: null,
			// 응답을 못 받았으니 usage는 0이 아니라 「모른다」다.
			selectionUsage: null,
			generationMs: null,
			status: "error",
			errorCode: "rate_limited",
		};
		for (const [key, value] of Object.entries(want)) {
			if (o[key] !== value) {
				throw new Error(`${key}가 ${value}가 아니라 ${o[key]}입니다`);
			}
		}
		// 선택은 실제로 시도했으므로 그 사실 자체는 남아야 한다.
		if (
			o.selectionStatus !== "failure" ||
			o.selectionErrorStage !== "selection"
		) {
			throw new Error(`선택 실패 기록이 없습니다: ${o.selectionStatus}`);
		}
		if (o.selectionErrorCategory !== "rate_limited") {
			throw new Error(`분류가 ${o.selectionErrorCategory}입니다`);
		}

		// DB 불변식도 함께 지켜야 한다.
		const row = buildFinalRow({ observation: o, totalMs: 1 });
		if (row.generation_attempted !== false || row.delivered_mode !== null) {
			throw new Error("불변식이 어긋납니다");
		}
		if (row.injected_bytes !== null) {
			throw new Error(`injected_bytes가 ${row.injected_bytes}입니다`);
		}
		for (const key of Object.keys(row)) {
			if (key.startsWith("selection_usage_") && row[key] !== null) {
				throw new Error(`${key}가 ${row[key]}입니다 — 0으로 채워졌습니다`);
			}
		}
	},
);

check("total_ms는 after() 밖에서 잰다", () => {
	// 콜백 안에서 재면 after()가 실행된 시각이 섞여 응답 시간이 부풀려진다.
	// 시간 판정선이 total_ms 중앙값이므로 그 오차가 그대로 판정을 민다.
	const afterAt = ROUTE_CODE.indexOf("after(");
	const totalAt = ROUTE_CODE.indexOf("const totalMs");
	if (totalAt === -1) {
		throw new Error("totalMs를 미리 고정하지 않습니다");
	}
	if (totalAt > afterAt) {
		throw new Error("totalMs 계산이 after() 뒤에 있습니다");
	}
	const afterBlock = ROUTE_CODE.slice(afterAt);
	if (/Date\.now\(\)/.test(afterBlock)) {
		throw new Error("after() 안에서 시각을 재고 있습니다");
	}
});

await checkAsync("관측값이 응답 body로 새지 않는다", async () => {
	const result = await runGeneration({
		client: fakeClient(SKILL_REPLY),
		request: {
			answers: ANSWERS,
			wantsAdvanced: false,
			refinement: undefined,
			clarifications: undefined,
		},
		configuredMode: "full",
		operationId: "018f2b6a-1c2d-4e5f-8a9b-0c1d2e3f4a5b",
	});
	const body = JSON.stringify(result.outcome.body);
	// 계측에만 쓰는 이름이 응답에 나타나면 형을 가른 뜻이 없어진다.
	for (const leak of [
		"observation",
		"deliveredMode",
		"generationAttempted",
		"injectedBytes",
		"operationId",
		"selectionMs",
	]) {
		if (body.includes(leak)) throw new Error(`응답에 ${leak}가 있습니다`);
	}
});

// ── 4. 코드와 DB가 같은 값을 쓰는가 ──────────────────────────────────
//
// 두 곳에 같은 목록을 적어 두면 한쪽만 고치는 날이 온다. 그날 DB는 400을
// 돌려주고 계측은 fail-open이라 조용히 사라진다.

check("status 집합이 DB CHECK와 같다", () => {
	for (const one of OBSERVATION_STATUSES) {
		if (!SQL.includes(`'${one}'`)) throw new Error(`SQL에 ${one}이 없습니다`);
	}
});

check("error_code 집합이 DB CHECK와 같다", () => {
	const block = SQL.slice(
		SQL.indexOf("generations_error_code_check"),
		SQL.indexOf("generations_selection_status_check"),
	);
	for (const one of GENERATION_ERROR_CODES) {
		if (!block.includes(`'${one}'`)) {
			throw new Error(`SQL의 error_code CHECK에 ${one}이 없습니다`);
		}
	}
});

check("selection_error_stage 집합이 DB CHECK와 같다", () => {
	const block = SQL.slice(
		SQL.indexOf("generations_selection_error_stage_check"),
		SQL.indexOf("generations_selection_error_category_check"),
	);
	for (const one of SELECTION_ERROR_STAGES) {
		if (!block.includes(`'${one}'`)) throw new Error(`SQL에 ${one}이 없습니다`);
	}
	// generation은 선택 경로가 아니라 이 열에 들어오면 안 된다.
	if (block.includes("'generation'")) {
		throw new Error("selection_error_stage에 generation이 허용돼 있습니다");
	}
});

check("모든 저장 열이 SQL에 실제로 있다", () => {
	const create = SQL.slice(0, SQL.indexOf("-- ── 값 제한"));
	for (const column of [...PENDING_ROW_COLUMNS, ...FINAL_ROW_COLUMNS]) {
		if (!create.includes(column)) {
			throw new Error(`표에 ${column} 열이 없습니다`);
		}
	}
});

// ── 5. 저장 모듈의 I/O ───────────────────────────────────────────────
//
// fetch를 가짜로 바꿔 실제 호출 없이 확인한다. 여기가 특히 중요한 이유는
// **저장이 fail-open**이기 때문이다. URL이 틀리거나 헤더가 빠져도 요청은 정상
// 응답을 돌려주고, 표만 조용히 빈다. 실패가 눈에 띄지 않는 자리일수록 검사가
// 대신 봐야 한다.

const FAKE_ENV = {
	SUPABASE_URL: "https://example.supabase.co/",
	SUPABASE_SECRET_KEY: "sb_secret_FAKE_KEY_FOR_TEST",
};

const STORE_CONTEXT = {
	operationId: "018f2b6a-1c2d-4e5f-8a9b-0c1d2e3f4a5b",
	startedAt: "2026-09-01T00:00:00.000Z",
	kind: "create",
	configuredMode: "routed",
	deploymentId: "dpl_abc",
	isSmoke: false,
};

/** fetch와 환경변수를 갈아끼우고 무슨 요청이 나갔는지, 무엇이 찍혔는지 모은다. */
async function withFakeFetch(run, { env = FAKE_ENV, reply } = {}) {
	const realFetch = globalThis.fetch;
	const realError = console.error;
	const saved = {};
	for (const key of ["SUPABASE_URL", "SUPABASE_SECRET_KEY"]) {
		saved[key] = process.env[key];
		if (env[key] === undefined) delete process.env[key];
		else process.env[key] = env[key];
	}
	const calls = [];
	const lines = [];
	globalThis.fetch = async (url, init) => {
		calls.push({ url: String(url), init });
		if (reply instanceof Error) throw reply;
		return reply ?? { ok: true, status: 201 };
	};
	console.error = (line) => lines.push(String(line));
	try {
		await run();
	} finally {
		globalThis.fetch = realFetch;
		console.error = realError;
		for (const [key, value] of Object.entries(saved)) {
			if (value === undefined) delete process.env[key];
			else process.env[key] = value;
		}
	}
	return { calls, lines };
}

await checkAsync("pending insert가 올바른 요청을 보낸다", async () => {
	const { calls } = await withFakeFetch(() =>
		savePendingObservation(STORE_CONTEXT),
	);
	if (calls.length !== 1) throw new Error(`요청이 ${calls.length}번입니다`);
	const [call] = calls;
	// 끝의 슬래시가 겹쳐 //rest/v1이 되면 안 된다.
	if (call.url !== "https://example.supabase.co/rest/v1/generations") {
		throw new Error(`URL이 다릅니다: ${call.url}`);
	}
	if (call.init.method !== "POST") throw new Error(call.init.method);
	const body = JSON.parse(call.init.body);
	if (!sameMembers(Object.keys(body), [...PENDING_ROW_COLUMNS])) {
		throw new Error(`본문 열이 다릅니다: ${Object.keys(body).join(", ")}`);
	}
	if (body.status !== "pending") throw new Error("status가 pending이 아닙니다");
});

await checkAsync("최종 갱신이 operation_id로 그 행만 고친다", async () => {
	const { calls } = await withFakeFetch(
		() =>
			saveFinalObservation({
				context: STORE_CONTEXT,
				observation: blankObservation(),
				totalMs: 100,
			}),
		{ reply: { ok: true, status: 204 } },
	);
	const [call] = calls;
	// 조건이 빠지면 표 전체를 덮어쓴다.
	if (
		!call.url.endsWith(
			"/rest/v1/generations?operation_id=eq.018f2b6a-1c2d-4e5f-8a9b-0c1d2e3f4a5b",
		)
	) {
		throw new Error(`URL이 다릅니다: ${call.url}`);
	}
	if (call.init.method !== "PATCH") throw new Error(call.init.method);
});

await checkAsync("시크릿은 apikey 헤더에만 실린다", async () => {
	// 새 형식(sb_secret_)의 키는 JWT가 아니다. Authorization은 사용자 JWT
	// 자리이므로 거기에 시크릿을 넣지 않는다. 실측으로도 apikey만으로 충분하다.
	const { calls } = await withFakeFetch(() =>
		savePendingObservation(STORE_CONTEXT),
	);
	const headers = calls[0].init.headers;
	if (headers.apikey !== FAKE_ENV.SUPABASE_SECRET_KEY) {
		throw new Error("apikey 헤더에 키가 없습니다");
	}
	if ("Authorization" in headers) {
		throw new Error("Authorization 헤더에 시크릿이 실렸습니다");
	}
	if (headers.Prefer !== "return=minimal") {
		throw new Error("저장한 행을 되돌려받고 있습니다");
	}
});

await checkAsync("타임아웃 신호를 붙여 보낸다", async () => {
	const { calls } = await withFakeFetch(() =>
		savePendingObservation(STORE_CONTEXT),
	);
	const { signal } = calls[0].init;
	if (!signal || typeof signal.aborted !== "boolean") {
		throw new Error(
			"AbortSignal이 없습니다 — 계측이 생성을 붙잡을 수 있습니다",
		);
	}
});

await checkAsync("HTTP 오류는 던지지 않고 로그만 남긴다", async () => {
	const { lines } = await withFakeFetch(
		() => savePendingObservation(STORE_CONTEXT),
		{ reply: { ok: false, status: 503 } },
	);
	if (lines.length !== 1) throw new Error(`로그가 ${lines.length}줄입니다`);
	const log = JSON.parse(lines[0]);
	if (log.event !== "generate-skill-persistence-error") {
		throw new Error(`이벤트가 ${log.event}입니다`);
	}
	if (log.reason !== "http_error" || log.status !== 503) {
		throw new Error(`분류가 틀립니다: ${log.reason}/${log.status}`);
	}
	if (log.stage !== "pending-insert") throw new Error(log.stage);
});

await checkAsync("연결 실패도 던지지 않는다", async () => {
	// 여기서 던지면 계측 장애가 스킬 생성을 막는다. fail-open이 깨지는 자리다.
	const { lines } = await withFakeFetch(
		() => savePendingObservation(STORE_CONTEXT),
		{ reply: new TypeError("fetch failed") },
	);
	const log = JSON.parse(lines[0]);
	if (log.reason !== "request_failed" || log.status !== null) {
		throw new Error(`분류가 틀립니다: ${log.reason}/${log.status}`);
	}
});

await checkAsync("오류 로그에 Supabase 응답 본문이 없다", async () => {
	const { lines } = await withFakeFetch(
		() => savePendingObservation(STORE_CONTEXT),
		{
			reply: {
				ok: false,
				status: 400,
				// 본문을 읽으면 이 표식이 로그로 새어 나갈 수 있다.
				text: async () => SECRET,
				json: async () => ({ message: SECRET }),
			},
		},
	);
	if (lines.join("").includes(SECRET)) {
		throw new Error("응답 본문이 로그에 담겼습니다");
	}
});

await checkAsync(
	"환경변수가 없으면 요청마다 operationId와 함께 남긴다",
	async () => {
		// 배포에서 변수를 빠뜨리면 모든 요청이 행 없이 사라진다. 그때 유실을 세는
		// 유일한 단서가 이 로그다.
		//
		// **프로세스마다 한 번만 찍으면 안 된다.** 사전등록의 유실률은 missing_row를
		// operation_id로 세는데, 한 줄만 남으면 수백 건이 사라져도 셀 수 있는 것이
		// 하나뿐이고 어느 요청이 첫 100건이었는지도 복원하지 못한다.
		const ids = [
			"018f2b6a-1c2d-4e5f-8a9b-0c1d2e3f4a01",
			"018f2b6a-1c2d-4e5f-8a9b-0c1d2e3f4a02",
		];
		const { calls, lines } = await withFakeFetch(
			async () => {
				for (const operationId of ids) {
					await savePendingObservation({ ...STORE_CONTEXT, operationId });
				}
			},
			{ env: {} },
		);
		if (calls.length !== 0) {
			throw new Error("설정이 없는데 요청을 보냈습니다");
		}
		if (lines.length !== ids.length) {
			throw new Error(
				`요청 ${ids.length}건에 로그가 ${lines.length}줄입니다 — 요청마다 한 줄이어야 합니다`,
			);
		}
		const logs = lines.map((line) => JSON.parse(line));
		for (const [index, log] of logs.entries()) {
			if (log.reason !== "not_configured") throw new Error(log.reason);
			if (log.stage !== "pending-insert") throw new Error(log.stage);
			if (log.operationId !== ids[index]) {
				throw new Error(`operationId가 ${log.operationId}입니다`);
			}
			// 첫 100건에 속하는지 사후에 가리려면 이 넷이 함께 있어야 한다.
			for (const key of ["startedAt", "kind", "configuredMode"]) {
				if (log[key] === null) throw new Error(`${key}가 비었습니다`);
			}
		}
	},
);

await checkAsync("최종 갱신도 설정이 없으면 그 요청을 남긴다", async () => {
	const { calls, lines } = await withFakeFetch(
		() =>
			saveFinalObservation({
				context: STORE_CONTEXT,
				observation: blankObservation(),
				totalMs: 1,
			}),
		{ env: {} },
	);
	if (calls.length !== 0) throw new Error("설정이 없는데 요청을 보냈습니다");
	if (lines.length !== 1) throw new Error(`로그가 ${lines.length}줄입니다`);
	const log = JSON.parse(lines[0]);
	if (log.stage !== "final-update" || log.reason !== "not_configured") {
		throw new Error(`${log.stage}/${log.reason}`);
	}
	if (log.operationId !== STORE_CONTEXT.operationId) {
		throw new Error("operationId가 보존되지 않았습니다");
	}
});

await checkAsync(
	"설정 누락 알림을 프로세스 단위로 억제하지 않는다",
	async () => {
		// 위 두 검사를 각각 통과해도, 모듈 수준 플래그가 있으면 「앞선 검사에서 이미
		// 찍었다」는 이유로 뒤 검사가 0줄이 될 수 있다. 순서를 바꿔도 매번 나오는지
		// 여기서 한 번 더 확인한다.
		for (let round = 0; round < 2; round += 1) {
			const { lines } = await withFakeFetch(
				() => savePendingObservation(STORE_CONTEXT),
				{ env: {} },
			);
			if (lines.length !== 1) {
				throw new Error(
					`${round + 1}번째 호출에서 로그가 ${lines.length}줄입니다`,
				);
			}
		}
	},
);

// ── 수명주기 배선 ────────────────────────────────────────────────────

check("pending 저장은 after()로 미루지 않는다", () => {
	// after()에 넣으면 하드 타임아웃 때 행이 남지 않아 목적이 사라진다.
	//
	// 주석을 먼저 걷어낸다. 이 파일의 주석에도 `after()`가 나오는데, 그것까지
	// 세면 코드가 옳아도 검사가 실패한다.
	if (!/await\s+savePendingObservation\(/.test(ROUTE_CODE)) {
		throw new Error("route.ts가 pending 저장을 기다리지 않습니다");
	}
	const afterBlock = ROUTE_CODE.slice(ROUTE_CODE.indexOf("after("));
	if (afterBlock.includes("savePendingObservation")) {
		throw new Error("pending 저장이 after() 안에 있습니다");
	}
});

check("최종 갱신은 after()로 보낸다", () => {
	if (!/after\(\s*\(\)\s*=>\s*\n?\s*saveFinalObservation/.test(ROUTE_CODE)) {
		throw new Error("최종 갱신이 after()에 없습니다");
	}
});

check("is_smoke를 요청에서 받지 않는다", () => {
	// 공개 엔드포인트다. body에서 받으면 아무나 표본을 조작할 수 있다.
	const context = ROUTE.slice(
		ROUTE.indexOf("isSmoke"),
		ROUTE.indexOf("isSmoke") + 40,
	);
	if (!context.includes("false")) {
		throw new Error("isSmoke가 고정값이 아닙니다");
	}
});

check("저장 타임아웃이 선택 deadline보다 짧다", () => {
	// 계측이 생성을 붙잡으면 fail-open의 뜻이 없어진다.
	if (PENDING_TIMEOUT_MS >= 10_000 || FINAL_TIMEOUT_MS >= 10_000) {
		throw new Error(
			`타임아웃이 깁니다: ${PENDING_TIMEOUT_MS}/${FINAL_TIMEOUT_MS}`,
		);
	}
});

if (failures.length) {
	console.error(`\nFAIL ${failures.length}건\n`);
	for (const one of failures) console.error(`  - ${one}`);
	process.exit(1);
}
console.log("\nOK  계측 회귀 시험 통과");
