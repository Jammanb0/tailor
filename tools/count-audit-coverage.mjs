// 감사 항목 반영 현황을 센다.
//
// 왜 도구로 만드나: 이 수치를 손으로 세다 두 번 틀렸다.
//
//   ⓐ handoff의 "249개 중 52개 미참조"는 `writing-skills` 24개를 통째로
//      빼먹은 값이었다.
//   ⓑ `writing-plans`와 `writing-skills`가 **둘 다 `W-` 접두사를 쓴다.**
//      `W-18`은 두 소스의 서로 다른 항목을 가리키므로, `auditId`만으로 세면
//      한쪽의 반영이 다른 쪽의 반영으로 잘못 잡힌다.
//
// 그래서 **(auditId, sourceId) 짝**으로 센다. 패턴의 `auditIds`는 그 패턴의
// `sourceIds` 안에서만 유효하다고 본다.
//
// 사용: node tools/count-audit-coverage.mjs [--unref]
//   --unref 를 주면 소스별 미참조 항목 id까지 찍는다.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { referenceCategories } from "../src/data/reference-corpus.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const CORPUS_DOCS = join(HERE, "..", "docs", "corpus");
const SHOW_UNREF = process.argv.includes("--unref");

// 감사 문서 파일명 → 소스 id. 코퍼스의 소스 id와 파일명이 다른 경우가 있어
// 자동으로 맞출 수 없다(예: entpnomad-tone-of-voice.md ↔ tone-of-voice).
const DOC_TO_SOURCE = {
	"anthropic-doc-coauthoring.md": "anthropic-doc-coauthoring",
	"anthropic-frontend-design.md": "anthropic-frontend-design",
	"anthropic-theme-factory.md": "anthropic-theme-factory",
	"entpnomad-tone-of-voice.md": "tone-of-voice",
	"superpowers-brainstorming.md": "sp-brainstorming",
	"superpowers-requesting-code-review.md": "sp-requesting-code-review",
	"superpowers-systematic-debugging.md": "sp-systematic-debugging",
	"superpowers-test-driven-development.md": "sp-tdd",
	"superpowers-verification-before-completion.md":
		"sp-verification-before-completion",
	"superpowers-writing-plans.md": "sp-writing-plans",
	"superpowers-writing-skills.md": "sp-writing-skills",
};

// systematic-debugging의 제작 기록은 별도 소스 id를 갖지만 감사 문서는 본 스킬
// 것 하나뿐이다. 그 문서의 SD-51~57이 여기서 나온다.
const ALIASES = { "sp-systematic-debugging-log": "sp-systematic-debugging" };

// 코퍼스가 참조하는 (auditId, sourceId) 짝을 모은다.
const referenced = new Set();
for (const category of referenceCategories) {
	for (const pattern of category.patterns) {
		for (const auditId of pattern.auditIds ?? []) {
			for (const sourceId of pattern.sourceIds) {
				referenced.add(`${ALIASES[sourceId] ?? sourceId}|${auditId}`);
			}
		}
	}
}

let total = 0;
let unreferenced = 0;
const rows = [];

for (const file of readdirSync(CORPUS_DOCS).sort()) {
	const sourceId = DOC_TO_SOURCE[file];
	if (!sourceId) {
		console.error(`⚠ 매핑 없는 감사 문서: ${file} — DOC_TO_SOURCE에 추가할 것`);
		process.exitCode = 1;
		continue;
	}
	// 항목표의 행 머리에서 id를 뽑는다. 본문 언급은 세지 않는다.
	const ids = [
		...new Set(
			(
				readFileSync(join(CORPUS_DOCS, file), "utf8").match(
					/^\| ([A-Z]{1,3}-\d{1,3}) \|/gm,
				) ?? []
			).map((line) => line.slice(2, -2).trim()),
		),
	];
	const missing = ids.filter((id) => !referenced.has(`${sourceId}|${id}`));
	total += ids.length;
	unreferenced += missing.length;
	rows.push({ sourceId, count: ids.length, missing });
}

rows.sort((a, b) => b.missing.length - a.missing.length);

console.log("소스                              항목  미참조");
for (const row of rows) {
	console.log(
		`  ${row.sourceId.padEnd(32)}${String(row.count).padStart(4)}${String(row.missing.length).padStart(7)}`,
	);
	if (SHOW_UNREF && row.missing.length) {
		console.log(`      ${row.missing.join(" ")}`);
	}
}
console.log("");
console.log(
	`합계: 감사 항목 ${total}개 중 ${unreferenced}개 미참조 (반영률 ${Math.round(((total - unreferenced) / total) * 100)}%)`,
);
