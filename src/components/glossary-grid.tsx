"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";
import { GlossaryCard } from "@/components/glossary-card";
import type { GlossaryTerm } from "@/data/glossary";

export function GlossaryGrid({ terms }: { terms: GlossaryTerm[] }) {
	const gridRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const cards = gridRef.current?.children;
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
		}, gridRef);

		return () => context.revert();
	}, []);

	return (
		<div ref={gridRef} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
			{terms.map((term) => (
				<GlossaryCard key={term.slug} {...term} />
			))}
		</div>
	);
}
