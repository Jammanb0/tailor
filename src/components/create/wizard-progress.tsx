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
				className="relative mt-2 h-1.5 w-full"
			>
				<div className="absolute inset-0 overflow-hidden rounded-full bg-border">
					<div ref={fillRef} className="h-full w-0 rounded-full bg-accent" />
				</div>
				<span
					ref={dotRef}
					aria-hidden
					className="-translate-y-1/2 absolute top-1/2 h-3.5 w-3.5 rounded-full border-2 border-accent bg-surface"
					style={{
						left: `calc(${percent}% - 7px)`,
						boxShadow: "0 0 0 3px var(--background)",
					}}
				/>
			</div>
		</div>
	);
}
