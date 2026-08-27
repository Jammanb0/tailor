// 생성 프롬프트 조립·응답 파싱 전담 모듈.
// route.ts(HTTP 계층)와 모델 A/B 평가 스크립트가 "완전히 동일한" 프롬프트를
// 쓰도록 하기 위해 분리했다. 여기서 갈라지면 비교 자체가 무의미해진다.

import {
	commonSpine,
	type FlowStep,
	getSourceById,
	type ReferencePattern,
	referenceCategories,
	structureArchetypes,
} from "@/data/reference-corpus";
import {
	advancedQuestions,
	languageQuestion,
	requiredQuestions,
	type WizardAnswers,
	type WizardQuestion,
} from "@/data/wizard-questions";

export type AnsweredQuestion = { question: string; answer: string };

export type Refinement = {
	previousSkillMarkdown: string;
	userFeedback: string;
	answeredQuestions: AnsweredQuestion[];
};

/** 되물음 상한. 프롬프트 지시와 응답 자르기가 같은 값을 쓰도록 한 곳에 둔다. */
export const MAX_CLARIFYING_QUESTIONS = 3;

const INSUFFICIENT_INPUT_RULE = `사용자가 답한 내용이 너무 부실해서 의미 있는 SKILL.md를 도저히 쓸 수 없다면,
지어내지 말고 <skill_md>를 비운 채 무엇이 더 필요한지를 <questions>에 적으세요.
단 이건 예외적인 경우입니다 — 웬만하면 주어진 내용으로 만들고, 더 정확해질
여지만 있는 정도라면 완성본을 낸 뒤 <questions>로 물으세요.`;

const OUTPUT_FORMAT = `${INSUFFICIENT_INPUT_RULE}

응답은 반드시 아래 형식만 출력하세요. 다른 설명은 붙이지 마세요.

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
확신이 충분하다면 이 태그 안을 비워두세요. 최대 ${MAX_CLARIFYING_QUESTIONS}개까지만
적으세요. 항상 한국어.
한 줄에 질문 하나를 완결해서 쓰세요 — 물어볼 내용과 보기를 두 줄로 나누거나,
같은 것을 문장만 바꿔 다시 묻지 마세요. 줄마다 별개 질문으로 취급되어 사용자가
같은 질문에 두 번 답하게 됩니다.)
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

export const SYSTEM_PROMPT = `당신은 사용자가 자기 상황에 맞는 Claude Code Skill(SKILL.md)을 만들도록 돕는 전문가입니다.
사용자는 Claude Code를 처음 접한 사람일 수도, 이미 익숙한 사람일 수도 있습니다.

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

export const REFINE_SYSTEM_PROMPT = `당신은 사용자가 자기 상황에 맞는 Claude Code Skill(SKILL.md)을 만들도록 돕는 전문가입니다.
사용자는 Claude Code를 처음 접한 사람일 수도, 이미 익숙한 사람일 수도 있습니다.

이번 요청은 새로 만드는 게 아니라, 이미 만들어둔 SKILL.md 초안을 사용자 피드백에 맞춰 다듬는 작업입니다.

작업 순서:
1. 기존 초안, 사용자가 추가로 답한 질문, 사용자가 직접 남긴 피드백을 모두 확인합니다.
2. 피드백을 반영해 초안을 고칩니다. 피드백과 관련 없는 부분은 임의로 바꾸지 않습니다.
3. 고친 결과를 스스로 검토합니다 — description의 트리거 조건이 충분히 구체적인지, 절차가 실제로 실행 가능한지, "알아서 해도 된다"고 한 부분과 "확인이 필요하다"고 한 부분이 명확히 구분돼 있는지 확인합니다.

${OUTPUT_FORMAT}`;

