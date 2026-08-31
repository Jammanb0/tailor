// 사용자 입력 길이 상한. 서버와 클라이언트가 같은 값을 읽는다.
//
// 왜 넉넉한가: 참고 스킬 전문을 통째로 붙여넣는 것이 정상 사용이다. 상한은
// 오타나 자동화가 만든 거대한 본문을 막는 선이지, 사람이 쓴 글을 자르는 선이
// 아니다.
//
// **최종 권한은 서버에 있다.** 클라이언트의 `maxLength`는 붙여넣기가 조용히
// 잘리는 것을 사용자에게 보여주기 위한 것이고, 실제 판정은 서버가 다시 한다 —
// 브라우저를 거치지 않는 요청이 얼마든지 올 수 있다.
//
// 길이는 자바스크립트 문자열 길이(UTF-16 단위)로 잰다. 서버와 클라이언트가
// 같은 수를 보게 하려면 같은 자로 재야 한다. 바이트 상한은 원시 본문에만
// 따로 적용한다.
//
// 회귀 시험: `pnpm check:input-limits`

/** 자유 서술 답변의 기본 상한. */
export const MAX_ANSWER_LENGTH = 20_000;

/** 남이 쓴 스킬 전문을 붙여넣는 자리라 따로 크게 잡는다. */
export const MAX_REFERENCE_LENGTH = 60_000;

/** 질문별 상한. 여기 없는 자유 서술 답변은 기본 상한을 쓴다. */
const ANSWER_LIMITS: Record<string, number> = {
	situation: MAX_ANSWER_LENGTH,
	reference: MAX_REFERENCE_LENGTH,
	autonomyDetail: MAX_ANSWER_LENGTH,
	constraints: MAX_ANSWER_LENGTH,
};

export function answerMaxLength(questionId: string): number {
	return ANSWER_LIMITS[questionId] ?? MAX_ANSWER_LENGTH;
}

/** 되물음·수정 요청에서 오가는 값. 질문은 모델이 만든 한 문장이다. */
export const MAX_FOLLOW_UP_QUESTION_LENGTH = 2_000;
export const MAX_FOLLOW_UP_ANSWER_LENGTH = 20_000;
export const MAX_FEEDBACK_LENGTH = 20_000;
export const MAX_PREVIOUS_SKILL_LENGTH = 60_000;

/** 회차가 쌓이는 목록의 항목 수 상한. */
export const MAX_FOLLOW_UP_ITEMS = 12;

/** 객관식 답변처럼 값이 정해진 자리. 짧은 값만 온다. */
export const MAX_ANSWER_KEYS = 32;
export const MAX_ANSWER_ARRAY_ITEMS = 32;
export const MAX_ANSWER_ARRAY_ITEM_LENGTH = 200;

/** 한 요청에 담긴 사용자 제어 문자열의 총합. */
export const MAX_TOTAL_INPUT_LENGTH = 120_000;

/** 원시 요청 본문의 바이트 상한(512 KiB). */
export const MAX_REQUEST_BODY_BYTES = 512 * 1024;

/** 남은 글자 수를 보여줄 때 쓰는 표기. */
export function formatLengthCounter(current: number, max: number): string {
	return `${current.toLocaleString("ko-KR")} / ${max.toLocaleString("ko-KR")}자`;
}
