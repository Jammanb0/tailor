# 2026-08-18 기준선(baseline) 실험 원자료

`docs/experiments/2026-08-18-baseline-quality.md`의 근거 자료.

**이 시점의 코퍼스로 만든 결과물을 기록해 둔 것**이며, 개선 후 같은 시나리오·같은
채점 기준으로 다시 측정해 비교하기 위한 대조군이다. 코퍼스를 고치기 **전에**
받아둔 자료이므로, 이 폴더의 내용은 수정하지 않는다.

| 파일 | 무엇 |
|---|---|
| `scenarios.json` | 시나리오 8개(카테고리당 1개). 사용자가 쓴 상황 설명 |
| `run.mjs` | 실행기. 앱이 실제로 쓰는 `POST /api/generate-skill`을 그대로 호출 |
| `generated-docs.json` | **채점자에게 보인 것** — 생성된 SKILL.md 24건 + 상황 설명. 모델 자가 보고는 빠져 있다 |
| `GRADING-REPORT.md` | 블라인드 채점 결과 (별도 에이전트). 9장에 채점 규칙이 있다 — **개선판에 그대로 적용할 것** |
| `self-report.json` | **정답지.** 화면에 뜰 출처 표기. 채점 중에는 다른 디렉터리에 격리해 두었다 |
| `raw-results.json` | API 응답 전문 + 소요 시간 |

## 채점 격리

채점 에이전트에게는 `generated-docs.json`과 `scenarios.json`만 주었고,
`self-report.json`·`raw-results.json`·실행 로그는 **다른 디렉터리로 옮겨둔 뒤**
"발견해도 열지 말라"고 명시했다. 코퍼스(`src/data/reference-corpus.ts`)와 감사
문서(`docs/corpus/`)도 읽지 말라고 지시했다 — 읽으면 "의도한 것"에 끌려가
"실제 나온 것"을 못 보게 된다. 에이전트는 지시대로 두 파일만 열었다고 보고했다.

이 방식은 2026-08-18 출처 정직성 실험에서 쓴 것과 같다.

## 재현

```bash
# dev 서버가 3000 포트에 떠 있어야 한다
node run.mjs 3
```

조건: `claude-sonnet-5`, `thinking` 비활성, `output_config` 없음(API 기본값),
`max_tokens` 8192, 고급 질문 없이 `{ tool: "cli", situation, language: "ko" }`.
코퍼스는 커밋 `83d49ef` 시점 그대로이며 이 실험 중 수정하지 않았다.
