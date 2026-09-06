// 갤러리 데이터
//
// 갤러리는 두 종류의 스킬을 보여준다:
//  (1) 외부 큐레이션 스킬 — 참고 코퍼스(reference-corpus)의 검증된 소스에서 파생.
//      원본으로 링크만 하고, 출처·라이선스를 표기한다.
//  (2) Tailor 자체 제작 스킬(시드) — 우리가 직접 쓴 SKILL.md라 다운로드 제공.
//      "Tailor-made"로 표시한다.

import { referenceCategories } from "@/data/reference-corpus";

export type GallerySkill = {
	id: string;
	name: string;
	/**
	 * 표시용 카테고리(그룹핑/검색용). 한 스킬이 여러 카테고리에 속할 수 있어
	 * 배열이다 — 예를 들어 verification-before-completion은 "디버깅"이면서
	 * "공통 기본"이기도 하다.
	 */
	categories: string[];
	/** 한 줄 설명 — 이게 무슨 스킬인지 */
	description: string;
	/** 핵심 좋은 점(펼침 시 표시) */
	goodPoints: string[];
	author: string;
	license: string;
	/** 외부 스킬 원본 링크(자체 제작은 없음) */
	url?: string;
	/** true면 Tailor 자체 제작(다운로드 제공, "Tailor-made" 표시) */
	self?: boolean;
	/** 자체 제작 스킬의 다운로드용 SKILL.md 내용 */
	skillMarkdown?: string;
};

// 외부 스킬 한 줄 설명(source.id → 설명). 실제로 읽고 정리한 내용을 바탕으로 함.
const sourceDescriptions: Record<string, string> = {
	"sp-tdd":
		"테스트를 먼저 쓰고 실패를 확인한 뒤 통과할 코드를 짜는 TDD 방법론.",
	"sp-systematic-debugging":
		"증상이 아니라 근본 원인부터 추적하는 체계적 디버깅 절차.",
	"sp-verification-before-completion":
		"'됐다'고 말하기 전에 명령을 실행해 증거로 확인하는 규율.",
	"sp-brainstorming": "구현에 들어가기 전에 설계를 질문하고 합의하는 절차.",
	"sp-writing-plans": "작업을 잘게 쪼갠 실행 계획서를 쓰는 방법.",
	"sp-requesting-code-review":
		"서브에이전트로 변경분만 넘겨 리뷰받는 코드리뷰 워크플로.",
	"sp-writing-skills":
		"좋은 SKILL.md를 쓰는 법(트리거 description, 형식 매칭 등).",
	"anthropic-frontend-design":
		"주제에 맞는 개성 있는 UI 디자인 방향을 잡는 가이드.",
	"anthropic-theme-factory":
		"색·폰트를 하나의 테마로 묶어 일관되게 적용하는 툴킷.",
	"tailor-glossary":
		"추상 개념을 일상 비유로 쉽게 풀어 설명하는 Tailor의 방식.",
	"anthropic-doc-coauthoring":
		"문서를 단계별로 함께 써 내려가는 공동작성 워크플로.",
};

// 한 소스가 여러 카테고리에 등록돼 있을 수 있다(정상). 그때 카드를 두 번
// 만들지 않고 하나로 합치되, 속한 카테고리와 좋은 점은 모두 모은다.
function externalSkills(): GallerySkill[] {
	const byId = new Map<string, GallerySkill>();
	for (const category of referenceCategories) {
		for (const source of category.sources) {
			const goodPoints = category.patterns
				.filter((pattern) => pattern.sourceIds.includes(source.id))
				.map((pattern) => pattern.summary);
			const existing = byId.get(source.id);
			if (existing) {
				if (!existing.categories.includes(category.label)) {
					existing.categories.push(category.label);
				}
				for (const point of goodPoints) {
					if (!existing.goodPoints.includes(point)) {
						existing.goodPoints.push(point);
					}
				}
				continue;
			}
			byId.set(source.id, {
				id: source.id,
				name: source.name,
				categories: [category.label],
				description: sourceDescriptions[source.id] ?? "",
				goodPoints,
				author: source.author,
				license: source.license,
				url: source.url || undefined,
				self: source.self,
			});
		}
	}
	return [...byId.values()];
}

