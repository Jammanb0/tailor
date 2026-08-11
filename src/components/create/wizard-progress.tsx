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
	const percent = total > 0 ? Math.min(100, (current / total) * 100) : 0;

	useEffect(() => {
		if (!fillRef.current) return;
		const tween = gsap.to(fillRef.current, {
			width: `${percent}%`,
			duration: 0.6,
			ease: "power3.out",
		});
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
				className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border"
			>
				<div ref={fillRef} className="h-full w-0 rounded-full bg-accent" />
			</div>
		</div>
	);
}
