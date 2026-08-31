"use client";

import { useState } from "react";
import { StepTransition } from "@/components/create/step-transition";
import { TextareaField } from "@/components/create/wizard-fields";
import { WizardProgress } from "@/components/create/wizard-progress";
import {
	MAX_FEEDBACK_LENGTH,
	MAX_FOLLOW_UP_ANSWER_LENGTH,
} from "@/lib/input-limits";

export type FollowUpAnswer = { question: string; answer: string };

export type FollowUpResult = {
	answeredQuestions: FollowUpAnswer[];
	feedback: string;
};

type FollowUpStep =
	| { kind: "question"; question: string }
	| { kind: "feedback" };

type FollowUpWizardProps = {
	/** AI가 되물은 질문들. 한 스텝에 하나씩 보여준다. */
	questions: string[];
	/** 진행바 라벨. */
	progressLabel: string;
	/** 각 질문 아래에 붙는 안내 문구. */
	questionDescription: string;
	/**
	 * 모든 질문에 답해야 제출할 수 있는지. 모델이 정보 부족으로 생성을
	 * 거부한 경우(clarify)는 true — 답을 안 받으면 같은 실패가 반복된다.
	 * 이미 초안이 있는 수정 요청(refine)은 false.
	 */
	requireAnswers: boolean;
	/** 질문 뒤에 자유 서술 스텝을 붙일지. 수정 요청 흐름에서만 쓴다. */
	includeFeedbackStep: boolean;
	feedbackHeading?: string;
	feedbackDescription?: string;
	feedbackPlaceholder?: string;
	submitLabel: string;
	cancelLabel: string;
	isSubmitting: boolean;
	/**
	 * 지금은 생성을 부를 수 없는 상태(실패가 서 있거나 429를 기다리는 중).
	 *
	 * 눌러도 아무 일이 없게 두면 사용자는 화면이 멈춘 줄 안다. 버튼을 잠그고
	 * 이유를 함께 보여준다.
	 */
	blockedReason?: string;
	/**
	 * 이 화면의 입력이 바뀔 때 부른다.
	 *
	 * 답변과 피드백은 이 컴포넌트 안에만 있어서, 부모의 「입력을 고치면 입력
	 * 때문에 막힌 오류를 지운다」 규칙이 여기까지 닿지 않는다. 그러면 피드백을
	 * 고쳐도 제출이 계속 잠긴다.
	 */
	onInputChange?: () => void;
	onCancel: () => void;
	onSubmit: (result: FollowUpResult) => void;
};

/**
 * AI의 되물음에 한 문항씩 답하게 하는 공용 마법사.
 * "수정 요청"(초안 있음)과 "정보 부족으로 생성 거부"(초안 없음) 두 흐름이
 * 화면 구조가 같아 공유한다 — 차이는 전부 props로 받는다.
 */
export function FollowUpWizard({
	questions,
	progressLabel,
	questionDescription,
	requireAnswers,
	includeFeedbackStep,
	feedbackHeading,
	feedbackDescription,
	feedbackPlaceholder,
	submitLabel,
	cancelLabel,
	isSubmitting,
	blockedReason,
	onInputChange,
	onCancel,
	onSubmit,
}: FollowUpWizardProps) {
	const [index, setIndex] = useState(0);
	const [direction, setDirection] = useState(1);
	const [answers, setAnswers] = useState<Record<string, string>>({});
	const [feedback, setFeedback] = useState("");

	const steps: FollowUpStep[] = [
		...questions.map((question) => ({ kind: "question" as const, question })),
		...(includeFeedbackStep ? [{ kind: "feedback" as const }] : []),
	];
	const step = steps[index];
	const isLastStep = index + 1 >= steps.length;

	// 답이 필수인 흐름에서는 빈 답으로 다음 스텝에 갈 수 없게 막는다.
	const isCurrentAnswerFilled =
		step.kind !== "question" ||
		!requireAnswers ||
		Boolean(answers[step.question]?.trim());

	const handleBack = () => {
		if (index === 0) {
			onCancel();
			return;
		}
		setDirection(-1);
		setIndex((i) => i - 1);
	};

	const handleNext = () => {
		if (!isLastStep) {
			setDirection(1);
			setIndex((i) => i + 1);
			return;
		}
		onSubmit({
			answeredQuestions: questions.map((question) => ({
				question,
				answer: answers[question] ?? "",
			})),
			feedback,
		});
	};

	return (
		<>
			<div className="mb-8">
				<WizardProgress
					current={index + 1}
					total={steps.length}
					label={progressLabel}
				/>
			</div>

			<StepTransition stepKey={`follow-up-${index}`} direction={direction}>
				{step.kind === "question" ? (
					<div className="flex flex-col gap-4">
						<div>
							<h1 className="text-xl font-semibold text-foreground">
								{step.question}
							</h1>
							<p className="mt-1.5 text-muted">{questionDescription}</p>
						</div>
						<TextareaField
							value={answers[step.question]}
							onChange={(value) => {
								setAnswers((prev) => ({ ...prev, [step.question]: value }));
								onInputChange?.();
							}}
							placeholder={
								requireAnswers
									? "답변을 적어주세요"
									: "답변을 적어주세요 (선택)"
							}
							maxLength={MAX_FOLLOW_UP_ANSWER_LENGTH}
						/>
					</div>
				) : (
					<div className="flex flex-col gap-4">
						<div>
							<h1 className="text-xl font-semibold text-foreground">
								{feedbackHeading}
							</h1>
							<p className="mt-1.5 text-muted">{feedbackDescription}</p>
						</div>
						<TextareaField
							value={feedback}
							onChange={(value) => {
								setFeedback(value);
								onInputChange?.();
							}}
							placeholder={feedbackPlaceholder}
							maxLength={MAX_FEEDBACK_LENGTH}
						/>
					</div>
				)}
			</StepTransition>

			{blockedReason && isLastStep && (
				<p
					role="alert"
					className="mt-6 rounded-2xl border border-accent/40 bg-accent/5 px-5 py-4 text-accent text-sm"
				>
					{blockedReason}
				</p>
			)}

			<div className="mt-6 flex justify-between">
				<button
					type="button"
					onClick={handleBack}
					className="rounded-full px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
				>
					{index === 0 ? cancelLabel : "이전"}
				</button>
				<button
					type="button"
					onClick={handleNext}
					disabled={
						isSubmitting ||
						!isCurrentAnswerFilled ||
						(isLastStep && blockedReason !== undefined)
					}
					className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
				>
					{isLastStep ? submitLabel : "다음"}
				</button>
			</div>
		</>
	);
}
