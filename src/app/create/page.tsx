"use client";

import Link from "next/link";
import { useState } from "react";
import { AnswerPreview } from "@/components/create/answer-preview";
import { HandoffPanel } from "@/components/create/handoff-panel";
import { PathFork } from "@/components/create/path-fork";
import { StepTransition } from "@/components/create/step-transition";
import {
	CheckboxField,
	RadioField,
	TextareaField,
} from "@/components/create/wizard-fields";
import { WizardProgress } from "@/components/create/wizard-progress";
import {
	advancedQuestions,
	languageQuestion,
	requiredQuestions,
	type WizardAnswers,
	type WizardQuestion,
} from "@/data/wizard-questions";

type Stage = "fork" | "handoff" | "form" | "preview";
type Step = { kind: "question"; question: WizardQuestion } | { kind: "gate" };

function buildSteps(wantsAdvanced: boolean | null): Step[] {
	return [
		...requiredQuestions.map((question) => ({
			kind: "question" as const,
			question,
		})),
		{ kind: "question" as const, question: languageQuestion },
		{ kind: "gate" as const },
		...(wantsAdvanced
			? advancedQuestions.map((question) => ({
					kind: "question" as const,
					question,
				}))
			: []),
	];
}

function isAnswerFilled(value: string | string[] | undefined) {
	if (Array.isArray(value)) return value.length > 0;
	return typeof value === "string" && value.trim().length > 0;
}

export default function CreatePage() {
	const [stage, setStage] = useState<Stage>("fork");
	const [wantsAdvanced, setWantsAdvanced] = useState<boolean | null>(null);
	const [index, setIndex] = useState(0);
	const [direction, setDirection] = useState(1);
	const [answers, setAnswers] = useState<WizardAnswers>({});

	const steps = buildSteps(wantsAdvanced);
	const step = steps[index];

	const goTo = (nextIndex: number, dir: number) => {
		setDirection(dir);
		setIndex(nextIndex);
	};

	const handleNext = () => {
		if (index + 1 >= steps.length) {
			setStage("preview");
			return;
		}
		goTo(index + 1, 1);
	};

	const handleBack = () => {
		if (index === 0) {
			setStage("fork");
			return;
		}
		goTo(index - 1, -1);
	};

	const handleGateChoice = (choice: boolean) => {
		setWantsAdvanced(choice);
		if (!choice) {
			setStage("preview");
			return;
		}
		setDirection(1);
		setIndex(index + 1);
	};

	const setAnswer = (id: string, value: string | string[]) => {
		setAnswers((prev) => ({ ...prev, [id]: value }));
	};

	if (stage === "fork") {
		return (
			<main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-16">
				<PathFork
					onSelectWeb={() => setStage("form")}
					onSelectHandoff={() => setStage("handoff")}
				/>
			</main>
		);
	}

	if (stage === "handoff") {
		return (
			<main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-16">
				<HandoffPanel onBack={() => setStage("fork")} />
			</main>
		);
	}

	if (stage === "preview") {
		return (
			<main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-16">
				<AnswerPreview
					answers={answers}
					wantsAdvanced={wantsAdvanced === true}
					onSelectQuestion={(questionId) => {
						const targetIndex = steps.findIndex(
							(s) => s.kind === "question" && s.question.id === questionId,
						);
						if (targetIndex === -1) return;
						setStage("form");
						goTo(targetIndex, -1);
					}}
				/>
			</main>
		);
	}

	// stage === "form"
	const phaseLabel =
		step.kind === "gate"
			? "옵션 선택"
			: step.question.mode === "advanced"
				? "고급 질문"
				: "필수 질문";

	return (
		<main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-16">
			<div className="mb-8">
				<WizardProgress
					current={index + 1}
					total={steps.length}
					label={phaseLabel}
				/>
			</div>

			<StepTransition stepKey={`${index}-${step.kind}`} direction={direction}>
				{step.kind === "gate" ? (
					<div className="flex flex-col gap-4">
						<div>
							<h1 className="text-2xl font-semibold text-foreground">
								고급 질문에 답해서 더 정확하게 만들까요?
							</h1>
							<p className="mt-1.5 text-muted">
								6개 질문이 더 있어요. 건너뛰어도 스킬은 만들어져요.
							</p>
						</div>
						<button
							type="button"
							onClick={() => handleGateChoice(true)}
							className="flex w-full flex-col gap-1 rounded-2xl border border-accent bg-accent/10 px-6 py-5 text-left transition-colors hover:bg-accent/15"
						>
							<span className="font-semibold text-accent">
								고급 질문 계속하기
							</span>
							<span className="text-sm text-muted">
								더 정확한 스킬을 원한다면 추천해요
							</span>
						</button>
						<button
							type="button"
							onClick={() => handleGateChoice(false)}
							className="flex w-full flex-col gap-1 rounded-2xl border border-border bg-surface px-6 py-5 text-left transition-colors hover:border-accent"
						>
							<span className="font-semibold text-foreground">이대로 완료</span>
							<span className="text-sm text-muted">
								필수 질문 답변만으로 만들어요
							</span>
						</button>
					</div>
				) : (
					<QuestionStep
						question={step.question}
						value={answers[step.question.id]}
						onChange={(value) => setAnswer(step.question.id, value)}
					/>
				)}
			</StepTransition>

			{step.kind === "question" && (
				<div className="mt-6 flex justify-between">
					<button
						type="button"
						onClick={handleBack}
						className="rounded-full px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
					>
						이전
					</button>
					<button
						type="button"
						onClick={handleNext}
						disabled={
							step.question.required &&
							!isAnswerFilled(answers[step.question.id])
						}
						className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
					>
						다음
					</button>
				</div>
			)}
		</main>
	);
}

function QuestionStep({
	question,
	value,
	onChange,
}: {
	question: WizardQuestion;
	value: string | string[] | undefined;
	onChange: (value: string | string[]) => void;
}) {
	const activeNotes = question.notes?.filter(
		(note) => note.whenValue === value,
	);

	return (
		<div className="flex flex-col gap-4">
			<div>
				<h1 className="text-xl font-semibold text-foreground">
					{question.title}
				</h1>
				{question.description && (
					<p className="mt-1.5 text-muted">{question.description}</p>
				)}
				{question.glossaryNote && question.glossarySlug && (
					<Link
						href={`/glossary#${question.glossarySlug}`}
						target="_blank"
						rel="noopener noreferrer"
						className="mt-1.5 inline-block text-sm text-accent underline underline-offset-2"
					>
						{question.glossaryNote} ↗
					</Link>
				)}
			</div>

			{question.type === "radio" && question.options && (
				<RadioField
					options={question.options}
					value={typeof value === "string" ? value : undefined}
					onChange={onChange}
				/>
			)}
			{question.type === "checkbox" && question.options && (
				<CheckboxField
					options={question.options}
					value={Array.isArray(value) ? value : undefined}
					onChange={onChange}
				/>
			)}
			{question.type === "textarea" && (
				<TextareaField
					value={typeof value === "string" ? value : undefined}
					onChange={onChange}
					placeholder={question.placeholder}
				/>
			)}

			{activeNotes?.map((note) => (
				<p
					key={note.whenValue}
					className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent"
				>
					{note.message}{" "}
					{note.glossarySlug && (
						<Link
							href={`/glossary#${note.glossarySlug}`}
							target="_blank"
							rel="noopener noreferrer"
							className="underline underline-offset-2"
						>
							자세히 보기 ↗
						</Link>
					)}
				</p>
			))}
		</div>
	);
}
