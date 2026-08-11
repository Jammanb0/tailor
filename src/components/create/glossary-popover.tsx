"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { glossaryTerms } from "@/data/glossary";

type GlossaryPopoverProps = {
	slug: string | null;
	onClose: () => void;
};

export function GlossaryPopover({ slug, onClose }: GlossaryPopoverProps) {
	const term = slug ? glossaryTerms.find((t) => t.slug === slug) : undefined;

	useEffect(() => {
		if (!term) return;
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [term, onClose]);

	return (
		<AnimatePresence>
			{term && (
				<>
					<motion.div
						key="glossary-backdrop"
						onClick={onClose}
						className="fixed inset-0 z-40 bg-foreground/30"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
					/>
					<motion.div
						key="glossary-panel"
						role="dialog"
						aria-modal="true"
						aria-label={term.term}
						className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-border bg-surface p-6 shadow-xl sm:inset-x-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2"
						initial={{ opacity: 0, y: 24, scale: 0.96 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 24, scale: 0.96 }}
						transition={{ type: "spring", stiffness: 320, damping: 30 }}
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
				</>
			)}
		</AnimatePresence>
	);
}
