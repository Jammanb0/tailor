"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnswerPreview } from "@/components/create/answer-preview";
import { AnswersSidePanel } from "@/components/create/answers-side-panel";
import { GeneratingScreen } from "@/components/create/generating-screen";
import { GlossarySidePanel } from "@/components/create/glossary-side-panel";
import { HandoffPanel } from "@/components/create/handoff-panel";
import { PathFork } from "@/components/create/path-fork";
import {
	type GenerationResult,
	SkillResult,
} from "@/components/create/skill-result";
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

type Stage =
	| "fork"
	| "handoff"
	| "form"
	| "preview"
	| "generating"
	| "result"
	| "refining";
type Step = { kind: "question"; question: WizardQuestion } | { kind: "gate" };
type EditSnapshot = {
	questionId: string;
	value: string | string[] | undefined;
};
type RefinementPayload = {
	userFeedback: string;
	answeredQuestions: { question: string; answer: string }[];
};
type RefineStep = { kind: "question"; question: string } | { kind: "feedback" };

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

function buildRefineSteps(clarifyingQuestions: string[]): RefineStep[] {
	return [
		...clarifyingQuestions.map((question) => ({
			kind: "question" as const,
			question,
		})),
		{ kind: "feedback" as const },
	];
}

const STORAGE_KEY = "tailor:wizard-state";
// 질문 구성(문항 수/순서)이 바뀌면 옛 저장값의 index가 새 구성과
// 어긋날 수 있으므로 반드시 올려서 옛 저장값을 무시하게 만들 것.
const STORAGE_VERSION = 1;
// 하루 넘게 방치된 답변은 상황이 바뀌었을 가능성이 커서 복원하지 않음.
const STORAGE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

type PersistedState = {
	version: number;
	savedAt: number;
	stage: Stage;
	wantsAdvanced: boolean | null;
	index: number;
	answers: WizardAnswers;
};

function HomeLink() {
	return (
		<Link
			href="/"
			className="fixed top-6 left-6 z-30 text-sm text-muted transition-colors hover:text-accent"
		>
			← 홈으로
		</Link>
	);
}

