# Tailor

자기만의 Claude Code Skill(`.claude/skills/이름/SKILL.md`)을 AI의 도움으로
만드는 웹 서비스. Claude Code가 처음인 사람이 막히지 않도록 배려하되,
초심자 전용 제품은 아니다.

## 무엇을 하나

| 기능 | 경로 | 설명 |
|---|---|---|
| 용어 사전 | `/glossary` | "스킬", "에이전트", "CLI" 같은 개념을 쉬운 비유로 설명. AI 호출 없음 |
| **스킬 생성기** | `/create` | 몇 가지 질문에 답하면 SKILL.md 초안을 만들어 준다. 핵심 기능 |
| 갤러리 | `/gallery` | 참고할 만한 스킬을 둘러보고 받아 간다 |

생성기는 두 갈래다 — 이 사이트에서 바로 만들거나, 사용자의 Claude 세션으로
넘겨서 거기서 만들거나.

## 개발

```bash
pnpm install
pnpm dev
```

`http://localhost:3000`. 생성 기능을 쓰려면 `.env.local`에 `ANTHROPIC_API_KEY`가
필요하다(`.env.example` 참고).

```bash
pnpm lint          # Biome
npx tsc --noEmit   # 타입 검사
```

## 구조

```
src/app/                    페이지 + API 라우트
  api/generate-skill/       생성 API (route.ts / prompt.ts)
  api/eval-ab/              실험용 평가 하네스 (개발 전용)
src/components/create/      마법사·결과 화면
src/data/
  reference-corpus.ts       참고 코퍼스 — 공개 스킬에서 정리한 패턴 + 구조 골격
  gallery.ts                갤러리 데이터
  glossary.ts               용어 사전 데이터
docs/corpus/                원문 감사 기록 (코퍼스가 원문을 제대로 옮겼는지)
docs/experiments/           생성 품질 실험 기록 + 원자료
```

## 참고 코퍼스에 대해

생성 프롬프트에는 공개 스킬에서 정리한 "좋은 패턴"이 함께 주입되고, 모델이
실제로 쓴 패턴을 스스로 보고하면 결과 화면에 그 출처만 표시된다.

지키는 원칙:

- **소스를 두 등급으로 나눈다.** 라이선스가 확인된 소스(MIT / Apache-2.0)는 값
  리터럴까지 옮기고, 확인되지 않은 소스는 개념·방법만 우리 말로 요약해 담는다
  (문구·목록·표·템플릿은 담지 않는다). **어느 등급이든 출처는 표기한다.**
  각 소스의 저장소와 라이선스는 직접 확인해 기록한다 — 검색 결과의 라이선스
  표기는 믿지 않는다. 규칙 본문은 `src/data/reference-corpus.ts` 머리 주석,
  확인 절차는 `.claude/rules/corpus-sources.md`에 있다.
- **표기는 "원문을 읽었다"가 아니라 "정리한 패턴을 참고했다".** 이번 생성에
  실제로 쓰인 것만 표시한다.
- **표기하는 것은 근거를 짚을 수 있어야 한다.** 완성된 SKILL.md에서 확인할 수
  없는 항목은 출처 크레딧에 넣지 않는다.

코퍼스가 원문을 제대로 옮겼는지는 `docs/corpus/`에 소스별로 감사 기록을 남긴다.
