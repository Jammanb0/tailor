// 관측값 회귀 시험.
//
// `runGeneration`은 응답(outcome)과 관측값(observation)을 형으로 갈라 돌려준다.
// 확인하는 것 셋이다.
//
//   1. 어느 경로로 끝나든 관측값이 만들어지고, 그 경로가 실제로 어떻게
//      끝났는지(부른 모델, 상태, 오류 코드)를 맞게 담는가
//   2. 관측값에 사용자 원문이 섞이지 않는가
//   3. 관측값이 응답 body로 새지 않는가
//
// 처음에는 이 값을 Supabase에 저장했고 저장 행 검사도 여기 있었다. 저장은
// 2026-11-22에 끝냈다. 경위는
// `docs/experiments/data/2026-08-31-routed-operations/NOTES.md`에 있다.
//
// 실제 Anthropic 호출은 하지 않는다. 클라이언트를 가짜로 만들어 모든 분기를
// 강제로 통과시킨다. 비용이 들지 않는다.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { APIError } from "@anthropic-ai/sdk";
import { runGeneration } from "../src/app/api/generate-skill/generate.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
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

// ── 1·2. 모든 경로가 관측값을 만드는가 ───────────────────────────────

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

function runFull(client) {
	return runGeneration({
		client,
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
}

for (const path of PATHS) {
	await checkAsync(`${path.name} 경로가 관측값을 만든다`, async () => {
		const result = await runFull(path.client);
		if (!result.observation) throw new Error("observation이 없습니다");
		for (const [key, want] of Object.entries(path.expect)) {
			if (result.observation[key] !== want) {
				throw new Error(
					`${key}가 ${want}가 아니라 ${result.observation[key]}입니다`,
				);
			}
		}
	});

	await checkAsync(
		`${path.name} 경로의 관측값에 사용자 원문이 없다`,
		async () => {
			const result = await runFull(path.client);
			if (JSON.stringify(result.observation).includes(SECRET)) {
				throw new Error("표식이 관측값에 남았습니다");
			}
		},
	);
}

// ── 선택 단계에서 중단된 요청 ────────────────────────────────────────
//
// 429·결제·인증이면 Sonnet을 부르지 않고 끝낸다. 이 경로가 「부른 것처럼」
// 기록되면 넣지도 않은 코퍼스 크기와 하지도 않은 호출의 usage가 남는다.

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
	},
);

// ── 3. 관측값은 응답으로 나가지 않는다 ───────────────────────────────

await checkAsync("관측값이 응답 body로 새지 않는다", async () => {
	const result = await runFull(fakeClient(SKILL_REPLY));
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

check("route.ts는 outcome만 응답한다", () => {
	if (!ROUTE_CODE.includes("NextResponse.json(result.outcome.body")) {
		throw new Error("성공 경로가 outcome.body를 응답하지 않습니다");
	}
	if (/NextResponse\.json\(\s*result\.observation/.test(ROUTE_CODE)) {
		throw new Error("관측값을 응답으로 내보냅니다");
	}
});

check("route.ts에 Supabase 저장이 남아 있지 않다", () => {
	for (const gone of [
		"SUPABASE_",
		"observation-store",
		"savePendingObservation",
		"saveFinalObservation",
		"after(",
	]) {
		if (ROUTE_CODE.includes(gone)) {
			throw new Error(`${gone}가 남아 있습니다`);
		}
	}
});

if (failures.length) {
	console.error(`\nFAIL ${failures.length}건\n`);
	for (const one of failures) console.error(`  - ${one}`);
	process.exit(1);
}
console.log("\nOK  관측값 회귀 시험 통과");
