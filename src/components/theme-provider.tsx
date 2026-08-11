"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ThemeOverride = "light" | "dark";

type ThemeContextValue = {
	override: ThemeOverride;
	setOverride: (value: ThemeOverride) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	// 시스템 설정과 무관하게 다크 모드로 시작함. layout.tsx의 <html
	// data-theme="dark">가 서버 렌더링 시점부터 이미 같은 값을 갖고 있어서
	// 첫 페인트부터 라이트 모드로 잠깐 보이는 깜빡임이 없음.
	const [override, setOverride] = useState<ThemeOverride>("dark");

	useEffect(() => {
		document.documentElement.dataset.theme = override;
	}, [override]);

	return (
		<ThemeContext.Provider value={{ override, setOverride }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const ctx = useContext(ThemeContext);
	if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
	return ctx;
}
