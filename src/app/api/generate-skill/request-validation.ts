// 요청 본문을 읽고 상한을 확인한다. 서버가 최종 권한이다.
//
// 순서가 중요하다.
//   1. `Content-Length`가 있으면 JSON을 파싱하기 전에 자른다 — 거대한 본문을
//      굳이 문자열로 만들 이유가 없다
//   2. 헤더는 없을 수도, 거짓일 수도 있으므로 실제 읽은 본문의 바이트도 잰다
//   3. 그 다음에야 JSON을 풀고 항목별·전체 상한을 다시 확인한다
//
// 여기서 실패한 요청은 로그를 남기지 않는다. 남길 만한 값이 사용자 원문과
// 그 길이뿐이라, 남기는 순간 「원문은 안 남긴다」는 약속이 반쯤 무너진다.
//
// 회귀 시험: `pnpm check:input-limits`

import type { WizardAnswers } from "@/data/wizard-questions";
import type { GenerationErrorCode } from "@/lib/generation-errors";
import {
	answerMaxLength,
	MAX_ANSWER_ARRAY_ITEM_LENGTH,
	MAX_ANSWER_ARRAY_ITEMS,
	MAX_ANSWER_KEYS,
	MAX_FEEDBACK_LENGTH,
	MAX_FOLLOW_UP_ANSWER_LENGTH,
	MAX_FOLLOW_UP_ITEMS,
	MAX_FOLLOW_UP_QUESTION_LENGTH,
	MAX_PREVIOUS_SKILL_LENGTH,
	MAX_REQUEST_BODY_BYTES,
	MAX_TOTAL_INPUT_LENGTH,
} from "@/lib/input-limits";
import type { AnsweredQuestion, Refinement } from "./prompt";

export type ValidatedRequest = {
	answers: WizardAnswers;
	wantsAdvanced: boolean;
	refinement: Refinement | undefined;
	clarifications: AnsweredQuestion[] | undefined;
};

export type ValidationFailure = { ok: false; code: GenerationErrorCode };
type Checked<T> = { ok: true; value: T } | ValidationFailure;
export type ValidationResult = Checked<ValidatedRequest>;

const TOO_LARGE: ValidationFailure = { ok: false, code: "input_too_large" };
const INVALID: ValidationFailure = { ok: false, code: "invalid_request" };

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 헤더가 말하는 크기. 없거나 숫자가 아니면 null이고, 그때는 본문으로 잰다. */
export function readContentLength(value: string | null): number | null {
	if (value === null) return null;
	const trimmed = value.trim();
	if (!/^\d+$/.test(trimmed)) return null;
	const bytes = Number(trimmed);
	return Number.isFinite(bytes) ? bytes : null;
}

export function exceedsBodyLimit(bytes: number): boolean {
	return bytes > MAX_REQUEST_BODY_BYTES;
}

/** 길이 누적기. 항목별 상한을 넘지 않아도 총합에서 걸릴 수 있다. */
class LengthBudget {
	private used = 0;

	add(value: string): boolean {
		this.used += value.length;
		return this.used <= MAX_TOTAL_INPUT_LENGTH;
	}
}

function validateAnswers(
	value: unknown,
	budget: LengthBudget,
): Checked<WizardAnswers> {
	if (value === undefined) return { ok: true, value: {} };
	if (!isPlainObject(value)) return INVALID;
	const keys = Object.keys(value);
	if (keys.length > MAX_ANSWER_KEYS) return INVALID;

	const answers: WizardAnswers = {};
	for (const key of keys) {
		const item = value[key];
		if (item === undefined) continue;
		if (typeof item === "string") {
			if (item.length > answerMaxLength(key)) return TOO_LARGE;
			if (!budget.add(item)) return TOO_LARGE;
			answers[key] = item;
			continue;
		}
		if (Array.isArray(item)) {
			if (item.length > MAX_ANSWER_ARRAY_ITEMS) return INVALID;
			const picked: string[] = [];
			for (const one of item) {
				if (typeof one !== "string") return INVALID;
				if (one.length > MAX_ANSWER_ARRAY_ITEM_LENGTH) return TOO_LARGE;
				if (!budget.add(one)) return TOO_LARGE;
				picked.push(one);
			}
			answers[key] = picked;
			continue;
		}
		return INVALID;
	}
	return { ok: true, value: answers };
}