export function formatAnswersForPrompt(
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

export function formatRefinementForPrompt(refinement: Refinement) {
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

// 직전 시도에서 모델이 "정보가 부족하다"며 되물은 것에 대한 사용자 답변.
// 정제(refinement)와는 다르다 — 그쪽은 이미 초안이 있고 이쪽은 아직 없다.
export function formatClarificationsForPrompt(
	clarifications: AnsweredQuestion[],
) {
	const qa = clarifications
		.filter((item) => item.answer.trim())
		.map((item) => `- ${item.question}\n  ${item.answer.trim()}`)
		.join("\n");
	if (!qa) return "";
	return `직전 시도에서 정보가 부족하다며 되물었고, 사용자가 이렇게 답했습니다:\n${qa}`;
}

// 사용자 메시지 본문. 신규 생성과 정제 요청이 같은 형태를 공유한다.
export function buildUserContent(
	answers: WizardAnswers,
	wantsAdvanced: boolean,
	refinement?: Refinement,
	clarifications?: AnsweredQuestion[],
) {
	const languageLabel = answers.language === "en" ? "영어" : "한국어";
	const summary = formatAnswersForPrompt(answers, wantsAdvanced);
	const clarificationBlock = clarifications?.length
		? formatClarificationsForPrompt(clarifications)
		: "";

	return [
		refinement ? "원래 사용자가 답한 내용:" : "사용자가 답한 내용:",
		`\n${summary}`,
		clarificationBlock && `\n${clarificationBlock}`,
		refinement && `\n${formatRefinementForPrompt(refinement)}`,
		`\n완성된 SKILL.md는 ${languageLabel}로 작성해주세요.`,
	]
		.filter(Boolean)
		.join("\n");
}

// 여는 태그는 **줄 머리에 있는 것만** 진짜로 본다.
//
// 모델이 검토 메모 안에서 태그 이름을 산문으로 언급하는 일이 있다 — 실제로
// "실제 사용 시 다를 수 있어 <questions>에 확인을 요청했습니다"라고 쓴 응답이
// 있었다. 줄 머리 조건이 없으면 파서가 **그 문장 속 태그**를 여는 자리로 잡아,
// 되물음 목록의 첫 항목이 "에 확인을 요청했습니다."가 되고 그 뒤로 `</review>`와
// `<questions>`가 항목으로 딸려 들어온다. 화면에 그대로 노출됐다.
// (2,588건 중 4건. 재현율은 낮지만 나오면 눈에 띈다.)
//
// 출력 형식이 태그를 각자의 줄에 두게 지시하므로 줄 머리 조건은 안전하다.
// 그래도 형식이 흔들린 응답에서 통째로 놓치지는 않도록, 못 찾으면 종전 방식으로
// 한 번 더 찾는다.
export function extractTag(text: string, tag: string): string | null {
	const atLineStart = text.match(
		new RegExp(`^[ \\t]*<${tag}>([\\s\\S]*?)</${tag}>`, "m"),
	);
	const match =
		atLineStart ?? text.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
	if (match) return match[1].trim();
	return extractUnclosedTag(text, tag);
}

/** 출력 형식의 최상위 태그. 닫는 태그가 없는 블록은 이 중 하나에서 끊는다. */
const TOP_LEVEL_TAGS =
	"skill_md|review|questions|filename|archetype|used_patterns";

// 닫는 태그가 없을 때의 되돌림 경로.
//
// 모델이 <skill_md>를 열고 문서를 끝까지 다 쓴 뒤 </skill_md>를 닫지 않고 끝낸
// 응답이 있었다(2026-08-27 측정, 3회 중 1회. stop_reason이 end_turn이었으므로
// 길이에 잘린 것이 아니다). 짝이 맞아야만 본문을 꺼내던 탓에 다 쓴 문서를
// 통째로 버리고 502를 냈다.
//
// **여는 태그가 줄 머리에 있을 때만** 인정한다. 이 조건이 a0a5c9b에서 고친
// 결함 — 산문 속 태그 언급에 파서가 열리는 것 — 을 되살리지 않는 유일한
// 장치다. 그 사례는 줄 가운데 있었으므로 여기서 걸러진다. 위 extractTag의 두
// 번째 되돌림(아무 자리나 찾기)에는 이 경로를 붙이지 않는다.
//
// 끝은 다음 최상위 태그가 나오는 줄 머리, 없으면 문서 끝이다. 아무 `<...>`나
// 경계로 잡으면 SKILL.md 본문의 코드 블록에서 멈춘다.
function extractUnclosedTag(text: string, tag: string): string | null {
	const opened = text.match(new RegExp(`^[ \\t]*<${tag}>[ \\t]*\\n?`, "m"));
	if (!opened || opened.index === undefined) return null;

	const rest = text.slice(opened.index + opened[0].length).split("\n");
	const boundary = new RegExp(`^[ \\t]*</?(?:${TOP_LEVEL_TAGS})>`);
	const end = rest.findIndex((line) => boundary.test(line));
	const body = (end < 0 ? rest : rest.slice(0, end)).join("\n").trim();
	return body || null;
}

/** 태그 하나만 있는 줄 — 잘라낸 블록에 섞여 들어온 잔해다. */
const TAG_ONLY_LINE = /^<\/?[a-z_][a-z0-9_]*>$/;

export function extractListTag(text: string, tag: string): string[] {
	const block = extractTag(text, tag) ?? "";
	return block
		.split("\n")
		.map((line) => line.replace(/^[-*]\s*/, "").trim())
		.filter(Boolean)
		.filter((line) => !TAG_ONLY_LINE.test(line));
}

// 모델이 id를 어떻게 감싸 보고하든 순수 id만 남긴다.
// 코퍼스를 `- [id] (role) summary` 형태로 렌더하다 보니, 모델에 따라
// 대괄호를 그대로 달거나(`[verify-before-done]`) 뒤에 설명을 붙여
// (`[verify-before-done] 커밋 전에 diff 확인`) 보고한다. 문자열 완전일치로
// 출처를 찾으면 이런 응답에서 출처 표기가 통째로 사라지므로 여기서 정규화한다.
// id는 kebab-case(`verify-before-done`)이므로 하이픈은 구분자가 아니다.
// 감싸개(대괄호·따옴표·백틱)를 벗긴 뒤 첫 kebab-case 토큰만 취한다.
function normalizeId(raw: string): string {
	const unwrapped = raw
		.trim()
		.replace(/^[-*\s]+/, "")
		.replace(/^[`"'[\s]+/, "");
	return unwrapped.match(/^[a-z0-9]+(?:-[a-z0-9]+)*/)?.[0] ?? "";
}

// 이번 생성에서 모델이 참고했다고 보고한 패턴 id 목록.
export function extractUsedPatternIds(text: string): string[] {
	const ids = extractListTag(text, "used_patterns")
		.map(normalizeId)
		.filter(Boolean);
	return [...new Set(ids)];
}

// 채택한 구조 골격 id. 없거나 형식이 깨졌으면 null.
export function extractArchetypeId(text: string): string | null {
	const raw = extractTag(text, "archetype");
	if (!raw) return null;
	return normalizeId(raw) || null;
}

// 패턴 한 항목을 프롬프트 줄로 렌더한다.
//
// 첫 줄은 예전과 동일한 `- [id] (role) summary: detail`이고, 구조화된 칸
// (format/options/examples/exception)은 **값이 있을 때만** 들여쓴 하위 줄로 붙는다.
// 따라서 칸을 비워둔 패턴의 렌더 결과는 스키마 도입 전과 바이트 단위로 같다 —
// 진행 중인 실험의 대조군을 지키기 위한 조건이다(tools/check-corpus-render.mjs).
//
// 순서를 고정하는 이유: 순서가 흔들리면 프롬프트 캐시가 깨지고 before 자료와의
// 비교도 무효가 되는데, 둘 다 조용히 일어난다.
//
// verifyHint는 의도적으로 렌더하지 않는다. 채점 기준을 모델에게 주면 그 기준에
// 맞춰 쓰게 되어 측정이 자기충족이 된다.
function describeGoto(goto: string, flow: FlowStep[]): string {
	if (goto === "done") return "끝";
	if (goto === "stop") return "멈춘다";
	const i = flow.findIndex((step) => step.id === goto);
	return i < 0 ? goto : `${i + 1}번(${flow[i].label})으로`;
}

function renderPattern(p: ReferencePattern): string {
	const lines = [`- [${p.id}] (${p.role ?? "-"}) ${p.summary}: ${p.detail}`];

	if (p.format?.count) lines.push(`  형식(개수): ${p.format.count}`);
	if (p.format?.sections?.length) {
		lines.push(`  형식(섹션): ${p.format.sections.join(" / ")}`);
	}
	if (p.format?.template) {
		lines.push("  형식(틀):", "  ```", `  ${p.format.template}`, "  ```");
	}
	for (const o of p.options ?? []) {
		lines.push(`  값: ${o.value} — ${o.character}`);
	}
	for (const e of p.examples ?? []) {
		lines.push(
			`  ${e.polarity === "good" ? "이렇게" : "이러지 말 것"}: ${e.text}`,
		);
	}
	if (p.exception) lines.push(`  예외: ${p.exception}`);

	// 흐름은 마지막에 붙인다. flow가 없는 패턴의 렌더 결과는 이 블록 도입 전과
	// 바이트 단위로 같다.
	if (p.flow?.length) {
		const flow = p.flow;
		lines.push("  흐름:");
		flow.forEach((step, i) => {
			const ref = step.patternId ? `  → [${step.patternId}]` : "";
			lines.push(`    ${i + 1}. ${step.label}${ref}`);
			if (step.gate) lines.push(`       ⤷ 넘어가기 전: ${step.gate}`);
			for (const b of step.branches ?? []) {
				lines.push(`       ⤷ ${b.when} → ${describeGoto(b.goto, flow)}`);
			}
		});
	}

	return lines.join("\n");
}

// 참고 코퍼스를 프롬프트용 텍스트로 렌더한다(정적 — 매 요청 동일해 캐싱 가능).
function buildCorpusSection(): string {
	// 공통 뼈대는 한 번만 찍고, 타입별로는 다른 본문만 찍는다. 4종에 같은 줄이
	// 네 번 반복되던 것을 2026-08-20에 걷어냈다.
	const archetypes = structureArchetypes
		.map(
			(a) =>
				`### ${a.id} — ${a.label}\n언제: ${a.whenToUse}\n본문:\n${a.bodySections}`,
		)
		.join("\n\n");
	// 카테고리 안을 출처별로 묶는다. 묶지 않으면 모델은 어느 패턴들이 한 스킬에서
	// 함께 나왔는지 알 수 없다 — 같은 스킬의 규정끼리는 서로를 전제하는 경우가
	// 많은데(원칙과 그 값, 규칙과 그 근거) 그 관계가 통째로 보이지 않는다.
	//
	// 묶는 기준은 첫 번째 sourceIds다. 두 출처에 걸친 패턴은 첫 번째 쪽에만 놓인다 —
	// 프롬프트에서 필요한 것은 "어느 것끼리 한 집안인가"이고, 두 번째 출처까지
	// 찍으면 묶음의 경계가 흐려진다. 계보 자체는 데이터의 sourceIds에 그대로 있고
	// 결과 화면의 출처 표기는 거기서 만들어진다.
	const categories = referenceCategories
		.map((c) => {
			const groups = new Map<string, ReferencePattern[]>();
			for (const pattern of c.patterns) {
				const key = pattern.sourceIds[0] ?? "";
				const bucket = groups.get(key);
				if (bucket) bucket.push(pattern);
				else groups.set(key, [pattern]);
			}
			const body = [...groups.entries()]
				.map(([sourceId, patterns], index) => {
					// 출처 **이름**은 찍지 않는다. 필요한 신호는 "이 항목들이 한 스킬에서
					// 함께 나왔다"까지이고, 이름까지 주면 모델이 그것을 이름 재료로 쓴다.
					// 2026-08-21에 이름을 찍어보고 2회 확인한 결과 생성된 스킬의 name이
					// 원본 스킬 이름 그대로 나왔고(systematic-debugging이 2회 다 일치),
					// 한국어 이름이 3개에서 1개로 줄었다. 사용자 상황에서 멀어지는 쪽이다.
					const source = getSourceById(sourceId);
					const heading = source
						? `### ${index + 1}번째 묶음 — 아래는 한 스킬에서 함께 나온 것들입니다`
						: "### 아래는 출처가 여럿에 걸친 것들입니다";
					return `${heading}\n${patterns.map(renderPattern).join("\n")}`;
				})
				.join("\n\n");
			return `## ${c.label}${c.alwaysApply ? " (공통·항상 적용)" : ""}\n${body}`;
		})
		.join("\n\n");
	return `참고 자료 — 아래는 공개 스킬(및 Tailor 자체)에서 정리한 "좋은 패턴"과 문서 구조 골격입니다.
사용자 상황에 맞는 것을 스스로 골라 흡수해 스킬을 만들되, 여기 없는 내용도 필요하면 채우세요.
사용자는 Claude Code에 익숙하지 않을 수 있습니다. 그렇다고 기술 용어나 구체적인 값을 빼지는
말고, 처음 나오는 용어에는 짧은 풀이를 붙여 문서 안에서 뜻이 풀리게 하세요.
작업이 단순하면 구조도 단순하게 — 불필요하게 길거나 과한 섹션을 넣지 말고
필요한 만큼만 쓰세요. 규율형 골격은 지켜야 할 원칙이 핵심인 스킬에만 쓰세요.
패턴은 출처별로 묶여 있습니다. 한 묶음 안의 항목들은 같은 스킬에서 나온 것이라
서로를 전제하는 경우가 많습니다 — 원칙과 그 값, 규칙과 그 근거처럼요. 하나를 쓰기로
했다면 같은 묶음에 짝이 있는지 보세요. 묶음 번호는 참고용이니 결과물에 적지 마세요.

반드시 지킬 것: 실제로 참고·반영한 패턴의 [id]와 채택한 구조 골격 id 하나를 출력 형식의
<used_patterns>·<archetype>에 보고하세요. 참고하지 않은 건 보고하지 마세요(정직).
보고할 때는 대괄호나 설명을 붙이지 말고 id 문자열만 한 줄에 하나씩 적으세요.

# 문서 구조 골격 (하나 선택)

아래 골격의 섹션 이름은 **그 자리에 무엇이 오는지 설명한 것**이지 그대로 베껴 쓸
문자열이 아닙니다. 완성된 SKILL.md의 섹션 제목은 사용자가 요청한 언어로, 그 스킬의
내용에 맞게 직접 지으세요.

금지 사항을 모은 절은 제목과 항목 중 한 쪽에서만 부정하세요. 제목을 「하지 말 것」처럼
부정형으로 지었다면 항목은 「전문용어 남발」, 「느낌표 반복」처럼 명사형으로 적고, 항목을
「~하지 않는다」로 쓸 거면 제목은 「지켜야 할 것」처럼 긍정형으로 지으세요. 제목과 항목이
둘 다 부정형이면 규칙이 거꾸로 읽힙니다.

골격은 "사용자가 원하는 게 무엇인가"로 고르세요:
- 값·옵션을 찾아보거나 정해진 기준을 일관되게 적용한다 → reference
- 정해진 순서대로 여러 단계를 밟아 결과물을 만든다 → workflow
- 개념이나 도구가 무엇인지 쉽게 설명한다 → explanation
- 지켜야 할 원칙이 핵심이고, 안 지키면 실제로 사고가 난다 → discipline

discipline은 마지막 수단입니다. 위 셋 중 하나로 설명되면 그걸 쓰세요.
Rationalizations·Red Flags 같은 섹션은 discipline을 골랐을 때만 쓰고,
다른 골격에 끌어다 붙이지 마세요.

## 공통 뼈대 (네 골격 모두 공유)

아래 앞뒤 구성은 어느 골격을 고르든 같습니다. {{본문}} 자리에 고른 골격의
본문 섹션이 들어갑니다. 뒤쪽 세 섹션은 조건이 붙어 있으니, 조건에 안 맞으면
넣지 마세요 — 짧은 스킬에 다 넣으면 본문보다 목차가 길어집니다.

${commonSpine}

## 골격별 본문

${archetypes}

# 좋은 패턴 (카테고리별)
${categories}`;
}

export const CORPUS_SECTION = buildCorpusSection();
