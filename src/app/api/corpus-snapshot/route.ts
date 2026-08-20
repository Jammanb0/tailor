// 코퍼스 렌더 결과 덤프 (개발 전용, 프로덕션 경로 아님).
//
// GET /api/corpus-snapshot → 프롬프트에 실제로 들어가는 CORPUS_SECTION 전문(text/plain)
//
// 왜 있나: 코퍼스 스키마를 손볼 때 "데이터는 그대로 두고 칸만 만들었다"를 증명하기
// 위해서다. 렌더 결과가 한 글자라도 달라지면 이미 받아둔 before 자료
// (docs/experiments/data/2026-08-18-baseline, -mismatch)가 다른 조건에서 측정한
// 것이 되어 비교가 깨지는데, 이 어긋남은 눈으로는 보이지 않는다.
//
// prompt.ts를 그대로 import한다 — 여기서 렌더를 복제하면 앱과 조용히 갈라져
// 대조 자체가 무의미해진다. 대조 절차는 tools/check-corpus-render.mjs 참조.

import { CORPUS_SECTION } from "../generate-skill/prompt";

export function GET() {
	if (process.env.NODE_ENV === "production") {
		return new Response("not found", { status: 404 });
	}
	return new Response(CORPUS_SECTION, {
		headers: { "content-type": "text/plain; charset=utf-8" },
	});
}
