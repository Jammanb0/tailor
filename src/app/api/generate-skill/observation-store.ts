// 관측값을 Supabase에 저장한다. 여기만 네트워크를 쓴다.
//
// **저장 실패는 스킬 생성을 막지 않는다(fail-open).** Supabase가 죽어도 사용자는
// 스킬을 받아야 한다. 그래서 이 파일의 함수는 아무것도 던지지 않고, 실패를
// 로그로만 남긴다.
//
// 저장할 값을 고르는 일은 `observation.ts`가 한다. 이 파일은 그렇게 만들어진
// 행을 보내기만 한다 — 무엇이 나가는지 판정하려면 그쪽 한 파일만 읽으면 된다.
//
// `supabase-js`를 쓰지 않는다. 쓰는 곳이 insert 한 번과 update 한 번뿐이라
// 현재 범위에서 클라이언트 라이브러리로 얻는 편익이 작고, 의존성이 늘면 공개
// 저장소의 공급망 표면도 늘어난다. 질의가 복잡해지면 다시 판단한다.
//
// 회귀 시험: `pnpm check:observation`

import {
	buildFinalRow,
	buildPendingRow,
	type GenerationObservation,
	type ObservationContext,
} from "./observation";
import {
	logPersistenceFailure,
	type PersistenceFailureReason,
	type PersistenceStage,
} from "./telemetry";

/**
 * pending insert의 제한 시간.
 *
 * 이 저장은 사용자 응답을 붙잡는다. 계측 때문에 생성이 느려지면 fail-open의
 * 뜻이 없어지므로 짧게 끊는다. 선택 호출 deadline(10초)보다 한참 짧다.
 */
export const PENDING_TIMEOUT_MS = 2_500;

/**
 * 최종 갱신의 제한 시간.
 *
 * `after()` 안에서 돌아 응답을 막지 않지만, 함수 실행 예산은 응답과 나눠 쓴다.
 * 길게 잡아도 하드 타임아웃에 같이 잘리므로 넉넉할 이유가 없다.
 */
export const FINAL_TIMEOUT_MS = 5_000;

type StoreConfig = { url: string; key: string };

/**
 * 환경변수가 없으면 저장을 건너뛴다.
 *
 * 로컬 개발에서는 이게 정상이다. 다만 배포에서 변수를 빠뜨리면 계측이 통째로
 * 빈다. 그때 **요청마다 한 줄씩** 남겨야 한다.
 *
 * 프로세스마다 한 번만 찍는 방식을 먼저 썼는데 그건 틀렸다. 사전등록의 유실률은
 * `missing_row`(insert 오류가 났고 행이 실제로 없는 것)를 operation_id로 세는데,
 * 로그가 한 줄이면 수백 건이 사라져도 셀 수 있는 것이 하나뿐이다. 어느 요청이
 * 첫 100건에 속했는지도 복원하지 못한다. 로그가 시끄러운 것보다 자료가 없는
 * 것이 나쁘고, 애초에 설정이 제대로면 이 줄은 한 번도 안 나온다.
 */
function readConfig(): StoreConfig | null {
	const url = process.env.SUPABASE_URL;
	const key = process.env.SUPABASE_SECRET_KEY;
	if (!url || !key) return null;
	return { url: url.replace(/\/+$/, ""), key };
}

function report(
	stage: PersistenceStage,
	reason: PersistenceFailureReason,
	status: number | null,
	context: ObservationContext,
): void {
	logPersistenceFailure({
		stage,
		reason,
		status,
		operationId: context.operationId,
		startedAt: context.startedAt,
		kind: context.kind,
		configuredMode: context.configuredMode,
		deploymentId: context.deploymentId,
		isSmoke: context.isSmoke,
	});
}

/**
 * PostgREST에 한 번 보낸다.
 *
 * 오류를 던지지 않는다. 부르는 쪽이 try를 잊어도 생성이 멈추지 않아야 한다.
 * 응답 본문은 읽지 않는다 — 읽어서 쓸 데가 없고, 로그에 담지도 않는다.
 */
async function send(input: {
	config: StoreConfig;
	path: string;
	method: "POST" | "PATCH";
	body: unknown;
	timeoutMs: number;
	stage: PersistenceStage;
	context: ObservationContext;
}): Promise<void> {
	try {
		const response = await fetch(`${input.config.url}/rest/v1/${input.path}`, {
			method: input.method,
			headers: {
				// **`apikey`에만 보낸다.** 새 형식(`sb_secret_`)의 시크릿 키는 JWT가
				// 아니고, `Authorization`은 사용자 JWT를 두는 자리다. 지금은 양쪽에
				// 보내도 통하지만 문서가 보장하는 쓰임이 아니다. 시크릿이 실리는
				// 헤더를 하나로 줄이는 쪽이기도 하다.
				//
				// 실측(2026-09-01): apikey만 → 읽기 200·insert 201·update 204,
				// Authorization만 → 401 "No API key found in request".
				apikey: input.config.key,
				"Content-Type": "application/json",
				// 응답 본문을 받지 않는다. 저장한 행을 되돌려받을 이유가 없고,
				// 받으면 사용자 자료가 로그로 흘러들 자리가 하나 늘어난다.
				Prefer: "return=minimal",
			},
			body: JSON.stringify(input.body),
			signal: AbortSignal.timeout(input.timeoutMs),
			cache: "no-store",
		});
		if (!response.ok) {
			report(input.stage, "http_error", response.status, input.context);
		}
	} catch {
		// 타임아웃·연결 실패·중단이 여기로 온다. 오류 객체는 보지 않는다 —
		// message에 무엇이 담길지 우리가 정하지 못한다.
		report(input.stage, "request_failed", null, input.context);
	}
}

/**
 * Sonnet을 부르기 전에 행을 넣는다. 이 호출만 응답을 기다린다.
 *
 * `after()`에 넣으면 안 된다. 하드 타임아웃으로 함수가 끊길 때 남아 있어야 할
 * 행이 바로 이것이라, 응답 뒤로 미루면 목적이 사라진다.
 */
export async function savePendingObservation(
	context: ObservationContext,
): Promise<void> {
	const config = readConfig();
	if (!config) {
		report("pending-insert", "not_configured", null, context);
		return;
	}
	await send({
		config,
		path: "generations",
		method: "POST",
		body: buildPendingRow(context),
		timeoutMs: PENDING_TIMEOUT_MS,
		stage: "pending-insert",
		context,
	});
}

/**
 * 응답을 보낸 뒤 최종 결과로 덮어쓴다. `after()`에서 부른다.
 *
 * 이 갱신이 유실되면 행은 `status='pending'`으로 남는다. 그 행이 곧 「끝을 못 본
 * 요청」의 표시가 된다.
 */
export async function saveFinalObservation(input: {
	context: ObservationContext;
	observation: GenerationObservation;
	totalMs: number;
}): Promise<void> {
	const config = readConfig();
	if (!config) {
		report("final-update", "not_configured", null, input.context);
		return;
	}
	await send({
		config,
		path: `generations?operation_id=eq.${encodeURIComponent(
			input.context.operationId,
		)}`,
		method: "PATCH",
		body: buildFinalRow({
			observation: input.observation,
			totalMs: input.totalMs,
		}),
		timeoutMs: FINAL_TIMEOUT_MS,
		stage: "final-update",
		context: input.context,
	});
}
