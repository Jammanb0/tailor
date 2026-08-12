import type { Metadata } from "next";
import Link from "next/link";
import { GalleryGrid } from "@/components/gallery-grid";
import { gallerySkills } from "@/data/gallery";

export const metadata: Metadata = {
	title: "스킬 갤러리 — Tailor",
	description:
		"초심자에게 도움이 될 만한 Claude Code 스킬들을 출처와 함께 모았어요.",
};

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
					초심자에게 도움이 될 만한 스킬들을 모았어요. 카드를 눌러 자세히 보고,
					마음에 들면 다운로드하거나 원본을 참고하세요.
				</p>
				<p className="mt-1 text-muted text-sm">
					Tailor가 직접 만든 건{" "}
					<span className="font-semibold text-accent">Tailor-made</span>로
					표시되고 다운로드할 수 있어요. 외부 스킬은 출처를 밝혀 소개하고
					원본으로 링크해요.
				</p>
				<div className="mt-8">
					<GalleryGrid skills={gallerySkills} />
				</div>
			</div>
		</main>
	);
}
