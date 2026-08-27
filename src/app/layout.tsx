import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const description = "AI의 도움으로 나만의 Claude Code Skill을 만드는 웹 서비스";

// 미리보기 카드의 그림 주소는 절대 주소여야 해서 사이트 주소를 알아야 한다.
// 코드에 박지 않고 Vercel이 넣어주는 값을 쓴다 — 프로덕션 도메인이 먼저이고
// (미리보기 배포에서도 카드는 프로덕션 그림을 가리키게 된다), 도메인이 따로
// 정해지면 NEXT_PUBLIC_SITE_URL로 덮는다.
const siteUrl =
	process.env.NEXT_PUBLIC_SITE_URL ??
	(process.env.VERCEL_PROJECT_PRODUCTION_URL
		? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
		: "http://localhost:3000");

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: "Tailor",
	description,
	openGraph: {
		type: "website",
		siteName: "Tailor",
		title: "Tailor",
		description,
		locale: "ko_KR",
		url: "/",
	},
	twitter: {
		card: "summary_large_image",
		title: "Tailor",
		description,
	},
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="ko"
			data-theme="dark"
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">
				<ThemeProvider>
					<ThemeToggle />
					{children}
				</ThemeProvider>
			</body>
		</html>
	);
}
