// 기준선(before) 생성 실행기. 앱이 실제로 쓰는 /api/generate-skill 을 그대로 호출한다.
// 사용: node run.mjs [runs]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUNS = Number(process.argv[2] ?? 3);
const ENDPOINT = "http://localhost:3000/api/generate-skill";

const scenarios = JSON.parse(readFileSync(join(HERE, "scenarios.json"), "utf8"));

// 채점자에게 보일 것 / 정답지를 물리적으로 분리한다.
const VISIBLE = join(HERE, "for-grader");
const KEY = join(HERE, "answer-key");
mkdirSync(VISIBLE, { recursive: true });
mkdirSync(KEY, { recursive: true });

const docs = [];
const key = [];
const raw = [];

for (const s of scenarios) {
  for (let run = 1; run <= RUNS; run++) {
    const label = `${s.id}-run${run}`;
    const startedAt = Date.now();
    let res, json, error = null;
    try {
      res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          answers: { tool: "cli", situation: s.situation, language: "ko" },
          wantsAdvanced: false,
        }),
      });
      json = await res.json();
    } catch (e) {
      error = String(e);
    }
    const ms = Date.now() - startedAt;

    if (error || !res.ok) {
      console.log(`FAIL ${label} (${ms}ms) ${error ?? res.status}`);
      raw.push({ label, ok: false, ms, status: res?.status ?? null, error, body: json ?? null });
      continue;
    }

    // 채점자용: 스킬 본문과 되물음만. 모델의 자가 보고(어떤 패턴을 썼다고 신고했는지)는 제외.
    docs.push({
      label,
      category: s.category,
      situation: s.situation,
      filename: json.suggestedFilename ?? null,
      skillMarkdown: json.skillMarkdown ?? null,
      needsMoreInfo: json.needsMoreInfo ?? false,
      clarifyingQuestions: json.clarifyingQuestions ?? [],
      reviewNotes: json.reviewNotes ?? [],
    });

    // 정답지: 자가 보고 + 화면에 뜰 출처. 채점자에게 주지 않는다.
    key.push({
      label,
      category: s.category,
      
      
      referencedSources: json.referencedSources ?? null,
      structureSources: json.structureSources ?? null,
    });

    raw.push({ label, ok: true, ms, chars: (json.skillMarkdown ?? "").length, json });
    console.log(
      `OK   ${label} (${ms}ms) ${(json.skillMarkdown ?? "").length}자` +
        ` 출처=${(json.referencedSources ?? []).length}` +
        ` 구조출처=${(json.structureSources ?? []).length}` +
        (json.needsMoreInfo ? " [되물음]" : ""),
    );
  }
}

writeFileSync(join(VISIBLE, "generated-docs.json"), JSON.stringify(docs, null, 2), "utf8");
writeFileSync(join(KEY, "self-report.json"), JSON.stringify(key, null, 2), "utf8");
writeFileSync(join(HERE, "raw-results.json"), JSON.stringify(raw, null, 2), "utf8");

const okCount = raw.filter((r) => r.ok).length;
console.log(`\n완료: ${okCount}/${raw.length} 성공`);
