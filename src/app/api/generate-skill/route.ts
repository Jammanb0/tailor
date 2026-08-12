import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
	type ReferenceSource,
	referenceCategories,
	type SkillArchetype,
	sourcesForArchetype,
	sourcesForUsedPatterns,
	structureArchetypes,
} from "@/data/reference-corpus";
import {
	advancedQuestions,
	languageQuestion,
	requiredQuestions,
	type WizardAnswers,
	type WizardQuestion,
} from "@/data/wizard-questions";

export const runtime = "nodejs";

const OUTPUT_FORMAT = `응답은 반드시 아래 형식만 출력하세요. 다른 설명은 붙이지 마세요.

<skill_md>과 <filename>은 사용자가 요청한 SKILL.md 언어를 따르세요. <review>와
<questions>는 이 사이트의 화면 언어인 한국어로, SKILL.md 언어와 무관하게
항상 한국어로만 작성하세요 — 이 둘은 사용자에게 보여주는 안내이지 완성된
스킬 파일의 일부가 아닙니다.

<skill_md>
(frontmatter를 포함한 SKILL.md 전체 내용)
</skill_md>
<review>
- (자체 점검하며 확인했거나 보완한 점을 짧게, 항목별로. 항상 한국어)
- 이미 완료된 점검/보완 결과만 적으세요. "아래 질문에 답변이 필요합니다",
  "이 부분은 사용자 확인이 필요합니다"처럼 사용자에게 추가 정보나 답변을
  요구하는 문장은 여기에 쓰지 마세요 — 그런 내용은 전부 <questions>로 옮기세요.
</review>
<questions>
(사용자에게 되물으면 더 정확해질 부분이 있다면, 한 줄에 하나씩 질문을 적으세요.
확신이 충분하다면 이 태그 안을 비워두세요. 최대 3개까지만 적으세요. 항상 한국어)
</questions>
<filename>
(name과 동일한 kebab-case 문자열, 확장자 없이)
</filename>
<archetype>
(채택한 문서 구조 골격 id 하나: discipline | workflow | reference | explanation)
</archetype>
<used_patterns>
(실제로 참고·반영한 패턴 id를 한 줄에 하나씩. 참고 안 했으면 비워둠)
</used_patterns>`;

const SYSTEM_PROMPT = `당신은 완전 초심자가 Claude Code Skill(SKILL.md)을 스스로 만들 수 있도록 돕는 전문가입니다.

SKILL.md는 아래 구조를 따르는 마크다운 파일입니다.

---
name: 스킬-이름-kebab-case
description: 이 스킬을 언제 사용해야 하는지 설명하는 한두 문장. Claude는 대화 중 이 description만 보고 스킬을 호출할지 판단하므로, 트리거 조건(어떤 요청·상황에서 쓰이는지)을 구체적으로 적어야 합니다.
---

# 스킬 제목

(실행 절차를 단계별로 명확하게 서술. 사용자가 답한 내용을 바탕으로 실제로 실행 가능한 구체적인 지시문으로 작성합니다.)

작업 순서:
1. 사용자가 답한 내용을 바탕으로 SKILL.md 초안을 작성합니다.
2. 초안을 스스로 검토합니다 — description의 트리거 조건이 충분히 구체적인지, 절차가 실제로 실행 가능한지, 사용자가 "알아서 해도 된다"고 한 부분과 "확인이 필요하다"고 한 부분이 본문에 명확히 구분돼 있는지, 사용자가 명시한 금지 사항이 반영됐는지 확인합니다.
3. 검토 결과를 반영해 다듬은 최종본을 작성합니다.

${OUTPUT_FORMAT}`;

const REFINE_SYSTEM_PROMPT = `당신은 완전 초심자가 Claude Code Skill(SKILL.md)을 스스로 만들 수 있도록 돕는 전문가입니다.

이번 요청은 새로 만드는 게 아니라, 이미 만들어둔 SKILL.md 초안을 사용자 피드백에 맞춰 다듬는 작업입니다.

작업 순서:
1. 기존 초안, 사용자가 추가로 답한 질문, 사용자가 직접 남긴 피드백을 모두 확인합니다.
2. 피드백을 반영해 초안을 고칩니다. 피드백과 관련 없는 부분은 임의로 바꾸지 않습니다.
3. 고친 결과를 스스로 검토합니다 — description의 트리거 조건이 충분히 구체적인지, 절차가 실제로 실행 가능한지, "알아서 해도 된다"고 한 부분과 "확인이 필요하다"고 한 부분이 명확히 구분돼 있는지 확인합니다.

${OUTPUT_FORMAT}`;

