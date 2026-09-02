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
import { buildCorpusSystemBlock } from "../generate-skill/generation-routing";
import {
	buildRoutedCorpusSection,
	buildUserContent,
	CORPUS_SECTION,
	extractFilename,
	extractListTag,
	extractTag,
	MAX_CLARIFYING_QUESTIONS,
	SYSTEM_PROMPT,
} from "../generate-skill/prompt";
import {
	decideSelectionFallback,
	extractSelectedBundleIds,
	resolveDelivery,
	runSelectionWithDeadline,
	SELECTION_MODEL,
	SELECTION_SYSTEM_PROMPT,
	type SelectionDecision,
	type SelectionResult,
	selectBundles,
} from "../generate-skill/routing";
import {
	resolveCorpusDeliveryPolicy,
	shouldSelectCorpus,
} from "../generate-skill/routing-policy";

export const runtime = "nodejs";

// 실제 생성 경로와 같은 설정을 쓴다. 이 라우트는 개발용 평가 경로이고,
// /api/generate-skill의 전체 코퍼스 주입 동작은 바꾸지 않는다.
const GENERATION_MODEL = "claude-sonnet-5";

type SelectionFixture = {
	rawText?: string;
	stopReason?: string | null;
	usage?: Anthropic.Usage;
	delayMs?: number;
	hang?: boolean;
	error?: "network" | "http-500" | "auth-401";
};

type SelectionFixtureState = {
	abortObserved: boolean;
	completedNaturally: boolean;
};

function fixtureError(kind: NonNullable<SelectionFixture["error"]>): Error {
	const error = new Error("injected selection failure");
	if (kind === "network") error.name = "APIConnectionError";
	if (kind === "http-500") {
		error.name = "InternalServerError";
		Object.assign(error, { status: 500 });
	}
	if (kind === "auth-401") {
		error.name = "AuthenticationError";
		Object.assign(error, { status: 401 });
	}
	return error;
}

/** 9단계 무비용 시험에서 선택 호출을 대신한다. 프로덕션에서는 라우트가 막힌다. */
function runSelectionFixture(
	fixture: SelectionFixture,
	signal: AbortSignal,
	state: SelectionFixtureState,
): Promise<SelectionResult> {
	return new Promise((resolve, reject) => {
		let timer: ReturnType<typeof setTimeout> | undefined;
		let settled = false;
		const cleanup = () => {
			if (timer !== undefined) clearTimeout(timer);
			signal.removeEventListener("abort", abort);
		};
		const abort = () => {
			if (settled) return;
			settled = true;
			state.abortObserved = true;
			cleanup();
			reject(new DOMException("selection fixture aborted", "AbortError"));
		};
		const finish = () => {
			if (settled) return;
			settled = true;
			state.completedNaturally = true;
			cleanup();
			if (fixture.error) {
				reject(fixtureError(fixture.error));
				return;
			}
			const rawText = fixture.rawText ?? "<bundles>\n[tdd-cycle]\n</bundles>";
			resolve({
				bundleIds: [],
				rawText,
				usage: fixture.usage ?? null,
				ms: fixture.delayMs ?? 0,
				stopReason: fixture.stopReason ?? "end_turn",
			});
		};

		signal.addEventListener("abort", abort, { once: true });
		if (signal.aborted) {
			abort();
			return;
		}
		if (!fixture.hang) {
			timer = setTimeout(finish, fixture.delayMs ?? 0);
		}
	});
}

