// Supabase에 저장할 값을 만드는 곳. 저장으로 나가는 것은 전부 여기를 거친다.
//
// telemetry.ts와 같은 **허용 목록 방식이다.** 객체를 통째로 넘기지 않고 필요한
// 필드만 골라 새 객체를 만든다. 관측값을 그대로 흘리면 나중에 필드가 하나
// 늘어나는 것만으로 저장 범위가 저절로 넓어진다.
//
// 남기지 않는 것은 telemetry.ts와 같다 — 사용자가 쓴 글, 모델이 만든 문서 전문,
// 오류 객체의 message. 여기에 더해 **선택된 묶음·패턴 id도 남기지 않는다.**
// 묶음 조합은 그 사람이 무엇을 만들려 했는지를 거의 그대로 드러낸다. 개수와
// 바이트만 남긴다.
//
// 기준: docs/experiments/data/2026-08-31-routed-operations/PRE-REGISTRATION.md
// 표 정의: docs/operations/generations-table.sql
// 회귀 시험: `pnpm check:observation`

import type { GenerationErrorCode } from "@/lib/generation-errors";
import type { CorpusRoutingMode } from "./routing-policy";
import type { UsageLog } from "./telemetry";

/** 저장 행의 `status`. DB의 CHECK와 같은 집합이다. */
export const OBSERVATION_STATUSES = [
	"pending",
	"success",
	"needs_more_info",
	"error",
] as const;
export type ObservationStatus = (typeof OBSERVATION_STATUSES)[number];

/** 선택 실패를 기록할 수 있는 자리. `generation`은 선택 경로가 아니라 제외한다. */
export const SELECTION_ERROR_STAGES = [
	"selection",
	"selection-processing",
] as const;
export type SelectionErrorStage = (typeof SELECTION_ERROR_STAGES)[number];

/**
 * 생성 한 번이 끝났을 때 남길 관측값.
 *
 * `generate.ts`가 만들어 `route.ts`에 돌려준다. **응답 body와 같은 객체에 담지
 * 않는다** — 담으면 계측값이 사용자 응답으로 새는 것을 사람이 눈으로 막아야
 * 한다. 둘을 형으로 갈라 두면 그 실수를 컴파일러가 잡는다.
 */
export type GenerationObservation = {
	/** Sonnet에 실제 전달한 코퍼스. 부르지 않았으면 null이다. */
	deliveredMode: CorpusRoutingMode | null;
	generationAttempted: boolean;
	status: Exclude<ObservationStatus, "pending">;
	errorCode: GenerationErrorCode | null;

	selectionStatus: "success" | "ambiguous" | "failure" | null;
	selectionFallback: boolean | null;
	fallbackReasonIds: string[] | null;
	ambiguityIds: string[] | null;
	selectionErrorStage: SelectionErrorStage | null;
	selectionErrorCategory: string | null;
	selectionMs: number | null;
	selectionUsage: UsageLog | null;

	generationMs: number | null;
	generationStopReason: string | null;
	generationUsage: UsageLog | null;

	/** id가 아니라 개수다. 무엇을 골랐는지는 남기지 않는다. */
	deliveredPatternCount: number | null;
	injectedBytes: number | null;
};

/** 요청이 시작될 때 아는 값. pending 행에 그대로 들어간다. */
export type ObservationContext = {
	operationId: string;
	/** 요청 시작 시각. 오류 로그에도 같은 값을 쓴다. DB의 now()를 쓰지 않는다. */
	startedAt: string;
	kind: "create" | "refine";
	configuredMode: CorpusRoutingMode;
	deploymentId: string | null;
	isSmoke: boolean;
};

function toCount(value: unknown): number | null {
	return typeof value === "number" && Number.isFinite(value)
		? Math.round(value)
		: null;
}

function toText(value: unknown): string | null {
	return typeof value === "string" ? value : null;
}

