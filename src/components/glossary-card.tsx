"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { GlossaryTerm } from "@/data/glossary";

export function GlossaryCard({ term, summary, explanation }: GlossaryTerm) {
	const [isOpen, setIsOpen] = useState(false);
	const [height, setHeight] = useState(0);
	const contentRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (isOpen && contentRef.current) {
			setHeight(contentRef.current.scrollHeight);
		} else {
			setHeight(0);
		}
	}, [isOpen]);

	return (
		<div className="rounded-2xl border border-border bg-surface">
			<button
				type="button"
				onClick={() => setIsOpen((v) => !v)}
				aria-expanded={isOpen}
				className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
			>
				<span>
					<span className="block font-semibold text-foreground">{term}</span>
					<span className="mt-0.5 block text-sm text-muted">{summary}</span>
				</span>
				<motion.span
					animate={{ rotate: isOpen ? 45 : 0 }}
					transition={{ duration: 0.2 }}
					className="shrink-0 text-xl text-accent"
					aria-hidden
				>
					+
				</motion.span>
			</button>
			<div
				style={{ height, transition: "height 300ms ease-in-out" }}
				className="overflow-hidden"
			>
				<div ref={contentRef}>
					<p className="px-5 pb-5 text-sm leading-relaxed text-foreground/80">
						{explanation}
					</p>
				</div>
			</div>
		</div>
	);
}
