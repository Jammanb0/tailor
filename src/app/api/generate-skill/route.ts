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

	const outcome = await runGeneration({
		client: new Anthropic({ apiKey }),
		request: validated.value,
		configuredMode: process.env.CORPUS_ROUTING_MODE,
	});
	return NextResponse.json(outcome.body, { status: outcome.status });
}
