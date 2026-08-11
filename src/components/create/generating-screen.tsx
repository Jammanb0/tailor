"use client";

import { useEffect, useState } from "react";

const STATUS_MESSAGES = [
	"답변을 살펴보는 중이에요...",
	"초안을 작성하는 중이에요...",
	"스스로 검토하는 중이에요...",
	"마지막으로 다듬는 중이에요...",
];

export function GeneratingScreen() {
	const [messageIndex, setMessageIndex] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setMessageIndex((i) => Math.min(i + 1, STATUS_MESSAGES.length - 1));
		}, 4000);
		return () => clearInterval(timer);
	}, []);

	return (
		<div className="flex flex-col items-center gap-4 text-center">
			<div
				aria-hidden
				className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent"
			/>
			<h1 className="text-xl font-semibold text-foreground">
				스킬을 만들고 있어요
			</h1>
			<p aria-live="polite" className="text-muted">
				{STATUS_MESSAGES[messageIndex]}
			</p>
			<p className="text-sm text-muted">
				보통 20~40초 정도 걸려요. 이 화면을 벗어나지 말고 잠시만 기다려주세요.
			</p>
		</div>
	);
}
