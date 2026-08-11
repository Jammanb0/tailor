"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";
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
			<div className="mt-2 flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
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
							className="shrink-0 text-sm text-muted transition-colors group-hover:text-accent"
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
};

export function AnswerPreview({
	answers,
	wantsAdvanced,
	onSelectQuestion,
}: AnswerPreviewProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
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

			{wantsAdvanced && (
				<div data-preview-item>
					<AnswerGroup
						title="고급 정보"
						questions={advancedQuestions}
						answers={answers}
						onSelectQuestion={onSelectQuestion}
					/>
				</div>
			)}

			<div
				data-preview-item
				className="rounded-2xl border border-dashed border-border bg-surface px-5 py-4 text-sm text-muted"
			>
				생성 파이프라인은 다음 단계에서 연동돼요. 지금은 답변을 모으는
				화면까지만 준비돼 있어요.
			</div>

			<div data-preview-item>
				<span
					aria-disabled
					className="flex w-fit items-center gap-1.5 rounded-full bg-accent/40 px-6 py-3 text-sm font-medium text-accent-foreground/70"
				>
					스킬 생성하기
					<span className="text-xs font-normal">곧 만나요</span>
				</span>
			</div>
		</div>
	);
}
