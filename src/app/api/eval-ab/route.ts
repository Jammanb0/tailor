// 생성 품질 평가 하네스 (개발 전용 — 배포 환경에서는 404로 막힌다).
//
// POST /api/eval-ab  { "experiment": "model" | "effort" | "attribution", "runs": 3 }
//
// - model : Haiku 4.5 vs Sonnet 5. Haiku는 effort를 지원하지 않으므로
//           Sonnet도 low로 맞춰 비교한다.
// - effort: Sonnet 5 안에서 low / medium / high 비교.
// - attribution: 설정 비교가 아니라 "지금 앱 설정"의 출처 표기 기준선 측정.
//   모델이 보고한 used_patterns가 결과물에 실제로 반영됐는지는 이 라우트가
//   판정하지 않는다 — 결과물과 보고 id를 분리 저장해 별도 채점자가 블라인드로
//   판정한다(실험 설계자가 품질까지 채점하면 자문자답이 된다).
//
// 설계 원칙
// 1. 한 번에 변수 하나만 바꾼다. 나머지 답변은 baseAnswers()로 전부 고정한다.
// 2. 같은 셀을 runs회 반복한다. 2026-08-13 1차 실험에서 동일 조건 재실행 시
//    결과 길이가 11.5% 달랐다 — 1회 측정으로는 노이즈와 신호를 구분할 수 없다.
// 3. 실행 순서로 인한 캐시 편향을 없애기 위해 워밍업 콜을 1회 버린다.
// 4. 비교 대상은 SKILL.md만이 아니다. AI가 되묻는 질문(`questions`)도 결과 화면에
//    그대로 노출되고 "수정 요청" 흐름의 입력이 되므로 함께 비교한다 — 개수뿐
//    아니라 내용까지(초심자가 답할 수 있는가, 이미 답한 것을 다시 묻지 않는가).
//
// 앱과 동일한 프롬프트를 쓰기 위해 generate-skill/prompt.ts를 그대로 import한다.
// 여기서 프롬프트를 복사해 쓰면 route.ts가 바뀔 때 조용히 어긋나 비교가 무의미해진다.

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import {
	processPatternIds,
	referenceCategories,
	structureArchetypes,
} from "@/data/reference-corpus";
import type { WizardAnswers } from "@/data/wizard-questions";
import {
	buildUserContent,
	CORPUS_SECTION,
	extractArchetypeId,
	extractListTag,
	extractTag,
	extractUsedPatternIds,
	SYSTEM_PROMPT,
} from "../generate-skill/prompt";

export const runtime = "nodejs";
export const maxDuration = 800;

const SONNET = "claude-sonnet-5";
const HAIKU = "claude-haiku-4-5";

// max_tokens는 모든 설정에서 동일하게 둔다. 상한일 뿐 과금 대상이 아니므로,
// 넉넉히 잡아 "잘림"이 설정 간 차이로 오인되는 것을 막는다.
const MAX_TOKENS = 16000;

type GenConfig = {
	id: string;
	model: string;
	// Haiku 4.5는 effort를 지원하지 않는다. null이면 파라미터를 아예 넘기지 않는다.
	effort: "low" | "medium" | "high" | null;
};

// 실험 2: Sonnet 5 내부 effort 비교.
const EFFORT_CONFIGS: GenConfig[] = [
	{ id: "sonnet-low", model: SONNET, effort: "low" },
	{ id: "sonnet-medium", model: SONNET, effort: "medium" },
	{ id: "sonnet-high", model: SONNET, effort: "high" },
];

// 실험 1: 모델 비교. Haiku가 effort를 못 받으므로 Sonnet도 low로 맞춘다.
const MODEL_CONFIGS: GenConfig[] = [
	{ id: "sonnet-low", model: SONNET, effort: "low" },
	{ id: "haiku", model: HAIKU, effort: null },
];

