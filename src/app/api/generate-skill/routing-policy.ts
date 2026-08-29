export type CorpusRoutingMode = "full" | "routed";

export type CorpusDeliveryPolicy = {
	mode: CorpusRoutingMode;
	cacheCorpus: boolean;
};

/** 미설정 값과 오타는 현재 전체 주입 방식으로 안전하게 무너진다. */
export function readCorpusRoutingMode(
	value: string | undefined,
): CorpusRoutingMode {
	return value === "routed" ? "routed" : "full";
}

/** 정제는 설정값과 무관하게 전체 코퍼스를 사용한다. */
export function shouldSelectCorpus(input: {
	configuredMode: CorpusRoutingMode;
	isRefinement: boolean;
}): boolean {
	return input.configuredMode === "routed" && !input.isRefinement;
}

/**
 * 실제 생성에 적용할 코퍼스 모드와 캐시 정책.
 *
 * 선택 성공 때만 routed이며, 선택 결과가 없거나 안전장치가 전환을 요구하면
 * 현재 full 경로와 같은 캐시 정책으로 돌아간다.
 */
export function resolveCorpusDeliveryPolicy(input: {
	selectionEnabled: boolean;
	selectionFallback: boolean;
	hasRoutedSection: boolean;
}): CorpusDeliveryPolicy {
	if (
		input.selectionEnabled &&
		!input.selectionFallback &&
		input.hasRoutedSection
	) {
		return { mode: "routed", cacheCorpus: false };
	}
	return { mode: "full", cacheCorpus: true };
}

export type CorpusSystemBlock = {
	type: "text";
	text: string;
	cache_control?: { type: "ephemeral" };
};

/** full만 기존 5분 캐시를 유지하고 routed 코퍼스에는 캐시를 걸지 않는다. */
export function buildCorpusSystemBlock(input: {
	text: string;
	cacheCorpus: boolean;
}): CorpusSystemBlock {
	return input.cacheCorpus
		? {
				type: "text",
				text: input.text,
				cache_control: { type: "ephemeral" },
			}
		: { type: "text", text: input.text };
}
