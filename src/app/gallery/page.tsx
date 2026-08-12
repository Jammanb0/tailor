import type { Metadata } from "next";
import Link from "next/link";
import {
	type ReferencePattern,
	type ReferenceSource,
	referenceCategories,
} from "@/data/reference-corpus";

export const metadata: Metadata = {
	title: "스킬 갤러리 — Tailor",
	description:
		"초심자에게 도움이 될 만한 공개 Claude Code 스킬들을 출처와 함께 모았어요.",
};

// 이 스킬에서 우리가 정리한 "좋은 점"(패턴 요약) 목록.
function goodPointsForSource(
	patterns: ReferencePattern[],
	sourceId: string,
): string[] {
	return patterns
		.filter((pattern) => pattern.sourceIds.includes(sourceId))
		.map((pattern) => pattern.summary);
}

function SkillCard({
	source,
	goodPoints,
}: {
	source: ReferenceSource;
	goodPoints: string[];
}) {
	return (
		<div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface px-5 py-4">
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
				{source.self && (
					<span className="rounded-full bg-accent/15 px-2 py-0.5 font-semibold text-accent text-xs">
						Tailor-made
					</span>
				)}
				{source.url && !source.self ? (
					<a
						href={source.url}
						target="_blank"
						rel="noreferrer"
						className="font-semibold text-foreground underline underline-offset-2 hover:text-accent"
					>
						{source.name}
					</a>
				) : (
					<span className="font-semibold text-foreground">{source.name}</span>
				)}
			</div>
			<p className="text-muted text-xs">
				{source.self
					? "Tailor가 직접 만든 방식"
					: `${source.author} · ${source.license}`}
			</p>
			{goodPoints.length > 0 && (
				<ul className="flex flex-col gap-1 text-foreground/80 text-sm">
					{goodPoints.map((point) => (
						<li key={point} className="flex gap-2">
							<span aria-hidden className="text-accent">
								·
							</span>
							<span>{point}</span>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

export default function GalleryPage() {
	return (
		<main className="min-h-screen w-full">
			<Link
				href="/"
				className="fixed top-6 left-6 z-30 text-sm text-muted transition-colors hover:text-accent"
			>
				← 홈으로
			</Link>
			<div className="mx-auto max-w-4xl px-6 py-16 sm:py-24">
				<h1 className="text-3xl font-semibold text-foreground">스킬 갤러리</h1>
				<p className="mt-2 text-muted">
					초심자에게 도움이 될 만한 공개 스킬들을 모았어요. 카드를 눌러 원본을
					보고, 마음에 들면 참고하세요.
				</p>
				<p className="mt-1 text-muted text-sm">
					원문을 그대로 가져온 게 아니라 출처를 밝혀 소개해요. Tailor가 직접
					만든 건 <span className="font-semibold text-accent">Tailor-made</span>
					로 표시돼요.
				</p>
				<div className="mt-10 flex flex-col gap-10">
					{referenceCategories.map((category) => (
						<section key={category.id}>
							<h2 className="text-lg font-semibold text-foreground">
								{category.label}
							</h2>
							<div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
								{category.sources.map((source) => (
									<SkillCard
										key={source.id}
										source={source}
										goodPoints={goodPointsForSource(
											category.patterns,
											source.id,
										)}
									/>
								))}
							</div>
						</section>
					))}
				</div>
			</div>
		</main>
	);
}