// 실험 3(출처 정직성): 설정을 비교하는 실험이 아니라 "지금 앱이 내는 결과"의
// 기준선을 재는 실험이므로, 반드시 generate-skill/route.ts와 동일한 조건이어야
// 한다 — 모델 sonnet-5, thinking 끔, effort 파라미터를 아예 넘기지 않음.
// (max_tokens만 하네스 공통값을 쓰는데, 상한일 뿐이라 결과에 영향이 없다.)
const ATTRIBUTION_CONFIGS: GenConfig[] = [
	{ id: "app-default", model: SONNET, effort: null },
];

// 4개 구조 골격을 각각 유도하도록 설계한 시나리오.
// situation을 제외한 모든 답변은 동일하게 고정한다(교란 변수 제거).
const SITUATIONS: { id: string; expect: string; situation: string }[] = [
	{
		id: "01-discipline",
		expect: "discipline",
		situation:
			"코드를 커밋할 때 API 키나 비밀번호 같은 게 실수로 들어가는 게 제일 무서워요. 커밋하기 전에 항상 확인하게 하고, 뭔가 발견되면 절대 그냥 커밋하지 말고 저한테 먼저 물어봤으면 좋겠어요.",
	},
	{
		id: "02-workflow",
		expect: "workflow",
		situation:
			"PR을 올리기 전에 해야 하는 일이 정해져 있는데 자꾸 빼먹어요. 테스트 돌리고, 린트 확인하고, 브랜치 이름 규칙 맞는지 보고, 마지막에 PR 설명을 템플릿대로 쓰는 순서예요. 이걸 순서대로 챙겨줬으면 해요.",
	},
	{
		id: "03-reference",
		expect: "reference",
		situation:
			"우리 프로젝트에서 쓰는 색상 토큰이랑 간격 값이 정해져 있는데, 어디에 뭐가 있는지 매번 까먹어서 찾아봐요. 제가 물어보면 그 값들을 정확히 알려주고, 없는 값을 지어내지는 않았으면 좋겠어요.",
	},
	{
		id: "04-explanation",
		expect: "explanation",
		situation:
			"제가 아직 초보라서 처음 보는 라이브러리가 나오면 이해가 안 돼요. 어려운 용어 쓰지 말고, 이게 왜 필요한지부터 쉬운 비유로 설명해준 다음에 아주 짧은 예제를 보여주는 식으로 알려줬으면 좋겠어요.",
	},
];

// 고정 답변. situation 외에는 모든 실험에서 동일하다.
function baseAnswers(situation: string): WizardAnswers {
	return { tool: "cli", situation, language: "ko" };
}

const VALID_PATTERN_IDS = new Set(
	referenceCategories.flatMap((c) => c.patterns.map((p) => p.id)),
);
const VALID_ARCHETYPE_IDS = new Set<string>(
	structureArchetypes.map((a) => a.id),
);

// 100만 토큰당 USD. 2026-08 기준. Sonnet 5는 2026-08-31까지 프로모 단가($2/$10)이며
// 이후 정가($3/$15)로 오른다 — 그 시점 이후에는 이 값을 갱신해야 한다.
// 캐시 배수: 읽기 0.1배, 쓰기 1.25배.
const PRICE: Record<string, { in: number; out: number }> = {
	[SONNET]: { in: 2, out: 10 },
	[HAIKU]: { in: 1, out: 5 },
};

const hasHangul = (s: string) => /[가-힣]/.test(s);

function costOf(model: string, u: Anthropic.Usage): number {
	const p = PRICE[model];
	return (
		(u.input_tokens * p.in +
			(u.cache_read_input_tokens ?? 0) * p.in * 0.1 +
			(u.cache_creation_input_tokens ?? 0) * p.in * 1.25 +
			u.output_tokens * p.out) /
		1_000_000
	);
}

