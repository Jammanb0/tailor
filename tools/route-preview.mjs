// 코퍼스 라우팅이 실제로 무엇을 고르고 무엇을 보내는지 눈으로 보는 도구.
//
// 사용: node tools/route-preview.mjs [시나리오id,...]
//
//   node tools/route-preview.mjs                    시나리오 전부
//   node tools/route-preview.mjs 01-testing         하나만
//
// dev 서버가 3000 포트에 떠 있어야 한다(pnpm dev). 시나리오마다 선택 모델을
// 한 번씩 부르므로 API 비용이 든다 — 좁혀 쓸 것.
//
// **이것은 채점이 아니다.** 여기서 나오는 것은 "무엇을 골랐나"까지이고, 그
// 선택이 맞는지는 6단계에서 사람이 판정한다. 통과 기준을 정하기 전에 이 출력을
// 성적표로 읽지 말 것.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = join(HERE, "..", "docs", "experiments", "data");
const ENDPOINT = "http://localhost:3000/api/route-preview";

const all = [
	...JSON.parse(
		readFileSync(join(DATA, "2026-08-19-expand3", "scenarios.json"), "utf8"),
	),
	...JSON.parse(
		readFileSync(
			join(DATA, "2026-08-20-baseline-fill", "scenarios-extra.json"),
			"utf8",
		),
	),
];
const only = process.argv[2]
	? new Set(process.argv[2].split(",").map((one) => one.trim()))
	: null;
const scenarios = only ? all.filter((one) => only.has(one.id)) : all;
if (!scenarios.length) {
	console.error(
		`고른 시나리오가 없습니다. 있는 것: ${all.map((one) => one.id).join(", ")}`,
	);
	process.exit(1);
}

let failed = 0;
for (const scenario of scenarios) {
	let json;
	try {
		const res = await fetch(ENDPOINT, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				answers: { tool: "cli", situation: scenario.situation, language: "ko" },
				wantsAdvanced: false,
			}),
		});
		json = await res.json();
		if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);
	} catch (e) {
		failed += 1;
		console.error(`FAIL ${scenario.id}: ${e}`);
		continue;
	}

	const { selection, plan, render } = json;
	const share = ((render.routedBytes / render.fullBytes) * 100).toFixed(1);
	console.log(`\n■ ${scenario.id}`);
	console.log(
		`  묶음(${plan.bundleIds.length}): ${plan.bundleIds.join(", ") || "(없음)"}`,
	);
	if (plan.unknownBundleIds.length) {
		console.log(`  ⚠ 목록에 없는 id: ${plan.unknownBundleIds.join(", ")}`);
	}
	if (plan.rejectedBundleIds.length) {
		console.log(`  ⚠ 평가 전용이라 뺌: ${plan.rejectedBundleIds.join(", ")}`);
	}
	if (plan.directSignalPatternIds.length) {
		console.log(`  직접 신호로 켬: ${plan.directSignalPatternIds.join(", ")}`);
	}
	if (plan.directSignalOffPatternIds.length) {
		console.log(
			`  직접 신호로 끔: ${plan.directSignalOffPatternIds.join(", ")}`,
		);
	}
	if (plan.addedByRequires.length) {
		console.log(`  requires로 딸려옴: ${plan.addedByRequires.join(", ")}`);
	}
	// 덧셈으로 적지 않는다. 신호로 끈 것과 관계로 딸려온 것이 있어 「항상 + 묶음」이
	// 최종 전달량과 맞지 않을 수 있고, 그 표기를 믿으면 6단계 측정에서 두 값을
	// 섞게 된다. 최종 전달량은 patternIds, 묶음이 데려온 후보는 bundlePatternIds다.
	console.log(
		`  전달 패턴 ${plan.patternIds.length}개(최종)` +
			` · 묶음이 데려온 후보 ${plan.bundlePatternIds.length}개` +
			` · 항상 ${plan.alwaysPatternIds.length}개`,
	);
	console.log(
		`  코퍼스 ${render.routedBytes.toLocaleString()}바이트 / 전체 ${render.fullBytes.toLocaleString()}바이트 (${share}%)`,
	);
	if (selection.usage) {
		console.log(
			`  선택 호출: ${selection.ms}ms · 입력 ${selection.usage.input_tokens} · 출력 ${selection.usage.output_tokens}`,
		);
	}
}

console.log(`\n시나리오 ${scenarios.length}건 · 실패 ${failed}건`);
if (failed) process.exit(1);
