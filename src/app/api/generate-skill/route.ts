import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
	type ReferenceSource,
	type SkillArchetype,
	sourcesForArchetype,
	sourcesForUsedPatterns,
} from "@/data/reference-corpus";
import type { WizardAnswers } from "@/data/wizard-questions";
import {
	buildUserContent,
	CORPUS_SECTION,
	extractArchetypeId,
	extractListTag,
	extractTag,
	extractUsedPatternIds,
	REFINE_SYSTEM_PROMPT,
	type Refinement,
	SYSTEM_PROMPT,
} from "./prompt";

export const runtime = "nodejs";

// 생성 모델. A/B 비교 중에는 이 값과 thinking 설정을 함께 맞춰야 공정한 비교가 된다.
const GENERATION_MODEL = "claude-sonnet-5";

function toLiteSource(source: ReferenceSource) {
	return {
		name: source.name,
		author: source.author,
		url: source.url,
		license: source.license,
		self: source.self ?? false,
	};
}

export async function POST(request: Request) {
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		return NextResponse.json(
			{ error: "서버에 Claude API 키가 설정되어 있지 않아요." },
			{ status: 500 },
		);
	}

	let body: {
		answers?: WizardAnswers;
		wantsAdvanced?: boolean;
		refinement?: Refinement;
	};
	try {
		body = await request.json();
	} catch {
		return NextResponse.json(
			{ error: "요청 형식이 올바르지 않아요." },
			{ status: 400 },
		);
	}

	const answers = body.answers ?? {};
	const wantsAdvanced = Boolean(body.wantsAdvanced);
	// previousSkillMarkdown이 있는 요청만 진짜 정제 요청으로 취급 — 잘못
	// 전달된 값(예: 이벤트 객체) 때문에 answeredQuestions가 없는 상태로
	// 아래 로직을 타는 것을 방지.
	const refinement =
		body.refinement && Array.isArray(body.refinement.answeredQuestions)
			? body.refinement
			: undefined;

	if (!answers.situation || !answers.costPreference || !answers.language) {
		return NextResponse.json(
			{ error: "필수 질문에 답하지 않은 항목이 있어요." },
			{ status: 400 },
		);
	}

	const client = new Anthropic({ apiKey });
	const userContent = buildUserContent(answers, wantsAdvanced, refinement);

	let text: string;
	try {
		const response = await client.messages.create({
			model: GENERATION_MODEL,
			max_tokens: 8192,
			// Sonnet 5는 이 필드를 생략하면 adaptive thinking이 켜지고, thinking
			// 토큰이 max_tokens를 함께 잡아먹어 <skill_md>가 잘린다. 명시적으로 끈다.
			thinking: { type: "disabled" },
			system: [
				{
					type: "text",
					text: CORPUS_SECTION,
					cache_control: { type: "ephemeral" },
				},
				{
					type: "text",
					text: refinement ? REFINE_SYSTEM_PROMPT : SYSTEM_PROMPT,
				},
			],
			messages: [{ role: "user", content: userContent }],
		});
		text = response.content
			.filter((block) => block.type === "text")
			.map((block) => block.text)
			.join("");
	} catch (error) {
		console.error("skill generation request failed", error);
		return NextResponse.json(
			{
				error: "스킬을 생성하는 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.",
			},
			{ status: 502 },
		);
	}

	const skillMarkdown = extractTag(text, "skill_md");
	if (!skillMarkdown) {
		console.error("skill generation response missing <skill_md>", text);
		return NextResponse.json(
			{ error: "생성 결과를 이해할 수 없었어요. 다시 시도해주세요." },
			{ status: 502 },
		);
	}

	const reviewNotes = extractListTag(text, "review");
	const clarifyingQuestions = extractListTag(text, "questions");
	const filename = extractTag(text, "filename")?.trim() || "my-skill";

	// 이번 생성에 AI가 실제로 참고했다고 보고한 것만 출처로 표기(정직).
	const archetypeId = extractArchetypeId(text);
	const usedPatternIds = extractUsedPatternIds(text);
	const referencedSources =
		sourcesForUsedPatterns(usedPatternIds).map(toLiteSource);
	const structureSources = archetypeId
		? sourcesForArchetype(archetypeId as SkillArchetype).map(toLiteSource)
		: [];

	return NextResponse.json({
		skillMarkdown,
		reviewNotes,
		clarifyingQuestions,
		suggestedFilename: filename,
		referencedSources,
		structureSources,
	});
}
