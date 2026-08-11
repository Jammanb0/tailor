"use client";

import { useState } from "react";

const HANDOFF_PROMPT = [
	"초심자를 위한 Claude Code Skill(SKILL.md)을 만드는 걸 도와줘.",
	"",
	"네가 실제 프로젝트 파일을 보고 있으니, 아래 내용을 자연스러운 대화로",
	"물어봐줘. 이미 답이 명백해 보이는 게 있으면 굳이 다시 묻지 말고 확인만",
	"해도 돼.",
	"",
	"[꼭 파악할 것]",
	"- 어떤 상황에서, 어떤 일을 하게 하고 싶은지 (순서가 있다면 순서까지)",
	"- 속도·품질·비용 중 뭘 더 중요하게 볼지",
	"- 참고할 만한 비슷한 스킬이나 예시가 있는지 (없어도 됨)",
	"- 완성된 스킬을 한국어/영어 중 어떤 언어로 쓸지 (한국어 추천)",
	"",
	"[더 정확하게 만들고 싶다면 추가로 파악할 것 — 물어보되, 부담스러워하면",
	"건너뛰어도 된다고 알려줘]",
	"- AI가 알아서 실행해도 되는 일인지, 사람 확인이 필요한 일인지",
	"  (구체적 예시로)",
	"- 쓸 때마다 다루는 파일 이름이나 번호 같은 게 달라지는 작업인지",
	"- 얼마나 자주 쓸 것 같은지 — 정말 자주 쓴다면 스킬보다 '루틴' 기능이",
	"  더 맞을 수 있다고 알려줘",
	"- 파일 읽기 / 수정 / 명령 실행 중 어디까지 필요한지",
	"- 개인용으로 쓸지, 팀과 공유할지",
	"- 꼭 하지 않았으면 하는 행동이 있는지",
	"",
	"[SKILL.md 작성 시]",
	"- frontmatter에 name과 description(이 스킬을 언제 써야 하는지 트리거",
	"  조건)을 담아줘",
	"- 본문에는 실행 절차를 구체적인 단계로 적어줘",
	"",
	"[진행 순서]",
	"1. 위 내용을 다 들은 다음 SKILL.md 초안을 보여줘. 내가 괜찮다고 할",
	"   때까지 저장하지 마.",
	"2. 승인하면 어디에 저장할지 물어봐 (개인용: ~/.claude/skills/,",
	"   프로젝트 공유용: 해당 프로젝트의 .claude/skills/).",
	"3. 저장 직전에 한 번 더 확인받고 나서만 파일을 만들어줘.",
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
