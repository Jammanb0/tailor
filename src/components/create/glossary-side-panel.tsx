"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { glossaryTerms } from "@/data/glossary";

type GlossarySidePanelProps = {
	slug: string | null;
	onClose: () => void;
};

const PANEL_WIDTH = 380;

export function GlossarySidePanel({ slug, onClose }: GlossarySidePanelProps) {
	const term = slug ? glossaryTerms.find((t) => t.slug === slug) : undefined;
	const isOpen = Boolean(term);

	useEffect(() => {
		const root = document.documentElement;
		root.style.setProperty(
			"--panel-offset",
			isOpen ? `${PANEL_WIDTH}px` : "0px",
		);
		if (isOpen) root.setAttribute("data-panel-open", "");
		else root.removeAttribute("data-panel-open");
		return () => {
			root.style.setProperty("--panel-offset", "0px");
			root.removeAttribute("data-panel-open");
		};
	}, [isOpen]);

	useEffect(() => {
		if (!isOpen) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	return (
		<aside
			aria-hidden={!isOpen}
			style={{ width: isOpen ? PANEL_WIDTH : 0 }}
			className={`sticky top-0 h-screen shrink-0 overflow-hidden bg-surface transition-[width] duration-300 ease-out ${isOpen ? "border-border border-l" : ""}`}
		>
			<div style={{ width: PANEL_WIDTH }} className="h-full overflow-y-auto">
				{term && (
					<motion.div
						key={term.slug}
						initial={{ opacity: 0, x: 16 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.25, delay: 0.1 }}
						role="dialog"
						aria-modal="false"
						aria-label={term.term}
						className="flex h-full flex-col p-6"
					>
						<div className="flex items-start justify-between gap-4">
							<span className="select-text">
								<span className="block font-semibold text-foreground text-lg">
									{term.term}
									{(term.acronymOf ?? term.english) && (
										<span className="ml-1.5 font-normal text-muted text-sm">
											({term.acronymOf ?? term.english})
										</span>
									)}
								</span>
								<span className="mt-0.5 block text-sm text-muted">
									{term.summary}
								</span>
							</span>
							<button
								type="button"
								onClick={onClose}
								aria-label="닫기"
								className="shrink-0 rounded-full p-1 text-muted transition-colors hover:text-foreground"
							>
								✕
							</button>
						</div>
						<p className="mt-4 select-text text-sm text-foreground/80 leading-relaxed">
							{term.explanation}
						</p>
					</motion.div>
				)}
			</div>
		</aside>
	);
}
