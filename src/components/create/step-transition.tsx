"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

const variants = {
	enter: (direction: number) => ({
		opacity: 0,
		x: direction >= 0 ? 48 : -48,
		scale: 0.97,
	}),
	center: {
		opacity: 1,
		x: 0,
		scale: 1,
	},
	exit: (direction: number) => ({
		opacity: 0,
		x: direction >= 0 ? -48 : 48,
		scale: 0.97,
	}),
};

type StepTransitionProps = {
	stepKey: string;
	direction: number;
	children: ReactNode;
};

export function StepTransition({
	stepKey,
	direction,
	children,
}: StepTransitionProps) {
	return (
		<AnimatePresence mode="popLayout" custom={direction} initial={false}>
			<motion.div
				key={stepKey}
				custom={direction}
				variants={variants}
				initial="enter"
				animate="center"
				exit="exit"
				transition={{
					x: { type: "spring", stiffness: 340, damping: 32 },
					opacity: { duration: 0.2 },
					scale: { duration: 0.25, ease: "easeOut" },
				}}
			>
				{children}
			</motion.div>
		</AnimatePresence>
	);
}
