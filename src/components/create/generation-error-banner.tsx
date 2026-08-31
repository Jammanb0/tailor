"use client";

import { useEffect, useState } from "react";
import type { GenerationErrorCode } from "@/lib/generation-errors";

export type GenerationErrorState = {
	code: GenerationErrorCode;
	message: string;
	retryable: boolean;
	retryAfterSeconds?: number;
	/** 카운트다운을 다시 시작할 기준. 같은 코드가 연달아 와도 새 실패로 센다. */
	receivedAt: number;
	/**
	 * 이 시각(epoch ms) 전에는 어떤 경로로도 다시 부르지 않는다.
	 *
	 * 카운트다운을 배너 안의 state로만 두면 배너 밖의 입구 — 「스킬 생성하기」,
	 * 「다시 생성하기」, 수정 요청 제출 — 가 그 시간을 그냥 지나친다. 기다리는
	 * 시각을 오류 상태에 두고 모든 입구가 같은 값을 본다.
	 */
	retryNotBefore: number;
};

/** 지금 다시 부를 수 있는가. 배너와 요청 경로가 같은 함수로 판정한다. */
export function canRetryNow(
	error: GenerationErrorState,
	now = Date.now(),
): boolean {
	return error.retryable && now >= error.retryNotBefore;
}

type GenerationErrorBannerProps = {
	error: GenerationErrorState;
	/** 마지막으로 실패한 요청을 그대로 다시 보낸다. */
	onRetry: () => void;
	/** 생성이 이미 진행 중이면 버튼을 잠근다. */
	isBusy: boolean;
};

/**
 * 실패 안내와 수동 재시도.
 *
 * **자동 재시도는 하지 않는다.** 생성 한 번이 실제 비용이라, 화면이 알아서
 * 다시 부르면 사용자가 모르는 사이에 같은 요청이 여러 번 나간다. 다시 보낼지는
 * 사람이 정한다.
 *
 * 429는 남은 시간 동안 버튼을 잠근다. 그 전에 눌러 봐야 같은 429가 돌아온다.
 */
export function GenerationErrorBanner({
	error,
	onRetry,
	isBusy,
}: GenerationErrorBannerProps) {
	// 남은 시간은 시계에서 다시 계산한다. 1씩 빼면 탭이 멈춰 있던 동안이
	// 그대로 밀려 실제보다 늦게 풀린다.
	// 새 실패마다 다시 세도록 부르는 쪽이 `key={error.receivedAt}`로 갈아 끼운다.
	const secondsLeft = () =>
		error.retryable
			? Math.max(0, Math.ceil((error.retryNotBefore - Date.now()) / 1000))
			: 0;
	const [remaining, setRemaining] = useState(secondsLeft);

	useEffect(() => {
		if (remaining <= 0) return;
		const timer = setTimeout(() => setRemaining(secondsLeft()), 1000);
		return () => clearTimeout(timer);
	});

	const waiting = remaining > 0;
	const disabled = waiting || isBusy;

	return (
		<div className="flex flex-col gap-3 rounded-2xl border border-accent/40 bg-accent/5 px-5 py-4 text-accent text-sm">
			{/* 문구만 보조기술에 알린다. 카운트다운까지 넣으면 1초마다 다시 읽는다. */}
			<p role="alert">{error.message}</p>
			{error.retryable && (
				<div>
					<button
						type="button"
						onClick={onRetry}
						disabled={disabled}
						className="rounded-full border border-accent/50 px-4 py-2 font-medium text-accent transition-colors hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{waiting ? `${remaining}초 후 다시 시도하기` : "다시 시도하기"}
					</button>
				</div>
			)}
		</div>
	);
}
