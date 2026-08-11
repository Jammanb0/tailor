import type { Metadata } from "next";
import Link from "next/link";
import { GlossaryGrid } from "@/components/glossary-grid";
import { ScrollToTopButton } from "@/components/scroll-to-top-button";
import { glossaryTerms } from "@/data/glossary";

export const metadata: Metadata = {
	title: "용어 사전 — Tailor",
	description: "스크립트, 에이전트, 스킬 같은 용어를 쉬운 비유로 설명합니다.",
};

export default function GlossaryPage() {
	return (
		<main className="min-h-screen w-full">
			{/* mx-auto/max-w는 여기 안쪽 wrapper에만 둠 — main 자체에 두면
			    layout.tsx의 body(flex flex-col)에서 flex 아이템의 auto 마진이
			    "꽉 채우기" 대신 "내용 크기만큼만 차지"로 동작해서, 검색 결과가
			    적을 때 페이지 전체 너비가 좁아져 보이는 버그가 있었음. */}
			<div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
				<Link
					href="/"
					className="text-sm text-muted transition-colors hover:text-accent"
				>
					← 홈으로
				</Link>
				<h1 className="mt-4 text-3xl font-semibold text-foreground">
					용어 사전
				</h1>
				<p className="mt-2 text-muted">
					궁금한 용어를 눌러서 쉬운 설명을 확인해보세요.
				</p>
				<div className="mt-8">
					<GlossaryGrid terms={glossaryTerms} />
				</div>
			</div>
			<ScrollToTopButton />
		</main>
	);
}