// ── Tailor 자체 제작 시드 스킬(다운로드 제공) ─────────────────────────
const LIBRARY_EXPLAINER_MD = `---
name: library-explainer
description: GitHub 링크나 라이브러리 이름을 주면, 그게 뭔지·왜 쓰는지·어떻게 시작하는지 완전 초보 눈높이로 설명해야 할 때 사용. "이 라이브러리 뭐야", "이거 어떻게 써" 같은 요청에 반응.
---

# 라이브러리 쉽게 설명하기

낯선 라이브러리를 처음 보는 사람에게, 전문용어 없이 쉽게 설명한다.

작업 순서:
1. 저장소/문서를 읽어 핵심을 파악한다(README, 예제).
2. 한 줄 요약으로 시작한다 — "이건 ~해주는 도구예요."
3. 일상 비유로 무엇을 하는지 설명한다.
4. 언제 쓰면 좋은지(어떤 문제를 풀어주는지) 알려준다.
5. 가장 작은 시작 예제 하나를 보여준다.
6. 전문용어가 필요하면 쉬운 말로 풀고 괄호로 원어를 덧붙인다.

지켜야 할 것:
- 용어로 시작해 겁주지 않는다.
- 모든 기능을 나열하지 말고, 처음 쓰는 데 필요한 것만 담는다.
`;

const EXPLANATION_STYLE_MD = `---
name: explanation-style
description: 어떤 개념·기능·코드를 초보에게 설명할 때, 비유를 써서 쉽고 친근하게 전달하고 싶을 때 사용. 설명이 어렵거나 딱딱하게 느껴질 때 적용.
---

# 쉽게 설명하는 말투

추상적인 개념을 일상의 구체적인 장면에 빗대어 설명한다.

원칙:
1. 한 줄 요약을 먼저 주고, 그다음 풀이한다.
2. 일상 비유로 감을 준다(예: "스크립트 = 알바생에게 남긴 할 일 메모").
3. 전문용어를 먼저 꺼내지 않는다. 쉬운 말로 풀고, 용어는 뒤에 괄호로 덧붙인다.
4. 왜 필요한지·무엇이 좋아지는지 곁들인다.
5. 짧은 문장, 짧은 문단으로 쓴다.

피할 것:
- 정의부터 늘어놓기, 용어 나열, 과한 격식.
`;

const VERIFICATION_METHOD_MD = `---
name: verification-method
description: 사실·주장·수치를 답하기 전에 실제 근거(공식 문서·원본 코드 등)로 확인하고 나서 답해야 할 때 사용. 추측으로 답하면 안 되는 상황, 정확성이 중요한 작업에 적용.
---

# 확인하고 나서 답하기

기억이나 추측이 아니라, 실제 근거로 확인한 뒤에 답한다.

작업 순서:
1. 답에 필요한 사실이 무엇인지 짚는다.
2. 그 사실을 확인할 1차 출처를 정한다(공식 문서, 원본 코드/파일, 실행 결과).
3. 출처를 실제로 확인한다 — 기억으로 대체하지 않는다.
4. 확인된 것만 단정하고, 확인 못 한 것은 "확인 못 함"이라고 밝힌다.
5. 근거(출처)를 함께 제시한다.

빨간불(멈추고 다시 확인):
- "아마", "보통", "~일 거예요" 같은 추측성 표현.
- 출처를 안 보고 단정하려 할 때.
- 두 설명이 서로 어긋날 때.
`;

