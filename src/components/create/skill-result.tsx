"use client";

export type GenerationResult = {
	skillMarkdown: string;
	reviewNotes: string[];
	suggestedFilename: string;
};

type SkillResultProps = {
	result: GenerationResult;
	audience: string | string[] | undefined;
	isRegenerating: boolean;
	onRegenerate: () => void;
	onEditAnswers: () => void;
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

export function SkillResult({
	result,
	audience,
	isRegenerating,
	onRegenerate,
	onEditAnswers,
}: SkillResultProps) {
	const isTeam = audience === "team";
	const installPath = isTeam
		? `해당 프로젝트의 .claude/skills/${result.suggestedFilename}/SKILL.md`
		: `~/.claude/skills/${result.suggestedFilename}/SKILL.md`;

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

			<div>
				<h2 className="text-sm font-semibold text-muted">SKILL.md 미리보기</h2>
				<pre className="mt-2 max-h-96 select-text overflow-auto whitespace-pre-wrap rounded-2xl border border-border bg-surface px-5 py-4 text-foreground/80 text-sm leading-relaxed">
					{result.skillMarkdown}
				</pre>
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

			<div className="rounded-2xl border border-border bg-surface px-5 py-4">
				<h2 className="text-sm font-semibold text-muted">설치 방법</h2>
				<p className="mt-1.5 select-text text-foreground text-sm">
					다운로드한 파일을 아래 경로에{" "}
					<code className="rounded bg-background px-1.5 py-0.5 text-xs">
						SKILL.md
					</code>
					라는 이름으로 저장하세요.
				</p>
				<code className="mt-2 block select-text rounded-xl bg-background px-3 py-2 text-xs">
					{installPath}
				</code>
			</div>

			<div className="rounded-2xl border border-border bg-surface px-5 py-4">
				<h2 className="text-sm font-semibold text-muted">
					설치 후 이렇게 확인해보세요
				</h2>
				<ol className="mt-2 flex flex-col gap-1.5 text-foreground text-sm">
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

			<div className="flex flex-wrap gap-3">
				<button
					type="button"
					onClick={() => downloadSkillMarkdown(result.skillMarkdown)}
					className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
				>
					SKILL.md 다운로드
				</button>
				<button
					type="button"
					onClick={onRegenerate}
					disabled={isRegenerating}
					className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
				>
					{isRegenerating ? "다시 만드는 중..." : "다시 생성하기"}
				</button>
				<button
					type="button"
					onClick={onEditAnswers}
					className="rounded-full px-6 py-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
				>
					답변 수정하기
				</button>
			</div>
		</div>
	);
}
