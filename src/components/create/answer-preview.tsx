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
}: {
	title: string;
	questions: WizardQuestion[];
	answers: WizardAnswers;
}) {
	return (
		<div>
			<h2 className="text-sm font-semibold text-muted">{title}</h2>
			<dl className="mt-2 flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
				{questions.map((question) => (
					<div key={question.id} className="flex flex-col gap-1 px-5 py-4">
						<dt className="text-sm text-muted">{question.title}</dt>
						<dd className="select-text text-foreground">
							{formatAnswer(question, answers)}
						</dd>
					</div>
				))}
			</dl>
		</div>
	);
}

type AnswerPreviewProps = {
	answers: WizardAnswers;
	wantsAdvanced: boolean;
	onEdit: () => void;
};

export function AnswerPreview({
	answers,
	wantsAdvanced,
	onEdit,
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
					답변을 확인하고, 고칠 부분이 있으면 이전으로 돌아가 수정해주세요.
				</p>
			</div>

			<div data-preview-item>
				<AnswerGroup
					title="필수 정보"
					questions={[...requiredQuestions, languageQuestion]}
					answers={answers}
				/>
			</div>

			{wantsAdvanced && (
				<div data-preview-item>
					<AnswerGroup
						title="고급 정보"
						questions={advancedQuestions}
						answers={answers}
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

			<div data-preview-item className="flex flex-wrap gap-3">
				<button
					type="button"
					onClick={onEdit}
					className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
				>
					답변 수정하기
				</button>
				<span
					aria-disabled
					className="flex items-center gap-1.5 rounded-full bg-accent/40 px-6 py-3 text-sm font-medium text-accent-foreground/70"
				>
					스킬 생성하기
					<span className="text-xs font-normal">곧 만나요</span>
				</span>
			</div>
		</div>
	);
}
