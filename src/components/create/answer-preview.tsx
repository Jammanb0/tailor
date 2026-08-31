"use client";

import { gsap } from "gsap";
import { useLayoutEffect, useRef } from "react";
import {
	GenerationErrorBanner,
	type GenerationErrorState,
} from "@/components/create/generation-error-banner";
import {
	advancedQuestions,
	languageQuestion,
	requiredQuestions,
	type WizardAnswers,
	type WizardQuestion,
} from "@/data/wizard-questions";

function formatAnswer(question: WizardQuestion, answers: WizardAnswers) {
	const value = answers[question.id];

	if (!value || (Array.isArray(value) && value.length === 0)) {
		return question.required ? "(응답 없음)" : "(입력 안 함)";
	}

	if (question.type === "checkbox" && Array.isArray(value)) {
		return value
			.map((v) => question.options?.find((o) => o.value === v)?.label ?? v)
			.join(", ");
	}

	if (question.type === "radio" && typeof value === "string") {
		return question.options?.find((o) => o.value === value)?.label ?? value;
	}

	return typeof value === "string" ? value : "";
}

function AnswerGroup({
	title,
	questions,
	answers,
	onSelectQuestion,
}: {
	title: string;
	questions: WizardQuestion[];
	answers: WizardAnswers;
	onSelectQuestion: (questionId: string) => void;
}) {
	return (
		<div>
			<h2 className="text-sm font-semibold text-muted">{title}</h2>
			<div className="mt-2 flex flex-col divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
				{questions.map((question) => (
					<button
						key={question.id}
						type="button"
						onClick={() => onSelectQuestion(question.id)}
						className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
					>
						<span>
							<span className="block text-sm text-muted">{question.title}</span>
							<span className="select-text text-foreground">
								{formatAnswer(question, answers)}
							</span>
						</span>
						<span
							aria-hidden
							className="shrink-0 text-sm text-accent transition-colors group-hover:text-accent-hover"
						>
							수정 →
						</span>
					</button>
				))}
			</div>
		</div>
	);
}

type AnswerPreviewProps = {
	answers: WizardAnswers;
	wantsAdvanced: boolean;
	onSelectQuestion: (questionId: string) => void;
	onAddAdvanced?: () => void;
	confirmingRestart: boolean;
	onRequestRestart: () => void;
	onCancelRestart: () => void;
	onConfirmRestart: () => void;
	onGenerate: () => void;
	isGenerating: boolean;
	generationError: GenerationErrorState | null;
	onRetry: () => void;
	onReturnToResult?: () => void;
};

export function AnswerPreview({
	answers,
	wantsAdvanced,
	onSelectQuestion,
	onAddAdvanced,
	confirmingRestart,
	onRequestRestart,
	onCancelRestart,
	onConfirmRestart,
	onGenerate,
	isGenerating,
	generationError,
	onRetry,
	onReturnToResult,
}: AnswerPreviewProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const context = gsap.context(() => {
			gsap.fromTo(
				"[data-preview-item]",
				{ opacity: 0, y: 12 },
				{
					opacity: 1,
					y: 0,
					duration: 0.4,
					ease: "power2.out",
					stagger: 0.07,
				},
			);
		}, containerRef);
		return () => context.revert();
	}, []);

	return (
		<div ref={containerRef} className="flex flex-col gap-5">
			<div data-preview-item>
				<h1 className="text-2xl font-semibold text-foreground">
					이렇게 이해했어요
				</h1>
				<p className="mt-1.5 text-muted">
					답변을 클릭하면 그 질문으로 바로 돌아가서 고칠 수 있어요.
				</p>
			</div>

			<div data-preview-item>
				<AnswerGroup
					title="필수 정보"
					questions={[...requiredQuestions, languageQuestion]}
					answers={answers}
					onSelectQuestion={onSelectQuestion}
				/>
			</div>

			{wantsAdvanced ? (
				<div data-preview-item>
					<AnswerGroup
						title="고급 정보"
						questions={advancedQuestions}
						answers={answers}
						onSelectQuestion={onSelectQuestion}
					/>
				</div>
			) : (
				onAddAdvanced && (
					<div data-preview-item>
						<div className="overflow-hidden rounded-2xl border border-border bg-surface">
							<button
								type="button"
								onClick={onAddAdvanced}
								className="group flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-accent/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
							>
								<span>
									<span className="block text-sm text-muted">고급 질문</span>
									<span className="text-foreground">
										지금 상태로도 만들 수 있어요. 원하면 고급 질문에 답해볼 수
										있어요.
									</span>
								</span>
								<span
									aria-hidden
									className="shrink-0 text-sm text-accent transition-colors group-hover:text-accent-hover"
								>
									답하기 →
								</span>
							</button>
						</div>
					</div>
				)
			)}

			{generationError && (
				<div data-preview-item>
					<GenerationErrorBanner
						key={generationError.receivedAt}
						error={generationError}
						onRetry={onRetry}
						isBusy={isGenerating}
					/>
				</div>
			)}

			<div data-preview-item className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					{onReturnToResult && (
						<button
							type="button"
							onClick={onReturnToResult}
							className="text-sm text-muted transition-colors hover:text-accent"
						>
							결과로 돌아가기
						</button>
					)}
					{!confirmingRestart && (
						<button
							type="button"
							onClick={onRequestRestart}
							className="text-sm text-muted transition-colors hover:text-foreground"
						>
							처음부터 다시하기
						</button>
					)}
				</div>

				{/*
				 * 실패가 서 있는 동안에는 잠근다. 이 버튼이 열려 있으면 429
				 * 카운트다운이나 「토큰 소진」 판정을 그대로 지나쳐 다시 호출할
				 * 수 있다 — 배너의 재시도만 막아서는 소용이 없다. 다시 보낼지는
				 * 배너가 정하고, 입력 때문에 막힌 실패는 답변을 고치면 풀린다.
				 */}
				<button
					type="button"
					onClick={onGenerate}
					disabled={isGenerating || generationError !== null}
					className="flex items-center gap-1.5 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isGenerating ? "만드는 중..." : "스킬 생성하기"}
				</button>
			</div>

			{confirmingRestart && (
				<div
					data-preview-item
					className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-4"
				>
					<span className="text-sm text-foreground">
						정말 처음부터 다시 시작할까요? 지금까지 답변이 모두 사라져요.
					</span>
					<div className="flex shrink-0 gap-2">
						<button
							type="button"
							onClick={onCancelRestart}
							className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
						>
							아니요
						</button>
						<button
							type="button"
							onClick={onConfirmRestart}
							className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
						>
							다시 시작
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
