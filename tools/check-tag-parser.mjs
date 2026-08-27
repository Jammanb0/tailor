// 응답 파서 회귀 시험.
//
// 잡는 것: 모델이 검토 메모 **안에서 태그 이름을 산문으로 언급**했을 때
// 파서가 그 자리를 여는 태그로 잡는 문제. 실제로 이런 응답이 나왔다.
//
//   <review>
//   - 실제 사용 시 다를 수 있어 <questions>에 확인을 요청했습니다.
//   </review>
//   <questions>
//   - 진짜 질문
//   </questions>
//
// 줄 머리 조건이 없으면 되물음 목록의 첫 항목이 "에 확인을 요청했습니다."가 되고
// `</review>`와 `<questions>`가 항목으로 딸려 들어와 화면에 그대로 노출된다.
// (저장된 생성물 2,588건 중 4건에서 관찰. 재현율은 낮지만 나오면 눈에 띈다.)
//
// 함께 잡는 것: 모델이 **닫는 태그를 안 붙이고 끝낸** 응답. 2026-08-27 측정에서
// <skill_md>를 열고 문서를 다 쓴 뒤 </skill_md> 없이 끝낸 응답이 3회 중 1회
// 나왔고, 짝이 맞아야만 본문을 꺼내던 파서가 완성된 문서를 통째로 버렸다.
// 되돌림 경로를 넣되 위 결함을 되살리지 않는 것이 여기 시험의 요점이다.
//
// prompt.ts는 `@/` 별칭을 쓰는 모듈을 불러오므로 그냥은 import할 수 없다.
// 그래서 **파일에서 함수들의 실제 소스를 뽑아** 돌린다 — 복사본을 시험하면
// 파일을 안 고쳐도 통과해서 시험의 뜻이 없어진다.
//
// 사용: node tools/check-tag-parser.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROMPT = join(
	HERE,
	"..",
	"src",
	"app",
	"api",
	"generate-skill",
	"prompt.ts",
);
// 줄바꿈을 LF로 맞춰 읽는다. 아래에서 함수 끝을 `\n}\n`로 찾는데, Windows
// 체크아웃(core.autocrlf)에서는 작업 트리가 CRLF라 그대로 두면 하나도 못 찾고
// 시험이 통째로 죽는다.
const src = readFileSync(PROMPT, "utf8").replace(/\r\n/g, "\n");

// export 여부와 무관하게 뽑는다 — 되돌림 경로(extractUnclosedTag)는 모듈
// 바깥에 안 나가지만 시험은 해야 한다.
const grab = (name) => {
	const i = src.search(new RegExp(`^(?:export )?function ${name}\\(`, "m"));
	if (i < 0) throw new Error(`prompt.ts에 ${name}이 없습니다`);
	const j = src.indexOf("\n}\n", i);
	return src.slice(i, j + 3).replace(/^export /, "");
};

