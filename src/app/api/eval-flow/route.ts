// flow 필드 A/B 생성기 (개발 전용, 프로덕션 경로 아님).
//
// POST /api/eval-flow  { "situation": "...", "corpus": "on" | "off" }
//   → 생성물 1건. 반복·동시 실행·저장은 호출하는 쪽(run.mjs)이 맡는다.
//
// 왜 라우트를 새로 두나: eval-ab는 모델·effort를 가르는 하네스라 코퍼스 갈래가
// 없고, /api/generate-skill은 프로덕션 경로라 실험용 분기를 넣지 않는다.
// 대신 프롬프트는 generate-skill/prompt.ts를 그대로 import한다 — 여기서 복제하면
// 앱과 조용히 갈라져 비교 자체가 무의미해진다(eval-ab 머리 주석과 같은 이유).
//
// 두 조건의 유일한 차이는 시스템 프롬프트 첫 블록이 CORPUS_SECTION이냐
// CORPUS_SECTION_NO_FLOW냐 하나뿐이다. 나머지 인자는 generate-skill/route.ts와
// 동일하게 맞춘다 — 모델 sonnet-5, thinking 끔, effort 안 넘김.
//
// 판정이 끝나면 이 라우트는 CORPUS_SECTION_NO_FLOW와 함께 지운다.

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { WizardAnswers } from "@/data/wizard-questions";
import {
	buildUserContent,
	CORPUS_SECTION,
	CORPUS_SECTION_NO_FLOW,
	extractArchetypeId,
	extractListTag,
	extractTag,
	extractUsedPatternIds,
	SYSTEM_PROMPT,
} from "../generate-skill/prompt";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = "claude-sonnet-5";
// 상한일 뿐 과금 대상이 아니다. 잘림이 조건 차이로 오인되지 않게 넉넉히 잡는다.
const MAX_TOKENS = 16000;

// 100만 토큰당 USD. 2026-08 Sonnet 5 프로모 단가. 캐시 읽기 0.1배, 쓰기 1.25배.
const PRICE = { in: 2, out: 10 };

function costOf(u: Anthropic.Usage): number {
	return (
		(u.input_tokens * PRICE.in +
			(u.cache_read_input_tokens ?? 0) * PRICE.in * 0.1 +
			(u.cache_creation_input_tokens ?? 0) * PRICE.in * 1.25 +
			u.output_tokens * PRICE.out) /
		1_000_000
	);
}

export async function POST(request: Request) {
	if (process.env.NODE_ENV === "production") {
		return new Response("not found", { status: 404 });
	}
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		return NextResponse.json({ error: "no api key" }, { status: 500 });
	}

	const body = await request.json();
	const situation = String(body?.situation ?? "");
	const corpus = body?.corpus === "off" ? "off" : "on";
	if (!situation) {
		return NextResponse.json({ error: "no situation" }, { status: 400 });
	}

	const answers: WizardAnswers = { tool: "cli", situation, language: "ko" };
	const client = new Anthropic({ apiKey });
	const startedAt = Date.now();

	let text = "";
	let usage: Anthropic.Usage | null = null;
	let error: string | null = null;
	try {
		const response = await client.messages.create({
			model: MODEL,
			max_tokens: MAX_TOKENS,
			thinking: { type: "disabled" },
			system: [
				{
					type: "text",
					text: corpus === "off" ? CORPUS_SECTION_NO_FLOW : CORPUS_SECTION,
					cache_control: { type: "ephemeral" },
				},
				{ type: "text", text: SYSTEM_PROMPT },
			],
			messages: [{ role: "user", content: buildUserContent(answers, false) }],
		});
		text = response.content
			.filter((b) => b.type === "text")
			.map((b) => b.text)
			.join("");
		usage = response.usage;
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	}

	return NextResponse.json({
		corpus,
		error,
		elapsedMs: Date.now() - startedAt,
		costUsd: usage ? costOf(usage) : null,
		skillMarkdown: extractTag(text, "skill_md"),
		review: extractListTag(text, "review"),
		questions: extractListTag(text, "questions"),
		archetype: extractArchetypeId(text),
		usedPatterns: extractUsedPatternIds(text),
	});
}