type AnsweredQuestion = { question: string; answer: string };
type Refinement = {
	previousSkillMarkdown: string;
	userFeedback: string;
	answeredQuestions: AnsweredQuestion[];
};

function formatAnswersForPrompt(
	answers: WizardAnswers,
	wantsAdvanced: boolean,
) {
	const questions: WizardQuestion[] = [
		...requiredQuestions,
		languageQuestion,
		...(wantsAdvanced ? advancedQuestions : []),
	];

	return questions
		.map((question) => {
			const value = answers[question.id];
			if (!value || (Array.isArray(value) && value.length === 0)) {
				return null;
			}
			const formatted = Array.isArray(value)
				? value
						.map(
							(v) => question.options?.find((o) => o.value === v)?.label ?? v,
						)
						.join(", ")
				: (question.options?.find((o) => o.value === value)?.label ?? value);
			return `- ${question.title}\n  ${formatted}`;
		})
		.filter((line): line is string => line !== null)
		.join("\n");
}

function formatRefinementForPrompt(refinement: Refinement) {
	const qa = refinement.answeredQuestions
		.filter((qa) => qa.answer.trim())
		.map((qa) => `- ${qa.question}\n  ${qa.answer}`)
		.join("\n");

	return [
		"기존 SKILL.md 초안:",
		refinement.previousSkillMarkdown,
		qa && `\nAI의 질문에 대한 사용자 답변:\n${qa}`,
		refinement.userFeedback.trim() &&
			`\n사용자가 직접 남긴 피드백:\n${refinement.userFeedback.trim()}`,
	]
		.filter(Boolean)
		.join("\n");
}

function extractTag(text: string, tag: string): string | null {
	const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
	return match ? match[1].trim() : null;
}

function extractListTag(text: string, tag: string): string[] {
	const block = extractTag(text, tag) ?? "";
	return block
		.split("\n")
		.map((line) => line.replace(/^[-*]\s*/, "").trim())
		.filter(Boolean);
}

// 참고 코퍼스를 프롬프트용 텍스트로 렌더한다(정적 — 매 요청 동일해 캐싱 가능).
function buildCorpusSection(): string {
	const archetypes = structureArchetypes
		.map(
			(a) =>
				`### ${a.id} — ${a.label}\n언제: ${a.whenToUse}\n골격:\n${a.sectionFlow}`,
		)
		.join("\n\n");
	const categories = referenceCategories
		.map((c) => {
			const patterns = c.patterns
				.map((p) => `- [${p.id}] (${p.role ?? "-"}) ${p.summary}: ${p.detail}`)
				.join("\n");
			return `## ${c.label}${c.alwaysApply ? " (공통·항상 적용)" : ""}\n${patterns}`;
		})
		.join("\n\n");
	return `참고 자료 — 아래는 공개 스킬(및 Tailor 자체)에서 정리한 "좋은 패턴"과 문서 구조 골격입니다.
사용자 상황에 맞는 것을 스스로 골라 흡수해 스킬을 만들되, 여기 없는 내용도 필요하면 채우세요.
대상은 완전 초심자입니다. 작업이 단순하면 구조도 단순하게 — 불필요하게 길거나 과한 섹션을
넣지 말고 필요한 만큼만 쓰세요. 규율형 골격은 지켜야 할 원칙이 핵심인 스킬에만 쓰세요.
반드시 지킬 것: 실제로 참고·반영한 패턴의 [id]와 채택한 구조 골격 id 하나를 출력 형식의
<used_patterns>·<archetype>에 보고하세요. 참고하지 않은 건 보고하지 마세요(정직).

# 문서 구조 골격 (하나 선택)
${archetypes}

# 좋은 패턴 (카테고리별)
${categories}`;
}

const CORPUS_SECTION = buildCorpusSection();

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

	const languageLabel = answers.language === "en" ? "영어" : "한국어";
	const summary = formatAnswersForPrompt(answers, wantsAdvanced);
	const client = new Anthropic({ apiKey });

	const userContent = refinement
		? `원래 사용자가 답한 내용:\n\n${summary}\n\n${formatRefinementForPrompt(refinement)}\n\n완성된 SKILL.md는 ${languageLabel}로 작성해주세요.`
		: `사용자가 답한 내용:\n\n${summary}\n\n완성된 SKILL.md는 ${languageLabel}로 작성해주세요.`;

	let text: string;
	try {
		const response = await client.messages.create({
			model: "claude-sonnet-5",
			max_tokens: 8192,
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
	const archetypeId = extractTag(text, "archetype")?.trim();
	const usedPatternIds = extractListTag(text, "used_patterns");
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
