<div align="center">

# Tailor

**자기만의 Claude Code Skill을 AI의 도움으로 만드는 웹 서비스**

한국어 · [English](README.en.md)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Claude](https://img.shields.io/badge/Claude-Sonnet_5-D97757?logo=anthropic&logoColor=white)

</div>

---

Claude Code에는 `SKILL.md`라는 게 있습니다. "이런 상황에서는 이렇게 해줘"를
적어 두면 Claude가 알아서 꺼내 쓰는 파일이에요. 편리하지만 **막상 처음
만들려고 하면 무엇을 어떤 순서로 적어야 하는지가 막막합니다.**

Tailor는 그 부분을 대신 물어봐 줍니다. 몇 가지 질문에 답하면 쓸 만한 초안이
나오고, 그 초안이 왜 그렇게 생겼는지도 함께 보여줍니다.

Tailor는 Claude Code를 처음 접하는 사람부터 이미 스킬을 만들어 본 숙련된
사용자까지 함께 쓸 수 있도록 설계했습니다. 기술 용어나 구체적인 값을 덜어내지
않되, 처음 나오는 용어에는 짧은 풀이를 붙였습니다. 처음에는 쉽게 시작하고,
익숙해진 뒤에도 필요한 만큼 구체적으로 다룰 수 있습니다.

<div align="center">

<img src="docs/images/tailor-skill-builder.png" alt="Tailor 스킬 생성기의 첫 번째 질문 화면" width="650">

<sub>몇 가지 질문에 답하며 나에게 맞는 <code>SKILL.md</code> 초안을 만듭니다.</sub>

<br><br>

<img src="docs/images/tailor-generated-skill.png" alt="Tailor에서 실제로 생성된 README 검토 스킬 결과 화면" width="900">

<sub>실제 생성 결과 — 완성된 <code>SKILL.md</code>와 AI 자체 점검을 함께 확인할 수 있습니다.</sub>

</div>

## 무엇을 하나요

| | 경로 | 설명 |
|---|---|---|
| **용어 사전** | `/glossary` | "스킬", "에이전트", "CLI" 같은 개념 21개를 쉬운 비유로 풀어 줍니다. AI를 부르지 않습니다 |
| **스킬 생성기** | `/create` | 질문에 답하면 `SKILL.md` 초안을 만들어 줍니다. 핵심 기능입니다 |
| **갤러리** | `/gallery` | 참고할 만한 스킬을 둘러보고 받아 갑니다 |

## 스킬 생성기의 두 갈래

`/create`에 들어가면 만드는 방법을 먼저 고르게 됩니다. **둘은 잘하는 것이
다릅니다.**

| | 이 사이트에서 만들기 | 내 Claude로 이어서 만들기 |
|---|---|---|
| 어디서 만드나 | 서버가 Claude API를 **1회** 호출 | `claude://` 딥링크로 **본인 Claude 세션** |
| 참고 코퍼스 | **함께 들어갑니다** | 링크에 담기지 않아 **못 넘깁니다** |
| 출처 표기 | 결과 화면에 표시됩니다 | 붙지 않습니다 |
| 내 프로젝트 파일 | 볼 수 없습니다 | **보면서 물어볼 수 있습니다** |
| 비용 | 서비스 운영자 부담 | **본인 Claude 계정** |

문서의 짜임새만 놓고 보면 웹 경로가 대체로 낫습니다. 이 차이는 고르기 전에
읽을 수 있도록 화면에도 적어 두었습니다.

> **이관 경로의 저장 원칙**
> 넘기는 프롬프트에는 *"초안을 보여주고 승인받은 뒤, 저장 위치를 물어보고,
> 저장 직전 다시 확인받고 나서만 저장하라"* 는 지시가 들어 있습니다.
> 다만 이건 코드가 아니라 지시문이라 100% 강제되지는 않습니다.

## 직접 돌려보기

```bash
pnpm install
pnpm dev
```

`http://localhost:3000`에서 열립니다.

> [!IMPORTANT]
> **생성 기능을 쓰려면 Claude API 키가 필요합니다.**
> 저장소 루트에 `.env.local` 파일을 만들고 키를 넣어 주세요
> (`.env.example` 참고).
>
> ```bash
> # .env.local
> ANTHROPIC_API_KEY=sk-ant-...
> ```
>
> 키는 [console.anthropic.com](https://console.anthropic.com)에서 발급받습니다.

`.env.local`은 `.gitignore`에 잡혀 있어 커밋되지 않고, 키는 **서버에서만**
읽습니다(`src/app/api/generate-skill/route.ts`). 브라우저로 내려가지 않습니다.

키가 없어도 **용어 사전과 갤러리는 그대로 동작합니다.** 둘 다 AI를 호출하지
않는 정적 페이지예요. 키 없이 `/create`에서 생성을 시도하면 "API 키가 설정되어
있지 않다"는 안내가 뜹니다.

<details>
<summary><b>검사 명령</b></summary>

```bash
pnpm lint            # Biome (lint + format)
npx tsc --noEmit     # 타입 검사
pnpm lint:corpus     # 코퍼스 작성 규칙 (패턴 148개 / 골격 4개)
pnpm check:parser    # 모델 응답 태그 파서 회귀
```

</details>

## 참고 코퍼스

생성 프롬프트에는 공개 스킬에서 미리 정리해 둔 **"좋은 패턴"** 이 함께
주입됩니다. 원문을 실행 중에 다시 읽지 않고, 생성은 구조화된 API 호출 1회로
끝납니다.

<div align="center">

| 카테고리 | 패턴 | 문서 골격 | 출처 스킬 |
|:---:|:---:|:---:|:---:|
| **9** | **148** | **4** | **13** |

</div>

`baseline` 카테고리만 요청 종류와 무관하게 항상 주입됩니다.

<details>
<summary><b>남의 것을 정리해 담을 때 지키는 원칙</b></summary>

- **소스를 두 등급으로 나눕니다.** 라이선스가 확인된 소스(MIT / Apache-2.0)는
  값 리터럴까지 옮기고, 확인되지 않은 소스는 개념·방법만 우리 말로 요약해
  담습니다(문구·목록·표·템플릿은 담지 않습니다). **어느 등급이든 출처는
  표기합니다** — 표기를 생략하면 화면에서 자체 제작으로 보이는데, 그건 틀린
  신호입니다.
- **각 소스의 저장소와 라이선스는 직접 확인해 기록합니다.** 검색 결과의
  라이선스 표기는 믿지 않습니다. 확인하지 못했으면 `"확인되지 않음"`이라고
  적습니다 — 화면에 그대로 표시되는 값이라, 추측을 적으면 사용자에게 거짓을
  보여주게 됩니다.
- **표기는 "원문을 읽었다"가 아니라 "정리한 패턴을 참고했다"** 입니다. 이번
  생성에 실제로 쓰인 것만 표시합니다.
- **표기하는 것은 근거를 짚을 수 있어야 합니다.** 완성된 `SKILL.md`에서 확인할
  수 없는 항목은 출처 크레딧에 넣지 않습니다.

규칙 본문은 `src/data/reference-corpus.ts` 머리 주석에, 소스 검증 절차는
`docs/corpus-sources.md`에 있습니다. 코퍼스가 원문을 제대로 옮겼는지는
`docs/corpus/`에 소스별 감사 기록으로 남깁니다 — 파일 목록·바이트·md5까지
적습니다.

> 이 판단은 법률 자문이 아닙니다.

</details>

## 만들면서 남긴 기록

품질을 눈대중으로 판단하지 않으려고, 무엇을 바꿨고 그래서 어떻게 됐는지를
그때그때 적어 두었습니다.

- **`docs/corpus/`** — 코퍼스가 원문을 제대로 옮겼는지 소스별로 대조한 감사
  기록 **11편**. 어떤 파일을 어디까지 읽었는지 파일 목록·바이트·md5까지
  적습니다
- **`docs/experiments/`** — 생성 품질 실험 기록 **9편**과 원자료. 모델·설정
  비교, 코퍼스를 채웠을 때 결과가 실제로 달라지는지, 표기한 출처가 결과물에
  정말 반영됐는지를 블라인드로 채점한 기록 등이 있습니다

나중에 **뒤집힌 결론도 지우지 않고**, 문서 상단에 정정 문구만 덧붙이는 방식으로
관리합니다. 본문을 고치면 "그때 무엇을 쟀는가"가 바뀌기 때문입니다. 그래서
결론을 인용하기 전에는 **문서 맨 위를 먼저 봐 주세요.**

## 프로젝트 구조

<details>
<summary><b>펼쳐 보기</b></summary>

```
src/app/                    페이지 + API 라우트
  api/generate-skill/       생성 API (route.ts / prompt.ts)
  api/eval-ab/              실험용 평가 하네스 (개발 전용, 배포 환경에서는 404)
  api/corpus-snapshot/      코퍼스 렌더 덤프 (개발 전용, 배포 환경에서는 404)
src/components/create/      마법사 · 결과 화면 · 이관 패널
src/data/
  reference-corpus.ts       참고 코퍼스 — 패턴 + 문서 골격
  gallery.ts                갤러리 데이터
  glossary.ts               용어 사전 데이터
  wizard-questions.ts       마법사 질문 정의
tools/                      코퍼스 lint · 렌더 대조 · 감사 반영률 · 파서 회귀
docs/corpus/                원문 감사 기록
docs/experiments/           생성 품질 실험 기록 + 원자료
```

</details>

## 기술 스택

Next.js (App Router) · React · TypeScript · Tailwind CSS · pnpm · Biome
· GSAP + Framer Motion · Anthropic SDK (Claude Sonnet 5)

## 출처

참고 코퍼스는 **다른 분들이 만든 공개 스킬**에서 패턴을 정리한 것입니다. 각
소스의 저작자와 라이선스는 `src/data/reference-corpus.ts`에, 감사 기록은
`docs/corpus/`에 있습니다. 생성 결과 화면에도 이번 생성에 실제로 쓰인 패턴의
출처가 표시됩니다.

## 라이선스

© 2026 Guhn Park

코드는 공개해 두었지만 따로 오픈소스 라이선스를 부여하지는 않았습니다.
GitHub 안에서 코드를 살펴보고 fork해 개선안을 실험하거나, issue와 pull
request로 더 나은 방법을 제안해 주시는 건 언제든 환영합니다. 아직 배우며
다듬어 가는 프로젝트라, 제가 놓친 관점이나 더 좋은 방법을 나눠 주시면 감사히
배우겠습니다.

GitHub에서의 열람·fork·기여 제안을 넘어 코드를 복제·수정·배포하거나 다른
용도로 이용하려면 먼저 연락 부탁드립니다.

참고 코퍼스에 정리된 패턴의 **원출처는 각자의 라이선스를 따릅니다** — 저작자와
라이선스는 `src/data/reference-corpus.ts`와 `docs/corpus/`에 기록되어 있습니다.
