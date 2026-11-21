// 생성 한 번의 결과를 응답과 따로 담는 관측값의 형.
//
// 처음에는 이 값을 Supabase에 저장했다(routed 운영 관찰, 2026-09-01~11-22).
// 저장은 끝냈고, 지금은 `runGeneration`이 응답(outcome)과 관측값을 형으로 갈라
// 돌려주는 계약만 남았다. 회귀 시험이 이 값으로 full·routed·전환·중단 경로가
// 실제로 어떻게 끝났는지 확인한다.
//
// 남기지 않는 것은 telemetry.ts와 같다 — 사용자가 쓴 글, 모델이 만든 문서 전문,
// 오류 객체의 message. 여기에 더해 **선택된 묶음·패턴 id도 담지 않는다.**
// 묶음 조합은 그 사람이 무엇을 만들려 했는지를 거의 그대로 드러낸다. 개수와
// 바이트만 담는다.
//
// 회귀 시험: `pnpm check:observation`

import type { GenerationErrorCode } from "@/lib/generation-errors";
import type { CorpusRoutingMode } from "./routing-policy";
import type { UsageLog } from "./telemetry";

/** 생성이 끝난 상태. */
export const OBSERVATION_STATUSES = [
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
	status: ObservationStatus;
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
