// 참고 코퍼스 (생성기 B 강화)
//
// 유명 스킬들에서 "오프라인으로 미리" 정리해 둔 자료. 생성 시점에는 원문을 다시
// 읽지 않고, 이 정리 파일만 단일 프롬프트에 주입해 결과를 만든다.
//
// 좋은 SKILL.md가 "기능하는 데" 영향을 주는 3축으로 나눠 담는다:
//   (1) structureArchetypes — 스킬 "타입"별 문서 섹션 골격. 실제 읽은 스킬에서
//       추출한 것으로, 하나의 범용 골격이 아니라 규율형/절차형/참조형으로 나뉜다.
//   (2) referenceCategories[].patterns — 주제별 "행동 지침" 패턴. 각 패턴에 role
//       태그를 붙여 위 구조의 어디(트리거/절차/제약/출력/검증)에 들어갈지 표시.
//   (3) baseline(alwaysApply) — 어떤 스킬이든 잘 쓰는 공통 메타 원칙.
//
// 신뢰성 원칙: 모든 항목은 유래한 출처 스킬을 "항목 단위"로 태그한다(sourceIds).
// 생성 결과에는 이번 생성에 실제로 쓰인 항목의 출처만 표기하며, 코퍼스 전체를
// "참고함"으로 찍지 않는다. 표기 문구는 원문 직접 열람이 아님을 정직하게 드러낸다
// (예: "아래 스킬들에서 정리한 패턴을 참고했습니다").
//
// 출처 라이선스: MIT/Apache-2.0만 코퍼스에 정리한다(정책 A). 카피레프트(CC-BY-SA
// 등)·무라이선스·마케팅성 저품질 스킬은 제외. Anthropic 문서 스킬(docx/pdf/pptx/
// xlsx)은 source-available(오픈소스 아님)이라 제외.

/** 정리 파일이 유래한 실제 스킬/저장소. 출처·저작자·라이선스·수집시점을 담는다. */
export type ReferenceSource = {
	/** 안정적 참조 키 (kebab-case) */
	id: string;
	/** 스킬 또는 저장소 이름 */
	name: string;
	/** 원저작자 (실명 또는 핸들) */
	author: string;
	/** 실제로 존재하는 출처 URL */
	url: string;
	/** 라이선스 (예: "MIT", "Apache-2.0") */
	license: string;
	/** 수집 시점 (YYYY-MM-DD) — "언제 받아왔는지" 표기용 */
	collectedAt: string;
	/** true면 Tailor 자체 제작 출처(결과 화면은 외부 링크 대신 "Tailor 자체 제작"으로 표시). */
	self?: boolean;
};

/**
 * 행동 패턴이 SKILL.md 구조의 어느 자리에 들어가면 좋은지 — 정확한 배치가 아니라
 * "느슨한 힌트"다. 최종 배치는 생성 AI가 판단한다.
 */
export type PatternRole =
	| "trigger" // description / 언제 쓰는지
	| "workflow-step" // 절차의 한 단계
	| "constraint" // 금지 · 안티패턴 · 규칙
	| "output-rule" // 결과물의 형태
	| "verification"; // 끝단 검증

/** 오프라인으로 정리한 "좋은 행동 패턴" 한 항목. 출처를 항목 단위로 태그한다. */
export type ReferencePattern = {
	/** 안정적 참조 키 (kebab-case) — AI가 사용한 패턴을 되짚을 때 사용 */
	id: string;
	/** 패턴 한 줄 요약 */
	summary: string;
	/** 정리된 내용 (생성 프롬프트에 주입되는 실제 텍스트) */
	detail: string;
	/** 이 패턴이 구조의 어느 자리에 들어가면 좋은지 */
	role?: PatternRole;
	/** 이 패턴이 유래한 ReferenceSource.id 목록 (신뢰성의 핵심) */
	sourceIds: string[];
};

/** 스킬 "타입" — 타입마다 좋은 문서 구조가 다르다(writing-skills: form matches failure). */
export type SkillArchetype =
	| "discipline"
	| "workflow"
	| "reference"
	| "explanation";

