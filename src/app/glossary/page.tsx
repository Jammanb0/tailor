import type { Metadata } from "next";
import Link from "next/link";
import { GlossaryGrid } from "@/components/glossary-grid";
import { glossaryTerms } from "@/data/glossary";

export const metadata: Metadata = {
	title: "용어 사전 — Tailor",
	description: "스크립트, 에이전트, 스킬 같은 용어를 쉬운 비유로 설명합니다.",
};

export default function GlossaryPage() {
	return (
		<main className="mx-auto min-h-screen max-w-3xl px-6 py-16 sm:py-24">
			<Link
				href="/"
				className="text-sm text-muted transition-colors hover:text-accent"
			>
				← 홈으로
			</Link>
			<h1 className="mt-4 text-3xl font-semibold text-foreground">용어 사전</h1>
			<p className="mt-2 text-muted">
				궁금한 용어를 눌러서 쉬운 설명을 확인해보세요.
			</p>
			<div className="mt-8">
				<GlossaryGrid terms={glossaryTerms} />
			</div>
		</main>
	);
}
