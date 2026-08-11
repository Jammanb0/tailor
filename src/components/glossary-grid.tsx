"use client";

import { gsap } from "gsap";
import { useEffect, useMemo, useRef, useState } from "react";
import { GlossaryCard } from "@/components/glossary-card";
import type { GlossaryTerm } from "@/data/glossary";

export function GlossaryGrid({ terms }: { terms: GlossaryTerm[] }) {
	const [query, setQuery] = useState("");
	const listRef = useRef<HTMLDivElement>(null);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return terms;
		return terms.filter((t) =>
			[t.term, t.english, t.acronymOf, t.summary]
				.filter(Boolean)
				.some((field) => field?.toLowerCase().includes(q)),
		);
	}, [terms, query]);

	useEffect(() => {
		if (filtered.length === 0) return;
		const cards = listRef.current?.children;
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
		}, listRef);

		return () => context.revert();
	}, [filtered]);

	return (
		<div>
			<input
				type="text"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder="용어 검색 (한글 또는 영어)"
				className="w-full rounded-full border border-border bg-surface px-5 py-3 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
			/>
			<div className="mt-6">
				{filtered.length === 0 ? (
					<p className="py-12 text-center text-muted">
						일치하는 용어가 없어요. 다른 검색어로 찾아보세요.
					</p>
				) : (
					<div ref={listRef} className="columns-1 gap-3 sm:columns-2">
						{filtered.map((term) => (
							<div key={term.slug} className="mb-3 break-inside-avoid">
								<GlossaryCard {...term} />
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