export async function POST(request: Request) {
	if (process.env.NODE_ENV === "production") {
		return new Response("not found", { status: 404 });
	}

	let body: {
		answers?: WizardAnswers;
		wantsAdvanced?: boolean;
		bundleIds?: string[];
		/** 9단계의 무비용 실패 주입. 실제 선택 모델을 부르지 않는다. */
		selectionFixture?: SelectionFixture;
		/** full은 8단계 비교에서만 쓴다. 생략하면 기존 routed 동작이다. */
		mode?: string;
		/** 10단계 무비용 정책 검사. true면 routed 설정이어도 정제처럼 full을 쓴다. */
		simulateRefinement?: boolean;
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
	if (mode === "full" && body.selectionFixture !== undefined) {
		return NextResponse.json(
			{ error: "full 모드에는 selectionFixture를 함께 보낼 수 없습니다" },
			{ status: 400 },
		);
	}
	if (body.bundleIds !== undefined && body.selectionFixture !== undefined) {
		return NextResponse.json(
			{ error: "bundleIds와 selectionFixture는 함께 보낼 수 없습니다" },
			{ status: 400 },
		);
	}
	const selectionEnabled = shouldSelectCorpus({
		configuredMode: mode,
		isRefinement: body.simulateRefinement === true,
	});

	let selection: SelectionResult | null = null;
	let selectionError: unknown;
	let selectionTimedOut = false;
	let selectionMs: number | null = null;
	let forcedBundleIds = false;
	let fixtureState: SelectionFixtureState | null = null;

	if (selectionEnabled) {
		if (Array.isArray(body.bundleIds)) {
			forcedBundleIds = true;
			selection = {
				bundleIds: body.bundleIds,
				rawText: "",
				usage: null,
				ms: 0,
				stopReason: null,
			};
		} else {
			let run: (signal: AbortSignal) => Promise<SelectionResult>;
			if (body.selectionFixture) {
				fixtureState = { abortObserved: false, completedNaturally: false };
				run = (signal) =>
					runSelectionFixture(
						body.selectionFixture as SelectionFixture,
						signal,
						fixtureState as SelectionFixtureState,
					);
			} else {
				const apiKey = process.env.ANTHROPIC_API_KEY;
				if (!apiKey) {
					return NextResponse.json(
						{ error: "ANTHROPIC_API_KEY가 없습니다" },
						{ status: 500 },
					);
				}
				const client = new Anthropic({ apiKey });
				run = (signal) =>
					selectBundles(client, { answers, wantsAdvanced }, { signal });
			}
			const attempt = await runSelectionWithDeadline(run);
			selection = attempt.result;
			selectionError = attempt.error;
			selectionTimedOut = attempt.timedOut;
			selectionMs = attempt.ms;
		}
	}
	if (selection && !forcedBundleIds) {
		selection.bundleIds = extractSelectedBundleIds(selection.rawText);
	}

	const plan = selection
		? resolveDelivery({
				selectedBundleIds: selection.bundleIds,
				answers,
			})
		: null;
	let routingDecision: SelectionDecision | null = null;
	if (selectionEnabled) {
		routingDecision = forcedBundleIds
			? {
					status: "success",
					fallback: false,
					fallbackReasonIds: [],
					ambiguityIds: [],
				}
			: decideSelectionFallback({
					result: selection,
					plan,
					error: selectionError,
					timedOut: selectionTimedOut,
				});
	}
	const routedSection = plan ? buildRoutedCorpusSection(plan.patternIds) : null;
	const generationPolicy = resolveCorpusDeliveryPolicy({
		selectionEnabled,
		selectionFallback: routingDecision?.fallback ?? false,
		hasRoutedSection: routedSection !== null,
	});
	const generationSection =
		generationPolicy.mode === "routed"
			? (routedSection ?? CORPUS_SECTION)
			: CORPUS_SECTION;

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
					buildCorpusSystemBlock({
						text: generationSection,
						cacheCorpus: generationPolicy.cacheCorpus,
					}),
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
				suggestedFilename: extractFilename(rawText),
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
		selectionEnabled,
		selection: selection
			? {
					model: SELECTION_MODEL,
					...selection,
					systemPromptBytes: Buffer.byteLength(SELECTION_SYSTEM_PROMPT, "utf8"),
				}
			: null,
		routingDecision: routingDecision
			? {
					...routingDecision,
					selectionMs: selectionMs ?? selection?.ms ?? null,
					selectionUsage: selection?.usage ?? null,
					selectionAbortObserved: fixtureState?.abortObserved ?? null,
					selectionCompletedNaturally: fixtureState?.completedNaturally ?? null,
				}
			: null,
		plan,
		render: {
			corpusMode: generationPolicy.mode,
			cacheCorpus: generationPolicy.cacheCorpus,
			injectedBytes: Buffer.byteLength(generationSection, "utf8"),
			routedBytes: routedSection
				? Buffer.byteLength(routedSection, "utf8")
				: null,
			fullBytes: Buffer.byteLength(CORPUS_SECTION, "utf8"),
			injectedText: body.includeText ? generationSection : undefined,
			routedText: body.includeText ? routedSection : undefined,
			selectionSystemPrompt: body.includeText
				? SELECTION_SYSTEM_PROMPT
				: undefined,
		},
		generation,
	});
}
