// 앱 코드를 node에서 그대로 불러오기 위한 해석 훅. tools/alias-loader.mjs가 등록한다.
//
// 두 가지만 한다.
//   1. `@/x` → `<repo>/src/x` (tsconfig의 paths와 같은 규칙)
//   2. 확장자를 생략한 상대 경로에 `.ts`/`.tsx`를 붙여 본다
//
// 앱 코드는 번들러 기준으로 쓰여 있어 확장자를 적지 않는다. node는 그걸
// 못 찾으므로 여기서 실제 파일을 확인해 붙인다. 없으면 손대지 않고 node의
// 기본 해석에 그대로 넘긴다 — 우리가 오류를 가리지 않게.

import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC = join(dirname(dirname(fileURLToPath(import.meta.url))), "src");

function firstExisting(base) {
	for (const candidate of [
		base,
		`${base}.ts`,
		`${base}.tsx`,
		join(base, "index.ts"),
	]) {
		if (existsSync(candidate)) return pathToFileURL(candidate).href;
	}
	return null;
}

export async function resolve(specifier, context, nextResolve) {
	if (specifier.startsWith("@/")) {
		const found = firstExisting(join(SRC, specifier.slice(2)));
		if (found) return nextResolve(found, context);
	} else if (specifier.startsWith(".") && context.parentURL) {
		const base = join(dirname(fileURLToPath(context.parentURL)), specifier);
		const found = firstExisting(base);
		if (found) return nextResolve(found, context);
	}
	return nextResolve(specifier, context);
}
