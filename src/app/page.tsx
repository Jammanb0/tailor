import Link from "next/link";

export default function Home() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6 text-center">
			<div>
				<h1 className="text-4xl font-semibold text-foreground">Tailor</h1>
				<p className="mt-3 text-muted">
					처음이어도 괜찮아요. 나에게 맞는 Claude Code Skill을 만들어드려요.
				</p>
			</div>
			<div className="flex flex-col gap-3 sm:flex-row">
				<Link
					href="/glossary"
					className="rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
				>
					용어 알아보기
				</Link>
				<span
					aria-disabled
					className="flex flex-col items-center rounded-full bg-accent/40 px-6 py-3 text-sm font-medium text-accent-foreground/70"
				>
					스킬 만들기
					<span className="text-xs font-normal">곧 만나요</span>
				</span>
			</div>
		</main>
	);
}
