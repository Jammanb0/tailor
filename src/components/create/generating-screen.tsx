"use client";

import { useEffect, useState } from "react";

const CREATE_MESSAGES = [
	"스킬의 치수를 재는 중이에요...",
	"스킬 원단을 재단하는 중이에요...",
	"바느질하듯 스킬을 검토하는 중이에요...",
	"스킬을 다듬는 중이에요...",
];

const REFINE_MESSAGES = [
	"요청하신 수정 사항을 확인하는 중이에요...",
	"스킬을 다시 뜯어 고치는 중이에요...",
	"달라진 스킬 내용을 검토하는 중이에요...",
	"스킬을 다시 다듬는 중이에요...",
];

type GeneratingScreenProps = {
	mode?: "create" | "refine";
};

export function GeneratingScreen({ mode = "create" }: GeneratingScreenProps) {
	const [messageIndex, setMessageIndex] = useState(0);
	const messages = mode === "refine" ? REFINE_MESSAGES : CREATE_MESSAGES;

	useEffect(() => {
		const timer = setInterval(() => {
			setMessageIndex((i) => Math.min(i + 1, messages.length - 1));
		}, 4000);
		return () => clearInterval(timer);
	}, [messages.length]);

	return (
		<div className="flex flex-col items-center gap-4 text-center">
			<div
				aria-hidden
				className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent"
			/>
			<h1 className="text-xl font-semibold text-foreground">
				{mode === "refine"
					? "Tailor가 요청하신 대로 스킬을 다시 손보고 있어요"
					: "Tailor가 당신만을 위한 스킬을 재단하고 있어요"}
			</h1>
			<p aria-live="polite" className="text-muted">
				{messages[messageIndex]}
			</p>
			<p className="text-sm text-muted">
				보통 20~40초 정도 걸려요. 이 화면을 벗어나지 말고 잠시만 기다려주세요.
			</p>
		</div>
	);
}
