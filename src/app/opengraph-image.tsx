import { ImageResponse } from "next/og";

// 링크를 붙여넣었을 때 뜨는 미리보기 카드 그림. 홈 화면과 같은 구성이다 —
// 이름 아래에 바느질 자국처럼 끊긴 코랄색 선.
//
// ⚠️ 그림 안의 글자는 전부 로마자다. ImageResponse는 브라우저 폰트를 쓰지 않고
// 넘겨준 폰트만 쓰는데, 기본 폰트에 한글 글리프가 없어 한글을 넣으면 네모로
// 나온다. 한글을 넣으려면 한글 TTF를 저장소에 두고 `fonts`로 넘겨야 하고,
// 그러면 번들 상한(500KB)이 걸린다. 카드에 뜨는 한국어 제목·설명은 그림이
// 아니라 layout.tsx의 metadata에서 나가므로 여기에 한글이 없어도 된다.
export const alt = "Tailor — make your own Claude Code Skill";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// globals.css의 다크 모드 값과 같은 색.
const BACKGROUND = "#0a0a0a";
const FOREGROUND = "#fafafa";
const MUTED = "#a1a1aa";
const ACCENT = "#ff7a5c";

// 밑줄을 이루는 막대 열둘. 개수만 필요하지만 각자 다른 이름을 주어야 리스트
// 키를 배열 인덱스로 쓰지 않는다.
const STITCHES = [
	"s1",
	"s2",
	"s3",
	"s4",
	"s5",
	"s6",
	"s7",
	"s8",
	"s9",
	"s10",
	"s11",
	"s12",
];

export default function OpengraphImage() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				gap: 28,
				background: BACKGROUND,
			}}
		>
			<div style={{ display: "flex", fontSize: 128, color: FOREGROUND }}>
				Tailor
			</div>
			{/* 홈 화면의 점선 밑줄. Satori는 CSS 테두리 스타일을 다 지원하지는
			    않으므로 짧은 막대를 늘어놓아 같은 모양을 만든다. */}
			<div style={{ display: "flex", gap: 12 }}>
				{STITCHES.map((stitch) => (
					<div
						key={stitch}
						style={{
							width: 24,
							height: 5,
							background: ACCENT,
							borderRadius: 3,
						}}
					/>
				))}
			</div>
			<div
				style={{
					display: "flex",
					marginTop: 12,
					fontSize: 34,
					color: MUTED,
				}}
			>
				Make your own Claude Code Skill
			</div>
		</div>,
		size,
	);
}