export default function CreatePage() {
	const [stage, setStage] = useState<Stage>("fork");
	const [wantsAdvanced, setWantsAdvanced] = useState<boolean | null>(null);
	const [index, setIndex] = useState(0);
	const [direction, setDirection] = useState(1);
	const [answers, setAnswers] = useState<WizardAnswers>({});
	const [editSnapshot, setEditSnapshot] = useState<EditSnapshot | null>(null);
	const [openGlossarySlug, setOpenGlossarySlug] = useState<string | null>(null);
	const [confirmingRestart, setConfirmingRestart] = useState(false);
	const [generationResult, setGenerationResult] =
		useState<GenerationResult | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [generationError, setGenerationError] = useState<string | null>(null);
	const [refineIndex, setRefineIndex] = useState(0);
	const [refineDirection, setRefineDirection] = useState(1);
	const [refineAnswers, setRefineAnswers] = useState<Record<string, string>>(
		{},
	);
	const [refineFeedback, setRefineFeedback] = useState("");
	const [refineHistory, setRefineHistory] = useState<
		{ question: string; answer: string }[]
	>([]);
	const [refineFeedbackHistory, setRefineFeedbackHistory] = useState<string[]>(
		[],
	);
	const [showAnswersPanel, setShowAnswersPanel] = useState(false);
	// 마운트 시 복원을 시도하기 전까지는 저장을 건너뜀 — 그렇지 않으면
	// 복원 effect의 setState가 반영되기 전에 저장 effect가 먼저 실행돼
	// 기본값으로 저장값을 덮어써버리는 경쟁 상태가 생김.
	const [hasHydrated, setHasHydrated] = useState(false);
	// 저장된 답변을 발견했지만 아직 "이어서 할지" 묻지 않은 상태.
	// 사용자가 고르기 전까지는 화면에 조용히 반영하지 않음 — 그렇지 않으면
	// "스킬 만들기"를 다시 눌렀을 뿐인데 예전 답변으로 곧장 넘어가버려서
	// 뭔가 잘못됐다고 느끼게 됨.
	const [pendingRestore, setPendingRestore] = useState<PersistedState | null>(
		null,
	);

	useEffect(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const saved: PersistedState = JSON.parse(raw);
				const isFresh =
					saved.version === STORAGE_VERSION &&
					Date.now() - saved.savedAt < STORAGE_MAX_AGE_MS;
				// 생성된 결과물이나 2차 작업 진행 상태는 저장하지 않고,
				// 생성 중이던 요청도 새로고침하면 끊기므로 세 단계 모두
				// preview로 취급해서 답변은 살리고 다시 시도할 수 있게 함.
				const restoredStage: Stage =
					saved.stage === "result" ||
					saved.stage === "generating" ||
					saved.stage === "refining"
						? "preview"
						: saved.stage;
				// fork/handoff는 아직 답변이 없는 진입 화면이라 이어서 할
				// 진행 상황이 없음.
				const hasProgress =
					restoredStage === "form" || restoredStage === "preview";
				// 저장된 index가 지금 질문 구성 범위를 벗어나면(질문 추가/삭제 등)
				// 복원하지 않음.
				const inBounds =
					saved.index >= 0 &&
					saved.index < buildSteps(saved.wantsAdvanced).length;

				if (isFresh && hasProgress && inBounds) {
					setPendingRestore({ ...saved, stage: restoredStage });
				} else {
					localStorage.removeItem(STORAGE_KEY);
				}
			}
		} catch {
			// 손상된 저장값은 무시하고 기본 상태로 시작
			try {
				localStorage.removeItem(STORAGE_KEY);
			} catch {}
		}
		setHasHydrated(true);
	}, []);

	useEffect(() => {
		// 복원 여부를 아직 안 물어본 상태에서 저장하면, 그 사이에 방금
		// 읽은 저장값을 기본값(빈 답변)으로 덮어써버림.
		if (!hasHydrated || pendingRestore) return;
		try {
			const toSave: PersistedState = {
				version: STORAGE_VERSION,
				savedAt: Date.now(),
				stage,
				wantsAdvanced,
				index,
				answers,
			};
			localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
		} catch {
			// 저장 실패(용량 초과 등)는 진행에 영향 없으므로 무시
		}
	}, [hasHydrated, pendingRestore, stage, wantsAdvanced, index, answers]);

	const handleResume = () => {
		if (!pendingRestore) return;
		setStage(pendingRestore.stage);
		setWantsAdvanced(pendingRestore.wantsAdvanced);
		setIndex(pendingRestore.index);
		setAnswers(pendingRestore.answers);
		setPendingRestore(null);
	};

	const handleDiscardRestore = () => {
		setPendingRestore(null);
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			// 무시 — 다음 저장 시 어차피 덮어써짐
		}
	};

	const steps = buildSteps(wantsAdvanced);
	const step = steps[index];

	const goTo = (nextIndex: number, dir: number) => {
		setDirection(dir);
		setIndex(nextIndex);
	};

	const handleNext = () => {
		if (editSnapshot) {
			setEditSnapshot(null);
			setStage("preview");
			return;
		}
		if (index + 1 >= steps.length) {
			setStage("preview");
			return;
		}
		goTo(index + 1, 1);
	};

	const handleBack = () => {
		if (editSnapshot) {
			setAnswers((prev) => ({
				...prev,
				[editSnapshot.questionId]: editSnapshot.value,
			}));
			setEditSnapshot(null);
			setStage("preview");
			return;
		}
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

	const handleAddAdvanced = () => {
		const stepsWithAdvanced = buildSteps(true);
		const targetIndex = stepsWithAdvanced.findIndex(
			(s) => s.kind === "question" && s.question.id === advancedQuestions[0].id,
		);
		setWantsAdvanced(true);
		setStage("form");
		goTo(targetIndex, 1);
	};

	const handleRestart = () => {
		setStage("fork");
		setWantsAdvanced(null);
		setAnswers({});
		setEditSnapshot(null);
		setOpenGlossarySlug(null);
		setConfirmingRestart(false);
		setGenerationResult(null);
		setGenerationError(null);
		setRefineHistory([]);
		setRefineFeedbackHistory([]);
		goTo(0, -1);
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			// 무시 — 다음 저장 시 어차피 덮어써짐
		}
	};

	const setAnswer = (id: string, value: string | string[]) => {
		setAnswers((prev) => ({ ...prev, [id]: value }));
	};

	const handleStartRefine = () => {
		setRefineIndex(0);
		setRefineDirection(1);
		setRefineAnswers({});
		setRefineFeedback("");
		setStage("refining");
	};

	const handleRefineBack = () => {
		if (refineIndex === 0) {
			setStage("result");
			return;
		}
		setRefineDirection(-1);
		setRefineIndex((i) => i - 1);
	};

	const handleRefineNext = (refineSteps: RefineStep[]) => {
		if (refineIndex + 1 >= refineSteps.length) {
			const answeredQuestions = refineSteps
				.filter((s) => s.kind === "question")
				.map((s) => ({
					question: s.question,
					answer: refineAnswers[s.question] ?? "",
				}));
			// "이전 답변 보기" 패널에서도 확인할 수 있도록 이번 회차에 답한
			// 내용을 누적해둠 — 답이 있는 것만 남김.
			setRefineHistory((prev) => [
				...prev,
				...answeredQuestions.filter((a) => a.answer.trim()),
			]);
			if (refineFeedback.trim()) {
				setRefineFeedbackHistory((prev) => [...prev, refineFeedback.trim()]);
			}
			handleGenerate({
				userFeedback: refineFeedback,
				answeredQuestions,
			});
			return;
		}
		setRefineDirection(1);
		setRefineIndex((i) => i + 1);
	};

	const handleGenerate = async (refinement?: RefinementPayload) => {
		// 정제(2차 작업)는 항상 이미 결과가 있는 상태에서만 일어나므로,
		// 실패해도 미리보기로 되돌리지 않고 결과 화면에 머물게 함.
		const originStage = generationResult ? "result" : "preview";
		setIsGenerating(true);
		setGenerationError(null);
		setStage("generating");
		try {
			const res = await fetch("/api/generate-skill", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					answers,
					wantsAdvanced: wantsAdvanced === true,
					refinement: refinement
						? {
								previousSkillMarkdown: generationResult?.skillMarkdown ?? "",
								userFeedback: refinement.userFeedback,
								answeredQuestions: refinement.answeredQuestions,
							}
						: undefined,
				}),
			});
			let data: (GenerationResult & { error?: string }) | null = null;
			try {
				data = await res.json();
			} catch {
				// 응답 본문이 비어있거나 손상된 경우 — 네트워크 문제 등
			}
			if (!res.ok || !data) {
				throw new Error(data?.error ?? "알 수 없는 오류가 발생했어요.");
			}
			setGenerationResult(data);
			setStage("result");
		} catch (error) {
			setGenerationError(
				error instanceof Error
					? error.message
					: "알 수 없는 오류가 발생했어요.",
			);
			setStage(originStage);
		} finally {
			setIsGenerating(false);
		}
	};

	if (stage === "fork") {
		return (
			<main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-16">
				<HomeLink />
				{pendingRestore ? (
					<div className="flex flex-col gap-4">
						<div>
							<h1 className="text-2xl font-semibold text-foreground">
								이어서 만들던 스킬이 있어요
							</h1>
							<p className="mt-1.5 text-muted">
								저장된 답변을 이어서 쓸까요, 아니면 새로 시작할까요?
							</p>
						</div>
						<button
							type="button"
							onClick={handleResume}
							className="flex w-full flex-col gap-1 rounded-2xl border border-accent bg-accent/10 px-6 py-5 text-left transition-colors hover:bg-accent/15"
						>
							<span className="font-semibold text-accent">이어서 하기</span>
							<span className="text-sm text-muted">
								답하던 질문부터 다시 시작해요
							</span>
						</button>
						<button
							type="button"
							onClick={handleDiscardRestore}
							className="flex w-full flex-col gap-1 rounded-2xl border border-border bg-surface px-6 py-5 text-left transition-colors hover:border-accent"
						>
							<span className="font-semibold text-foreground">
								새로 시작하기
							</span>
							<span className="text-sm text-muted">
								저장된 답변을 지우고 처음부터 만들어요
							</span>
						</button>
					</div>
				) : (
					<PathFork
						onSelectWeb={() => setStage("form")}
						onSelectHandoff={() => setStage("handoff")}
					/>
				)}
			</main>
		);
	}

	if (stage === "handoff") {
		return (
			<main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-16">
				<HomeLink />
				<HandoffPanel onBack={() => setStage("fork")} />
			</main>
		);
	}

	if (stage === "preview") {
		return (
			<main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-16">
				<HomeLink />
				<AnswerPreview
					answers={answers}
					wantsAdvanced={wantsAdvanced === true}
					onSelectQuestion={(questionId) => {
						const targetIndex = steps.findIndex(
							(s) => s.kind === "question" && s.question.id === questionId,
						);
						if (targetIndex === -1) return;
						setEditSnapshot({ questionId, value: answers[questionId] });
						setStage("form");
						goTo(targetIndex, -1);
					}}
					onAddAdvanced={wantsAdvanced === true ? undefined : handleAddAdvanced}
					confirmingRestart={confirmingRestart}
					onRequestRestart={() => setConfirmingRestart(true)}
					onCancelRestart={() => setConfirmingRestart(false)}
					onConfirmRestart={handleRestart}
					onGenerate={() => handleGenerate()}
					isGenerating={isGenerating}
					generationError={generationError}
					onReturnToResult={
						generationResult ? () => setStage("result") : undefined
					}
				/>
			</main>
		);
	}

	if (stage === "generating") {
		return (
			<main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-16">
				<HomeLink />
				<GeneratingScreen />
			</main>
		);
	}

	if (stage === "result" && generationResult) {
		return (
			<div className="flex min-h-screen overflow-x-clip">
				<div className="min-w-0 flex-1">
					<main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-16">
						<HomeLink />
						<div className="mb-3 flex justify-end">
							<button
								type="button"
								onClick={() => setShowAnswersPanel(true)}
								className="text-sm text-muted transition-colors hover:text-accent"
							>
								이전 답변 보기
							</button>
						</div>
						<SkillResult
							result={generationResult}
							audience={answers.audience}
							isRegenerating={isGenerating}
							generationError={generationError}
							onRegenerate={() => handleGenerate()}
							onStartRefine={handleStartRefine}
							onEditAnswers={() => setStage("preview")}
						/>
					</main>
				</div>
				<AnswersSidePanel
					isOpen={showAnswersPanel}
					onClose={() => setShowAnswersPanel(false)}
					answers={answers}
					wantsAdvanced={wantsAdvanced === true}
					refineHistory={refineHistory}
					refineFeedbackHistory={refineFeedbackHistory}
				/>
			</div>
		);
	}

	if (stage === "refining" && generationResult) {
		const refineSteps = buildRefineSteps(generationResult.clarifyingQuestions);
		const refineStep = refineSteps[refineIndex];
		const isLastRefineStep = refineIndex + 1 >= refineSteps.length;

		return (
			<div className="flex min-h-screen overflow-x-clip">
				<div className="min-w-0 flex-1">
					<main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-16">
						<HomeLink />
						<div className="mb-3 flex justify-end">
							<button
								type="button"
								onClick={() => setShowAnswersPanel(true)}
								className="text-sm text-muted transition-colors hover:text-accent"
							>
								이전 답변 보기
							</button>
						</div>
						<div className="mb-8">
							<WizardProgress
								current={refineIndex + 1}
								total={refineSteps.length}
								label="2차 작업"
							/>
						</div>

						<StepTransition
							stepKey={`refine-${refineIndex}`}
							direction={refineDirection}
						>
							{refineStep.kind === "question" ? (
								<div className="flex flex-col gap-4">
									<div>
										<h1 className="text-xl font-semibold text-foreground">
											{refineStep.question}
										</h1>
										<p className="mt-1.5 text-muted">
											AI가 확인하고 싶은 부분이에요. 답하지 않고 넘어가도 돼요.
										</p>
									</div>
									<TextareaField
										value={refineAnswers[refineStep.question]}
										onChange={(value) =>
											setRefineAnswers((prev) => ({
												...prev,
												[refineStep.question]: value,
											}))
										}
										placeholder="답변을 적어주세요 (선택)"
									/>
								</div>
							) : (
								<div className="flex flex-col gap-4">
									<div>
										<h1 className="text-xl font-semibold text-foreground">
											이 부분은 이렇게 고쳐주세요
										</h1>
										<p className="mt-1.5 text-muted">
											{generationResult.clarifyingQuestions.length === 0
												? "AI가 이번엔 따로 확인하고 싶은 부분이 없었대요. 그래도 고치고 싶은 부분이 있으면 적어주세요."
												: "선택 사항이에요. 없으면 비워두고 마쳐도 괜찮아요."}
										</p>
									</div>
									<TextareaField
										value={refineFeedback}
										onChange={setRefineFeedback}
										placeholder="예: 확인 없이 파일을 지우는 부분은 빼줘"
									/>
								</div>
							)}
						</StepTransition>

						<div className="mt-6 flex justify-between">
							<button
								type="button"
								onClick={handleRefineBack}
								className="rounded-full px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
							>
								{refineIndex === 0 ? "취소" : "이전"}
							</button>
							<button
								type="button"
								onClick={() => handleRefineNext(refineSteps)}
								disabled={isGenerating}
								className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isLastRefineStep ? "수정 반영하기" : "다음"}
							</button>
						</div>
					</main>
				</div>
				<AnswersSidePanel
					isOpen={showAnswersPanel}
					onClose={() => setShowAnswersPanel(false)}
					answers={answers}
					wantsAdvanced={wantsAdvanced === true}
					refineHistory={refineHistory}
					refineFeedbackHistory={refineFeedbackHistory}
				/>
			</div>
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
		<div className="flex min-h-screen overflow-x-clip">
			<div className="min-w-0 flex-1">
				<main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-6 py-16">
					<HomeLink />
					<div className="mb-8">
						<WizardProgress
							current={index + 1}
							total={steps.length}
							label={phaseLabel}
						/>
					</div>

					<StepTransition
						stepKey={`${index}-${step.kind}`}
						direction={direction}
					>
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
									<span className="font-semibold text-foreground">
										이대로 완료
									</span>
									<span className="text-sm text-muted">
										필수 질문 답변만으로 만들어요 (나중에 미리보기 화면에서 다시
										추가할 수 있어요)
									</span>
								</button>
							</div>
						) : (
							<QuestionStep
								question={step.question}
								value={answers[step.question.id]}
								onChange={(value) => setAnswer(step.question.id, value)}
								onOpenGlossary={setOpenGlossarySlug}
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
								{editSnapshot ? "취소" : "이전"}
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
								{editSnapshot ? "저장하고 돌아가기" : "다음"}
							</button>
						</div>
					)}
				</main>
			</div>

			<GlossarySidePanel
				slug={openGlossarySlug}
				onClose={() => setOpenGlossarySlug(null)}
			/>
		</div>
	);
}

function QuestionStep({
	question,
	value,
	onChange,
	onOpenGlossary,
}: {
	question: WizardQuestion;
	value: string | string[] | undefined;
	onChange: (value: string | string[]) => void;
	onOpenGlossary: (slug: string) => void;
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
					<button
						type="button"
						onClick={() => onOpenGlossary(question.glossarySlug as string)}
						className="mt-1.5 inline-block text-left text-sm text-accent underline underline-offset-2"
					>
						{question.glossaryNote}
					</button>
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
						<button
							type="button"
							onClick={() => onOpenGlossary(note.glossarySlug as string)}
							className="underline underline-offset-2"
						>
							자세히 보기
						</button>
					)}
				</p>
			))}
		</div>
	);
}