// 시그니처의 타입만 벗긴다. 본문은 건드리지 않는다 — `: null`을 통째로 지우면
// 삼항 연산자의 `: null`까지 먹는다.
const stripSig = (fn) =>
	fn
		.replace(/\(([^)]*)\)(\s*:\s*[^{]+)\{/, (_, args) => {
			const bare = args
				.split(",")
				.map((a) => a.split(":")[0].trim())
				.filter(Boolean)
				.join(", ");
			return `(${bare}) {`;
		})
		.replace(/\(line: string\)/g, "(line)");

const tagOnly = src.match(/const TAG_ONLY_LINE = .*;/)?.[0];
if (!tagOnly) throw new Error("prompt.ts에 TAG_ONLY_LINE이 없습니다");

const topLevel = src.match(/const TOP_LEVEL_TAGS =[\s\S]*?;/)?.[0];
if (!topLevel) throw new Error("prompt.ts에 TOP_LEVEL_TAGS가 없습니다");

const { extractTag, extractListTag } = new Function(
	[
		stripSig(grab("extractTag")),
		topLevel,
		stripSig(grab("extractUnclosedTag")),
		tagOnly,
		stripSig(grab("extractListTag")),
		"return { extractTag, extractListTag };",
	].join("\n"),
)();

const failures = [];
const check = (name, actual, expected) => {
	const ok = JSON.stringify(actual) === JSON.stringify(expected);
	console.log(`${ok ? "OK  " : "FAIL"} ${name}`);
	if (!ok) {
		failures.push(name);
		console.log(`     기대: ${JSON.stringify(expected)}`);
		console.log(`     실제: ${JSON.stringify(actual)}`);
	}
};

// ① 실제로 관찰된 응답 모양
const observed = `<review>
- 골격은 reference로 잡았습니다.
- 실제 사용 시 다를 수 있어 <questions>에 확인을 요청했습니다.
</review>
<questions>
- 실제로 다루시는 엑셀의 항목 이름을 알려주세요
- 부가세 계산 방식이 거래처마다 다른가요
</questions>
<filename>
monthly-sales
</filename>`;

check(
	"산문 속 태그 언급에 속지 않는다",
	extractListTag(observed, "questions"),
	[
		"실제로 다루시는 엑셀의 항목 이름을 알려주세요",
		"부가세 계산 방식이 거래처마다 다른가요",
	],
);
check(
	"뒤따르는 태그도 멀쩡히 잡힌다",
	extractTag(observed, "filename"),
	"monthly-sales",
);

// ② 형식이 흔들린 응답에서 통째로 놓치지 않는다(되돌림 경로)
check(
	"여는 태그가 줄 머리에 없어도 잡는다",
	extractListTag("설명 <questions>\n- 한 줄\n</questions>", "questions"),
	["한 줄"],
);

// ③ 태그만 있는 줄은 항목으로 세지 않는다
check(
	"태그만 있는 줄은 걸러진다",
	extractListTag("<questions>\n- 진짜\n</review>\n</questions>", "questions"),
	["진짜"],
);

// ④ 없는 태그는 빈 결과
check("없는 태그는 빈 목록", extractListTag(observed, "nope"), []);

// ⑤ 닫는 태그 없이 끝난 응답 — 2026-08-27에 실제로 502를 냈던 모양
const unclosedToEnd = `<skill_md>
---
name: monthly-sales
---

# 월간 매출 정리

1. 엑셀을 연다.`;

check(
	"닫는 태그 없이 끝나도 본문을 건진다",
	extractTag(unclosedToEnd, "skill_md"),
	"---\nname: monthly-sales\n---\n\n# 월간 매출 정리\n\n1. 엑셀을 연다.",
);

// ⑥ 닫는 태그가 없어도 다음 최상위 태그를 넘어 삼키지 않는다
const unclosedThenNext = `<skill_md>
# 월간 매출 정리

1. 엑셀을 연다.
<review>
- 골격은 workflow로 잡았습니다.
</review>`;

check(
	"닫는 태그가 없으면 다음 최상위 태그 앞에서 멈춘다",
	extractTag(unclosedThenNext, "skill_md"),
	"# 월간 매출 정리\n\n1. 엑셀을 연다.",
);
check(
	"뒤따르는 블록은 그대로 잡힌다",
	extractListTag(unclosedThenNext, "review"),
	["골격은 workflow로 잡았습니다."],
);

// ⑦ 되돌림 경로가 a0a5c9b의 결함을 되살리지 않는다.
// <questions>는 산문 속에만 있고 블록으로는 없다 — 닫는 태그가 없다고 해서
// 이 문장 중간을 여는 자리로 잡으면 안 된다.
const proseMentionOnly = `<skill_md>
# 제목
</skill_md>
<review>
- 실제 사용 시 다를 수 있어 <questions>에 확인을 요청했습니다.
</review>`;

check(
	"산문 속 태그 언급은 되돌림 경로로도 열리지 않는다",
	extractTag(proseMentionOnly, "questions"),
	null,
);

console.log("");
if (failures.length) {
	console.error(`실패 ${failures.length}건: ${failures.join(", ")}`);
	process.exit(1);
}
console.log("OK  태그 파서 7건 통과");