async function runOne(
	client: Anthropic,
	label: { situationId: string; expect: string; config: string; run: number },
	answers: WizardAnswers,
	config: GenConfig,
) {
	const startedAt = Date.now();
	let text = "";
	let usage: Anthropic.Usage | null = null;
	let error: string | null = null;

	try {
		const response = await client.messages.create({
			model: config.model,
			max_tokens: MAX_TOKENS,
			// 모든 실험에서 thinking은 끈다. Haiku 4.5와 조건을 맞추기 위함이며,
			// 이 조건에서만 결론이 유효하다는 점을 문서에 명시할 것.
			thinking: { type: "disabled" },
			...(config.effort ? { output_config: { effort: config.effort } } : {}),
			system: [
				{
					type: "text",
					text: CORPUS_SECTION,
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

	const skillMarkdown = extractTag(text, "skill_md");
	const review = extractListTag(text, "review");
	const questions = extractListTag(text, "questions");
	const archetype = extractArchetypeId(text);
	const usedPatterns = extractUsedPatternIds(text);

	return {
		...label,
		error,
		elapsedMs: Date.now() - startedAt,
		usage,
		model: config.model,
		effort: config.effort,
		costUsd: usage ? costOf(config.model, usage) : null,
		checks: {
			skillMarkdownOk: Boolean(skillMarkdown),
			skillMarkdownChars: skillMarkdown?.length ?? 0,
			archetype,
			archetypeValid: archetype ? VALID_ARCHETYPE_IDS.has(archetype) : false,
			archetypeMatchesExpectation: archetype === label.expect,
			usedPatterns,
			unknownPatternIds: usedPatterns.filter(
				(id) => !VALID_PATTERN_IDS.has(id),
			),
			// process 패턴은 완성된 문서에서 검증할 수 없다. 채점에 섞으면 정밀도가
			// 구조적으로 깎이므로(2026-08-18 실험) 분리해서 기록한다.
			processPatterns: processPatternIds(usedPatterns),
			reviewCount: review.length,
			questionCount: questions.length,
			reviewKorean: review.every(hasHangul),
			questionsKorean: questions.every(hasHangul),
		},
		skillMarkdown,
		review,
		questions,
	};
}

export async function POST(request: Request) {
	// 개발 전용 라우트. 배포된 환경에서는 존재하지 않는 것으로 응답한다 —
	// 요청 1회가 AI를 39~63회 호출하므로(시나리오 4 x 설정 3 x 반복 3 + 예열),
	// 밖에 열어두면 아무 값도 돌려주지 않으면서 비용만 나간다.
	// corpus-snapshot/route.ts와 같은 가드다.
	if (process.env.NODE_ENV === "production") {
		return new Response("not found", { status: 404 });
	}

	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		return NextResponse.json({ error: "no api key" }, { status: 500 });
	}

	let experiment = "effort";
	let runs = 3;
	try {
		const body = await request.json();
		if (body?.experiment) experiment = String(body.experiment);
		if (Number.isInteger(body?.runs))
			runs = Math.min(Math.max(body.runs, 1), 5);
	} catch {
		// 본문 없으면 기본값 사용
	}

	const client = new Anthropic({ apiKey });
	const configs =
		experiment === "model"
			? MODEL_CONFIGS
			: experiment === "attribution"
				? ATTRIBUTION_CONFIGS
				: EFFORT_CONFIGS;
	const results = [];

	// 워밍업: 첫 호출은 TLS 핸드셰이크·캐시 생성 비용을 혼자 떠안으므로 버린다.
	// (effort/모델마다 캐시 항목이 따로 생기므로 설정별로 1회씩 예열한다.)
	for (const config of configs) {
		await runOne(
			client,
			{ situationId: "warmup", expect: "", config: config.id, run: 0 },
			baseAnswers(SITUATIONS[0].situation),
			config,
		);
	}

	// 같은 셀을 runs회 반복한다. 반복 없이는 노이즈와 실제 차이를 구분할 수 없다.
	for (const s of SITUATIONS) {
		for (const config of configs) {
			for (let run = 1; run <= runs; run++) {
				results.push(
					await runOne(
						client,
						{
							situationId: s.id,
							expect: s.expect,
							config: config.id,
							run,
						},
						baseAnswers(s.situation),
						config,
					),
				);
			}
		}
	}

	return NextResponse.json({ experiment, runs, results });
}
