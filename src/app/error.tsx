"use client";

import Link from "next/link";
import { useEffect } from "react";

// 렌더 도중 예외가 터지면 Next.js 기본 오류 화면(프로덕션에서는 설명 없는
// 회색 화면) 대신 이 화면이 뜬다. 화면 안에서 API 실패를 안내하는 문구는
// 각 화면이 따로 갖고 있고, 여기는 그것으로 못 잡은 것을 받는 마지막 그물이다.
//
// Next 16에서 재시도 함수 이름은 `reset`이 아니라 `retry`다 — `retry`는 경계
// 안쪽을 다시 불러와 다시 그리고, `reset`은 다시 불러오지 않고 상태만 지운다.
export default function RouteError({
	error,
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
			<div>
				<h1 className="text-2xl font-semibold text-foreground">
					화면을 그리다 문제가 생겼어요
				</h1>
				<div className="mx-auto mt-3 h-0 w-24 border-t-2 border-accent border-dashed" />
			</div>
			<p className="max-w-md text-muted">
				일시적인 문제일 수 있어요. 다시 시도해도 같은 화면이 나오면 잠시 뒤에
				열어봐 주세요.
			</p>
			{error.digest ? (
				// 서버에서 난 오류는 내용이 클라이언트로 오지 않는다. 대신 오는 것이
				// 이 digest이고, 서버 로그에서 같은 값을 찾으면 실제 오류를 볼 수 있다.
				<p className="select-text font-mono text-xs text-muted">
					오류 번호 {error.digest}
				</p>
			) : null}
			<div className="flex flex-wrap justify-center gap-3">
				<button
					type="button"
					onClick={() => retry()}
					className="flex items-center justify-center rounded-full bg-accent px-6 py-3 text-center text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
				>
					다시 시도
				</button>
				<Link
					href="/"
					className="flex items-center justify-center rounded-full border border-border px-6 py-3 text-center text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
				>
					처음으로
				</Link>
			</div>
		</main>
	);
}
