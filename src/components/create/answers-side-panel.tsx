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

export type RefineHistoryEntry = { question: string; answer: string };

type AnswersSidePanelProps = {
	isOpen: boolean;
	onClose: () => void;
	answers: WizardAnswers;
	wantsAdvanced: boolean;
	refineHistory: RefineHistoryEntry[];
	refineFeedbackHistory: string[];
};

const PANEL_WIDTH = 380;

function downloadText(content: string) {
	const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "내가-답한-내용.txt";
	a.click();
	URL.revokeObjectURL(url);
}

export function AnswersSidePanel({
	isOpen,
	onClose,
	answers,
	wantsAdvanced,
	refineHistory,
	refineFeedbackHistory,
}: AnswersSidePanelProps) {
	useEffect(() => {
		document.documentElement.style.setProperty(
			"--panel-offset",
			isOpen ? `${PANEL_WIDTH}px` : "0px",
		);
		return () => {
			document.documentElement.style.setProperty("--panel-offset", "0px");
		};
	}, [isOpen]);

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

	const handleDownload = () => {
		const lines = [
			"내가 답한 내용",
			"",
			...questions.map((q) => `- ${q.title}\n  ${formatAnswer(q, answers)}`),
		];
		if (refineHistory.length > 0 || refineFeedbackHistory.length > 0) {
			lines.push("", "2차 작업에서 답한 내용");
			for (const entry of refineHistory) {
				lines.push(`- ${entry.question}\n  ${entry.answer || "(입력 안 함)"}`);
			}
			for (const feedback of refineFeedbackHistory) {
				lines.push(`- 이 부분은 이렇게 고쳐주세요\n  ${feedback}`);
			}
		}
		downloadText(lines.join("\n"));
	};

	return (
		<aside
			aria-hidden={!isOpen}
			style={{ width: isOpen ? PANEL_WIDTH : 0 }}
			className={`sticky top-0 h-screen shrink-0 overflow-hidden bg-surface transition-[width] duration-300 ease-out ${isOpen ? "border-border border-l" : ""}`}
		>
			<div
				style={{ width: PANEL_WIDTH }}
				className="flex h-full flex-col overflow-y-auto p-6"
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

				{(refineHistory.length > 0 || refineFeedbackHistory.length > 0) && (
					<div className="mt-6 border-border border-t pt-4">
						<h3 className="text-sm text-muted">2차 작업에서 답한 내용</h3>
						<dl className="mt-3 flex flex-col gap-4">
							{refineHistory.map((entry) => (
								<div key={entry.question}>
									<dt className="text-sm text-muted">{entry.question}</dt>
									<dd className="select-text text-foreground">
										{entry.answer || "(입력 안 함)"}
									</dd>
								</div>
							))}
							{refineFeedbackHistory.map((feedback) => (
								<div key={feedback}>
									<dt className="text-sm text-muted">
										이 부분은 이렇게 고쳐주세요
									</dt>
									<dd className="select-text text-foreground">{feedback}</dd>
								</div>
							))}
						</dl>
					</div>
				)}

				<button
					type="button"
					onClick={handleDownload}
					className="mt-6 self-start rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
				>
					답변 내용 다운로드
				</button>
			</div>
		</aside>
	);
}
