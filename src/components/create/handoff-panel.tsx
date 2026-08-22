"use client";

import { useState } from "react";

const HANDOFF_PROMPT = [
	"자기만의 Claude Code Skill(SKILL.md)을 만드는 걸 도와줘.",
	"",
	"네가 실제 프로젝트 파일을 보고 있으니, 아래 내용을 자연스러운 대화로",
	"물어봐줘. 이미 답이 명백해 보이는 게 있으면 굳이 다시 묻지 말고 확인만",
	"해도 돼.",
	"",
	"[꼭 파악할 것]",
	"- 어떤 상황에서, 어떤 일을 하게 하고 싶은지 (순서가 있다면 순서까지)",
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
	"- 마지막에 '완료 전 확인' 절을 넣어줘 — 무엇이 있어야 '끝났다'고 말할 수",
	"  있는지. 돌려볼 것이 있으면 돌려서 결과를 읽고, 없으면 앞에 적어둔",
	"  조건을 한 줄씩 짚게 해줘",
	"- 쉽게 쓴다고 기술 용어나 구체적인 값을 빼지는 마. 대신 처음 나오는",
	"  용어에 짧은 풀이를 붙여줘",
	"",
	"[진행 순서]",
	"1. 위 내용을 다 들은 다음 SKILL.md 초안을 보여줘. 내가 괜찮다고 할",
	"   때까지 저장하지 마.",
	"2. 승인하면 어디에 저장할지 물어봐 (개인용: ~/.claude/skills/,",
	"   프로젝트 공유용: 해당 프로젝트의 .claude/skills/).",
	"3. 저장 직전에 한 번 더 확인받고 나서만 파일을 만들어줘.",
	"4. 저장한 뒤에는 이 스킬이 실제로 불려 나오는지 확인하는 방법을 짧게",
	"   알려줘 — 어떻게 말을 걸면 이 스킬이 뜨는지, 안 뜨면 뭘 볼지.",
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

			{/* 두 경로의 차이를 고르기 전에 알린다. "성능이 낮다"고만 적으면 무엇이
			    어떻게 다른지 알 수 없어 판단에 쓸 수 없으므로, 빠지는 것과 대신
			    얻는 것을 같이 적는다. */}
			<div className="rounded-2xl border border-border bg-surface px-5 py-4 text-muted text-sm">
				<p>
					<span className="font-medium text-foreground">
						문서의 짜임새는 웹에서 만드는 쪽이 대체로 낫습니다.
					</span>{" "}
					Tailor가 공개 스킬에서 정리해 둔 참고 패턴과 문서 골격은 링크 하나에
					담기엔 너무 커서, 이 경로로는 함께 넘기지 못해요. 결과에 출처 표기도
					붙지 않습니다.
				</p>
				<p className="mt-2">
					대신 이쪽은 Claude가{" "}
					<span className="text-foreground">실제 프로젝트 파일을 보면서</span>{" "}
					물어볼 수 있고, 만드는 데 드는 비용도 본인 Claude 계정으로 나갑니다.
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
