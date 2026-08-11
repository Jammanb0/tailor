export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
			<h1 className="text-3xl font-semibold text-foreground">Tailor</h1>
			<p className="text-muted">
				초심자를 위한 Claude Code Skill 생성 서비스 — 준비 중
			</p>
			<button
				type="button"
				className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
			>
				시작하기
			</button>
		</main>
	);
}
