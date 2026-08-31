import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { after, NextResponse } from "next/server";
import { generationErrorOutcome, runGeneration } from "./generate";
import type { ObservationContext } from "./observation";
import {
	saveFinalObservation,
	savePendingObservation,
} from "./observation-store";
import { readValidatedRequest } from "./request-validation";
import { readCorpusRoutingMode } from "./routing-policy";

export const runtime = "nodejs";

/**
 * 스킬 생성 요청.
 *
 * 이 파일은 요청을 받아 검사하고, 클라이언트를 만들어 넘기고, 결과를 응답으로
 * 바꾸고, 계측의 수명주기를 잡는 일만 한다. 실제 흐름은 `generate.ts`, 입력
 * 상한은 `request-validation.ts`, 오류 분류는 `upstream-error.ts`, 저장할 값을
 * 고르는 일은 `observation.ts`에 있다.
 *
 * 실패 응답은 언제나 고정된 `errorCode`와 `retryable`을 함께 내려준다.
 * 클라이언트가 문구를 읽어 분기하지 않게 하기 위해서다.
 *
 * 계측을 여기서 잡는 이유는 응답 수명주기를 아는 곳이 여기뿐이기 때문이다.
 * 저장 자체는 `observation-store.ts`가 맡아 이 파일이 무거워지지 않는다.
 */
export async function POST(request: Request) {
	const startedAtMs = Date.now();
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		// 키가 없는 것은 서버 설정 문제다. 사용자가 다시 눌러도 풀리지 않는다.
		const outcome = generationErrorOutcome({
			code: "authentication_unavailable",
		});
		return NextResponse.json(outcome.body, { status: outcome.status });
	}

	const validated = await readValidatedRequest(request);
	if (!validated.ok) {
		// 검사에서 막힌 요청은 계측 행을 만들지 않는다. 생성 경로에 들어가지
		// 않았으므로 관찰 대상 100건 밖이다(사전등록 「제외하는 것」).
		const outcome = generationErrorOutcome({ code: validated.code });
		return NextResponse.json(outcome.body, { status: outcome.status });
	}

	const context: ObservationContext = {
		operationId: randomUUID(),
		// 요청 시작 시각을 우리가 만든다. DB의 default now()를 쓰면 저장 지연만큼
		// 로그와 어긋나 유실 대조가 맞지 않는다.
		startedAt: new Date(startedAtMs).toISOString(),
		kind: validated.value.refinement === undefined ? "create" : "refine",
		configuredMode: readCorpusRoutingMode(process.env.CORPUS_ROUTING_MODE),
		deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
		// smoke는 요청에서 받지 않는다. 공개 엔드포인트라 아무나 붙일 수 있어
		// 표본을 조작할 수 있다. smoke로 돌린 operationId를 사전등록 문서에
		// 수동으로 적어 사후에 뺀다.
		isSmoke: false,
	};

	// **이 저장만 응답을 기다린다.** 하드 타임아웃으로 함수가 끊길 때 남아 있어야
	// 할 행이라 after()로 미룰 수 없다. 실패해도 던지지 않는다(fail-open).
	await savePendingObservation(context);

	const result = await runGeneration({
		client: new Anthropic({ apiKey }),
		request: validated.value,
		configuredMode: process.env.CORPUS_ROUTING_MODE,
		operationId: context.operationId,
	});

	// 최종 갱신은 응답을 막지 않는다. 대신 저장을 보장하지도 않는다 — 함수 실행
	// 예산을 응답과 나눠 쓰므로 하드 타임아웃에서는 통째로 날아간다. 그때 행은
	// pending으로 남고, 그 상태가 곧 「끝을 못 본 요청」의 표시가 된다.
	// **응답 직전에 값을 고정한다.** 콜백 안에서 재면 after()가 실제로 실행된
	// 시각까지 들어가, 사용자가 기다린 시간이 아니라 플랫폼이 콜백을 언제
	// 돌렸는지가 섞인다. 시간 판정선이 total_ms 중앙값에 걸려 있으므로 그 오차는
	// 그대로 판정을 밀어 올린다.
	const totalMs = Date.now() - startedAtMs;

	after(() =>
		saveFinalObservation({
			context,
			observation: result.observation,
			totalMs,
		}),
	);

	// 응답에는 outcome만 나간다. observation은 여기서 끝난다.
	return NextResponse.json(result.outcome.body, {
		status: result.outcome.status,
	});
}
