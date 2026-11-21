import { randomUUID } from "node:crypto";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { generationErrorOutcome, runGeneration } from "./generate";
import { readValidatedRequest } from "./request-validation";

export const runtime = "nodejs";

/**
 * 스킬 생성 요청.
 *
 * 이 파일은 요청을 받아 검사하고, 클라이언트를 만들어 넘기고, 결과를 응답으로
 * 바꾸는 일만 한다. 실제 흐름은 `generate.ts`, 입력 상한은
 * `request-validation.ts`, 오류 분류는 `upstream-error.ts`에 있다.
 *
 * 실패 응답은 언제나 고정된 `errorCode`와 `retryable`을 함께 내려준다.
 * 클라이언트가 문구를 읽어 분기하지 않게 하기 위해서다.
 *
 * Supabase 운영 계측 저장은 2026-11-22에 끝냈다. 경위는
 * `docs/experiments/data/2026-08-31-routed-operations/NOTES.md`에 있다.
 */
export async function POST(request: Request) {
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
		const outcome = generationErrorOutcome({ code: validated.code });
		return NextResponse.json(outcome.body, { status: outcome.status });
	}

	const result = await runGeneration({
		client: new Anthropic({ apiKey }),
		request: validated.value,
		configuredMode: process.env.CORPUS_ROUTING_MODE,
		// 한 요청의 선택·생성·오류 로그를 Vercel 로그에서 잇는 값이다.
		operationId: randomUUID(),
	});

	// 응답에는 outcome만 나간다. `result.observation`은 응답과 형을 갈라 둔
	// 관측값이라 여기서 내보내지 않는다.
	return NextResponse.json(result.outcome.body, {
		status: result.outcome.status,
	});
}
