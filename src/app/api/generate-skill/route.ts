import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
	type AttributedSource,
	type SkillArchetype,
	sourcesForArchetype,
	sourcesForUsedPatterns,
} from "@/data/reference-corpus";
import type { WizardAnswers } from "@/data/wizard-questions";
import {
	type AnsweredQuestion,
	buildUserContent,
	CORPUS_SECTION,
	extractArchetypeId,
	extractListTag,
	extractTag,
	extractUsedPatternIds,
	MAX_CLARIFYING_QUESTIONS,
	REFINE_SYSTEM_PROMPT,
	type Refinement,
	SYSTEM_PROMPT,
} from "./prompt";

export const runtime = "nodejs";

// 생성 모델. A/B 비교 중에는 이 값과 thinking 설정을 함께 맞춰야 공정한 비교가 된다.
const GENERATION_MODEL = "claude-sonnet-5";

function toLiteSource(source: AttributedSource) {
	return {
		name: source.name,
		author: source.author,
		url: source.url,
		license: source.license,
		self: source.self ?? false,
		// 원문을 번역·재해석해 담은 패턴에서 온 출처. 화면에 "Tailor 가공"으로 붙는다.
		adapted: source.adapted ?? false,
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
		clarifications?: AnsweredQuestion[];
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

	if (!answers.situation || !answers.language) {
		return NextResponse.json(
			{ error: "필수 질문에 답하지 않은 항목이 있어요." },
			{ status: 400 },
		);
	}

	// 모델이 "정보가 부족하다"며 되물은 것에 대한 사용자 답변(누적).
	const clarifications = Array.isArray(body.clarifications)
		? body.clarifications.filter(
				(item) =>
					typeof item?.question === "string" &&
					typeof item?.answer === "string",
			)
		: undefined;

	const client = new Anthropic({ apiKey });
	const userContent = buildUserContent(
		answers,
		wantsAdvanced,
		refinement,
		clarifications,
	);

	let text: string;
	try {
		const startedAt = Date.now();
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
		// 코퍼스 라우팅 전환 전의 기준값을 남기기 위한 한 줄. 생성 결과에는
		// 영향을 주지 않고 서버 로그에만 찍는다. 사용자가 쓴 글은 담지 않는다.
		// 전환 뒤 같은 시나리오를 돌려 이 값과 비교한다.
		console.log(
			JSON.stringify({
				event: "generate-skill",
				kind: refinement ? "refine" : "create",
				model: GENERATION_MODEL,
				ms: Date.now() - startedAt,
				stopReason: response.stop_reason,
				usage: response.usage,
			}),
		);
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
	const reviewNotes = extractListTag(text, "review");
	// 프롬프트로 최대 3개를 걸어두지만 모델이 넘겨 보내는 일이 있다 — 실제로
	// 같은 질문을 문장만 바꿔 두 번 적고 4개를 낸 응답이 있었다. 사용자는 같은
	// 것에 두 번 답하게 되므로 여기서 잘라 상한을 지킨다.
	const clarifyingQuestions = extractListTag(text, "questions").slice(
		0,
		MAX_CLARIFYING_QUESTIONS,
	);

	if (!skillMarkdown) {
		// 입력이 부실하면 모델은 <skill_md>를 비우고 <questions>로 되묻는다.
		// 이건 실패가 아니라 정당한 요구다 — 에러로 뭉개면 모델이 만든 되물음이
		// 그대로 버려지고 사용자는 같은 입력으로 재시도하는 것 말고 할 게 없다.
		if (clarifyingQuestions.length > 0) {
			return NextResponse.json({
				needsMoreInfo: true,
				clarifyingQuestions,
				reviewNotes,
			});
		}
		// 되물음조차 없으면 진짜 형식 파손이다.
		console.error("skill generation response missing <skill_md>", text);
		return NextResponse.json(
			{ error: "생성 결과를 이해할 수 없었어요. 다시 시도해주세요." },
			{ status: 502 },
		);
	}

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
