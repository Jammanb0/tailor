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

/**
 * 패턴이 어디에 작용하는가 — 출처 표기의 검증 가능성을 가른다.
 *
 * - "artifact": 완성된 SKILL.md 본문에 드러난다. 문서에서 근거 구절을 짚을 수
 *   있으므로 "이 패턴을 참고했다"는 표기를 제3자가 검증할 수 있다.
 * - "process": 문서를 *어떤 형태로 쓸지* 결정하는 규칙이라 완성된 문서 안에는
 *   흔적이 남지 않는다. 실제로 적용됐더라도 문서만 보고는 확인할 방법이 없다.
 *
 * 2026-08-18 출처 정직성 실험에서 나온 구분이다. 당시 거짓 크레딧 16건 중 8건이
 * process 패턴이었는데, 모델이 거짓 보고를 한 게 아니라(구조 골격 선택은 12/12
 * 정확했다) 애초에 문서로 검증할 수 없는 항목을 검증 대상에 섞어 놓은 탓이었다.
 * 근거: docs/experiments/2026-08-18-attribution-honesty.md
 *
 * 생략하면 "artifact"로 취급한다 — 대다수가 그쪽이고, 새 패턴을 추가할 때
 * 조용히 크레딧에서 빠지는 것보다 조용히 포함되는 편이 낫다.
 */
export type PatternKind = "artifact" | "process";

/**
 * 구체 예시 한 개. 극성(좋은 예/나쁜 예)을 반드시 밝힌다.
 *
 * 극성을 선택 항목으로 두면 안 되는 이유: 나쁜 예로 적은 값(`#F4F1EA` 같은)이
 * 표시 없이 목록에 섞이면 모델이 권장값으로 읽는다. 예시는 값 자체보다
 * "이건 하지 말라는 쪽인가"가 먼저 전달돼야 쓸모가 있다.
 */
export type PatternExample = {
	polarity: "good" | "bad";
	text: string;
};

/**
 * 값을 고르는 닫힌 선택지 한 개.
 *
 * `character`(성격 서술)가 필수인 이유: 값만 있으면 사용자 상황에 맞는지 판단할
 * 방법이 없다. `#1B2A41`만 적힌 것과 `#1B2A41 — 깊은 남색, 차분하고 신뢰감`이
 * 적힌 것은 참고 자료로서 완전히 다르다.
 */
export type PatternOption = {
	/** 실제 값 (예: "#1B2A41", "세리프") */
	value: string;
	/** 어떤 성격·느낌인지 (예: "깊은 남색 — 차분하고 신뢰감") */
	character: string;
};

/**
 * 결과물이 어떤 형식을 갖춰야 하는지. 세 조각으로 나눈다.
 *
 * 한 덩어리 문장으로 적으면 "색을 정하라"까지만 남고 "몇 개를, 어떤 항목으로,
 * 어떤 모양으로"가 통째로 빠진다 — 2026-08-18 감사에서 두 소스 모두 정확히
 * 이 자리에서 소실됐다.
 */