/** usage 네 값을 열 이름으로 편다. 이름은 telemetry.ts의 USAGE_LOG_FIELDS를 따른다. */
function spreadUsage(
	prefix: "selection" | "generation",
	usage: UsageLog | null,
) {
	return {
		[`${prefix}_usage_input_tokens`]: usage?.input_tokens ?? null,
		[`${prefix}_usage_output_tokens`]: usage?.output_tokens ?? null,
		[`${prefix}_usage_cache_creation_input_tokens`]:
			usage?.cache_creation_input_tokens ?? null,
		[`${prefix}_usage_cache_read_input_tokens`]:
			usage?.cache_read_input_tokens ?? null,
	};
}

/**
 * Sonnet을 부르기 전에 넣는 행.
 *
 * 이 행이 먼저 있어야 하드 타임아웃으로 최종 갱신이 날아가도 「요청이 있었다」는
 * 사실이 남는다. 그래서 이 저장만은 `after()`에 넣지 않고 동기로 한다.
 */
export function buildPendingRow(context: ObservationContext) {
	return {
		operation_id: context.operationId,
		started_at: context.startedAt,
		deployment_id: context.deploymentId,
		is_smoke: context.isSmoke,
		kind: context.kind,
		configured_mode: context.configuredMode,
		status: "pending" as const,
	};
}

/**
 * 응답을 돌려준 뒤 `after()`에서 덮어쓰는 행.
 *
 * `generation_attempted`와 `delivered_mode`는 DB의 CHECK가 짝을 강제한다.
 * 여기서도 한 곳에서 함께 만들어 둘이 어긋날 자리를 없앤다.
 */
export function buildFinalRow(input: {
	observation: GenerationObservation;
	totalMs: number;
}) {
	const o = input.observation;
	// 부르지 않았으면 전달한 코퍼스도 없다. DB의 불변식과 같은 규칙을 여기서도
	// 적용해, 배선 실수가 400으로 튕기기 전에 값 자체가 만들어지지 않게 한다.
	const deliveredMode = o.generationAttempted ? o.deliveredMode : null;
	return {
		delivered_mode: deliveredMode,
		generation_attempted: deliveredMode !== null,
		status: o.status,
		error_code: o.errorCode,

		selection_status: o.selectionStatus,
		selection_fallback: o.selectionFallback,
		fallback_reason_ids: o.fallbackReasonIds,
		ambiguity_ids: o.ambiguityIds,
		selection_error_stage: o.selectionErrorStage,
		selection_error_category: o.selectionErrorCategory,
		selection_ms: toCount(o.selectionMs),
		...spreadUsage("selection", o.selectionUsage),

		generation_ms: toCount(o.generationMs),
		generation_stop_reason: toText(o.generationStopReason),
		...spreadUsage("generation", o.generationUsage),

		delivered_pattern_count: toCount(o.deliveredPatternCount),
		injected_bytes: toCount(o.injectedBytes),
		total_ms: toCount(input.totalMs),
	};
}

/** 저장 행에 나갈 수 있는 열 전부. 회귀 시험이 이 목록과 실제 행을 대조한다. */
export const PENDING_ROW_COLUMNS = [
	"operation_id",
	"started_at",
	"deployment_id",
	"is_smoke",
	"kind",
	"configured_mode",
	"status",
] as const;

export const FINAL_ROW_COLUMNS = [
	"delivered_mode",
	"generation_attempted",
	"status",
	"error_code",
	"selection_status",
	"selection_fallback",
	"fallback_reason_ids",
	"ambiguity_ids",
	"selection_error_stage",
	"selection_error_category",
	"selection_ms",
	"selection_usage_input_tokens",
	"selection_usage_output_tokens",
	"selection_usage_cache_creation_input_tokens",
	"selection_usage_cache_read_input_tokens",
	"generation_ms",
	"generation_stop_reason",
	"generation_usage_input_tokens",
	"generation_usage_output_tokens",
	"generation_usage_cache_creation_input_tokens",
	"generation_usage_cache_read_input_tokens",
	"delivered_pattern_count",
	"injected_bytes",
	"total_ms",
] as const;
