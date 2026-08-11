"use client";

import { gsap } from "gsap";
import { useEffect, useRef } from "react";

type WizardProgressProps = {
	current: number;
	total: number;
	label: string;
};

export function WizardProgress({ current, total, label }: WizardProgressProps) {
	const fillRef = useRef<HTMLDivElement>(null);
	const dotRef = useRef<HTMLSpanElement>(null);
	const percent = total > 0 ? Math.min(100, (current / total) * 100) : 0;

	useEffect(() => {
		if (!fillRef.current) return;
		const tween = gsap.to(fillRef.current, {
			width: `${percent}%`,
			duration: 0.6,
			ease: "power3.out",
		});
		if (dotRef.current) {
			gsap.fromTo(
				dotRef.current,
				{ scale: 0.6, opacity: 0.4 },
				{ scale: 1, opacity: 1, duration: 0.35, ease: "back.out(3)" },
			);
		}
		return () => {
			tween.kill();
		};
	}, [percent]);

	return (
		<div>
			<div className="flex items-center justify-between text-sm text-muted">
				<span>{label}</span>
				<span aria-hidden className="tabular-nums">
					{current}/{total}
				</span>
			</div>
			<div
				role="progressbar"
				aria-valuenow={Math.round(percent)}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label={label}
				className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border"
			>
				<div
					ref={fillRef}
					className="absolute inset-y-0 left-0 w-0 rounded-full bg-accent"
				/>
				<span
					ref={dotRef}
					aria-hidden
					className="-translate-y-1/2 absolute top-1/2 h-3 w-3 rounded-full bg-accent shadow-[0_0_0_3px_var(--surface)]"
					style={{ left: `calc(${percent}% - 6px)` }}
				/>
			</div>
		</div>
	);
}