export type PatternFormat = {
	/** 개수 규정 (예: "색 4~6개") */
	count?: string;
	/** 산출물의 섹션 구성 */
	sections?: string[];
	/** 그대로 따라 쓸 리터럴 템플릿 (예: "이름: #hex - 역할"). 코드펜스로 렌더된다. */
	template?: string;
};

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
	/**
	 * 결과물에 드러나는가(artifact) / 작성 과정에만 작용하는가(process). 기본 artifact.
	 *
	 * 함정: 판정 기준은 "원문이 무엇을 규정했나"가 아니라 **"Tailor가 만든
	 * SKILL.md에서 근거 구절을 짚을 수 있나"**다. 감사 문서의 kind 표기를 그대로
	 * 옮기면 결과물에 분명히 드러나는 항목이 process로 분류돼 출처 크레딧에서
	 * 조용히 빠진다. 감사 표기와 다르게 판정했다면 그 이유를 주석으로 남길 것.
	 */
	kind?: PatternKind;
	/** 구체 예시. 좋은 예/나쁜 예를 반드시 구분한다. */
	examples?: PatternExample[];
	/** 결과물의 형식 규정 (개수 · 섹션 구성 · 리터럴 템플릿). */
	format?: PatternFormat;
	/** 값을 고르는 닫힌 선택지. 각 값에 성격 서술이 붙는다. */
	options?: PatternOption[];
	/** 이 패턴을 적용하지 않아도 되는 조건 (예: "사용자가 이미 방향을 정해줬다면"). */
	exception?: string;
	/**
	 * 근거가 된 감사 항목 id (예: "D-17", "T-14"). 보고서 파일 경로가 아니라
	 * 항목 단위로 적는다 — 파일 단위로는 "그 문서 어딘가"까지만 되짚을 수 있다.
	 */
	auditIds?: string[];
	/**
	 * 이 패턴이 실제로 반영됐는지 채점할 때 볼 것. **프롬프트에 렌더하지 않는다.**
	 * 모델에게 주면 채점 기준을 보고 쓰는 셈이라 측정이 무의미해진다.
	 */
	verifyHint?: string;
	/**
	 * 원문을 그대로 정리한 것이 아니라 **번역·재해석해 담은** 패턴인가.
	 *
	 * 원칙은 "원문에서 빼는 것은 없다 — 옮길 수 없으면 번역한다"이다. 예를 들어
	 * 원문이 "샌드박스에 이 폰트들이 깔려 있다"고만 적어둔 것은 그 소스의 환경
	 * 사정이라 그대로는 못 쓰지만, "이런 느낌이 필요하면 이런 폰트를 권한다"로
	 * 바꾸면 쓸 수 있다. 그렇게 옮기는 순간 **원문에 없던 판단이 섞인다.**
	 *
	 * true면 출처를 "원 소스 + Tailor 가공"으로 표기한다. `sourceIds`는 그대로 원
	 * 소스를 가리킨다 — 계보를 지우지 않는다. Tailor가 처음부터 만든 것
	 * (`ReferenceSource.self`, "Tailor-made")과는 다른 상태다.
	 *
	 * 이 구분이 없어서 생긴 사고가 `context-appropriate-theme`의 가필이다.
	 * 원문에 없는 문장에 theme-factory 크레딧이 붙어 있었다(2026-08-18 감사).
	 */
	adapted?: boolean;
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
				// 어떤 골격을 쓸지 고르는 규칙이라 완성된 문서에는 흔적이 남지 않는다.
				kind: "process",
				sourceIds: ["sp-writing-skills"],
			},
			{
				id: "skills-are-reusable-techniques",
				summary: "스킬은 재사용 가능한 검증된 기법이지 일회성 서사가 아니다",
				detail:
					"한 번의 문제 해결 이야기가 아니라 반복해서 쓸 기법의 참고 자료로 만든다. 일회성 작업은 스킬로 만들지 않는다.",
				role: "constraint",
				// "무엇을 스킬로 만들 것인가"에 대한 메타 규칙 — 결과물에 문장으로
				// 드러나지 않는다.
				kind: "process",
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
		// 2026-08-18 복원. 이 카테고리만 원문 감사(docs/corpus/) 결과를 반영해 구체값을
		// 되살렸다. 나머지 7개 카테고리는 재측정의 대조군이므로 손대지 않는다.
		//
		// kind 판정 주의: 감사 문서의 kind는 "원문에서 그 지시가 무엇에 작용하는가"
		// 기준이고, 여기 kind는 "Tailor가 만든 SKILL.md에서 근거를 짚을 수 있는가"
		// 기준이다. 그래서 감사가 process로 본 항목이 여기서는 artifact가 되기도 한다
		// (아래 개별 주석). 감사 표기를 그대로 옮기면 크레딧이 조용히 사라진다.
		patterns: [
			{
				id: "ground-in-subject",
				summary: "주제 고유의 세계에서 디자인 선택을 끌어낸다",
				detail:
					"브리프가 주제를 특정하지 않으면 먼저 직접 고정한다 — 구체적 주제 1개·청중·페이지의 단일 목적을 정하고 그 선택을 명시한다. 고유한 선택은 주제의 세계(소재·도구·산물·업계 용어)에서 나온다. 히어로는 주장이다: 주제 세계에서 가장 특징적인 것으로 연다.",
				role: "workflow-step",
				kind: "artifact",
				format: {
					sections: ["구체적 주제 1개", "청중", "페이지의 단일 목적"],
				},
				options: [
					{
						value: "헤드라인",
						character: "주장을 문장으로 — 카피 자체가 강할 때",
					},
					{ value: "이미지", character: "주제의 실물·질감을 바로 보여줄 때" },
					{ value: "애니메이션", character: "변화·과정이 주제의 핵심일 때" },
					{
						value: "라이브 데모",
						character: "직접 만져보는 것이 가장 설득적일 때",
					},
					{
						value: "인터랙티브 순간",
						character: "참여 자체가 메시지일 때",
					},
				],
				examples: [
					{
						polarity: "bad",
						text: "큰 숫자 + 작은 라벨 + 보조 스탯 + 그라데이션 액센트 — 히어로의 템플릿 답안. 정말 최선일 때만 쓴다",
					},
				],
				auditIds: ["D-03", "D-04", "D-05", "D-06"],
				sourceIds: ["anthropic-frontend-design"],
			},
			{
				id: "avoid-ai-default-looks",
				summary: "AI 디자인이 몰리는 세 가지 기본 룩을 알고 피한다",
				detail:
					"아래 셋은 어떤 브리프에는 정당하지만 선택이 아니라 기본값이며, 주제와 무관하게 반복해서 나온다. 브리프가 비워둔 축에서 이 셋으로 흘러가지 않는지 만들면서 확인한다.",
				role: "constraint",
				kind: "artifact",
				examples: [
					{
						polarity: "bad",
						text: "따뜻한 크림 배경(#F4F1EA 근처) + 고대비 세리프 디스플레이 + 테라코타 액센트",
					},
					{
						polarity: "bad",
						text: "니어블랙 배경 + 밝은 애시드 그린 또는 버밀리언 액센트 하나",
					},
					{
						polarity: "bad",
						text: "헤어라인 괘선 + border-radius: 0 + 신문식 조밀 다단(브로드시트)",
					},
				],
				exception:
					"브리프가 이 룩 중 하나를 명시적으로 요구하면 그대로 따른다 — 브리프의 말이 항상 이긴다",
				auditIds: ["D-17"],
				verifyHint:
					"생성된 SKILL.md에 hex나 CSS 값이 '피할 것'으로 등장하는가. 권장값으로 등장하면 극성이 뒤집힌 것이다",
				sourceIds: ["anthropic-frontend-design"],
			},
			{
				id: "one-signature-element",
				summary: "대담함은 한 곳에 집중하고 나머지는 절제한다",
				detail:
					"시그니처 요소 하나만 기억에 남게 하고 주변은 조용하고 규율 있게 두며, 브리프에 복무하지 않는 장식은 잘라낸다. 구조 장치(번호·아이브로우·구분선·라벨)는 내용에 관한 참인 무언가를 담아야 하고 장식이면 안 된다.",
				role: "constraint",
				kind: "artifact",
				examples: [
					{
						polarity: "bad",
						text: "순서가 아닌 내용에 01 / 02 / 03 번호 마커를 붙이는 것",
					},
					{
						polarity: "good",
						text: "실제 프로세스나 시점이 찍힌 타임라인처럼, 순서가 독자에게 정보를 줄 때만 번호를 쓴다",
					},
				],
				exception:
					"모험하지 않는 것 자체가 위험일 수 있다 — 절제가 무난함으로 흐르지 않게 한다",
				auditIds: ["D-10", "D-11", "D-23"],
				sourceIds: ["anthropic-frontend-design"],
			},
			{
				id: "deliberate-typography",
				summary: "디스플레이·본문 폰트를 의도적으로 짝짓고 역할을 나눈다",
				detail:
					"아무 프로젝트에나 반사적으로 쓰는 서체 대신 주제에 맞게 고른다. 타입 스케일을 명확히 잡고 굵기·너비·자간을 의도적으로 설정하며, 타이포 처리 자체가 기억에 남는 요소가 되게 한다. 역할은 헤더와 본문 둘로 나누는 것이 기본이고, 개성은 헤더에서 내되 본문은 가독성을 지킨다.",
				role: "output-rule",
				// 감사는 T-16(폰트 2역할)을 theme-factory 형식으로 봤고, 헤더/본문의
				// 성격 서술은 themes/ 10개를 전수로 읽어 우리가 읽어낸 해석이다.
				// 원문에 없는 문장이므로 adapted로 표시한다.
				kind: "artifact",
				adapted: true,
				format: {
					sections: [
						"헤더(디스플레이)",
						"본문",
						"필요시 캡션·데이터용 유틸리티",
					],
				},
				options: [
					{
						value: "세리프 헤더",
						character: "격식 있고 전통적 — 신뢰·역사·전문성을 말할 때",
					},
					{
						value: "산세리프 헤더",
						character: "현대적이고 중립적 — 기술·명료함을 말할 때",
					},
					{
						value: "굵은 헤더 + 보통 굵기 본문",
						character: "대비로 위계를 만드는 가장 안전한 기본 조합",
					},
					{
						value: "산세리프 본문",
						character: "긴 글에서도 읽기 쉬움 — 본문에는 이쪽을 권한다",
					},
				],
				exception:
					"실행 환경에 따라 쓸 수 있는 서체가 제한될 수 있다. 그때는 이름이 아니라 성격(세리프/산세리프, 굵기 대비)을 맞춘다",
				auditIds: ["D-07", "D-08", "D-09", "T-16"],
				sourceIds: ["anthropic-frontend-design", "anthropic-theme-factory"],
			},
			{
				id: "purposeful-motion",
				summary: "모션은 쓸 곳과 쓸지 여부를 함께 판단한다",
				detail:
					"흩뿌린 효과보다 연출된 한 순간이 대개 더 세게 꽂힌다. 애니메이션이 과하면 'AI가 만든' 느낌에 기여하므로, 어디에 쓸지와 아예 쓰지 않을지를 함께 정한다.",
				role: "constraint",
				kind: "artifact",
				options: [
					{
						value: "페이지 로드 시퀀스",
						character: "첫인상을 연출 — 한 번만 쓰고 짧게",
					},
					{
						value: "스크롤 트리거 등장",
						character: "읽는 속도에 맞춰 정보를 드러냄",
					},
					{
						value: "호버 마이크로 인터랙션",
						character: "조작 가능하다는 신호 — 작고 빠르게",
					},
					{
						value: "앰비언트 분위기",
						character: "배경에서 은은하게, 주의를 뺏지 않게",
					},
				],
				auditIds: ["D-12", "D-13", "D-14"],
				sourceIds: ["anthropic-frontend-design"],
			},
			{
				id: "match-complexity-to-vision",
				summary: "복잡도를 택한 방향에 맞춘다",
				detail:
					"맥시멀리즘 방향은 정교한 실행을 요구하고, 미니멀 방향은 여백·타입·디테일의 정밀함을 요구한다. 우아함은 택한 비전을 잘 실행하는 것이지 요소를 줄이는 것이 아니다.",
				role: "constraint",
				kind: "artifact",
				auditIds: ["D-15"],
				sourceIds: ["anthropic-frontend-design"],
			},
			{
				id: "design-token-plan",
				summary: "만들기 전에 토큰 시스템 4종을 개수까지 정한다",
				detail:
					"코드를 쓰기 전에 색·타입·레이아웃·시그니처를 한 벌로 정하고, 이후 모든 결정을 이 계획에서 파생시킨다. 개수를 정해두지 않으면 계획이 '분위기 설명'으로 흐른다.",
				role: "output-rule",
				// 감사(9-1)는 이것을 process로 봤다 — 원문에서는 작성 과정의 1패스이기
				// 때문이다. 그러나 Tailor가 만든 SKILL.md에는 "색 4~6개를 정한다"가
				// 문장으로 남으므로, 우리 기준으로는 결과물에서 확인 가능한 artifact다.
				kind: "artifact",
				format: {
					count: "색 명명 hex 4~6개 · 서체 2역할 이상 · 시그니처 정확히 1개",
					sections: [
						"Color — 명명된 hex 4~6개",
						"Type — 디스플레이 / 본문 (+필요시 유틸리티)",
						"Layout — 한 문장 산문 + ASCII 와이어프레임으로 안 비교",
						"Signature — 이 페이지가 기억될 단 하나의 요소",
					],
					template:
						"Color: Deep Navy #1B2A41 / ... (4~6개)  |  Type: 디스플레이 + 본문  |  Layout: 산문 1문장 + ASCII 와이어프레임  |  Signature: 1개",
				},
				auditIds: ["D-19"],
				verifyHint:
					"생성된 SKILL.md가 '색을 정한다' 수준에서 멈추는지, 개수(4~6)와 4조각 구성까지 적는지",
				sourceIds: ["anthropic-frontend-design"],
			},
			{
				id: "plan-then-critique",
				summary: "계획을 브리프에 비춰 검토한 뒤에야 만든다(2패스)",
				detail:
					"계획의 각 부분이 '비슷한 페이지면 아무거나 나올 법한 기본값'으로 읽히는지 본다. 판정은 감이 아니라 절차로 한다 — 비슷한 프롬프트를 실제로 굴려 같은 결과에 도달하는지 확인하고, 고쳤으면 무엇을 왜 바꿨는지 말한다. 고유성을 확인한 뒤에야 코드를 쓴다.",
				role: "workflow-step",
				kind: "artifact",
				auditIds: ["D-20"],
				sourceIds: ["anthropic-frontend-design"],
			},
			{
				id: "brief-wins",
				summary: "브리프가 지정한 것은 그대로 따른다",
				detail:
					"고유성을 요구하는 다른 모든 규칙에 우선하는 예외다. 브리프가 방향을 지정했으면 그대로 따르고, 브리프가 비워둔 축에서만 그 자유를 기본값에 쓰지 않는다. 이 규칙이 없으면 '고유하게 하라'가 사용자 지시를 무시하는 근거로 쓰인다.",
				role: "constraint",
				kind: "artifact",
				auditIds: ["D-18"],
				sourceIds: ["anthropic-frontend-design"],
			},
			{
				id: "quality-floor-unannounced",
				summary: "품질 바닥선을 티내지 않고 지킨다",
				detail:
					"아래 3항목은 자랑하지 않고 기본으로 지킨다. 문서에 '접근성을 고려했습니다'라고 쓰는 대신 항목을 실제 점검 대상으로 둔다.",
				role: "verification",
				kind: "artifact",
				format: {
					sections: [
						"모바일까지 반응형",
						"키보드 포커스가 눈에 보임",
						"prefers-reduced-motion 존중",
					],
				},
				auditIds: ["D-24"],
				sourceIds: ["anthropic-frontend-design"],
			},
			{
				id: "ui-copy-is-design-material",
				summary: "화면의 글도 디자인 재료로 다룬다",
				detail:
					"카피는 장식이 아니라 디자인 재료다. 사용자가 다루고 알아보는 이름으로 부르고 시스템 구현 방식으로 부르지 않는다. 능동태를 기본으로 하고, 한 동작은 흐름 전체에서 같은 이름을 유지한다. 실패와 빈 화면은 분위기가 아니라 방향을 주는 자리다 — 에러는 사과하지 않고 무엇이 잘못됐고 어떻게 고치는지 말한다.",
				role: "output-rule",
				kind: "artifact",
				examples: [
					{
						polarity: "good",
						text: '"Save changes" — 눌렀을 때 벌어질 일을 그대로',
					},
					{ polarity: "bad", text: '"Submit" — 무슨 일이 나는지 말하지 않음' },
					{
						polarity: "good",
						text: '"Publish" 버튼이 "Published" 토스트를 낸다 — 이름이 흐름 내내 유지됨',
					},
					{ polarity: "good", text: '"알림을 관리" — 사람이 아는 말' },
					{ polarity: "bad", text: '"웹훅 설정"을 관리 — 시스템 구현 용어' },
				],
				auditIds: ["D-26", "D-27", "D-28", "D-29", "D-30"],
				sourceIds: ["anthropic-frontend-design"],
			},
			{
				id: "cohesive-palette-and-fonts",
				summary: "색·폰트·정체성 3종을 한 벌로 묶는다",
				detail:
					"테마 하나는 세 가지로 구성된다 — hex 코드를 갖춘 응집된 색 팔레트, 헤더·본문의 상보적 폰트 짝, 맥락과 청중에 맞는 뚜렷한 시각 정체성. 셋 중 하나라도 빠지면 여러 콘텐츠에 일관되게 적용할 수 없다.",
				role: "output-rule",
				kind: "artifact",
				format: {
					sections: [
						"hex 코드를 갖춘 색 팔레트",
						"헤더·본문 폰트 짝",
						"맥락·청중에 맞는 시각 정체성",
					],
				},
				auditIds: ["T-01"],
				sourceIds: ["anthropic-theme-factory"],
			},
			{
				id: "option-spec-format",
				summary: "옵션 하나를 적는 형식 — 이름·값·역할 3부",
				detail:
					"선택지를 제공하는 스킬은 옵션 하나하나를 같은 틀로 적는다. 색은 정확히 4개를 배경·주 강조·보조 강조·텍스트 자리에 배치하고, 각 항목은 부르는 이름·실제 값·쓰이는 자리 세 조각을 모두 갖춘다. 이름만 있으면 못 쓰고, 값만 있으면 어디 쓸지 모르고, 역할만 있으면 무슨 색인지 모른다.",
				role: "output-rule",
				kind: "artifact",
				format: {
					count: "색 정확히 4개 · 폰트 2역할 · 용도 4~5개",
					sections: [
						"# 이름",
						"성격 한 문장 (형용사 + 무엇을 연상시키는지)",
						"## Color Palette",
						"## Typography",
						"## Best Used For",
					],
					template: "- **Deep Navy**: `#1B2A41` - 주 배경색",
				},
				auditIds: ["T-14", "T-15", "T-16", "T-17", "T-18"],
				verifyHint:
					"생성된 SKILL.md가 값만 나열하는지, 이름·값·역할 3부를 갖춘 틀을 제시하는지",
				sourceIds: ["anthropic-theme-factory"],
			},
			{
				id: "show-options-then-apply",
				summary: "옵션을 먼저 보여주고 승인 후 일관 적용",
				detail:
					"선택지를 먼저 눈으로 보게 하고, 어느 것을 쓸지 묻고, 명시적 확인을 받은 뒤에 적용한다. 적용할 때는 대비·가독성을 지키며 전체에 일관되게 반영한다.",
				role: "workflow-step",
				kind: "artifact",
				exception:
					"보여주기용 자료(쇼케이스)는 보여주기만 하고 수정하지 않는다",
				auditIds: ["T-02", "T-03", "T-05", "T-09", "T-10", "T-11"],
				sourceIds: ["anthropic-theme-factory"],
			},
			{
				id: "wait-for-explicit-choice",
				summary: "'제시했다'와 '확인받았다'를 다른 사건으로 다룬다",
				detail:
					"선택지를 보여준 것만으로 진행하지 않고 명시적 확인을 기다린다. 한 문장으로 합치면 제시만 하고 적용해버리는 실패가 규칙 위반으로 잡히지 않는다.",
				role: "workflow-step",
				// 완성된 SKILL.md에 "확인을 받은 뒤 적용한다"는 문장으로 남으므로
				// artifact다. 감사(9-1)는 원문 기준으로 process로 분류했다.
				kind: "artifact",
				auditIds: ["T-04"],
				sourceIds: ["anthropic-theme-factory"],
			},
			{
				id: "custom-option-fallback",
				summary: "맞는 선택지가 없으면 만들고, 같은 승인 절차를 다시 밟는다",
				detail:
					"기존 선택지 중 맞는 것이 없으면 새로 만든다. 이름은 조합이 무엇을 표상하는지 드러나게 붙이고, 사용자가 준 설명으로 값을 고른다. 만든 뒤에는 기존 선택지와 똑같이 검토·확인을 받고 나서 적용한다 — 예외 경로에서 승인 절차가 새지 않게 한다.",
				role: "workflow-step",
				kind: "artifact",
				auditIds: ["T-12", "T-13"],
				sourceIds: ["anthropic-theme-factory"],
			},
			{
				id: "read-the-spec-not-memory",
				summary: "명세가 파일로 있으면 기억하지 말고 읽는다",
				detail:
					"적용할 값이 별도 파일에 정의돼 있으면 그 파일을 열어 읽고 적용한다. 기억이나 추측으로 값을 채우면 파일과 결과물이 조용히 어긋난다.",
				role: "workflow-step",
				kind: "artifact",
				auditIds: ["T-08"],
				sourceIds: ["anthropic-theme-factory"],
			},
			{
				id: "context-appropriate-theme",
				summary: "용도를 형용사가 아니라 실제 상황으로 적는다",
				detail:
					"맥락과 청중에 맞는 시각 정체성을 고르되, 어디에 쓰는 것인지를 실제 문서 종류·업종으로 적는다. 고를 때 필요한 판단은 '멋진가'가 아니라 '내 상황이 여기 있는가'이기 때문이다.",
				role: "workflow-step",
				kind: "artifact",
				format: { count: "용도 4~5개" },
				examples: [
					{
						polarity: "good",
						text: "의료 발표자료, 재무 보고서, 웨딩 기획, 기술 스타트업 데모",
					},
					{
						polarity: "bad",
						text: "'우아한', '전문적인', '모던한' 같은 형용사만 나열하는 것",
					},
				],
				auditIds: ["T-17"],
				// 초판 코퍼스에 있던 "스타일은 미학이자 전달 수단이다"는 원문에 없는
				// 문장이었다(감사 8-4의 가필). 이번에 삭제하고 T-17 근거로 대체했다.
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
/**
 * 이번 생성에 실제로 쓰인 출처 한 건. 원 출처 정보에 "가공 여부"가 붙는다.
 * 화면 표기는 세 상태로 갈린다 — 그대로 정리 / 원 소스 + Tailor 가공 / Tailor-made.
 */
export type AttributedSource = ReferenceSource & { adapted?: boolean };

export function getSourceById(id: string): ReferenceSource | undefined {
	for (const category of referenceCategories) {
		const found = category.sources.find((source) => source.id === id);
		if (found) return found;
	}
	return undefined;
}

/** 패턴 id → 패턴. 전 카테고리를 순회한다(id는 전역 유일). */
export function getPatternById(id: string): ReferencePattern | undefined {
	for (const category of referenceCategories) {
		const found = category.patterns.find((pattern) => pattern.id === id);
		if (found) return found;
	}
	return undefined;
}

/** 보고된 id 중 결과물에서 검증할 수 없는 process 패턴만 골라낸다. */
export function processPatternIds(usedPatternIds: string[]): string[] {
	return usedPatternIds.filter((id) => getPatternById(id)?.kind === "process");
}

/**
 * AI가 보고한 "쓴 패턴 id" 평면 목록 → 그 패턴들의 출처만 중복 없이 반환.
 *
 * process 패턴은 제외한다. 실제로 적용됐더라도 완성된 문서에서 확인할 방법이
 * 없어서, 크레딧을 걸면 사용자가 검증할 수 없는 표기가 화면에 남는다. 표기하는
 * 것은 전부 근거를 짚을 수 있어야 한다는 게 이 프로젝트의 출처 정책이다.
 * (실무상 손실도 거의 없다 — process 패턴의 출처인 sp-writing-skills는
 * trigger-first-description으로 어차피 대부분의 생성에서 크레딧된다.)
 */
export function sourcesForUsedPatterns(
	usedPatternIds: string[],
): AttributedSource[] {
	const used = new Set(usedPatternIds);
	const adaptedSourceIds = new Set<string>();
	const sourceIds = new Set<string>();
	for (const category of referenceCategories) {
		for (const pattern of category.patterns) {
			if (pattern.kind === "process") continue;
			if (used.has(pattern.id)) {
				for (const sourceId of pattern.sourceIds) {
					sourceIds.add(sourceId);
					if (pattern.adapted) adaptedSourceIds.add(sourceId);
				}
			}
		}
	}
	return [...sourceIds]
		.map((id) => {
			const source = getSourceById(id);
			if (!source) return undefined;
			// 한 출처가 여러 패턴에 걸릴 수 있다. 그중 하나라도 가공본이면 가공으로
			// 표기한다 — 덜 표기해서 손댄 사실을 감추는 쪽이 더 나쁜 실패다.
			return adaptedSourceIds.has(id) ? { ...source, adapted: true } : source;
		})
		.filter((source): source is AttributedSource => source !== undefined);
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
