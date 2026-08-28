// 코퍼스 라우팅 미리보기 (개발 전용, 프로덕션 경로 아님).
//
// POST /api/route-preview
//   { answers, wantsAdvanced?, bundleIds?, mode?, generate? }
//     → 고른 묶음 · 전달 패턴 목록 · 선택 주입 코퍼스의 크기
//     → generate=true면 그 코퍼스로 만든 평가용 SKILL.md도 함께 반환
//     → mode="full"이면 선택을 건너뛰고 전체 코퍼스로 평가용 생성
//
// `bundleIds`를 주면 선택 모델을 부르지 않고 그 목록으로 전달만 편다. 선택
// 결과와 무관하게 「합집합·중복 제거·requires 닫기」만 확인하고 싶을 때 쓴다.
//
// 왜 라우트인가: 라우팅 모듈은 `@/` 별칭과 TS로 쓰여 있어 node 스크립트가
// 그대로 불러오지 못한다. corpus-snapshot과 같은 방식으로 앱 안에서 돌리고
// 도구는 HTTP로 부른다 — 렌더를 복제하면 앱과 조용히 갈라진다.
//
// 실제 제품 생성 경로는 아니다. generate=true는 6단계 개발 평가에서만 쓰고,
// /api/generate-skill은 그대로 전체 코퍼스를 보낸다. 선택 주입을 실제로
// 채택할지는 6~8단계 비교 뒤에 정한다.

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { WizardAnswers } from "@/data/wizard-questions";
import {
	buildRoutedCorpusSection,
	buildUserContent,
	CORPUS_SECTION,
	extractListTag,
	extractTag,
	MAX_CLARIFYING_QUESTIONS,
	SYSTEM_PROMPT,
} from "../generate-skill/prompt";
import {
	resolveDelivery,
	SELECTION_MODEL,
	SELECTION_SYSTEM_PROMPT,
	selectBundles,
} from "../generate-skill/routing";

export const runtime = "nodejs";

// 실제 생성 경로와 같은 설정을 쓴다. 이 라우트는 개발용 평가 경로이고,
// /api/generate-skill의 전체 코퍼스 주입 동작은 바꾸지 않는다.
const GENERATION_MODEL = "claude-sonnet-5";

