"use client";

import { gsap } from "gsap";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { GlossaryCard } from "@/components/glossary-card";
import type { GlossaryTerm } from "@/data/glossary";

export function GlossaryGrid({ terms }: { terms: GlossaryTerm[] }) {
	const [query, setQuery] = useState("");
	const [openSlugs, setOpenSlugs] = useState<Set<string>>(new Set());
	const wrapperRef = useRef<HTMLDivElement>(null);
	const hasAppliedHashRef = useRef(false);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return terms;
		return terms.filter((t) =>
			[t.term, t.english, t.acronymOf, t.summary]
				.filter(Boolean)
				.some((field) => field?.toLowerCase().includes(q)),
		);
	}, [terms, query]);

	// 두 개의 독립된 세로 칸으로 미리 나눠서, 한쪽 카드가 펼쳐져도
	// 반대쪽 칸의 카드 위치가 재배치되지 않게 함 (CSS columns의 재배치 문제 회피).
	const leftColumn = filtered.filter((_, i) => i % 2 === 0);
	const rightColumn = filtered.filter((_, i) => i % 2 === 1);

	const toggleSlug = (slug: string) => {
		setOpenSlugs((prev) => {
			const next = new Set(prev);
			if (next.has(slug)) {
				next.delete(slug);
			} else {
				next.add(slug);
			}
			return next;
		});
	};

	const collapseAll = () => setOpenSlugs(new Set());

	// #slug로 들어오면 해당 용어 카드를 자동으로 펼치고 그 위치로 스크롤.
	// 스킬 생성기 등 다른 화면에서 특정 용어로 바로 연결할 때 쓰기 위함.
	useEffect(() => {
		if (hasAppliedHashRef.current) return;
		const slug = window.location.hash.replace("#", "");
		if (!slug || !terms.some((t) => t.slug === slug)) return;
		hasAppliedHashRef.current = true;
		setOpenSlugs((prev) => new Set(prev).add(slug));
		requestAnimationFrame(() => {
			document
				.getElementById(slug)
				?.scrollIntoView({ behavior: "smooth", block: "center" });
		});
	}, [terms]);

	useLayoutEffect(() => {
		if (filtered.length === 0) return;
		const cards = wrapperRef.current?.querySelectorAll("[data-glossary-card]");
		if (!cards) return;

		const context = gsap.context(() => {
			gsap.fromTo(
				cards,
				{ opacity: 0, y: 16 },
				{
					opacity: 1,
					y: 0,
					duration: 0.5,
					ease: "power2.out",
					stagger: 0.06,
				},
			);
		}, wrapperRef);

		return () => context.revert();
	}, [filtered]);

	return (
		<div>
			<div className="relative">
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="용어 검색 (한글 또는 영어)"
					className="w-full select-text rounded-full border border-border bg-surface px-5 py-3 pr-11 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
				/>
				{query && (
					<button
						type="button"
						onClick={() => setQuery("")}
						aria-label="검색어 지우기"
						className="absolute top-1/2 right-4 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
					>
						✕
					</button>
				)}
			</div>
			<div className="mt-3 flex items-center justify-between text-sm text-muted">
				<span>
					{query
						? `총 ${terms.length}개 중 ${filtered.length}개`
						: `총 ${terms.length}개`}
				</span>
				{openSlugs.size > 0 && (
					<button
						type="button"
						onClick={collapseAll}
						className="text-muted transition-colors hover:text-accent"
					>
						모두 닫기
					</button>
				)}
			</div>
			<div className="mt-4">
				{filtered.length === 0 ? (
					<div className="rounded-2xl border border-border bg-surface px-5 py-12 text-center text-muted">
						일치하는 용어가 없어요. 다른 검색어로 찾아보세요.
					</div>
				) : (
					<div ref={wrapperRef} className="flex flex-col gap-3 sm:flex-row">
						<div className="flex flex-1 flex-col gap-3">
							{leftColumn.map((term) => (
								<div key={term.slug} id={term.slug} data-glossary-card>
									<GlossaryCard
										{...term}
										isOpen={openSlugs.has(term.slug)}
										onToggle={() => toggleSlug(term.slug)}
									/>
								</div>
							))}
						</div>
						<div className="flex flex-1 flex-col gap-3">
							{rightColumn.map((term) => (
								<div key={term.slug} id={term.slug} data-glossary-card>
									<GlossaryCard
										{...term}
										isOpen={openSlugs.has(term.slug)}
										onToggle={() => toggleSlug(term.slug)}
									/>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
