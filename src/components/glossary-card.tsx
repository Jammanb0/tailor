"use client";

import { useEffect, useRef, useState } from "react";
import { CardToggleIcon } from "@/components/card-toggle-icon";
import type { GlossaryTerm } from "@/data/glossary";

type GlossaryCardProps = GlossaryTerm & {
	isOpen: boolean;
	onToggle: () => void;
};

export function GlossaryCard({
	term,
	english,
	acronymOf,
	summary,
	explanation,
	isOpen,
	onToggle,
}: GlossaryCardProps) {
	const [height, setHeight] = useState(0);
	const contentRef = useRef<HTMLDivElement>(null);
	const subtitle = acronymOf ?? english;

	useEffect(() => {
		if (isOpen && contentRef.current) {
			setHeight(contentRef.current.scrollHeight);
		} else {
			setHeight(0);
		}
	}, [isOpen]);

	return (
		<div
			className={`rounded-2xl border bg-surface transition-colors ${
				isOpen ? "border-accent/50" : "border-border"
			}`}
		>
			<button
				type="button"
				onClick={onToggle}
				aria-expanded={isOpen}
				className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
			>
				<span className="select-text">
					<span className="block font-semibold text-foreground">
						{term}
						{subtitle && (
							<span className="ml-1.5 font-normal text-muted">
								({subtitle})
							</span>
						)}
					</span>
					<span className="mt-0.5 block text-sm text-muted">{summary}</span>
				</span>
				<CardToggleIcon isOpen={isOpen} />
			</button>
			<div
				style={{ height, transition: "height 300ms ease-in-out" }}
				className="overflow-hidden"
			>
				<div ref={contentRef}>
					<p className="select-text px-5 pb-5 text-sm leading-relaxed text-foreground/80">
						{explanation}
					</p>
				</div>
			</div>
		</div>
	);
}
