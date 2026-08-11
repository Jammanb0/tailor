import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
	advancedQuestions,
	languageQuestion,
	requiredQuestions,
	type WizardAnswers,
	type WizardQuestion,
} from "@/data/wizard-questions";

export const runtime = "nodejs";

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

응답은 반드시 아래 형식만 출력하세요. 다른 설명은 붙이지 마세요.

<skill_md>
(frontmatter를 포함한 SKILL.md 전체 내용)
</skill_md>
<review>
- (자체 점검하며 확인했거나 보완한 점을 짧게, 항목별로)
</review>
<filename>
(name과 동일한 kebab-case 문자열, 확장자 없이)
</filename>`;

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

function extractTag(text: string, tag: string): string | null {
	const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
	return match ? match[1].trim() : null;
}

export async function POST(request: Request) {
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		return NextResponse.json(
			{ error: "서버에 Claude API 키가 설정되어 있지 않아요." },
			{ status: 500 },
		);
	}

	let body: { answers?: WizardAnswers; wantsAdvanced?: boolean };
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

	if (!answers.situation || !answers.costPreference || !answers.language) {
		return NextResponse.json(
			{ error: "필수 질문에 답하지 않은 항목이 있어요." },
			{ status: 400 },
		);
	}

	const languageLabel = answers.language === "en" ? "영어" : "한국어";
	const summary = formatAnswersForPrompt(answers, wantsAdvanced);
	const client = new Anthropic({ apiKey });

	let text: string;
	try {
		const response = await client.messages.create({
			model: "claude-sonnet-5",
			max_tokens: 4096,
			system: SYSTEM_PROMPT,
			messages: [
				{
					role: "user",
					content: `사용자가 답한 내용:\n\n${summary}\n\n완성된 SKILL.md는 ${languageLabel}로 작성해주세요.`,
				},
			],
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

	const reviewBlock = extractTag(text, "review") ?? "";
	const reviewNotes = reviewBlock
		.split("\n")
		.map((line) => line.replace(/^[-*]\s*/, "").trim())
		.filter(Boolean);

	const filename = extractTag(text, "filename")?.trim() || "my-skill";

	return NextResponse.json({
		skillMarkdown,
		reviewNotes,
		suggestedFilename: filename,
	});
}
