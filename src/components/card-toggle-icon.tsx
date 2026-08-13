"use client";

import { motion } from "framer-motion";

// 카드 여닫기 토글 아이콘 — 접힘: 아래 방향 chevron, 펼침: 위 방향으로 회전.
// 갤러리·용어사전 카드가 공유해 동작·모양을 통일한다.
export function CardToggleIcon({ isOpen }: { isOpen: boolean }) {
	return (
		<motion.span
			aria-hidden
			animate={{ rotate: isOpen ? 180 : 0 }}
			transition={{ duration: 0.2 }}
			className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
				isOpen ? "bg-accent text-accent-foreground" : "bg-accent/10 text-accent"
			}`}
		>
			<svg
				width="14"
				height="14"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			>
				<title>여닫기</title>
				<path d="M6 9l6 6 6-6" />
			</svg>
		</motion.span>
	);
}
