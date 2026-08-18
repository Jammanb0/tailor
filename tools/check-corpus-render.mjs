// 코퍼스 렌더 결과가 기준 파일과 바이트 단위로 같은지 대조한다.
//
// 사용: node tools/check-corpus-render.mjs        (대조)
//       node tools/check-corpus-render.mjs --update (기준 파일 갱신)
//
// 왜 필요한가: 코퍼스 스키마를 고칠 때 데이터를 그대로 뒀다면 프롬프트에 들어가는
// 글자도 그대로여야 한다. 줄바꿈 하나만 어긋나도 이미 받아둔 before 자료
// (docs/experiments/data/2026-08-18-baseline, -mismatch)와 조건이 달라져 비교가
// 무효가 되는데, 그 어긋남은 눈으로 보이지 않는다. 그래서 기계로 대조한다.
//
// 기준 파일을 갱신하는 것은 "렌더 결과를 의도적으로 바꿨다"는 선언이다.
// 실험 도중에 --update를 쓰면 대조군이 조용히 사라진다 — 쓰기 전에 한 번 더 생각할 것.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const GOLDEN = join(HERE, "corpus-section.golden.txt");
const ENDPOINT = "http://localhost:3000/api/corpus-snapshot";
const UPDATE = process.argv.includes("--update");

let current;
try {
	const res = await fetch(ENDPOINT);
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	current = Buffer.from(await res.arrayBuffer());
} catch (e) {
	console.error(`렌더 결과를 받지 못했습니다: ${e}`);
	console.error(`dev 서버가 3000 포트에 떠 있어야 합니다 (pnpm dev).`);
	process.exit(2);
}

if (UPDATE) {
	writeFileSync(GOLDEN, current);
	console.log(`기준 파일 갱신: ${current.length} bytes`);
	process.exit(0);
}

let golden;
try {
	golden = readFileSync(GOLDEN);
} catch {
	console.error(`기준 파일이 없습니다: ${GOLDEN}`);
	console.error(`처음이라면 --update로 만드세요.`);
	process.exit(2);
}

if (golden.equals(current)) {
	console.log(`OK  렌더 결과가 기준과 동일합니다 (${current.length} bytes)`);
	process.exit(0);
}

console.error(
	`FAIL 렌더 결과가 기준과 다릅니다 (기준 ${golden.length} bytes → 현재 ${current.length} bytes)`,
);

// 어디서 갈렸는지 첫 지점만 보여준다. 전체 diff는 파일로 떠서 보는 편이 낫다.
const a = golden.toString("utf8").split("\n");
const b = current.toString("utf8").split("\n");
for (let i = 0; i < Math.max(a.length, b.length); i++) {
	if (a[i] !== b[i]) {
		console.error(`\n첫 차이: ${i + 1}번째 줄`);
		console.error(`  기준: ${JSON.stringify(a[i] ?? "(없음)")}`);
		console.error(`  현재: ${JSON.stringify(b[i] ?? "(없음)")}`);
		break;
	}
}
console.error(
	`\n의도한 변경이라면 --update로 기준을 갱신하되, 진행 중인 실험의 대조군이 무효가 되는지 먼저 확인할 것.`,
);
process.exit(1);
