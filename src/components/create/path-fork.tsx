"use client";

import { gsap } from "gsap";
import { useLayoutEffect, useRef } from "react";

type PathForkProps = {
	onSelectWeb: () => void;
	onSelectHandoff: () => void;
};

export function PathFork({ onSelectWeb, onSelectHandoff }: PathForkProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const context = gsap.context(() => {
			gsap.fromTo(
				"[data-fork-item]",
				{ opacity: 0, y: 14 },
				{
					opacity: 1,
					y: 0,
					duration: 0.45,
					ease: "power2.out",
					stagger: 0.08,
				},
			);
		}, containerRef);
		return () => context.revert();
	}, []);

	return (
		<div ref={containerRef} className="flex flex-col gap-4">
			<div data-fork-item className="translate-y-3 opacity-0">
				<h1 className="text-2xl font-semibold text-foreground">
					어떻게 만들어드릴까요?
				</h1>
				<p className="mt-1.5 text-muted">
					둘 중 편한 방법을 골라주세요. 나중에 언제든 바꿀 수 있어요.
				</p>
			</div>

			<button
				type="button"
				data-fork-item
				onClick={onSelectWeb}
				className="group flex w-full translate-y-3 flex-col gap-1 rounded-2xl border border-border bg-surface px-6 py-5 text-left opacity-0 transition-colors hover:border-accent"
			>
				<span className="font-semibold text-foreground group-hover:text-accent">
					이 사이트에서 바로 만들기
				</span>
				<span className="text-sm text-muted">
					질문에 답하면 저희가 대신 만들어드려요. 하루 5회까지 무료예요.
				</span>
			</button>

			<button
				type="button"
				data-fork-item
				onClick={onSelectHandoff}
				className="group hidden w-full translate-y-3 flex-col gap-1 rounded-2xl border border-border bg-surface px-6 py-5 text-left opacity-0 transition-colors hover:border-accent sm:flex"
			>
				<span className="font-semibold text-foreground group-hover:text-accent">
					내 Claude로 이어서 만들기
				</span>
				<span className="text-sm text-muted">
					실제 프로젝트 파일을 보면서 더 정확하게 만들 수 있어요. 비용은 내
					계정으로 청구돼요.
				</span>
			</button>
		</div>
	);
}
