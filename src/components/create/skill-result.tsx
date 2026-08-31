"use client";

import { useRef, useState } from "react";
import {
	GenerationErrorBanner,
	type GenerationErrorState,
} from "@/components/create/generation-error-banner";

export type ReferencedSource = {
	name: string;
	author: string;
	url: string;
	license: string;
	/** Tailor가 처음부터 만든 것 */
	self?: boolean;
	/** 원문을 번역·재해석해 담은 것 — 원 소스는 그대로 밝히되 손댔음을 표시한다 */
	adapted?: boolean;
};

export type GenerationResult = {
	skillMarkdown: string;
	reviewNotes: string[];
	clarifyingQuestions: string[];
	suggestedFilename: string;
	referencedSources?: ReferencedSource[];
	structureSources?: ReferencedSource[];
};

type SkillResultProps = {
	result: GenerationResult;
	audience: string | string[] | undefined;
	isRegenerating: boolean;
	generationError: GenerationErrorState | null;
	onRetry: () => void;
	onRegenerate: () => void;
	onStartRefine: () => void;
	onEditAnswers: () => void;
	onAddAdvanced?: () => void;
};

function downloadSkillMarkdown(content: string) {
	const blob = new Blob([content], { type: "text/markdown" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "SKILL.md";
	a.click();
	URL.revokeObjectURL(url);
}

function SourceRow({ source }: { source: ReferencedSource }) {
	return (
		<li className="flex flex-wrap items-center gap-x-2 gap-y-1">
			{source.url && !source.self ? (
				<a
					href={source.url}
					target="_blank"
					rel="noreferrer"
					className="font-medium text-foreground underline underline-offset-2 hover:text-accent"
				>
					{source.name}
				</a>
			) : (
				<span className="font-medium text-foreground">{source.name}</span>
			)}
			{/* 모든 행이 `이름 + 부가정보` 한 형태다. 자체 제작만 뱃지를 이름 앞에
			    달았더니 그 줄만 다른 것처럼 보였다. 부가정보 자리에 "우리가 만든
			    방식"이라고 풀어 쓰던 것도 Tailor-made로 통일한다 — 밖에서 온 것과
			    같은 자리에, 같은 무게로 적힌다. */}
			<span className="text-muted text-xs">
				{source.self ? "Tailor-made" : `${source.author} · ${source.license}`}
			</span>
			{/* 원문 그대로가 아니라 Tailor가 손봐서 담은 내용. 계보(원 소스)는 위에
			    그대로 밝히고, 손댔다는 사실만 덧붙인다. */}
			{source.adapted && !source.self && (
				<span className="rounded-full border border-border px-2 py-0.5 text-muted text-xs">
					Tailor 가공
				</span>
			)}
		</li>
	);
}

function SourcesSection({
	referencedSources,
	structureSources,
}: {
	referencedSources?: ReferencedSource[];
	structureSources?: ReferencedSource[];
}) {
	const hasPattern = (referencedSources?.length ?? 0) > 0;
	const hasStructure = (structureSources?.length ?? 0) > 0;
	if (!hasPattern && !hasStructure) return null;

	return (
		<div>
			<h2 className="text-sm font-semibold text-muted">참고한 자료</h2>
			<div className="mt-2 flex flex-col gap-4 rounded-2xl border border-border bg-surface px-5 py-4 text-sm">
				{hasPattern && (
					<div>
						<p className="text-foreground/80">
							이 스킬을 만들 때 아래 스킬들에서 정리한 패턴을 참고했어요.
						</p>
						<ul className="mt-2 flex flex-col gap-1.5">
							{referencedSources?.map((source) => (
								<SourceRow key={source.name} source={source} />
							))}
						</ul>
					</div>
				)}
				{hasStructure && (
					<div>
						<p className="text-foreground/80">
							문서 구조(형식)는 아래 스킬을 참고했어요.
						</p>
						<ul className="mt-2 flex flex-col gap-1.5">
							{structureSources?.map((source) => (
								<SourceRow key={source.name} source={source} />
							))}
						</ul>
					</div>
				)}
				<p className="text-muted text-xs">
					* 원문을 그대로 가져온 게 아니라, 공개 스킬에서 정리한 좋은 패턴을
					참고했다는 뜻이에요.
				</p>
			</div>
		</div>
	);
}

export function SkillResult({
	result,
	audience,
	isRegenerating,
	generationError,
	onRetry,
	onRegenerate,
	onStartRefine,
	onEditAnswers,
	onAddAdvanced,
}: SkillResultProps) {
	const refineButtonRef = useRef<HTMLButtonElement>(null);
	const [highlightRefine, setHighlightRefine] = useState(false);
	const hasPendingQuestions = result.clarifyingQuestions.length > 0;

	const jumpToRefineButton = () => {
		refineButtonRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "center",
		});
		setHighlightRefine(true);
		setTimeout(() => setHighlightRefine(false), 1600);
	};

	const buildTree = (rootLabel: string) =>
		[
			`${rootLabel}/`,
			"└─ .claude/",
			"   └─ skills/",
			`      └─ ${result.suggestedFilename}/`,
			"         └─ SKILL.md",
		].join("\n");
	const personalTree = buildTree("~  (내 컴퓨터의 홈 폴더)");
	const projectTree = buildTree("(작업 중인 프로젝트 폴더)");
	const suggestion =
		audience === "team"
			? "팀 공유용으로 답하셨으니 오른쪽이 더 맞을 것 같아요."
			: audience === "personal"
				? "개인용으로 답하셨으니 왼쪽이 더 맞을 것 같아요."
				: null;

	return (
		<div className="flex flex-col gap-5">
			<div>
				<h1 className="text-2xl font-semibold text-foreground">
					스킬이 완성됐어요
				</h1>
				<p className="mt-1.5 text-muted">
					아래 내용을 확인하고, 마음에 들지 않으면 다시 만들거나 답변을 고칠 수
					있어요.
				</p>
			</div>

			{/* 이 페이지에서 사용자 행동을 요구하는 것은 이것뿐이라 맨 위에 둔다.
			    종전에는 미리보기·점검내용·출처 아래에 있어 화면을 한참 내려야
			    보였고, 질문이 하나뿐일 때는 그대로 지나치기 쉬웠다.
			    질문 내용까지 여기서 보여준다 — 무엇을 묻는지 알려고 한 번 더
			    누르게 하지 않는다. */}
			{hasPendingQuestions && (
				<button
					type="button"
					onClick={jumpToRefineButton}
					className="flex flex-col gap-2 rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4 text-left transition-colors hover:border-accent"
				>
					<span className="flex items-center justify-between gap-3">
						<span className="font-medium text-foreground text-sm">
							Tailor가 궁금한 점이 있어요
							{result.clarifyingQuestions.length > 1
								? ` (${result.clarifyingQuestions.length}개)`
								: ""}
						</span>
						<span aria-hidden className="shrink-0 text-accent">
							↓
						</span>
					</span>
					<ul className="flex flex-col gap-1 text-muted text-sm">
						{result.clarifyingQuestions.map((question) => (
							<li key={question} className="flex gap-2">
								<span aria-hidden className="text-accent">
									·
								</span>
								<span>{question}</span>
							</li>
						))}
					</ul>
					<span className="text-muted text-xs">
						답하면 더 정확해져요. 그냥 넘어가도 괜찮아요.
					</span>
				</button>
			)}

			{/* 질문이 없을 때 이 자리를 비워두면 Tailor가 아무 말도 안 한 것처럼
			    보인다. 물어볼 게 없었다는 것도 결과의 일부라 한 줄로 알린다. */}
			{!hasPendingQuestions && (
				<p className="rounded-2xl border border-border px-5 py-4 text-muted text-sm">
					Tailor가 이번엔 따로 확인하고 싶은 부분이 없었어요. 고치고 싶은 곳이
					있으면 아래 "수정 요청하기"로 알려주세요.
				</p>
			)}

			<div>
				<h2 className="text-sm font-semibold text-muted">SKILL.md 미리보기</h2>
				<div className="mt-2 max-h-96 overflow-hidden rounded-2xl border border-border bg-surface">
					<pre className="my-4 max-h-[22rem] select-text overflow-y-auto whitespace-pre-wrap px-5 text-foreground/80 text-sm leading-relaxed">
						{result.skillMarkdown}
					</pre>
				</div>
			</div>

			{result.reviewNotes.length > 0 && (
				<div>
					<h2 className="text-sm font-semibold text-muted">
						AI가 스스로 점검한 내용
					</h2>
					<ul className="mt-2 flex flex-col gap-1.5 rounded-2xl border border-border bg-surface px-5 py-4 text-sm text-foreground/80">
						{result.reviewNotes.map((note) => (
							<li key={note} className="flex gap-2">
								<span aria-hidden className="text-accent">
									·
								</span>
								<span className="select-text">{note}</span>
							</li>
						))}
					</ul>
				</div>
			)}

			<SourcesSection
				referencedSources={result.referencedSources}
				structureSources={result.structureSources}
			/>

			<div>
				<h2 className="text-sm font-semibold text-muted">설치 방법</h2>
				<div className="mt-2 rounded-2xl border border-border bg-surface px-5 py-4">
					<p className="select-text text-foreground text-sm leading-relaxed">
						스킬은 SKILL.md라는 문서 하나예요. 보통{" "}
						<code className="rounded bg-background px-1.5 py-0.5 text-xs">
							.claude
						</code>
						라는 폴더를 만들고, 그 안에{" "}
						<code className="rounded bg-background px-1.5 py-0.5 text-xs">
							skills
						</code>
						라는 폴더를 하나 더 만들어서 스킬들을 모아둬요. Claude Code는 이
						폴더를 자동으로 인식해서, 관련된 상황이 오면 알아서 이 스킬을 찾아
						써요.
					</p>

					<p className="mt-3 select-text font-medium text-foreground text-sm">
						어디에 둘지는 "이 스킬을 얼마나 넓게 쓸지"로 정하면 돼요. 어느
						한쪽이 항상 정답인 건 아니에요.
					</p>
					<div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
						<div>
							<p className="select-text text-foreground text-sm">
								여러 프로젝트에서 계속 쓸 스킬이라면
							</p>
							<p className="mt-0.5 select-text text-muted text-xs">
								내 컴퓨터의 홈 폴더 기준. 어떤 프로젝트에서 작업하든 항상 쓸 수
								있어요.
							</p>
							<pre className="mt-2 select-text overflow-x-auto rounded-xl bg-background px-3 py-2 text-xs leading-relaxed">
								{personalTree}
							</pre>
						</div>
						<div>
							<p className="select-text text-foreground text-sm">
								이 프로젝트에서만 의미 있거나, 팀과 공유하고 싶다면
							</p>
							<p className="mt-0.5 select-text text-muted text-xs">
								작업 중인 프로젝트 폴더 기준. git으로 커밋하면 팀원도 함께 쓰고,
								다른 프로젝트에는 나타나지 않아요.
							</p>
							<pre className="mt-2 select-text overflow-x-auto rounded-xl bg-background px-3 py-2 text-xs leading-relaxed">
								{projectTree}
							</pre>
						</div>
					</div>
					<p className="mt-3 select-text text-muted text-sm leading-relaxed">
						다운로드한 파일을{" "}
						<code className="rounded bg-background px-1.5 py-0.5 text-xs">
							SKILL.md
						</code>
						라는 이름으로 위 경로에 저장하세요.
						{suggestion && ` ${suggestion} 물론 직접 골라도 괜찮아요.`}
					</p>
				</div>
			</div>

			<div>
				<h2 className="text-sm font-semibold text-muted">
					설치 후 이렇게 확인해보세요
				</h2>
				<ol className="mt-2 flex flex-col gap-1.5 rounded-2xl border border-border bg-surface px-5 py-4 text-foreground text-sm">
					<li>
						1. 새 대화를 열고, 스킬이 반응해야 할 상황을 실제로 말해보세요.
					</li>
					<li>2. Claude가 이 스킬을 사용했다고 알려주는지 확인하세요.</li>
					<li>
						3. 원하는 대로 동작하지 않으면, description의 트리거 조건을 더
						구체적으로 고쳐보세요.
					</li>
				</ol>
			</div>

			{generationError && (
				<GenerationErrorBanner
					key={generationError.receivedAt}
					error={generationError}
					onRetry={onRetry}
					isBusy={isRegenerating}
				/>
			)}

			<div className="flex flex-col gap-3">
				<div className="grid grid-cols-2 gap-3">
					{/*
					 * 실패가 서 있는 동안에는 잠근다. 다시 보낼지는 배너가 정한다 —
					 * 이 버튼이 열려 있으면 429 대기 시간을 그냥 건너뛴다. 다운로드와
					 * 답변 수정 같은 비생성 기능은 그대로 둔다.
					 */}
					<button
						type="button"
						onClick={onRegenerate}
						disabled={isRegenerating || generationError !== null}
						className="w-full rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
					>
						{isRegenerating ? "다시 만드는 중..." : "다시 생성하기"}
					</button>
					<button
						type="button"
						onClick={onEditAnswers}
						className="w-full rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
					>
						답변 수정하기
					</button>
				</div>
				{onAddAdvanced && (
					<button
						type="button"
						onClick={onAddAdvanced}
						className="w-full rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
					>
						고급 질문 추가로 답하고 다시 받아보기
					</button>
				)}
				<div className="grid grid-cols-2 gap-3">
					<button
						type="button"
						ref={refineButtonRef}
						onClick={onStartRefine}
						className={`relative w-full rounded-full border px-6 py-3 text-sm font-medium transition-all ${
							hasPendingQuestions
								? "border-accent bg-accent/5 text-accent hover:bg-accent/15"
								: "border-border text-foreground hover:border-accent hover:text-accent"
						} ${highlightRefine ? "ring-2 ring-accent ring-offset-2 ring-offset-background" : ""}`}
					>
						{hasPendingQuestions ? "질문 답하고 수정하기" : "수정 요청하기"}
						{hasPendingQuestions && (
							<span
								aria-hidden
								className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground"
							>
								{result.clarifyingQuestions.length}
							</span>
						)}
					</button>
					<button
						type="button"
						onClick={() => downloadSkillMarkdown(result.skillMarkdown)}
						className="w-full rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
					>
						SKILL.md 다운로드
					</button>
				</div>
			</div>
		</div>
	);
}