/** 스킬 타입별 문서 골격. 실제로 그 구조를 보인 스킬에서 추출한다. */
export type StructureArchetype = {
	id: SkillArchetype;
	/** 표시용 이름 */
	label: string;
	/** 어떤 스킬에 이 구조가 맞는지 */
	whenToUse: string;
	/** 실제 섹션 흐름(형태를 보여주는 골격) */
	sectionFlow: string;
	/** 이 구조를 실제로 보인 스킬들 */
	sourceIds: string[];
};

/** 하나의 카테고리(예: 웹 디자인)에 대한 참고 코퍼스. */
export type ReferenceCategory = {
	/** 안정적 참조 키 (예: "design") */
	id: string;
	/** 표시용 이름 */
	label: string;
	/** 사용자 상황 텍스트와 매칭하기 위한 힌트 키워드 */
	keywords: string[];
	/** true면 키워드 매칭과 무관하게 모든 생성에 항상 주입(공통 기본) */
	alwaysApply?: boolean;
	sources: ReferenceSource[];
	patterns: ReferencePattern[];
};

// ── 축 1: 구조 원형 ──────────────────────────────────────────────
// 하나의 범용 골격(# Role/# Context/# Output …)은 오히려 "AI가 만든 흔한 템플릿"에
// 가깝다(frontend-design 경고). 실제 좋은 스킬은 타입에 따라 구조가 다르므로,
// 읽은 스킬에서 추출한 3원형으로 나눠 담고 출처를 태그한다.
export const structureArchetypes: StructureArchetype[] = [
	{
		id: "discipline",
		label: "규율형 (지켜야 할 원칙)",
		whenToUse:
			"지켜야 할 원칙·규율이 핵심이고, AI가 '이번만 건너뛰자'며 합리화하기 쉬운 스킬 (예: 테스트 먼저, 완료 전 검증, 근본원인 우선). 단순 조회·설명·정해진 순서 실행에는 쓰지 마세요 — 그런 작업에 이 골격을 붙이면 불필요하게 무겁고 훈계조인 문서가 됩니다.",
		sectionFlow: [
			"--- name(kebab-case) / description('Use when …' 트리거 중심) ---",
			"# 제목",
			"## Overview — 핵심 원칙 한 줄을 굵게",
			"## When to Use — 항상 적용되는 경우 / 예외(사람에게 확인)",
			"## <핵심 절차> — 단계별로, 규칙마다 Good/Bad 예시 쌍",
			"## Rationalizations — '변명 → 현실' 표로 회피 논리를 미리 차단",
			"## Red Flags — 'STOP하고 다시 시작' 신호 목록",
			"## Verification Checklist — 완료 전 체크 항목",
		].join("\n"),
		sourceIds: [
			"sp-tdd",
			"sp-systematic-debugging",
			"sp-verification-before-completion",
		],
	},
	{
		id: "workflow",
		label: "절차형 (순서 있는 워크플로)",
		whenToUse:
			"순서 있는 여러 단계를 거쳐 산출물을 만드는 스킬 (예: 문서 공동작성, 브레인스토밍, 계획 작성).",
		sectionFlow: [
			"--- name / description('Use when …') ---",
			"# 제목",
			"## Overview — 이 워크플로가 무엇을 만들어내는지 한 줄",
			"## Stages — 번호 있는 단계. 각 단계: (a) 맥락/질문 → (b) 산출 → (c) 반복.",
			"   단계 사이에 '다음으로 넘어가기 전 게이트'(승인/확인)를 명시",
			"## Self-Review — 자리표시자·모순·범위 이탈 점검",
			"## Handoff / Done — 완료 기준과 다음 단계",
		].join("\n"),
		sourceIds: [
			"sp-brainstorming",
			"sp-writing-plans",
			"anthropic-doc-coauthoring",
		],
	},
	{
		id: "reference",
		label: "참조형 (옵션 제공·적용)",
		whenToUse:
			"옵션/프로필을 정의하고 일관되게 적용하는 스킬 (예: 테마·디자인 시스템, 말투 프로필).",
		sectionFlow: [
			"--- name / description('Use when …') ---",
			"# 제목",
			"## Overview — 무엇을 일관되게 적용하는지",
			"## Profile / Options — 정의할 항목(색·폰트·보이스 특성 등) 또는 선택지 목록",
			"## Apply — 옵션을 먼저 보여주고 승인받은 뒤, 대비·가독성 등 제약을 지키며 전체 적용",
			"## Constraints — 금지 조건(진부한 기본값, 금지 문구 등)",
		].join("\n"),
		sourceIds: [
			"anthropic-theme-factory",
			"anthropic-frontend-design",
			"tone-of-voice",
		],
	},
	{
		id: "explanation",
		label: "설명형 (개념을 쉽게 설명)",
		whenToUse:
			"어떤 개념·라이브러리·도구가 무엇인지 초보에게 쉽게 설명하는 스킬 (예: '이 라이브러리 뭔지 초보한테 설명해줘'). 초심자의 흔한 첫 스킬 형태.",
		sectionFlow: [
			"--- name / description('Use when …') ---",
			"# 제목",
			"## 한 줄 요약 — 개념을 쉬운 말 한 줄로",
			"## 비유 — 일상의 구체적 장면에 빗대기",
			"## 풀이 — 어떻게 동작/사용하는지, 왜 필요한지",
			"## (용어) — 전문용어는 마지막에 괄호로 곁들이기",
		].join("\n"),
		sourceIds: ["tailor-glossary"],
	},
];

