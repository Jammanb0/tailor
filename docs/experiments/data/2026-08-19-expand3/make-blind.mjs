// 채점용 블라인드 묶음 생성기.
//
// 두 조건(직전 = testing·debugging 확장 / 이번 = voice 확장)의 60건을
// 고정 시드로 섞고, 조건·시나리오 라벨을 모두 지운 채 채점자에게 넘긴다.
// 채점자는 조건이 둘이라는 사실 자체를 몰라야 한다 — 2026-08-18 headings 실험에서
// 이 절차 덕분에 불리한 결과(B축 회귀)가 정직하게 나왔다.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..", "..", "..");
const load = (p) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));

const conditions = [
	["before", "docs/experiments/data/2026-08-19-expand2/for-grader/generated-docs.json"],
	["after", "docs/experiments/data/2026-08-19-expand3/for-grader/generated-docs.json"],
];

const items = [];
for (const [condition, path] of conditions) {
	for (const d of load(path)) {
		items.push({ condition, sourceLabel: d.label, category: d.category, doc: d });
	}
}

// 고정 시드 셔플(mulberry32) — 재현 가능해야 자료를 다시 만들 수 있다.
let seed = 20260819;
const rand = () => {
	let t = (seed += 0x6d2b79f5);
	t = Math.imul(t ^ (t >>> 15), t | 1);
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const shuffle = (arr) => {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(rand() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
};

// 그냥 섞으면 한쪽 조건이 앞뒤로 몰릴 수 있다(첫 시도에서 실제로 그랬다).
// 채점자가 뒤로 갈수록 기준이 흔들리면 그 흔들림이 조건 차이로 잘못 잡힌다.
// 그래서 조건별로 섞은 뒤 짝을 지어 배치하고, 짝 안의 순서만 무작위로 둔다 —
// 어느 구간을 잘라도 두 조건이 반반이 된다.
const beforeItems = shuffle(items.filter((it) => it.condition === 'before'));
const afterItems = shuffle(items.filter((it) => it.condition === 'after'));
const paired = [];
for (let i = 0; i < Math.max(beforeItems.length, afterItems.length); i++) {
	const pair = [beforeItems[i], afterItems[i]].filter(Boolean);
	if (rand() < 0.5) pair.reverse();
	paired.push(...pair);
}
items.length = 0;
items.push(...paired);

const blind = [];
const key = [];
items.forEach((it, i) => {
	const id = `item-${String(i + 1).padStart(3, "0")}`;
	blind.push({
		id,
		situation: it.doc.situation,
		skillMarkdown: it.doc.skillMarkdown,
		needsMoreInfo: it.doc.needsMoreInfo,
		clarifyingQuestions: it.doc.clarifyingQuestions,
	});
	key.push({ id, condition: it.condition, sourceLabel: it.sourceLabel, category: it.category });
});

const OUT = join(HERE, "for-grader");
const KEY = join(HERE, "answer-key");
mkdirSync(OUT, { recursive: true });
mkdirSync(KEY, { recursive: true });
writeFileSync(join(OUT, "blind-items.json"), JSON.stringify(blind, null, 2), "utf8");
writeFileSync(join(KEY, "blind-mapping.json"), JSON.stringify(key, null, 2), "utf8");
console.log(`블라인드 ${blind.length}건 생성 (조건 라벨 제거, 시드 20260819)`);