function validateAnsweredQuestions(
	value: unknown,
	budget: LengthBudget,
): Checked<AnsweredQuestion[]> {
	if (!Array.isArray(value)) return INVALID;
	if (value.length > MAX_FOLLOW_UP_ITEMS) return INVALID;
	const picked: AnsweredQuestion[] = [];
	for (const item of value) {
		if (!isPlainObject(item)) return INVALID;
		const { question, answer } = item;
		if (typeof question !== "string" || typeof answer !== "string") {
			return INVALID;
		}
		if (question.length > MAX_FOLLOW_UP_QUESTION_LENGTH) return TOO_LARGE;
		if (answer.length > MAX_FOLLOW_UP_ANSWER_LENGTH) return TOO_LARGE;
		if (!budget.add(question) || !budget.add(answer)) return TOO_LARGE;
		picked.push({ question, answer });
	}
	return { ok: true, value: picked };
}

/**
 * 파싱된 본문을 검사한다.
 *
 * `refinement`는 `answeredQuestions`가 배열일 때만 정제 요청으로 친다. 잘못
 * 전달된 값(예: 이벤트 객체) 때문에 정제 분기를 타지 않게 하는 기존 방어를
 * 그대로 유지한다 — 그 경우 거절하지 않고 「정제가 아닌 요청」으로 본다.
 */
export function validateParsedBody(body: unknown): ValidationResult {
	if (!isPlainObject(body)) return INVALID;
	const budget = new LengthBudget();

	const answersResult = validateAnswers(body.answers, budget);
	if (!answersResult.ok) return answersResult;
	const answers = answersResult.value;

	if (
		body.wantsAdvanced !== undefined &&
		typeof body.wantsAdvanced !== "boolean"
	) {
		return INVALID;
	}

	let clarifications: AnsweredQuestion[] | undefined;
	if (body.clarifications !== undefined) {
		const result = validateAnsweredQuestions(body.clarifications, budget);
		if (!result.ok) return result;
		clarifications = result.value.length > 0 ? result.value : undefined;
	}

	let refinement: Refinement | undefined;
	if (body.refinement !== undefined) {
		if (!isPlainObject(body.refinement)) return INVALID;
		const raw = body.refinement;
		if (Array.isArray(raw.answeredQuestions)) {
			const result = validateAnsweredQuestions(raw.answeredQuestions, budget);
			if (!result.ok) return result;
			const previousSkillMarkdown = raw.previousSkillMarkdown ?? "";
			const userFeedback = raw.userFeedback ?? "";
			if (
				typeof previousSkillMarkdown !== "string" ||
				typeof userFeedback !== "string"
			) {
				return INVALID;
			}
			if (previousSkillMarkdown.length > MAX_PREVIOUS_SKILL_LENGTH) {
				return TOO_LARGE;
			}
			if (userFeedback.length > MAX_FEEDBACK_LENGTH) return TOO_LARGE;
			if (!budget.add(previousSkillMarkdown) || !budget.add(userFeedback)) {
				return TOO_LARGE;
			}
			refinement = {
				previousSkillMarkdown,
				userFeedback,
				answeredQuestions: result.value,
			};
		}
	}

	if (!answers.situation || !answers.language) {
		return { ok: false, code: "missing_required_answers" };
	}

	return {
		ok: true,
		value: {
			answers,
			wantsAdvanced: body.wantsAdvanced === true,
			refinement,
			clarifications,
		},
	};
}

/**
 * 요청을 읽어 검사까지 마친다.
 *
 * 본문을 문자열로 읽는 것 자체가 메모리를 쓰므로, 헤더가 상한을 넘는다고
 * 말하면 읽지 않고 끝낸다.
 */
export async function readValidatedRequest(
	request: Request,
): Promise<ValidationResult> {
	const declared = readContentLength(request.headers.get("content-length"));
	if (declared !== null && exceedsBodyLimit(declared)) return TOO_LARGE;

	let raw: string;
	try {
		raw = await request.text();
	} catch {
		return INVALID;
	}
	// 헤더는 없을 수도, 실제와 다를 수도 있다. 실제로 읽은 바이트로 다시 본다.
	if (exceedsBodyLimit(Buffer.byteLength(raw, "utf8"))) return TOO_LARGE;

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return INVALID;
	}
	return validateParsedBody(parsed);
}