export async function POST(request: Request) {
	if (process.env.NODE_ENV === "production") {
		return new Response("not found", { status: 404 });
	}

	let body: {
		answers?: WizardAnswers;
		wantsAdvanced?: boolean;
		bundleIds?: string[];
		/** full은 8단계 비교에서만 쓴다. 생략하면 기존 routed 동작이다. */
		mode?: string;
		/** true면 렌더 전문을 함께 준다. 토큰을 직접 재려면 글이 필요하다. */
		includeText?: boolean;
		/** true면 지정한 모드의 코퍼스로 평가용 SKILL.md도 만든다. API 비용이 든다. */
		generate?: boolean;
	};
	try {
		body = await request.json();
	} catch {
		return NextResponse.json({ error: "잘못된 요청 형식" }, { status: 400 });
	}

	const answers = body.answers ?? {};
	const wantsAdvanced = Boolean(body.wantsAdvanced);
	const mode = body.mode ?? "routed";
	if (mode !== "routed" && mode !== "full") {
		return NextResponse.json(
			{ error: "알 수 없는 평가 모드" },
			{ status: 400 },
		);
	}
	if (mode === "full" && body.bundleIds !== undefined) {
		return NextResponse.json(
			{ error: "full 모드에는 bundleIds를 함께 보낼 수 없습니다" },
			{ status: 400 },
		);
	}

	let selection: {
		bundleIds: string[];
		rawText: string | null;
		usage: Anthropic.Usage | null;
		ms: number | null;
	} | null = null;

	if (mode === "routed") {
		if (Array.isArray(body.bundleIds)) {
			selection = {
				bundleIds: body.bundleIds,
				rawText: null,
				usage: null,
				ms: null,
			};
		} else {
			const apiKey = process.env.ANTHROPIC_API_KEY;
			if (!apiKey) {
				return NextResponse.json(
					{ error: "ANTHROPIC_API_KEY가 없습니다" },
					{ status: 500 },
				);
			}
			try {
				const result = await selectBundles(new Anthropic({ apiKey }), {
					answers,
					wantsAdvanced,
				});
				selection = {
					bundleIds: result.bundleIds,
					rawText: result.rawText,
					usage: result.usage,
					ms: result.ms,
				};
			} catch (error) {
				console.error("bundle selection failed", error);
				return NextResponse.json(
					{ error: `선택 호출 실패: ${error}` },
					{ status: 502 },
				);
			}
		}
	}

	const plan = selection
		? resolveDelivery({
				selectedBundleIds: selection.bundleIds,
				answers,
			})
		: null;
	const routedSection = plan ? buildRoutedCorpusSection(plan.patternIds) : null;
	const generationSection = routedSection ?? CORPUS_SECTION;

	let generation = null;
	if (body.generate) {
		if (!answers.situation || !answers.language) {
			return NextResponse.json(
				{ error: "평가용 생성에는 situation과 language가 필요합니다" },
				{ status: 400 },
			);
		}
		const apiKey = process.env.ANTHROPIC_API_KEY;
		if (!apiKey) {
			return NextResponse.json(
				{ error: "ANTHROPIC_API_KEY가 없습니다" },
				{ status: 500 },
			);
		}

		try {
			const startedAt = Date.now();
			const response = await new Anthropic({ apiKey }).messages.create({
				model: GENERATION_MODEL,
				max_tokens: 8192,
				thinking: { type: "disabled" },
				system: [
					{
						type: "text",
						text: generationSection,
						cache_control: { type: "ephemeral" },
					},
					{ type: "text", text: SYSTEM_PROMPT },
				],
				messages: [
					{
						role: "user",
						content: buildUserContent(answers, wantsAdvanced),
					},
				],
			});
			const rawText = response.content
				.filter((block) => block.type === "text")
				.map((block) => block.text)
				.join("");
			const clarifyingQuestions = extractListTag(rawText, "questions").slice(
				0,
				MAX_CLARIFYING_QUESTIONS,
			);
			generation = {
				model: GENERATION_MODEL,
				ms: Date.now() - startedAt,
				stopReason: response.stop_reason,
				usage: response.usage,
				rawText,
				skillMarkdown: extractTag(rawText, "skill_md"),
				reviewNotes: extractListTag(rawText, "review"),
				clarifyingQuestions,
				needsMoreInfo:
					!extractTag(rawText, "skill_md") && clarifyingQuestions.length > 0,
				suggestedFilename:
					extractTag(rawText, "filename")?.trim() || "my-skill",
			};
		} catch (error) {
			console.error(`${mode} evaluation generation failed`, error);
			return NextResponse.json(
				{
					error: `${mode === "full" ? "전체" : "선택"} 주입 생성 실패: ${error}`,
				},
				{ status: 502 },
			);
		}
	}

	return NextResponse.json({
		mode,
		selection: selection
			? {
					model: SELECTION_MODEL,
					...selection,
					systemPromptBytes: Buffer.byteLength(SELECTION_SYSTEM_PROMPT, "utf8"),
				}
			: null,
		plan,
		render: {
			injectedBytes: Buffer.byteLength(generationSection, "utf8"),
			routedBytes: routedSection
				? Buffer.byteLength(routedSection, "utf8")
				: null,
			fullBytes: Buffer.byteLength(CORPUS_SECTION, "utf8"),
			routedText: body.includeText ? routedSection : undefined,
			selectionSystemPrompt: body.includeText
				? SELECTION_SYSTEM_PROMPT
				: undefined,
		},
		generation,
	});
}
