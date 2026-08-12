"use client";

import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
	const { override, setOverride } = useTheme();
	const isDark = override === "dark";

	return (
		<button
			type="button"
			onClick={() => setOverride(isDark ? "light" : "dark")}
			aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
			className="fixed top-6 right-[calc(1.5rem+var(--panel-offset))] z-30 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-[right,color] duration-300 ease-out hover:text-accent"
		>
			{isDark ? "☀︎" : "☾"}
		</button>
	);
}