const NATURAL_KOREAN_MD = `---
name: natural-korean-writing
description: 한국어로 답변, 문서, 코드 주석, 커밋 메시지를 작성할 때 항상 사용. 영어를 그대로 옮긴 듯한 번역투 문장("~할 필요가 있다", "~를 가진다", "이는 ~를 의미한다", "~하는 것을 권장한다" 등)이 나오지 않도록 자연스러운 한국어로 쓰고, 작성 후 스스로 점검한다.
---

# 자연스러운 한국어 쓰기

## 개요
한국어로 글을 쓸 때 영어 문장 구조를 그대로 옮긴 듯한 번역투를 피하고, 우리말답게 자연스러운 문장으로 쓴다. 원문(전달하려는 내용)의 뜻은 그대로 유지하고, 표현 방식만 자연스럽게 고친다.

## 언제 쓰나
- 한국어로 답변할 때 (설명, 요약, 대화 응답 등)
- 코드 주석을 한국어로 쓸 때
- 커밋 메시지를 한국어로 쓸 때
- 문서, 보고서 등 모든 한국어 글쓰기

영어 원문을 한국어로 번역하는 작업뿐 아니라, 처음부터 한국어로 새로 쓰는 글에도 똑같이 적용한다 — 한국어 화자도 영어식 어순이나 표현에 익숙해져 자기도 모르게 번역투를 쓰는 경우가 많기 때문이다.

## 자주 나오는 번역투 패턴과 자연스러운 대안

아래는 흔히 나오는 번역투를 자연스러운 한국어로 바꾼 예다. 왼쪽 형태가 눈에 띄면 오른쪽처럼 고친다.

| 번역투 | 자연스러운 한국어 |
|---|---|
| ~할 필요가 있다 | ~해야 한다 |
| ~를 가진다 / ~를 갖는다 | ~이 있다 / ~한다 (예: "회의를 가졌다" → "회의를 했다") |
| 이는 ~를 의미한다 | 즉 ~라는 뜻이다 / 다시 말해 ~다 |
| ~하는 것을 권장한다 | ~하는 게 좋다 / ~하길 권한다 |
| ~에 의해 ~되다 (과도한 피동) | ~가 ~하다 (능동으로) |
| ~들 (불필요한 복수 표시 남발) | 문맥상 복수가 명확하면 생략 |
| ~에 대해 | ~을/를 (불필요할 때 생략) |
| ~을 통해 | ~로 / ~해서 |
| ~함으로써 | ~해서 / ~하여 |
| ~하는 데 있어 | ~할 때 / ~하려면 |
| 만약 ~라면 (만약 남발) | ~라면 ("만약" 없이도 충분한 경우가 많음) |
| ~것으로 보인다 / ~것 같다 (과도한 완곡) | 확실하면 단정형으로 |
| 주어를 매번 명시 ("나는 ~라고 생각한다") | 한국어는 주어 생략이 자연스러움 |

이 표는 예시이지 전부가 아니다. 위 패턴이 아니어도 "번역기가 돌린 것 같다"는 느낌이 드는 문장은 같은 원리로 고친다 — 영어 어순을 그대로 따르는지, 영어에서만 필요한 격식(피동태, 명사화)을 옮겼는지 확인한다.

## 지켜야 할 조건

- **원문의 뜻을 바꾸지 않는다.** 표현만 자연스럽게 고치는 것이지 내용을 요약하거나 빼는 것이 아니다.
- **전문용어와 고유명사는 그대로 둔다.** 자연스러움을 위해 정확한 용어를 임의로 바꾸지 않는다.
- **고쳤다는 티를 내지 않는다.** "번역투를 고쳤습니다" 같은 설명을 덧붙이지 말고, 그냥 자연스러운 문장으로 결과만 보여준다.

## 작성 절차

1. 평소처럼 내용을 구성해 초안을 쓴다.
2. 쓴 글을 처음부터 다시 읽으며 위 표에 있는 패턴이나 비슷한 번역투가 있는지 점검한다.
3. 발견하면 뜻은 그대로 두고 표현만 고친다.
4. 고친 결과만 보여준다 — 무엇을 고쳤는지는 설명하지 않는다.

## 완료 전 확인

- [ ] 다 쓴 뒤 처음부터 다시 읽어보며 번역투를 점검했는가
- [ ] "~할 필요가 있다", "~를 가진다", "이는 ~를 의미한다", "~하는 것을 권장한다" 같은 표현이 남아 있지 않은가
- [ ] 과도한 피동형이나 어색한 어순이 남아 있지 않은가
- [ ] 원문의 뜻이 그대로 유지됐는가 — 내용을 빼거나 바꾸지 않았는가
- [ ] 전문용어와 고유명사를 임의로 바꾸지 않았는가
- [ ] "번역투를 고쳤습니다" 같은 부연 설명 없이 결과만 제시했는가

못 채운 항목이 있으면 다시 2단계로 돌아가 점검한다.`;

