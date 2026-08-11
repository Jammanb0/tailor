"use client";

import { gsap } from "gsap";
import Link from "next/link";
import { useEffect, useRef } from "react";

export default function Home() {
	const titleRef = useRef<HTMLHeadingElement>(null);
	const stitchRef = useRef<HTMLDivElement>(null);
	const restRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const context = gsap.context(() => {
			gsap
				.timeline()
				.fromTo(
					titleRef.current,
					{ opacity: 0, y: 12 },
					{ opacity: 1, y: 0, duration: 0.5, ease: "power2.out" },
				)
				.fromTo(
					stitchRef.current,
					{ scaleX: 0 },
					{
						scaleX: 1,
						duration: 0.5,
						ease: "power2.inOut",
						transformOrigin: "left center",
					},
					"-=0.15",
				)
				.fromTo(
					restRef.current,
					{ opacity: 0, y: 8 },
					{ opacity: 1, y: 0, duration: 0.4, ease: "power2.out" },
					"-=0.1",
				);
		});

		return () => context.revert();
	}, []);

	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
			<div>
				<h1 ref={titleRef} className="text-4xl font-semibold text-foreground">
					Tailor
				</h1>
				<div
					ref={stitchRef}
					className="mx-auto mt-3 h-0 w-24 border-t-2 border-accent border-dashed"
				/>
			</div>
			<div ref={restRef} className="flex flex-col items-center gap-6">
				<p className="text-muted">
					처음이어도 괜찮아요. 나에게 맞는 Claude Code Skill을 만들어드려요.
				</p>
				<div className="flex gap-3">
					<Link
						href="/glossary"
						className="flex items-center justify-center rounded-full border border-border px-6 py-3 text-center text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
					>
						용어 알아보기
					</Link>
					<span
						aria-disabled
						className="flex flex-col items-center justify-center gap-0.5 rounded-full bg-accent/40 px-6 py-3 text-center text-sm font-medium text-accent-foreground/70"
					>
						스킬 만들기
						<span className="text-xs font-normal">곧 만나요</span>
					</span>
				</div>
			</div>
		</main>
	);
}