// ── 축 2·3: 주제별 행동 패턴 + baseline 공통 메타 ────────────────────
export const referenceCategories: ReferenceCategory[] = [
	{
		id: "testing",
		label: "테스트",
		keywords: ["테스트", "test", "tdd", "단위 테스트"],
		sources: [
			{
				id: "sp-tdd",
				name: "test-driven-development (superpowers)",
				author: "Jesse Vincent · Prime Radiant",
				url: "https://github.com/obra/superpowers/tree/main/skills/test-driven-development",
				license: "MIT",
				collectedAt: "2026-08-12",
			},
		],
		patterns: [
			{
				id: "test-first",
				summary: "구현 코드보다 실패하는 테스트를 먼저 쓴다",
				detail:
					"새 기능·버그픽스·리팩터링 전에 실패하는 테스트를 먼저 작성하고, 그 테스트가 '기능이 없어서' 실패하는지 눈으로 확인한 뒤 통과할 최소 코드를 쓴다(Red-Green-Refactor). 테스트를 나중에 쓰면 이미 짠 코드에 편향돼 '무엇을 하는가'만 검증하게 된다.",
				role: "workflow-step",
				sourceIds: ["sp-tdd"],
			},
			{
				id: "one-behavior-per-test",
				summary: "테스트 하나는 한 가지 행동만 검증한다",
				detail:
					"테스트 이름에 'and'가 들어가면 쪼갠다. 이름은 동작을 설명하고, mock의 동작이 아니라 실제 코드의 동작을 단언한다.",
				role: "constraint",
				sourceIds: ["sp-tdd"],
			},
			{
				id: "minimal-green",
				summary: "테스트를 통과시킬 최소 코드만 쓴다",
				detail:
					"아직 필요 없는 옵션·추상화·에러 처리를 미리 넣지 않는다(YAGNI). 통과 후 리팩터 단계에서만 정리한다.",
				role: "constraint",
				sourceIds: ["sp-tdd"],
			},
		],
	},
	{
		id: "debugging",
		label: "디버깅",
		keywords: ["디버그", "debug", "버그", "에러", "오류", "고치"],
		sources: [
			{
				id: "sp-systematic-debugging",
				name: "systematic-debugging (superpowers)",
				author: "Jesse Vincent · Prime Radiant",
				url: "https://github.com/obra/superpowers/tree/main/skills/systematic-debugging",
				license: "MIT",
				collectedAt: "2026-08-12",
			},
			{
				id: "sp-verification-before-completion",
				name: "verification-before-completion (superpowers)",
				author: "Jesse Vincent · Prime Radiant",
				url: "https://github.com/obra/superpowers/tree/main/skills/verification-before-completion",
				license: "MIT",
				collectedAt: "2026-08-12",
			},
		],
		patterns: [
			{
				id: "root-cause-first",
				summary: "증상이 아니라 근본 원인부터 조사한다",
				detail:
					"에러 메시지 정독 → 일관되게 재현 → 최근 변경 확인 → 컴포넌트 경계마다 진단 로그로 데이터 흐름을 추적한다. 데이터 흐름을 추적하기 전에 해결책부터 제안하면 안 된다.",
				role: "workflow-step",
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				id: "three-fix-rule",
				summary: "3번 이상 고쳐도 안 되면 설계 문제 신호",
				detail:
					"같은 문제에 세 번 넘게 고쳐도 안 되면 구현이 아니라 아키텍처 문제일 가능성이 크다. 계속 찔러보지 말고 구조를 의심한다.",
				role: "constraint",
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				id: "verify-before-done",
				summary: "'됐다'고 말하기 전에 명령을 실행해 증거를 확인한다",
				detail:
					"완료·수정·통과를 주장하기 전에 그것을 증명하는 명령을 새로 실행하고 출력과 종료코드를 직접 읽는다. 'should/probably/seems' 같은 표현이나 실행 없는 성공 주장은 금지.",
				role: "verification",
				sourceIds: ["sp-verification-before-completion"],
			},
		],
	},
	{
		id: "planning",
		label: "계획·설계",
		keywords: ["계획", "기획", "설계", "plan", "브레인", "아이디어"],
		sources: [
			{
				id: "sp-brainstorming",
				name: "brainstorming (superpowers)",
				author: "Jesse Vincent · Prime Radiant",
				url: "https://github.com/obra/superpowers/tree/main/skills/brainstorming",
				license: "MIT",
				collectedAt: "2026-08-12",
			},
			{
				id: "sp-writing-plans",
				name: "writing-plans (superpowers)",
				author: "Jesse Vincent · Prime Radiant",
				url: "https://github.com/obra/superpowers/tree/main/skills/writing-plans",
				license: "MIT",
				collectedAt: "2026-08-12",
			},
		],
		patterns: [
			{
				id: "design-before-code",
				summary: "구현 전에 설계를 먼저 합의한다",
				detail:
					"맥락 파악 → 한 번에 하나씩 질문 → 2~3개 접근안을 트레이드오프와 함께 제시 → 승인 후 진행. '간단한' 작업일수록 검증 안 된 가정이 낭비를 만든다.",
				role: "workflow-step",
				sourceIds: ["sp-brainstorming"],
			},
			{
				id: "bite-sized-tasks",
				summary: "계획은 2~5분짜리 독립 작업 단위로 쪼갠다",
				detail:
					"실패 테스트 작성→실패 확인→구현→통과 확인→커밋 흐름으로 잘게 나눈다. 'TBD'·'검증 추가' 같은 자리표시자 대신 실제 파일 경로·인터페이스를 적는다.",
				role: "workflow-step",
				sourceIds: ["sp-writing-plans"],
			},
			{
				id: "assume-low-context-reader",
				summary: "'도메인을 거의 모르는 유능한 개발자'가 읽는다고 가정",
				detail:
					"계획은 추상적 표현 대신 구체적 구현 정보를 담는다. 읽는 사람이 이 코드베이스·도구를 모른다고 가정하고 실제 세부를 적는다.",
				role: "output-rule",
				sourceIds: ["sp-writing-plans"],
			},
		],
	},
	{
		id: "code-review",
		label: "코드 리뷰",
		keywords: ["리뷰", "review", "코드 리뷰", "pr", "풀리퀘"],
		sources: [
			{
				id: "sp-requesting-code-review",
				name: "requesting-code-review (superpowers)",
				author: "Jesse Vincent · Prime Radiant",
				url: "https://github.com/obra/superpowers/tree/main/skills/requesting-code-review",
				license: "MIT",
				collectedAt: "2026-08-12",
			},
		],
		patterns: [
			{
				id: "review-early-often",
				summary: "자주, 일찍 리뷰한다",
				detail:
					"작업·주요 기능 후, main 병합 전에 리뷰한다. '간단한' 변경이라고 건너뛰지 않는다.",
				role: "workflow-step",
				sourceIds: ["sp-requesting-code-review"],
			},
			{
				id: "severity-ordered-fixes",
				summary: "피드백은 심각도 순으로 처리한다",
				detail:
					"치명적→중요→사소 순으로 고친다. 근거 없는 지적에는 기술적 근거를 들어 반박할 수 있다.",
				role: "workflow-step",
				sourceIds: ["sp-requesting-code-review"],
			},
			{
				id: "isolated-reviewer-context",
				summary: "리뷰어에겐 변경 diff와 요구사항만 준다",
				detail:
					"세션 전체가 아니라 base·head 커밋의 diff와 요구사항만 전달해 리뷰어의 맥락을 격리하고 판단을 독립시킨다.",
				role: "constraint",
				sourceIds: ["sp-requesting-code-review"],
			},
		],
	},
	{
		id: "baseline",
		label: "공통 기본 (모든 스킬)",
		keywords: ["스킬", "skill", "skill.md", "에이전트"],
		alwaysApply: true,
		sources: [
			{
				id: "sp-writing-skills",
				name: "writing-skills (superpowers)",
				author: "Jesse Vincent · Prime Radiant",
				url: "https://github.com/obra/superpowers/tree/main/skills/writing-skills",
				license: "MIT",
				collectedAt: "2026-08-12",
			},
		],
		patterns: [
			{
				id: "trigger-first-description",
				summary: "description은 'Use when...' 트리거 조건 중심으로",
				detail:
					"워크플로 요약이 아니라 '언제 쓰는지'(어떤 요청·상황·에러·도구에서 호출되는지)를 구체적으로 쓴다. 에이전트가 검색할 키워드를 넣는다. description은 에이전트가 스킬 호출 여부를 판단하는 가장 중요한 필드다.",
				role: "trigger",
				sourceIds: ["sp-writing-skills"],
			},
			{
				id: "form-matches-failure",
				summary: "가이드 형태를 실패 유형에 맞춘다(→ 구조 원형 선택)",
				detail:
					"규칙 위반엔 금지문, 출력 형태 문제엔 레시피/예시를 쓴다. 규율형 스킬엔 합리화 표와 red flag 목록을 넣는다. 이 원칙이 곧 어떤 구조 원형(규율형/절차형/참조형)을 쓸지 결정한다.",
				role: "constraint",
				sourceIds: ["sp-writing-skills"],
			},
			{
				id: "skills-are-reusable-techniques",
				summary: "스킬은 재사용 가능한 검증된 기법이지 일회성 서사가 아니다",
				detail:
					"한 번의 문제 해결 이야기가 아니라 반복해서 쓸 기법의 참고 자료로 만든다. 일회성 작업은 스킬로 만들지 않는다.",
				role: "constraint",
				sourceIds: ["sp-writing-skills"],
			},
		],
	},
	{
		id: "design",
		label: "디자인·프론트엔드",
		keywords: [
			"디자인",
			"design",
			"ui",
			"프론트",
			"frontend",
			"화면",
			"레이아웃",
			"색상",
			"스타일",
		],
		// Anthropic 공식 예시 스킬(Apache-2.0). brand-guidelines는 Anthropic 브랜드 전용이라 제외.
		sources: [
			{
				id: "anthropic-frontend-design",
				name: "frontend-design (Anthropic skills)",
				author: "Anthropic",
				url: "https://github.com/anthropics/skills/tree/main/skills/frontend-design",
				license: "Apache-2.0",
				collectedAt: "2026-08-12",
			},
			{
				id: "anthropic-theme-factory",
				name: "theme-factory (Anthropic skills)",
				author: "Anthropic",
				url: "https://github.com/anthropics/skills/tree/main/skills/theme-factory",
				license: "Apache-2.0",
				collectedAt: "2026-08-12",
			},
		],
		patterns: [
			{
				id: "ground-in-subject",
				summary: "주제 고유의 세계에서 디자인 선택을 끌어낸다",
				detail:
					"어떤 프로젝트에나 쓸 법한 일반 패턴을 피하고, 주제의 소재·도구·용어에서 특징적인 선택을 뽑아낸다. 히어로는 주제의 가장 특징적인 요소로 열고, 큰 숫자+그라데이션 같은 기본값을 지양한다.",
				role: "workflow-step",
				sourceIds: ["anthropic-frontend-design"],
			},
			{
				id: "one-signature-element",
				summary: "대담함은 한 곳에 집중하고 나머지는 절제한다",
				detail:
					"시그니처 요소 하나에 힘을 주고 나머지는 규율 있게 절제한다. 구조적 장치(번호 마커 등)는 순서가 실제로 의미를 가질 때만 쓰고 장식으로 쓰지 않는다.",
				role: "constraint",
				sourceIds: ["anthropic-frontend-design"],
			},
			{
				id: "deliberate-typography",
				summary: "디스플레이·본문 폰트를 의도적으로 짝짓는다",
				detail:
					"아무 프로젝트에나 반사적으로 쓰는 폰트 대신, 주제에 맞게 디스플레이와 본문 서체를 의도적으로 고른다.",
				role: "output-rule",
				sourceIds: ["anthropic-frontend-design"],
			},
			{
				id: "purposeful-motion",
				summary: "모션은 목적을 갖고 절제한다",
				detail:
					"흩뿌린 효과보다 하나의 연출된 순간이 더 강하게 남는다. 애니메이션이 과하면 'AI가 만든' 느낌이 나니 목적을 갖고 쓴다.",
				role: "constraint",
				sourceIds: ["anthropic-frontend-design"],
			},
			{
				id: "plan-then-critique",
				summary: "만들기 전에 계획→클리셰 자기비판→구현(2패스)",
				detail:
					"바로 만들지 말고 디자인 계획을 먼저 세우고 흔한 클리셰에 비춰 자기비판한 뒤, 고유성을 확인하고 나서 구현한다.",
				role: "workflow-step",
				sourceIds: ["anthropic-frontend-design"],
			},
			{
				id: "cohesive-palette-and-fonts",
				summary: "색 팔레트와 폰트 짝을 하나의 시각 정체성으로 묶는다",
				detail:
					"색과 폰트 조합을 하나의 정체성으로 정해 슬라이드·문서·랜딩 등 여러 콘텐츠에 일관되게 적용한다.",
				role: "output-rule",
				sourceIds: ["anthropic-theme-factory"],
			},
			{
				id: "show-options-then-apply",
				summary: "옵션을 먼저 보여주고 승인 후 일관 적용",
				detail:
					"테마 옵션을 먼저 제시해 사용자 승인을 받은 뒤, 대비·가독성을 지키며 전체에 체계적으로 적용한다.",
				role: "workflow-step",
				sourceIds: ["anthropic-theme-factory"],
			},
			{
				id: "context-appropriate-theme",
				summary: "맥락·청중에 맞는 시각 정체성을 고른다",
				detail:
					"미니멀부터 드라마틱까지, 맥락과 청중에 맞는 시각 정체성을 고른다. 스타일은 미학이자 전달 수단이다.",
				role: "workflow-step",
				sourceIds: ["anthropic-theme-factory"],
			},
		],
	},
	{
		id: "voice",
		label: "말투·보이스",
		keywords: [
			"말투",
			"톤",
			"tone",
			"보이스",
			"voice",
			"페르소나",
			"persona",
			"문체",
			"글쓰기",
			"writing",
		],
		// TODO: "설명 방식(비유로 쉽게 설명)" 소스 추가 필요 — 현재는 말투/보이스 위주.
		//   goal.md 갤러리 시드 스킬 #2("설명 말투 스타일")와 겹치므로 자체 스킬로도 커버 가능.
		sources: [
			{
				id: "tone-of-voice",
				name: "tone-of-voice (Claude Code skill)",
				author: "entpnomad",
				url: "https://github.com/entpnomad/tone-of-voice",
				license: "MIT",
				collectedAt: "2026-08-12",
			},
		],
		patterns: [
			{
				id: "define-voice-profile",
				summary: "말투를 먼저 '프로필'로 정의하고 일관 적용한다",
				detail:
					"정체성·핵심 신념·독자·보이스 특성(3~5개)·핵심 주제·선호/거부 어휘·금지 문구·채널별 규칙·예시 문단을 프로필로 정의하고, 그 기준으로 일관되게 쓴다.",
				role: "workflow-step",
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "banned-phrases",
				summary: "쓰지 말 표현을 명시적으로 목록화해 제거한다",
				detail:
					"진부하거나 'AI스러운' 문구를 금지 목록으로 만들고, 선호 어휘 대 거부 어휘를 구분해 걸러낸다.",
				role: "constraint",
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "open-with-punch",
				summary: "빌드업 없이 핵심으로 열고, 짧게 쓴다",
				detail:
					"숫자·대담한 주장·의외의 관점으로 시작한다. 짧은 문장, 짧은 문단, 여백을 둔다.",
				role: "output-rule",
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "substance-over-performance",
				summary: "태도가 아니라 근거로 뒷받침된 의견을 낸다",
				detail:
					"데이터·경험으로 뒷받침한다. 과시성 글쓰기·허수아비·아랫사람 깔보기·선언문식 수사를 금지하고, 모든 문장이 값을 하게 한다.",
				role: "constraint",
				sourceIds: ["tone-of-voice"],
			},
		],
	},
	{
		id: "documentation",
		label: "문서 작성",
		keywords: [
			"문서",
			"docs",
			"documentation",
			"readme",
			"스펙",
			"spec",
			"기술 문서",
			"가이드",
		],
		sources: [
			{
				id: "anthropic-doc-coauthoring",
				name: "doc-coauthoring (Anthropic skills)",
				author: "Anthropic",
				url: "https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring",
				license: "Apache-2.0",
				collectedAt: "2026-08-12",
			},
		],
		patterns: [
			{
				id: "context-gathering-first",
				summary: "쓰기 전에 배경·엣지케이스·트레이드오프를 질문으로 채운다",
				detail:
					"초기 질문·정보 덤프·후속 질문으로 지식 공백을 메운다. 모르는 게 가장 많은 섹션부터 시작한다.",
				role: "workflow-step",
				sourceIds: ["anthropic-doc-coauthoring"],
			},
			{
				id: "section-by-section",
				summary: "섹션 단위로 브레인스토밍→선별→초안→반복",
				detail:
					"섹션마다 5~20개 옵션을 브레인스토밍하고 선별해 초안을 쓴 뒤 피드백을 반영한다. 전체 재작성 대신 타깃 편집(str_replace)을 쓴다.",
				role: "workflow-step",
				sourceIds: ["anthropic-doc-coauthoring"],
			},
			{
				id: "fresh-reader-test",
				summary: "맥락 없는 새 인스턴스로 읽혀 맹점을 찾는다",
				detail:
					"저자는 알지만 독자는 모를 지점을, 맥락이 섞이지 않은 새 Claude로 문서를 읽혀 찾아낸다.",
				role: "verification",
				sourceIds: ["anthropic-doc-coauthoring"],
			},
			{
				id: "trim-filler",
				summary: "군더더기를 덜어내며 마무리한다",
				detail:
					"세 번 반복해도 변화가 적으면 무엇을 뺄지 묻는다. 마무리에 전체 흐름·일관성·군더더기를 점검한다.",
				role: "verification",
				sourceIds: ["anthropic-doc-coauthoring"],
			},
		],
	},
	{
		id: "explanation",
		label: "설명형 (쉽게 설명)",
		keywords: [
			"설명",
			"쉽게",
			"비유",
			"초보",
			"입문",
			"explain",
			"eli5",
			"뭔지",
			"개념",
		],
		// 출처=Tailor 자체(용어사전 방식). 외부 clean-라이선스 설명 스킬을 못 찾아,
		// 이미 제품이 실천 중인 접근을 정리함(제품 정체성과 일치, 라이선스 문제 없음).
		sources: [
			{
				id: "tailor-glossary",
				name: "Tailor 용어사전 방식 (자체)",
				author: "Tailor",
				url: "",
				license: "자체 (프로젝트 내부)",
				collectedAt: "2026-08-12",
				self: true,
			},
		],
		patterns: [
			{
				id: "everyday-analogy",
				summary: "추상 개념을 일상의 구체적 장면에 빗댄다",
				detail:
					"카페·알바생·메모처럼 누구나 아는 일상 상황으로 치환해 설명한다. (예: '스크립트 = 알바생에게 남긴 할 일 메모')",
				role: "output-rule",
				sourceIds: ["tailor-glossary"],
			},
			{
				id: "plain-words-first",
				summary: "전문용어를 먼저 꺼내지 않는다",
				detail:
					"쉬운 말로 먼저 풀고, 전문용어는 필요할 때 뒤에 괄호로 곁들인다. 용어로 시작해 겁주지 않는다.",
				role: "constraint",
				sourceIds: ["tailor-glossary"],
			},
			{
				id: "summary-then-detail",
				summary: "한 줄 요약 먼저, 그다음 풀이",
				detail:
					"짧은 한 줄로 감을 준 뒤 자세히 풀이한다. 처음부터 길게 늘어놓지 않는다.",
				role: "output-rule",
				sourceIds: ["tailor-glossary"],
			},
			{
				id: "include-why",
				summary: "무엇이 좋은지·왜 쓰는지를 곁들인다",
				detail:
					"개념이 왜 필요한지, 쓰면 무엇이 편해지는지를 함께 알려준다. (예: '한 번 써두면 매번 사람이 시키지 않아도 알아서 처리')",
				role: "workflow-step",
				sourceIds: ["tailor-glossary"],
			},
		],
	},
];