const NPM_PACKAGE_REVIEW_MD = `---
name: npm-package-review
description: Use when the user asks to add a new npm/pnpm/yarn package to the project, or when new work requires a new dependency — before running any install command. Triggers on phrases like "X 패키지 넣자", "X 라이브러리 추가하자", "이거 설치하자", or when the assistant itself identifies that a new dependency is needed mid-task.
---

# 새 패키지 검토

## 개요

새 의존성(dependency, 프로젝트가 기대는 외부 코드 패키지)을 추가하기 전에, 설치하지 않고 먼저 검토 보고서부터 작성하는 스킬입니다. 라이선스, 관리 상태, 용량, 대체 가능성을 확인한 뒤 표로 정리해 사용자에게 보여주고, 실제 설치는 사용자가 "설치해"라고 명확히 말한 뒤에만 실행합니다.

## 언제 쓰나

- 사용자가 "X 패키지/라이브러리 넣자", "X 설치하자"라고 말했을 때
- 작업 중 새 의존성이 필요하다고 스스로 판단했을 때
- 이미 설치된 패키지의 버전을 올리는 것뿐이라면 이 스킬 대상이 아닙니다 — 신규 의존성 추가에만 적용
- devDependency(개발 중에만 쓰는 패키지, 예: 테스트 도구)도 동일하게 검토 대상입니다

## 조사 단계 (승인 없이 진행 가능)

아래는 파일을 읽고 외부 정보를 조회하는 것까지만 포함합니다. 이 단계에서는 package.json이나 lockfile(의존성 버전을 고정해 기록하는 파일, 예: package-lock.json, pnpm-lock.yaml)을 **읽기만** 하고 절대 수정하지 않습니다.

1. **현재 상태 확인**
   - \`package.json\`을 읽어 이미 어떤 패키지가 들어 있는지 파악
   - lockfile을 읽어 실제 설치되는 하위 의존성 트리를 확인
   - 후보 패키지와 기능이 겹치는 기존 패키지가 있는지 검색

2. **라이선스 확인**
   - npm registry 메타데이터 또는 패키지 저장소의 실제 \`LICENSE\` 파일을 직접 확인
   - 기억이나 통념("이 패키지는 보통 MIT일 것이다" 같은 추측)으로 적지 않는다 — 실제로 확인한 값만 기록
   - 확인이 안 되면 "확인 못 함"으로 남긴다
   - 이 프로젝트에 쓸 수 있는 라이선스인지까지 판단 (예: 상용 서비스에 GPL 계열이 문제가 될 수 있는지)

3. **관리 상태 확인**
   - 마지막 릴리스 시점
   - 열린 이슈 수
   - 메인테이너(관리자) 수
   - 주간 다운로드 수

4. **용량·의존성 확인**
   - 설치 시 딸려오는 하위 의존성 개수
   - 설치 용량 (npm registry나 bundlephobia 같은 도구로 확인 가능하면 활용)

5. **대체 가능성 확인**
   - 이미 프로젝트에 들어 있는 패키지의 기능으로 대체 가능한지
   - 언어/런타임 표준 기능(built-in)으로 대체 가능한지
   - 짧은 자체 구현(예: 10~20줄 이내 함수)으로 충분한지

## 보고서 작성

조사가 끝나면 아래 형식으로 표를 만들어 보여줍니다.

| 항목 | 확인 결과 |
|---|---|
| 라이선스 | (예: MIT — 저장소 LICENSE 파일 확인) |
| 이 프로젝트에 쓸 수 있는가 | (예/아니오/확인 못 함 + 사유) |
| 마지막 릴리스 | (날짜) |
| 관리 상태 | (열린 이슈 수, 메인테이너 수) |
| 주간 다운로드 | (수치) |
| 하위 의존성 개수 | (수치) |
| 설치 용량 | (수치, 확인 못 하면 "확인 못 함") |
| 기존 패키지로 대체 가능? | (가능/불가능 + 근거) |
| 표준 기능으로 대체 가능? | (가능/불가능 + 근거) |
| 자체 구현으로 대체 가능? | (가능/불가능 + 예상 규모) |

표 아래에 다음을 반드시 포함합니다:

- **추천: 넣는다 / 넣지 않는다** — 근거를 2~4문장으로
- 확인하지 못한 항목이 있다면 "확인 못 함"으로 명시하고, 값을 추측해 채우지 않는다
- 넣는 쪽과 넣지 않는 쪽 두 선택지를 동등한 무게로 제시한다 — 신규 추가를 기본값처럼 밀어붙이지 않는다

보고서를 다 쓴 뒤에는 실행하지 않고 사용자의 다음 지시를 기다립니다.

## 승인 게이트 (반드시 지킬 것)

**검토 보고서에서 "넣자"라는 결론이 나왔더라도, 그 자체를 승인으로 여기지 않습니다.** 사용자가 "설치해", "진행해" 등 명확한 설치 지시를 말한 뒤에만 다음을 수행합니다:

- 실제 설치 명령 실행 (\`npm install\`, \`pnpm add\`, \`yarn add\` 등)
- \`package.json\` 또는 lockfile 수정

승인 없이 위 두 가지를 하지 않습니다.

## 하지 말아야 할 것

- 승인 없이 설치 명령을 실행하거나 package.json·lockfile을 수정하는 것
- 사용자가 요청한 버전이 아닌 다른 버전으로 임의로 올려 설치하는 것
- 이번 작업과 관련 없는 다른 패키지를 같이 정리하거나 업데이트하는 것
- 확인하지 못한 값을 추측으로 채우는 것 — 항상 "확인 못 함"으로 남긴다
- 라이선스를 기억이나 통념으로 적는 것 — 실제 LICENSE 파일이나 registry 메타데이터를 본 결과만 적는다
- 신규 패키지 추가를 기본값처럼 밀어붙이는 것 — 안 넣는 선택지도 동등하게 제시한다

## 완료 전 확인

- 표의 모든 항목이 "확인 못 함"이 아니라면 실제 조사 근거가 있는가
- 라이선스 항목이 추측이 아니라 실제 파일/메타데이터 확인 결과인가
- 넣는다/넣지 않는다 두 선택지가 편향 없이 제시됐는가
- 사용자의 명확한 설치 지시 없이 설치 명령이나 파일 수정을 하지 않았는가
`;

