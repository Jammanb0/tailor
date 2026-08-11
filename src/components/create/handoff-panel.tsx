"use client";

import { useState } from "react";

const HANDOFF_PROMPT = [
	"초심자를 위한 Claude Code Skill(SKILL.md)을 만드는 걸 도와줘.",
	"",
	"아래 순서로 진행해줘.",
	"1. 나에게 이런 걸 순서대로 물어봐: 어떤 상황에서 뭘 하게 하고 싶은지, ",
	"   속도·품질·비용 중 뭘 우선할지, AI가 알아서 실행해도 되는 일인지 ",
	"   사람 확인이 필요한 일인지, 얼마나 자주 하는 작업인지, 개인용인지 ",
	"   팀 공유용인지, 완성될 스킬은 어떤 언어(한국어/영어)로 쓸지.",
	"2. 답을 다 들은 다음 SKILL.md 초안을 보여주고, 내가 괜찮다고 할 때까지 ",
	"   저장하지 마.",
	"3. 승인하면 어디에 저장할지(개인용: ~/.claude/skills/, 프로젝트 공유용: ",
	"   해당 프로젝트의 .claude/skills/) 물어봐.",
	"4. 저장 직전에 한 번 더 확인받고 나서만 파일을 만들어줘.",
].join("\n");

const encodedPrompt = encodeURIComponent(HANDOFF_PROMPT);

export function HandoffPanel({ onBack }: { onBack: () => void }) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(HANDOFF_PROMPT);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			setCopied(false);
		}
	};

	return (
		<div className="flex flex-col gap-4">
			<div>
				<h1 className="text-2xl font-semibold text-foreground">
					내 Claude로 이어서 만들기
				</h1>
				<p className="mt-1.5 text-muted">
					아래 버튼으로 내 Claude를 열면, 그 안에서 질문에 답하며 스킬을 만들 수
					있어요.
				</p>
			</div>

			<div className="flex flex-col gap-2.5 sm:flex-row">
				<a
					href={`claude://code/new?q=${encodedPrompt}`}
					className="flex flex-1 items-center justify-center rounded-full bg-accent px-6 py-3 text-center text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
				>
					Claude 데스크톱 앱에서 열기
				</a>
				<a
					href={`claude-cli://open?q=${encodedPrompt}`}
					className="flex flex-1 items-center justify-center rounded-full border border-border bg-surface px-6 py-3 text-center text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
				>
					Claude Code CLI에서 열기
				</a>
			</div>

			<div className="rounded-2xl border border-border bg-surface px-5 py-4">
				<p className="text-sm text-muted">
					버튼을 눌러도 안 열린다면, 아직 이 컴퓨터에 Claude 앱/CLI가 연결돼
					있지 않은 거예요. 아래 문구를 복사해서 Claude 대화창에 붙여넣어
					주세요.
				</p>
				<pre className="mt-3 select-text overflow-x-auto whitespace-pre-wrap rounded-xl bg-background px-4 py-3 text-xs text-foreground/80 leading-relaxed">
					{HANDOFF_PROMPT}
				</pre>
				<button
					type="button"
					onClick={handleCopy}
					className="mt-3 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
				>
					{copied ? "복사했어요" : "문구 복사하기"}
				</button>
			</div>

			<p className="text-sm text-muted">
				Claude 앱이나 CLI가 아직 없으신가요? claude.ai에서 데스크톱 앱을
				내려받거나, 터미널에서{" "}
				<code className="select-text rounded bg-surface px-1.5 py-0.5 text-xs">
					npm install -g @anthropic-ai/claude-code
				</code>
				로 CLI를 설치할 수 있어요.
			</p>

			<button
				type="button"
				onClick={onBack}
				className="self-start text-sm text-muted transition-colors hover:text-accent"
			>
				← 다른 방법으로 만들기
			</button>
		</div>
	);
}
