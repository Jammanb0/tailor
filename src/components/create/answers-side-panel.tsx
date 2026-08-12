"use client";

import { useEffect } from "react";
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

type AnswersSidePanelProps = {
	isOpen: boolean;
	onClose: () => void;
	answers: WizardAnswers;
	wantsAdvanced: boolean;
};

const PANEL_WIDTH = 380;

export function AnswersSidePanel({
	isOpen,
	onClose,
	answers,
	wantsAdvanced,
}: AnswersSidePanelProps) {
	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	const questions = [
		...requiredQuestions,
		languageQuestion,
		...(wantsAdvanced ? advancedQuestions : []),
	];

	return (
		<aside
			aria-hidden={!isOpen}
			style={{ width: isOpen ? PANEL_WIDTH : 0 }}
			className="h-screen shrink-0 overflow-hidden border-border border-l bg-surface transition-[width] duration-300 ease-out"
		>
			<div
				style={{ width: PANEL_WIDTH }}
				className="h-full overflow-y-auto p-6"
			>
				<div className="flex items-center justify-between">
					<h2 className="font-semibold text-foreground">내가 답한 내용</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="닫기"
						className="shrink-0 rounded-full p-1 text-muted transition-colors hover:text-foreground"
					>
						✕
					</button>
				</div>
				<dl className="mt-4 flex flex-col gap-4">
					{questions.map((question) => (
						<div key={question.id}>
							<dt className="text-sm text-muted">{question.title}</dt>
							<dd className="select-text text-foreground">
								{formatAnswer(question, answers)}
							</dd>
						</div>
					))}
				</dl>
			</div>
		</aside>
	);
}
