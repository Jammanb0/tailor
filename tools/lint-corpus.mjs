// 코퍼스 저술 규칙 검사기.
//
// 사용: node --experimental-strip-types tools/lint-corpus.mjs
//       (pnpm lint:corpus)
//
// 왜 있나: 2026-08-18 원문 감사에서 두 소스 모두 "태도는 남고 형식은 빠졌다"는
// 같은 실패를 보였다. 원인은 스키마에 칸이 없었던 것과, 있어도 채우는지 아무도
// 확인하지 않은 것 둘 다다. 칸(examples/format/options)을 만들면서 이 검사기를
// 같은 커밋에 넣는 이유가 그것 — 필드만 늘리면 아무도 안 채운다.
//
// 이 검사기는 "빠뜨렸는가"를 잡지 "잘 썼는가"를 판정하지 않는다. 내용 품질은
// 생성 실험(docs/experiments/)에서 측정한다.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	getSourceById,
	referenceCategories,
	structureArchetypes,
} from "../src/data/reference-corpus.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROMPT_TS = join(
	HERE,
	"..",
	"src",
	"app",
	"api",
	"generate-skill",
	"prompt.ts",
);

const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);

// ── 규칙 1: verifyHint는 프롬프트에 렌더되지 않는다 ────────────────
// 채점 기준을 모델에게 주면 그 기준에 맞춰 쓰게 되어 측정이 자기충족이 된다.
// 주석에서 이 필드를 설명하는 것은 정상이므로, 주석을 걷어낸 코드만 본다.
const promptCode = readFileSync(PROMPT_TS, "utf8")
	.replace(/\/\*[\s\S]*?\*\//g, "")
	.replace(/\/\/.*$/gm, "");
if (promptCode.includes("verifyHint")) {
	fail(
		"prompt.ts",
		"verifyHint를 렌더러가 참조하고 있습니다 — 프롬프트에 넣지 않기로 한 필드입니다",
	);
}

// ── 규칙 2~5: 패턴 단위 검사 ──────────────────────────────────────
const AUDIT_ID = /^[A-Z]{1,3}-\d{1,3}$/;
const STRUCTURED_FIELDS = [
	"examples",
	"format",
	"options",
	"exception",
	"auditIds",
	"verifyHint",
];

const seenIds = new Map();

for (const category of referenceCategories) {
	for (const p of category.patterns) {
		const where = `${category.id}/${p.id}`;

		// 5-a. id 중복 — 중복되면 출처 되짚기가 엉뚱한 패턴을 가리킨다.
		if (seenIds.has(p.id)) {
			fail(where, `id가 ${seenIds.get(p.id)}와 중복입니다`);
		}
		seenIds.set(p.id, where);

		// 5-b. 출처가 실존해야 한다. 못 찾으면 화면에서 크레딧이 조용히 사라진다.
		if (!p.sourceIds?.length) fail(where, "sourceIds가 비어 있습니다");
		for (const sid of p.sourceIds ?? []) {
			if (!getSourceById(sid))
				fail(where, `sourceIds의 "${sid}"를 찾을 수 없습니다`);
		}

		// 6. adapted(가공)는 원 소스가 있어야 성립한다.
		// "원 소스 + Tailor 가공" 표기의 앞쪽이 비면 표기 자체가 거짓이 된다.
		// Tailor가 처음부터 만든 것은 가공이 아니라 self(=Tailor-made)다.
		if (p.adapted) {
			const external = (p.sourceIds ?? []).filter(
				(sid) => getSourceById(sid) && !getSourceById(sid).self,
			);
			if (!external.length) {
				fail(
					where,
					"adapted인데 원 소스가 없습니다 — 처음부터 만든 것이라면 self 출처를 쓰세요",
				);
			}
		}

		// 4. 구조화된 칸을 하나라도 썼다면 kind를 명시해야 한다.
		// 기본값(artifact)에 기대면, 결과물로 검증할 수 없는 항목이 크레딧에
		// 섞여 들어간다(2026-08-18 출처 정직성 실험의 거짓 크레딧 원인).
		const usesStructured = STRUCTURED_FIELDS.some(
			(f) => p[f] !== undefined && p[f] !== null,
		);
		if (usesStructured && p.kind === undefined) {
			fail(
				where,
				"구조화된 칸을 썼다면 kind를 명시해야 합니다(artifact | process)",
			);
		}

		// 2-a. 값에는 성격 서술이 반드시 붙는다.
		// 값만 있으면 사용자 상황에 맞는지 판단할 수 없어 참고 자체가 불가능하다.
		for (const [i, o] of (p.options ?? []).entries()) {
			if (!o.value?.trim()) fail(where, `options[${i}].value가 비어 있습니다`);
			if (!o.character?.trim()) {
				fail(
					where,
					`options[${i}]("${o.value}")에 성격 서술(character)이 없습니다`,
				);
			}
		}

		// 2-b. 예시는 극성과 본문이 모두 있어야 한다.
		// 극성이 없으면 나쁜 예로 적은 값이 권장값으로 읽힌다.
		for (const [i, e] of (p.examples ?? []).entries()) {
			if (e.polarity !== "good" && e.polarity !== "bad") {
				fail(where, `examples[${i}].polarity는 "good" 또는 "bad"여야 합니다`);
			}
			if (!e.text?.trim()) fail(where, `examples[${i}].text가 비어 있습니다`);
		}

		// 2-c. format을 열었으면 최소 한 조각은 채운다(빈 껍데기 방지).
		if (p.format) {
			const filled =
				p.format.count?.trim() ||
				p.format.sections?.length ||
				p.format.template?.trim();
			if (!filled)
				fail(where, "format이 비어 있습니다 — 안 쓸 거면 필드를 지우세요");
		}

		// 3. 감사 항목 id는 항목 단위 형식만 받는다(파일 경로 금지).
		for (const aid of p.auditIds ?? []) {
			if (!AUDIT_ID.test(aid)) {
				fail(where, `auditIds의 "${aid}"는 항목 id 형식이 아닙니다(예: D-17)`);
			}
		}
	}
}

// ── 구조 골격도 출처 실존 검사만 함께 ───────────────────────────────
for (const a of structureArchetypes) {
	for (const sid of a.sourceIds ?? []) {
		if (!getSourceById(sid)) {
			fail(`archetype/${a.id}`, `sourceIds의 "${sid}"를 찾을 수 없습니다`);
		}
	}
}

const patternCount = referenceCategories.reduce(
	(n, c) => n + c.patterns.length,
	0,
);

if (errors.length) {
	console.error(`FAIL ${errors.length}건\n`);
	for (const e of errors) console.error(`  - ${e}`);
	process.exit(1);
}

console.log(
	`OK  패턴 ${patternCount}개, 골격 ${structureArchetypes.length}개 검사 통과`,
);