// 생성 시 코퍼스는 "전체를 정적으로" 프롬프트에 주입하고(정적 접두부라 캐시 가능),
// 어떤 카테고리·아키타입·패턴을 참고할지는 생성 AI가 고른다. 키워드 하드필터는
// 부분문자열 오매칭(ui→build)과 캐싱 모순 때문에 두지 않는다. keywords 필드는
// AI에게 주는 힌트로만 남긴다.

/**
 * 전역 소스 조회. 소스는 카테고리 안에 들어있지만, 아키타입/패턴 출처를 카테고리
 * 경계를 넘어 되찾아야 하므로 전 카테고리를 순회해 id로 찾는다.
 */
export function getSourceById(id: string): ReferenceSource | undefined {
	for (const category of referenceCategories) {
		const found = category.sources.find((source) => source.id === id);
		if (found) return found;
	}
	return undefined;
}

/** AI가 보고한 "쓴 패턴 id" 평면 목록 → 그 패턴들의 출처만 중복 없이 반환. */
export function sourcesForUsedPatterns(
	usedPatternIds: string[],
): ReferenceSource[] {
	const used = new Set(usedPatternIds);
	const sourceIds = new Set<string>();
	for (const category of referenceCategories) {
		for (const pattern of category.patterns) {
			if (used.has(pattern.id)) {
				for (const sourceId of pattern.sourceIds) sourceIds.add(sourceId);
			}
		}
	}
	return [...sourceIds]
		.map((id) => getSourceById(id))
		.filter((source): source is ReferenceSource => source !== undefined);
}

