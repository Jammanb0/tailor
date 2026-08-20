// SD-13(Phase 2 네 항목) 채운 뒤 눈으로 확인하는 생성 실행기.
//
// A/B가 아니다 — 이 항목이 결과물에 나오는지는 2026-08-20 A/B에서 이미 6 대 0으로
// 갈렸다. 여기서 보는 것은 "네 항목의 내용까지 실리는가"다. 그래서 조건 하나로
// 3건만 돌리고 눈으로 읽는다.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const HERE = dirname(fileURLToPath(import.meta.url));
const SITUATION =
	"버그가 나면 일단 여기저기 고쳐보다가 우연히 고쳐지는 경우가 많아요. 왜 고쳐졌는지도 모르고요. 원인을 제대로 찾아가는 순서대로 진행하게 하고, 원인을 모른 채로 '고쳐졌다'고 넘어가지 않게 해줬으면 해요.";
mkdirSync(join(HERE, "out"), { recursive: true });
const results = [];
await Promise.all(
	[1, 2, 3].map(async (run) => {
		const res = await fetch("http://localhost:3000/api/generate-skill", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({
				answers: { tool: "cli", situation: SITUATION, language: "ko" },
				wantsAdvanced: false,
			}),
		});
		const j = await res.json();
		const md = j.skillMarkdown ?? j.skill_md ?? "";
		writeFileSync(join(HERE, "out", `run${run}.md`), md);
		results.push({ run, chars: md.length, patterns: j.usedPatterns ?? [] });
		console.log(`run${run}: ${md.length}자`);
	}),
);
writeFileSync(join(HERE, "meta.json"), JSON.stringify(results, null, "\t"));
