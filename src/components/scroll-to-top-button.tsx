"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function ScrollToTopButton() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		const onScroll = () => setVisible(window.scrollY > 400);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<AnimatePresence>
			{visible && (
				<motion.button
					type="button"
					onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
					aria-label="맨 위로 이동"
					initial={{ opacity: 0, scale: 0.6, y: 12 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.6, y: 12 }}
					transition={{ duration: 0.2, ease: "easeOut" }}
					className="fixed right-6 bottom-6 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-lg text-accent-foreground shadow-lg transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
				>
					↑
				</motion.button>
			)}
		</AnimatePresence>
	);
}