/** archetype id → 구조 원형(생성 프롬프트에 구조 골격을 주입할 때 사용). */
export function getArchetype(
	id: SkillArchetype,
): StructureArchetype | undefined {
	return structureArchetypes.find((archetype) => archetype.id === id);
}

/**
 * 아키타입(구조 골격)이 참고한 출처. 결과 화면에서 "구조 골격 참고"는 "내용 패턴
 * 참고"와 문구를 분리해 표기해야 오해가 없다(디자인 스킬이 규율형 골격을 썼다고
 * TDD를 "내용 참고"로 오표기하지 않도록).
 */
export function sourcesForArchetype(id: SkillArchetype): ReferenceSource[] {
	const archetype = getArchetype(id);
	if (!archetype) return [];
	return archetype.sourceIds
		.map((sourceId) => getSourceById(sourceId))
		.filter((source): source is ReferenceSource => source !== undefined);
}

// 개발 안전장치: 패턴 id는 전역에서 유일해야 한다(런타임에 AI가 평면 id 목록을
// 보고하므로). 중복이면 출처 매핑이 조용히 깨지니 개발 중엔 바로 터뜨린다.
if (process.env.NODE_ENV !== "production") {
	const seenPatternIds = new Set<string>();
	for (const category of referenceCategories) {
		for (const pattern of category.patterns) {
			if (seenPatternIds.has(pattern.id)) {
				throw new Error(`reference-corpus: 중복 패턴 id "${pattern.id}"`);
			}
			seenPatternIds.add(pattern.id);
		}
	}
}