export const tailorSeedSkills: GallerySkill[] = [
	{
		id: "tailor-library-explainer",
		name: "라이브러리 설명 스킬",
		categories: ["설명형 (쉽게 설명)"],
		description:
			"GitHub 링크·라이브러리 이름을 주면 초보 눈높이로 무엇인지·어떻게 쓰는지 설명해줘요.",
		goodPoints: [
			"한 줄 요약 → 비유 → 시작 예제 순서",
			"전문용어로 겁주지 않기",
			"처음 쓰는 데 필요한 것만",
		],
		author: "Tailor",
		license: "자체 (프로젝트 내부)",
		self: true,
		skillMarkdown: LIBRARY_EXPLAINER_MD,
	},
	{
		id: "tailor-explanation-style",
		name: "설명 말투 스타일 스킬",
		categories: ["설명형 (쉽게 설명)"],
		description:
			"어떤 개념이든 일상 비유로 쉽고 친근하게 설명하도록 말투를 잡아줘요.",
		goodPoints: [
			"한 줄 요약 먼저, 그다음 풀이",
			"일상 비유로 감 주기",
			"전문용어는 뒤에 괄호로",
		],
		author: "Tailor",
		license: "자체 (프로젝트 내부)",
		self: true,
		skillMarkdown: EXPLANATION_STYLE_MD,
	},
	{
		id: "tailor-verification-method",
		name: "검증 방법 스킬",
		categories: ["검증·신뢰성"],
		description:
			"추측이 아니라 실제 근거(공식 문서·원본 코드)로 확인하고 나서 답하도록 해줘요.",
		goodPoints: [
			"답 전에 1차 출처로 확인",
			"확인 못 한 건 솔직히 밝히기",
			"'아마·보통' 같은 추측 표현 경계",
		],
		author: "Tailor",
		license: "자체 (프로젝트 내부)",
		self: true,
		skillMarkdown: VERIFICATION_METHOD_MD,
	},
	{
		id: "tailor-natural-korean",
		name: "자연스러운 한국어 쓰기 스킬",
		categories: ["설명형 (쉽게 설명)"],
		description:
			"영어를 그대로 옮긴 듯한 번역투를 걸러내고 우리말답게 쓰도록 말투를 잡아줘요.",
		goodPoints: [
			"흔한 번역투 13가지를 표로 정리",
			"뜻은 그대로, 표현만 손보기",
			"다 쓴 뒤 스스로 점검하는 체크리스트",
		],
		author: "Tailor",
		license: "자체 (프로젝트 내부)",
		self: true,
		skillMarkdown: NATURAL_KOREAN_MD,
	},
	{
		id: "tailor-npm-package-review",
		name: "새 패키지 검토 스킬",
		categories: ["검증·신뢰성"],
		description:
			"새 패키지를 설치하기 전에 라이선스·관리 상태·대체 가능성을 조사해 표로 보고하고, 설치는 승인받은 뒤에만 해요.",
		goodPoints: [
			"조사는 알아서, 설치는 승인받고 — 경계를 절로 나눔",
			"라이선스는 추측 금지, 못 찾으면 '확인 못 함'",
			"넣는 쪽과 안 넣는 쪽을 같은 무게로 제시",
		],
		author: "Tailor",
		license: "자체 (프로젝트 내부)",
		self: true,
		skillMarkdown: NPM_PACKAGE_REVIEW_MD,
	},
];

// 자체 제작 시드를 먼저(추천), 그다음 외부 큐레이션 스킬.
export const gallerySkills: GallerySkill[] = [
	...tailorSeedSkills,
	...externalSkills(),
];
