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
	/** 표시용 카테고리(그룹핑/검색용) */
	category: string;
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

function externalSkills(): GallerySkill[] {
	const skills: GallerySkill[] = [];
	for (const category of referenceCategories) {
		for (const source of category.sources) {
			const goodPoints = category.patterns
				.filter((pattern) => pattern.sourceIds.includes(source.id))
				.map((pattern) => pattern.summary);
			skills.push({
				id: source.id,
				name: source.name,
				category: category.label,
				description: sourceDescriptions[source.id] ?? "",
				goodPoints,
				author: source.author,
				license: source.license,
				url: source.url || undefined,
				self: source.self,
			});
		}
	}
	return skills;
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

export const tailorSeedSkills: GallerySkill[] = [
	{
		id: "tailor-library-explainer",
		name: "라이브러리 설명 스킬",
		category: "설명형 (쉽게 설명)",
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
		category: "설명형 (쉽게 설명)",
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
		category: "검증·신뢰성",
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
];

// 자체 제작 시드를 먼저(추천), 그다음 외부 큐레이션 스킬.
export const gallerySkills: GallerySkill[] = [
	...tailorSeedSkills,
	...externalSkills(),
];
