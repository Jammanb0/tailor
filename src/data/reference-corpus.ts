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
// 어느 칸에 담는가 (2026-08-20 확정)
//
// 같은 정보가 두 칸에 살면 한쪽만 고쳐져 조용히 어긋난다. 실제로 순서가
// `detail`과 `format.template` 양쪽에 산문으로 흩어져 있었다. 그래서 칸마다
// 담을 것을 하나로 못박는다.
//
//   detail   — **왜·언제.** 이걸 안 지키면 무엇이 잘못되는지, 어떤 상황에
//              적용되는지. **순서를 여기에 다시 적지 않는다.**
//   flow     — **행동의 순서.** 단계, 넘어가기 전 조건(gate), 갈림길·되돌아감
//              (branches). 목록이 아니라 흐름일 때만 쓴다.
//   format   — 순서가 없는 구성 항목(sections) · 개수(count) · 줄 형식(template).
//              `template`은 "이렇게 생긴 한 줄"이지 절차가 아니다.
//   options  — 골라 쓰는 값의 닫힌 목록. 각 값에 성격 서술을 붙인다.
//   examples — 좋은 예 / 나쁜 예.
//   exception— 이 패턴을 적용하지 않아도 되는 조건.
//
// **칸은 전부 선택이다.** 해당 없으면 비운다 — 107개 중 `format`을 쓰는 것은
// 15개뿐이다. 억지로 채우지 말 것.
//
// 판정이 갈리는 자리 두 곳:
//   · 순서인가 목록인가 → "1번을 끝내야 2번을 할 수 있나?"로 가른다.
//     아니면 `format.sections`다. (예: root-cause-first의 5단계는 flow,
//     instrument-component-boundaries의 경계 4항목은 sections)
//   · 흐름인가 배치 규칙인가 → "먼저"가 들어 있어도 절차가 아니면 detail이다.
//     (예: plain-words-first의 "쉬운 말로 먼저 풀고"는 detail로 남긴다)
//
// lint 규칙 8-d가 `flow`와 순서형 `format.template`의 동시 보유를 막는다.
// 8-e는 `auditIds` 없는 `flow`를 막는다 — 지어낸 순서에 원 소스 크레딧이
// 붙는 것은 `context-appropriate-theme` 가필 사고와 같은 종류다.
//
// **원칙 패턴과 값 패턴이 짝을 이루는 경우가 있다** — 형식을 담는 패턴 하나와
// 주제별 값을 담는 패턴 여럿이다(변명 표 · 위험 신호 두 가족, 2026-08-21 기준
// 7개). 짝은 **카테고리를 가로지르므로** 출처별 묶음 렌더로는 붙지 않는다.
// 관계 필드를 새로 만들지 않고 **양쪽 `detail`에 상대 패턴 id를 한 줄 적는다** —
// 렌더에 그대로 실려 모델에 도달하고, 필드가 늘지 않는다. 새 값 패턴을 만들 때
// 같은 줄을 붙일 것.
//
// **문서 자체의 섹션 순서는 여기가 아니다.** 그것은 축 (1)이 담는다 —
// 타입과 무관한 앞뒤는 `commonSpine`, 타입별로 다른 본문은
// `structureArchetypes[].bodySections`다. `flow`는 "스킬이 시키는 일"의
// 순서이고 축 (1)은 "SKILL.md를 어떤 섹션 순서로 쓸까"다. 섞지 말 것.
//
// 출처 라이선스 (정책 B, 2026-08-19 — 이전 정책 A를 대체한다):
//
// 저작권은 "표현"을 보호하고 "아이디어·방법·사실"은 보호하지 않는다. 그래서
// 원문을 읽고 우리 말로 다시 쓰는 것과, 원문의 값을 그대로 옮기는 것은 성질이
// 다르다. 라이선스는 후자를 확실하게 만들어 주는 장치다. 이 구분에 맞춰 소스를
// 두 등급으로 나눈다.
//
//   1) 라이선스가 확인된 소스 (MIT / Apache-2.0)
//      → 값 리터럴까지 옮긴다 (금지 문구 목록, 선택지, 수치, 리터럴 템플릿 등)
//
//   2) 라이선스가 확인되지 않은 소스  → `summaryOnly: true`
//      → 개념·방법은 우리 말로 요약해 담는다
//      → **수치·개수 같은 방법의 매개변수는 담아도 된다.** 위 문단이 말한
//         "사실"에 해당한다 — "옵션을 5~20개 뽑아라"의 숫자는 표현이 아니라
//         방법의 값이다. 이걸 빼면 지시가 "여러 개 뽑아라"로 뭉개져 참고 자료로
//         쓸모가 없어진다
//      → **문구·목록·표·리터럴 템플릿은 담지 않는다.** 이쪽이 "표현"이다.
//         금지 문구 목록, 좋은 예/나쁜 예 문장, 표의 행, 그대로 베껴 쓸 템플릿
//      → 이 소스에서 온 패턴은 전부 `adapted: true` (lint 규칙 7이 강제한다)
//
//      **[2026-08-21 정정]** 종전 문구는 "값 리터럴은 옮기지 않는다"였고 수치를
//      금지 목록에 넣고 있었다. 그런데 이 정책의 근거는 "아이디어·방법·사실은
//      보호되지 않는다"이므로 **근거와 결론이 어긋나 있었다.** 실제로 데이터도
//      그 조항을 안 지키고 있었다(`section-by-section`의 "5~20개",
//      `trim-filler`의 "세 번"). 옛 정책 A가 "법이 요구하는 선보다 엄격한
//      자기 규율"이라는 이유로 폐기된 것과 같은 종류의 과잉이다.
//
//      **검사기가 이 구분을 못 잡는다는 점은 그대로다** — lint 규칙 7은
//      `adapted` 표시만 본다. 문구를 옮겼는지는 사람이 판단해야 한다.
//
// **두 등급 모두 출처를 표기한다.** 라이선스가 없는 쪽이 표기가 덜 중요한 게
// 아니라 오히려 더 중요하다 — 표기를 생략하면 화면에서 Tailor 자체 제작으로
// 보이는데 그건 틀린 신호다.
//
// 카피레프트(CC-BY-SA 등)는 여전히 제외한다 — 요약본에까지 같은 라이선스를
// 요구할 수 있어 등급 2로도 다루기 어렵다. 마케팅성 저품질 스킬도 제외(품질 사유).
//
// `license` 필드에는 **확인한 사실만** 적는다. 확인 못 했으면 "확인되지 않음"으로
// 적는다 — 화면에 그대로 표시되므로 추측을 적으면 사용자에게 거짓을 보여주게 된다.
//
// 왜 바뀌었나: 옛 정책 A는 "MIT/Apache만"이었고 근거가 기록돼 있지 않았다.
// 2026-08-19에 두 소스가 연달아 걸리면서(doc-coauthoring, writing-skills의
// anthropic-best-practices.md) 따져본 결과, 그 규칙은 법이 요구하는 선보다
// 엄격한 자기 규율이었고 **쓸 수 있는 개념까지 통째로 버리고 있었다.**
// 상세 판단은 `.claude/plans/open-questions.md`의 해결된 미결 사항에 있다.

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
	/**
	 * 라이선스가 확인되지 않은 소스인가 (정책 B의 등급 2).
	 *
	 * true면 이 소스에서 **개념·방법만 우리 말로 요약해** 담고, 원문의 값
	 * 리터럴(목록·선택지·수치·템플릿)은 옮기지 않는다. 저작권이 보호하는 것은
	 * 표현이지 아이디어가 아니므로, 다시 쓴 요약은 라이선스와 별개 문제다.
	 *
	 * 이 소스를 가리키는 패턴은 전부 `adapted: true`여야 한다(lint 규칙 7).
	 * 검사기가 "이 문장이 원문 복사인가"까지는 볼 수 없지만, "요약본임을
	 * 표시했는가"는 확실히 잡는다.
	 *
	 * 출처 표기는 등급과 무관하게 한다 — 생략하면 화면에서 Tailor 자체 제작으로
	 * 보이는데 그건 틀린 신호다.
	 */
	summaryOnly?: boolean;
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
/**
 * 흐름 안의 한 단계.
 *
 * 왜 별도 타입인가: 원본 스킬이 규정한 순서가 여러 패턴으로 쪼개지면서 사라진다.
 * systematic-debugging의 4단계(감사 SD-07)가 그 사례다 — 각 단계는 패턴으로
 * 남았는데 "이 순서이고 각 단계를 끝내야 다음"이라는 규정만 어디에도 없다.
 *
 * 목록(string[])으로는 부족하다. 원문에는 분기(SD-16)와 되돌아감(SD-20)이 있고,
 * 그 둘은 직선 목록에 담기지 않는다.
 */
export type FlowStep = {
	/** 이 흐름 안에서만 유일하면 된다(전역 유일일 필요 없음) */
	id: string;
	/** 렌더에 나올 짧은 행동 문장 */
	label: string;
	/** 이 단계에 대응하는 패턴이 있으면 그 id. 없으면 생략한다 */
	patternId?: string;
	/** 다음으로 넘어가기 전 충족해야 하는 조건 */
	gate?: string;
	/** 조건부 이동. 비어 있으면 다음 단계로 순차 진행 */
	branches?: {
		when: string;
		/** 같은 흐름의 FlowStep.id | "done"(정상 종료) | "stop"(중단) */
		goto: string;
	}[];
};

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
	/**
	 * 여러 패턴에 걸친 순서·게이트·분기·되돌아감.
	 *
	 * 한 패턴 안에 닫힌 직선 절차는 `format.template`에 둔다 — 둘을 동시에 갖지
	 * 않는다(lint 규칙 8-e). 순서의 집은 하나여야 한다.
	 *
	 * `flow`가 있으면 `detail`은 '왜'와 적용 조건만 쓰고 순서를 반복하지 않는다.
	 */
	flow?: FlowStep[];
	/** 이 패턴이 유래한 ReferenceSource.id 목록 (신뢰성의 핵심) */
	sourceIds: string[];
};

/** 스킬 "타입" — 타입마다 좋은 문서 구조가 다르다(writing-skills: form matches failure). */
export type SkillArchetype =
	| "discipline"
	| "workflow"
	| "reference"
	| "explanation";

/**
 * 스킬 타입별 문서 골격. 실제로 그 구조를 보인 스킬에서 추출한다.
 *
 * 2026-08-20 구조 변경: 4종의 `sectionFlow`가 앞뒤로 같은 줄을 반복하고 있었다
 * (frontmatter · 제목 · 개요 · "언제 쓰나"가 네 번씩). 공통 부분을
 * `commonSpine`에 한 번만 두고, 여기에는 **그 타입에서만 다른 본문**을 담는다.
 *
 * 왜 바꿨나: writing-skills 원문의 표준 섹션 순서(감사 W-06)는 "스킬 종류 하나"가
 * 아니라 **종류와 무관한 한 벌의 순서**다. 4종 목록에 5번째로 끼워 넣으면 종류처럼
 * 보이는데 종류가 아니다. 공통/변형으로 쪼개야 그 순서가 들어갈 자리가 생긴다.
 *
 * 그 대조에서 **원문에는 있는데 4종 어디에도 없던 섹션 3개**가 드러났다 —
 * 빠른 참조(훑기용 표) · 흔한 실수 · 실제 성과(선택).
 */
export type StructureArchetype = {
	id: SkillArchetype;
	/** 표시용 이름 */
	label: string;
	/** 어떤 스킬에 이 구조가 맞는지 */
	whenToUse: string;
	/**
	 * 이 타입에서만 달라지는 본문 섹션들. 공통 앞뒤(`commonSpine`)는 여기 쓰지
	 * 않는다 — 같은 줄이 두 곳에 살면 한쪽만 고쳐져 조용히 어긋난다.
	 */
	bodySections: string;
	/** 이 구조를 실제로 보인 스킬들 */
	sourceIds: string[];
};

/**
 * 타입과 무관하게 모든 SKILL.md가 공유하는 앞뒤 뼈대.
 *
 * `{{본문}}` 자리에 각 타입의 `bodySections`가 들어간다. 순서는 writing-skills
 * 원문의 표준 골격(감사 W-06)을 따랐고, 우리 4종에 이미 있던 공통 줄과 합쳤다.
 *
 * 「완료 전 확인」을 2026-08-21에 보탰다. **근거는 실측이다** — 생성물 22건 중
 * 확인 절이 붙은 것이 8건뿐이었고, 붙은 쪽은 전부 `discipline` 골격이었다.
 * 그 골격의 `bodySections`에만 「완료 전 점검」이 있고 나머지 셋에는 없다.
 * **완료 검증 패턴을 baseline으로 올린 뒤에도 수치가 안 움직였다**(36% → 32%) —
 * 패턴은 무엇을 확인할지 알려주지만 **확인할 자리를 만들지는 못한다.**
 * 자리는 골격이 만든다.
 *
 * 뒤쪽 세 섹션에 조건을 단 이유: 원문은 셋 다 표준 섹션으로 규정하지만, 짧은
 * 스킬에 전부 넣으면 본문보다 목차가 길어진다. 코퍼스 머리말이 "작업이 단순하면
 * 구조도 단순하게"를 이미 지시하므로 그와 충돌하지 않게 조건을 붙였다.
 */
export const commonSpine = [
	"--- name(kebab-case) / description(트리거 조건 중심) ---",
	"# 제목",
	"## 개요 — 이 스킬이 무엇인지·핵심 원칙을 1~2문장",
	"## 언제 쓰나 — 증상·사용례 목록, 그리고 쓰지 말아야 할 때",
	"{{본문}}",
	"## 완료 전 확인 — 무엇이 있어야 '끝났다'고 말할 수 있는지. 돌려볼 것이 있으면 돌려서 결과를 읽고, 없으면 위에 적어둔 조건을 한 줄씩 짚는다",
	"## 빠른 참조 — 훑어볼 수 있는 표 (항목이 여럿일 때만)",
	"## 흔한 실수 — 무엇이 잘못되고 어떻게 고치나 (실패가 예상될 때만)",
	"## 실제 성과 — 구체적 결과 (선택. 실제 수치가 있을 때만)",
].join("\n");

/** 하나의 카테고리(예: 웹 디자인)에 대한 참고 코퍼스. */
export type ReferenceCategory = {
	/** 안정적 참조 키 (예: "design") */
	id: string;
	/** 표시용 이름 */
	label: string;
	/** true면 요청 종류와 무관하게 모든 생성에 항상 주입(공통 기본) */
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
		// 이 타입에서만 다른 것: 핵심 원칙을 굵게 박고, 예외는 사람에게 확인하게
		// 하고, 변명·위험 신호·완료 점검이라는 압박 저항 장치 셋을 둔다.
		bodySections: [
			"## 지켜야 할 원칙 — 핵심 원칙 한 줄을 굵게. 예외는 사람에게 확인",
			"## <핵심 절차> — 단계별로, 규칙마다 좋은 예/나쁜 예 쌍",
			"## 흔한 변명과 현실 — 표로 회피 논리를 미리 차단",
			"## 위험 신호 — '멈추고 다시 시작' 신호 목록",
			// 「완료 전 점검」은 2026-08-21에 commonSpine으로 올라갔다. 여기 두면
			// 같은 줄이 두 곳에 살게 된다.
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
		bodySections: [
			"## 단계 — 번호 있는 단계. 각 단계: (a) 맥락/질문 → (b) 산출 → (c) 반복.",
			"   단계 사이에 '다음으로 넘어가기 전 게이트'(승인/확인)를 명시",
			"## 자체 점검 — 자리표시자·모순·범위 이탈 점검",
			"## 마무리 — 완료 기준과 다음 단계",
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
		bodySections: [
			"## 선택지 — 정의할 항목(색·폰트·보이스 특성 등) 또는 선택지 목록",
			"## 적용 — 옵션을 먼저 보여주고 승인받은 뒤, 대비·가독성 등 제약을 지키며 전체 적용",
			"## 지켜야 할 조건 — 금지 조건(진부한 기본값, 금지 문구 등)",
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
		// 이 타입의 「개요」는 공통 뼈대의 것을 그대로 쓰되 쉬운 말 한 줄이면 된다.
		// "쉬운 말로 먼저"라는 지시 자체는 explanation 카테고리의 plain-words-first가
		// 든다 — 여기 다시 적으면 두 곳에 살게 된다.
		bodySections: [
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
		sources: [
			{
				id: "sp-tdd",
				name: "test-driven-development (superpowers)",
				author: "Jesse Vincent",
				url: "https://github.com/obra/superpowers/tree/main/skills/test-driven-development",
				license: "MIT",
				collectedAt: "2026-08-12",
			},
		],
		// 2026-08-19 2차 확장. 원문 감사
		// (docs/corpus/superpowers-test-driven-development.md) 결과를 반영했다.
		// 감사에서 드러난 핵심 셋:
		// ⓐ 이 스킬은 2파일이고 분량의 47.8%가 `writing-good-tests.md`인데
		//    코퍼스에는 그 파일에서 온 내용이 0개였다.
		// ⓑ 읽은 파일(SKILL.md) 안에서도 최대 섹션인 변명 표(21.5%)가 통째로
		//    빠졌다 — "하지 말라는 일"이 답이 아닌 것으로 걸러진 것으로 보인다.
		// ⓒ 이 소스는 "논증"이 죽은 첫 사례다. 변명 표 오른쪽 칸이 200~330자인데
		//    담을 자리가 없었다. 필드를 새로 만들지 않고 detail에 담기로 했다 —
		//    구조를 바꾸면 전 카테고리 렌더가 동시에 변해 대조군이 사라진다.
		patterns: [
			{
				id: "test-first",
				summary: "구현 코드보다 실패하는 테스트를 먼저 쓴다",
				detail:
					"실패를 눈으로 보지 못했으면 그 테스트가 옳은 것을 재는지 알 수 없다. 나중에 쓴 테스트는 이미 짠 코드에 편향돼 '무엇을 해야 하는가'가 아니라 '무엇을 하는가'만 검증하게 되고, 그런 테스트는 통과해도 아무것도 증명하지 못한다. 신규 기능·버그픽스·리팩터링·동작 변경 전부에 걸린다. **이 주기는 한 줄로 흐르지 않는다** — 되돌아오는 길이 셋이고, 그것을 빼고 '빨강 → 초록 → 리팩터' 세 단어로 요약하면 주기의 알맹이가 사라진다.",
				role: "workflow-step",
				kind: "artifact",
				// 2026-08-21 축 1(게이트를 절차에 연결). 순서와 되돌아감이 detail에
				// 산문으로 들어 있었다 — 머리말이 "순서를 detail에 다시 적지 않는다"로
				// 못박은 바로 그 형태다. 원문은 이 주기를 노드 6개 + 되돌아가는 화살표
				// 3개의 상태 기계로 그린다(감사 TD-06).
				flow: [
					{
						id: "red",
						label: "실패하는 테스트를 쓴다",
						patternId: "name-the-break",
						gate: "한 행동만 검증하고, 이름이 무엇을 재는지 말해주고, 가짜가 아닌 진짜를 실행할 것",
					},
					{
						id: "see-red",
						label: "실패를 눈으로 확인한다",
						patternId: "watch-it-fail-correctly",
						gate: "기능이 없어서 실패하는가 — 오타·설정 오류로 실패한 것이 아닌가",
						branches: [
							{ when: "엉뚱한 이유로 실패했으면", goto: "red" },
							{
								when: "실패하지 않았으면 테스트가 아무것도 안 재는 것이므로",
								goto: "red",
							},
						],
					},
					{
						id: "green",
						label: "통과시킬 최소 코드만 쓴다",
						patternId: "minimal-green",
					},
					{
						id: "see-green",
						label: "통과를 확인한다",
						patternId: "green-verification-gate",
						gate: "통과했는가 — 실패했다면 테스트가 아니라 코드를 고친다",
						branches: [{ when: "아직 실패하면", goto: "green" }],
					},
					{
						id: "refactor",
						label: "초록을 유지한 채 정리한다",
						branches: [{ when: "정리했으면 반드시", goto: "see-green" }],
					},
					{
						id: "next",
						label: "다음 행동으로 넘어간다",
						gate: "완료 점검을 과거형으로 통과했는가",
						branches: [{ when: "못 채운 항목이 있으면", goto: "red" }],
					},
				],
				exception:
					"버리는 프로토타입·생성된 코드·설정 파일은 예외로 둘 수 있다. 다만 예외로 할지는 혼자 정하지 말고 사람에게 묻는다.",
				// TD-18(최종 규칙 — 사람 파트너 승인 없이 예외 없음)은 위 exception이
				// 이미 같은 말을 하고 있어 패턴을 새로 만들지 않고 번호만 보탠다.
				auditIds: ["TD-01", "TD-02", "TD-04", "TD-06", "TD-18"],
				verifyHint:
					"주기를 '빨강→초록→리팩터' 직선으로만 적는지, 되돌아오는 길 셋이 살아 있는지",
				sourceIds: ["sp-tdd"],
			},
			{
				id: "watch-it-fail-correctly",
				summary:
					"실패를 눈으로 확인하는 단계에는 볼 것과 어긋났을 때의 행동이 붙는다",
				detail:
					"실패를 못 봤으면 그 테스트가 옳은 것을 재는지 알 수 없다. 그래서 이 단계는 건너뛸 수 없고, 확인할 것과 어긋났을 때 할 일이 함께 정해져 있어야 쓸모가 있다. 어긋났을 때가 빠지면 정작 무너지는 자리에 아무 지시가 없게 된다.",
				role: "verification",
				kind: "artifact",
				format: {
					sections: [
						"실패하는가 — 에러가 나는 것과는 다르다",
						"실패 메시지가 예상한 그대로인가",
						"기능이 없어서 실패하는가 — 오타 때문이 아니라",
					],
				},
				examples: [
					{
						polarity: "bad",
						text: "테스트가 그냥 통과했다 → 이미 있는 동작을 재고 있는 것이므로 테스트를 고친다",
					},
					{
						polarity: "bad",
						text: "실패가 아니라 에러가 났다 → 에러를 고쳐 제대로 실패할 때까지 다시 돌린다",
					},
				],
				auditIds: ["TD-08", "TD-02"],
				verifyHint:
					"확인 항목 셋과 어긋났을 때의 분기가 다 있는지, '실패를 확인한다' 한 줄로 끝나는지",
				sourceIds: ["sp-tdd"],
			},
			{
				id: "minimal-green",
				summary: "테스트를 통과시킬 최소 코드만 쓴다",
				detail:
					"아직 필요 없는 옵션·추상화·에러 처리를 미리 넣지 않는다. 통과한 뒤 정리 단계에서만 손본다. 좋은 예와 나쁜 예를 나란히 놓으면 경계가 분명해진다 — 시키는 일만 하는 코드와, 아직 아무도 요구하지 않은 설정 항목을 미리 받아두는 코드의 차이다.",
				role: "constraint",
				kind: "artifact",
				examples: [
					{
						polarity: "good",
						text: "세 번 재시도한다는 테스트에 맞춰, 세 번 돌고 마지막에 예외를 그대로 올리는 코드만 쓴다",
					},
					{
						polarity: "bad",
						text: "재시도 횟수·대기 방식·재시도 때 부를 콜백까지 옵션으로 미리 열어둔다 — 어느 것도 테스트가 요구하지 않았다",
					},
				],
				auditIds: ["TD-10"],
				sourceIds: ["sp-tdd"],
			},
			{
				id: "green-verification-gate",
				summary: "통과를 확인하는 단계에서는 테스트가 아니라 코드를 고친다",
				detail:
					"통과했다는 것만 보고 넘어가면 옆 테스트를 깨뜨린 채로 진행하게 된다. 그리고 여기서 실패했을 때 손대야 하는 쪽은 코드다 — 테스트를 고쳐 통과시키면 방금 세운 기준을 스스로 지운 것이 된다.",
				role: "verification",
				kind: "artifact",
				format: {
					sections: [
						"이 테스트가 통과하는가",
						"다른 테스트도 여전히 통과하는가",
						"출력이 깨끗한가 — 에러도 경고도 없이",
					],
				},
				examples: [
					{
						polarity: "bad",
						text: "실패하자 단언 값을 실제 결과에 맞춰 바꿔서 통과시킨다",
					},
				],
				auditIds: ["TD-09"],
				verifyHint:
					"'실패하면 테스트가 아니라 코드를 고친다'가 명시되는지, 다른 테스트 확인이 들어가는지",
				sourceIds: ["sp-tdd"],
			},
			{
				id: "name-the-break",
				summary:
					"테스트를 쓰기 전에 '무엇이 망가지면 이게 실패하는지'를 먼저 말한다",
				detail:
					"테스트는 특정한 고장을 잡으려고 존재한다. 그 고장을 말로 못 하면 그 테스트는 아직 잡을 것이 없는 상태다. 기대값도 손으로 구해야 한다 — 검사 대상 코드로 기대값을 만들면 그 코드가 무슨 짓을 해도 통과한다.",
				role: "workflow-step",
				kind: "artifact",
				flow: [
					{
						id: "name",
						label:
							"테스트 본문을 쓰기 전에, 이 테스트를 실패시킬 제품 코드 변경을 말한다",
						branches: [
							{
								when: "말 못 하겠다 — 눈에 보이는 동작을 기준으로 다시 설계한다",
								goto: "name",
							},
							{
								when: "'원문 글자가 바뀜'뿐이다 — 산출물을 실행해 결과를 단언한다",
								goto: "name",
							},
							{
								when: "의도적으로 정한 값만 실패시킨다 — 그 값에 기대는 동작을 대신 잰다",
								goto: "name",
							},
						],
					},
					{ id: "write", label: "그제서야 테스트 본문을 쓴다" },
				],
				examples: [
					{
						polarity: "bad",
						text: "같은 함수로 기대값과 실제값을 둘 다 만들어 비교한다 — 언제나 통과한다",
					},
					{
						polarity: "bad",
						text: "상수 값 자체를 단언한다 — 값을 바꾸기로 결정할 때만 실패하고 진짜 버그는 놓친다",
					},
					{
						polarity: "good",
						text: "손으로 계산한 결과를 그대로 적어 비교한다",
					},
				],
				auditIds: ["TD-20", "TD-21", "TD-22", "TD-25"],
				verifyHint:
					"'무엇이 망가지면 실패하는가'를 먼저 묻는 절차가 있는지, 기대값을 손으로 구하라는 규정이 있는지",
				sourceIds: ["sp-tdd"],
			},
			{
				id: "one-behavior-per-test",
				summary: "테스트 하나는 한 가지 행동만 검증한다",
				detail:
					"이름에 '그리고'가 들어가면 쪼갠다. 이름은 무슨 동작인지를 설명해야 하고, 단언은 실제 코드의 동작을 향해야 한다.",
				role: "constraint",
				kind: "artifact",
				format: {
					sections: [
						"최소성 — 한 가지만. 이름에 '그리고'가 있으면 쪼갠다",
						"명확성 — 이름이 동작을 설명한다",
						"의도 노출 — 원하는 사용법이 드러난다",
					],
				},
				examples: [
					{
						polarity: "bad",
						text: "이메일과 도메인과 공백까지 한 테스트에서 검사한다",
					},
					{ polarity: "bad", text: "이름이 '테스트1'이다" },
				],
				auditIds: ["TD-07", "TD-11"],
				sourceIds: ["sp-tdd"],
			},
			{
				id: "no-mock-assertions",
				summary: "가짜 객체 자체를 단언하지 않는다",
				detail:
					"가짜를 향한 단언은 가짜가 있으면 통과하고 없으면 실패할 뿐, 정작 검사하려는 코드에 대해서는 아무 말도 하지 않는다. 가짜로 바꿀 때는 진짜가 하던 일을 먼저 파악하고 느리거나 바깥에 나가는 부분만 바꾼다 — 테스트가 기대는 동작까지 삼켜버리면 테스트는 통과하고 실제 연결은 깨진다.",
				role: "constraint",
				kind: "artifact",
				examples: [
					{
						polarity: "bad",
						text: "화면에 '가짜 사이드바'라는 표시가 있는지 확인한다",
					},
					{
						polarity: "good",
						text: "실제로 렌더된 내비게이션 영역이 있는지 확인한다",
					},
					{
						polarity: "bad",
						text: "설정 파일 기록까지 함께 삼키는 층을 통째로 가짜로 바꾼다 — 그 기록을 읽는 검사가 무력해진다",
					},
					{
						polarity: "good",
						text: "느린 서버 기동만 가짜로 바꾸고 설정 기록은 진짜로 남긴다",
					},
				],
				auditIds: ["TD-26", "TD-27", "TD-29"],
				verifyHint: "가짜를 어느 층에서 쓰는지에 대한 기준이 있는지",
				sourceIds: ["sp-tdd"],
			},
			{
				id: "rationalization-table",
				summary: "지키기 싫어질 때의 속말을 미리 적고 각각을 되받는다",
				detail:
					"이것은 표를 어떤 모양으로 쓸지를 담는다. 실제로 넣을 변명은 주제마다 다르고 debug-rationalization-defaults · review-rationalizations · skill-testing-rationalization-defaults가 각각 든다. 금지문은 규칙을 어긴 뒤에야 걸리지만, 변명 표는 어기기 직전의 생각을 걸어낸다. 왼쪽 칸에는 회피하는 사람의 속말을 1인칭 그대로 적고, 오른쪽 칸에는 예의나 원칙이 아니라 인과로 되받는다. 되받는 말이 짧으면 설득력이 없으므로 이 칸은 길어도 된다. 예를 들어 '나중에 테스트하겠다'에는 이렇게 답한다 — 나중에 쓴 테스트는 즉시 통과하고, 즉시 통과는 아무것도 증명하지 못한다. 실패하는 것을 본 적이 없으니 그 테스트가 버그를 잡을 수 있다는 증거가 없다. '이미 여러 시간 썼는데 지우는 건 낭비'에는 이렇게 답한다 — 그 시간은 어느 쪽을 골라도 이미 썼다. 남은 선택은 믿을 수 있는 것을 다시 만드는 쪽과, 믿지 못할 것을 안고 가는 쪽뿐이다.",
				role: "output-rule",
				kind: "artifact",
				format: {
					count: "실제로 나올 법한 변명 6~11개",
					sections: [
						"왼쪽 — 회피하는 속말을 1인칭 그대로",
						"오른쪽 — 왜 그 생각이 틀렸는지 인과로",
					],
				},
				auditIds: ["TD-12", "TD-03"],
				verifyHint:
					"변명 표가 있는지, 오른쪽 칸이 '안 됩니다' 수준으로 짧게 끝나지 않는지",
				sourceIds: ["sp-tdd"],
			},
			{
				id: "red-flags-list",
				summary: "위험 신호는 사유 없이 짧게 늘어놓고 끝에 처방 한 줄을 붙인다",
				detail:
					"이것은 목록을 어떤 모양으로 쓸지를 담는다. 실제로 넣을 신호는 주제마다 다르고 debug-red-flag-defaults · label-misuse-red-flags가 각각 든다. 변명 표와 같은 항목이 여기 다시 나와도 된다. 하는 일이 다르기 때문이다 — 변명 표는 설득하고, 이 목록은 알아채게 한다. 그래서 여기서는 사유를 달지 않고 신호만 짧게 적고, 목록 끝에 '이 중 하나라도 해당하면 무엇을 하라'는 처방을 한 줄로 붙인다.",
				role: "constraint",
				kind: "artifact",
				format: {
					count: "짧은 신호 8~13개 + 닫는 처방 한 줄",
				},
				examples: [
					{ polarity: "bad", text: "테스트보다 코드를 먼저 썼다" },
					{ polarity: "bad", text: "테스트가 처음부터 통과했다" },
					{ polarity: "bad", text: "왜 실패했는지 설명하지 못한다" },
					{ polarity: "bad", text: "이번만 예외로 하자고 생각하고 있다" },
				],
				auditIds: ["TD-13", "TD-34"],
				verifyHint: "위험 신호 목록이 있는지, 닫는 처방 한 줄이 붙는지",
				sourceIds: ["sp-tdd"],
			},
			{
				id: "past-tense-completion-checklist",
				summary: "완료 점검은 전부 과거형으로 묻고, 다 못 채우면 되돌아간다",
				detail:
					"'~하라'가 아니라 '~했는가'로 물어야 점검이 된다. 앞으로 할 일 목록은 읽고 넘어갈 수 있지만, 이미 한 일을 묻는 질문은 안 한 것을 숨길 수 없다. 목록 끝에 못 채웠을 때의 처분을 반드시 붙인다 — 처분이 없으면 체크리스트가 장식이 된다.",
				role: "verification",
				kind: "artifact",
				format: {
					count: "과거형 질문 6~8개 + 못 채웠을 때의 처분 한 줄",
					template: "- [ ] ~했는가 / ~를 확인했는가",
				},
				examples: [
					{ polarity: "good", text: "각 테스트가 실패하는 것을 봤는가" },
					{
						polarity: "good",
						text: "각 테스트가 예상한 이유로 실패했는가 — 오타가 아니라",
					},
					{ polarity: "bad", text: "모든 함수를 테스트할 것" },
				],
				auditIds: ["TD-15"],
				verifyHint: "체크 항목이 과거형인지, 다 못 채웠을 때의 처분이 있는지",
				sourceIds: ["sp-tdd"],
			},
			{
				id: "mutation-check",
				summary: "끝내기 전에 코드를 일부러 망가뜨려 보고 잡히는지 본다",
				detail:
					"머릿속으로 제품 코드를 하나씩 망가뜨려 보고, 각각에 대해 실패하는 테스트가 최소 하나는 있어야 한다. 아무 테스트도 못 잡는 고장이 있다면 그 동작은 지금 무방비이거나, 테스트가 무엇을 하든 통과하는 상태다.",
				role: "verification",
				kind: "artifact",
				format: {
					sections: [
						"값이나 인자를 틀리게 바꿨을 때",
						"분기를 반대로 탔을 때",
						"상태 변경이나 바깥으로 나가는 동작을 빠뜨렸을 때",
						"아무것도 안 하고 기본값만 돌려줄 때",
						"빈 값·0·권한 없음·형식 오류를 검사하지 않을 때",
					],
				},
				auditIds: ["TD-32"],
				verifyHint: "일부러 망가뜨려 보는 점검이 들어가는지",
				sourceIds: ["sp-tdd"],
			},
		],
	},
	{
		id: "debugging",
		label: "디버깅",
		sources: [
			{
				id: "sp-systematic-debugging",
				name: "systematic-debugging (superpowers)",
				author: "Jesse Vincent",
				url: "https://github.com/obra/superpowers/tree/main/skills/systematic-debugging",
				license: "MIT",
				collectedAt: "2026-08-12",
			},
			{
				id: "sp-verification-before-completion",
				name: "verification-before-completion (superpowers)",
				author: "Jesse Vincent",
				url: "https://github.com/obra/superpowers/tree/main/skills/verification-before-completion",
				license: "MIT",
				collectedAt: "2026-08-12",
			},
		],
		// 2026-08-19 2차 확장. 원문 감사 2편
		// (docs/corpus/superpowers-systematic-debugging.md,
		//  docs/corpus/superpowers-verification-before-completion.md) 반영.
		// 감사에서 드러난 핵심 셋:
		// ⓐ systematic-debugging은 11파일인데 코퍼스가 읽은 것은 SKILL.md뿐이고,
		//    스킬 본문의 67.3%가 미반영이었다. 특히 방어층·조건 대기 두 기법
		//    문서는 대응 패턴이 아예 없었다.
		// ⓑ verification-before-completion은 단일 파일 3.6KB인데도 표 3개와
		//    대조쌍 5벌이 전부 사라졌다 — 전수 조회는 필요조건이지 충분조건이
		//    아니라는 증거다.
		// ⓒ 판정 규칙이 관찰 소견으로 약해지는 소실 유형을 여기서 처음 봤다
		//    (원문 "3회면 멈춰라" → 코퍼스 "~일 가능성이 크다").
		//
		// 기존 3패턴의 id는 유지하고 내용만 되살렸다. 과거 실험 기록이 패턴 id로
		// 결과를 가리키고 있어서, id를 갈면 그 기록을 되짚을 수 없게 된다.
		//
		// 회귀 테스트 항목(red-green-regression-proof)이 testing이 아니라 여기
		// 있는 이유: 원문 verification-before-completion에 쓰인 항목이라 출처
		// 계보를 따랐다. testing 쪽에서는 이 항목을 다시 쓰지 않는다.
		patterns: [
			{
				// 원문 44–47줄의 4단계 순서와 "각 단계를 끝내야 다음"(감사 SD-07)은
				// 지금까지 어느 패턴에도 담기지 않았다. 감사 문서의 「잃은 것」 표에
				// 5번 항목으로 "부분" 복원이라 적혀 있고, SD-07을 참조하는 패턴이
				// 코퍼스에 0개다. 각 단계의 내용은 이미 개별 패턴으로 있으므로
				// 여기서는 순서와 넘어가는 조건만 담는다.
				//
				// 2단계(패턴 분석)에는 대응 패턴이 없다 — 감사 9번이 미복원(✗)이다.
				// 그래서 patternId 없이 label만 둔다.
				//
				// 3회 규칙(SD-20, 조사 단계로 되돌아감)은 여기 넣지 않는다.
				// 원문에서 별개 규칙이고 three-fix-rule이 이미 담고 있다.
				id: "four-phase-debugging-order",
				summary: "디버깅은 네 단계이고, 각 단계를 끝내야 다음으로 간다",
				detail:
					"단계를 건너뛰거나 뒤섞으면 원인을 모르는 채 고치게 된다. 각 단계에서 무엇을 할지는 해당 패턴에 적혀 있고, 여기서 정하는 것은 순서와 넘어가는 조건이다.",
				role: "workflow-step",
				kind: "artifact",
				flow: [
					{
						id: "investigate",
						label: "근본 원인 조사",
						patternId: "root-cause-first",
						gate: "증거를 다 모으기 전에는 고칠 방법을 제안하지 않는다",
						// 조사가 끝나지 않는 것을 막는 유일한 출구다. 이 갈래가 없으면
						// "원인을 못 찾았다"가 절차 안에 자리가 없어, 결국 조사를
						// 슬그머니 그만두고 증상을 고치게 된다.
						branches: [
							{
								when: "정해둔 조건을 다 채웠는데도 원인이 안 나오면",
								goto: "stop",
							},
						],
					},
					{
						id: "analyze",
						label: "패턴 분석 — 작동하는 예를 찾아 차이를 전부 나열한다",
						patternId: "compare-with-working-example",
						gate: "차이가 전부 적히기 전에는 넘어가지 않는다",
					},
					{
						id: "hypothesize",
						label: "가설을 하나 세우고 검증한다",
						patternId: "single-hypothesis",
						gate: "가설이 맞았는지 틀렸는지가 갈리기 전에는 넘어가지 않는다",
						branches: [
							{ when: "고쳐졌다", goto: "implement" },
							{ when: "안 고쳐졌다", goto: "hypothesize" },
						],
					},
					{
						id: "implement",
						label: "고친다",
						patternId: "failing-test-before-fix",
						gate: "문제가 사라지고 테스트가 통과해야 끝난 것이다",
					},
					{
						id: "harden",
						label: "값이 지나는 모든 층에 검사를 넣는다",
						patternId: "defense-in-depth-layers",
						gate: "원인을 찾은 뒤에만 한다 — 원인을 모른 채 층을 두르면 증상만 덮인다",
					},
				],
				auditIds: ["SD-07", "SD-16", "SD-25"],
				verifyHint:
					"단계 이름만 나열하는지, 넘어가는 조건과 되돌아가는 길이 붙는지",
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				id: "root-cause-first",
				summary: "증상이 아니라 근본 원인부터 조사한다",
				detail:
					"조사를 끝내기 전에는 고칠 방법을 제안하지 않는다. 증상을 건드리면 원인은 그대로 남아 같은 문제가 다시 나온다.",
				role: "workflow-step",
				kind: "artifact",
				flow: [
					{
						id: "read-error",
						label: "에러 메시지를 끝까지 읽는다 — 줄 번호·경로·오류 코드까지",
					},
					{
						id: "reproduce",
						label: "일관되게 재현한다 — 정확한 단계는 무엇이고 매번 재현되는가",
						branches: [
							{
								when: "재현이 안 된다 — 추측하지 말고 자료를 더 모은다",
								goto: "reproduce",
							},
						],
					},
					{
						id: "recent-changes",
						label:
							"최근 바뀐 것을 확인한다 — 변경 이력, 새로 들어온 의존성, 설정",
					},
					{
						id: "instrument",
						label: "여러 조각으로 이뤄진 시스템이면 경계마다 증거를 남긴다",
						patternId: "instrument-component-boundaries",
					},
					{
						id: "trace-back",
						label: "잘못된 값이 어디서 왔는지 거슬러 올라간다",
					},
				],
				auditIds: ["SD-01", "SD-02", "SD-08", "SD-09", "SD-10"],
				verifyHint: "단계 이름만 나열하는지, 단계마다 무엇을 볼지가 붙는지",
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				// 감사 8-3: "압박 저항 장치가 통째로 빠졌다". 원문에서 SD-05·06·22·24를
				// 합치면 SKILL.md의 27.7%인데 코퍼스에는 하나도 없었다. 이 스킬은 문서
				// 전체가 "급할 때 무너지는 것"을 막으려고 쓰였으므로, 그 장치가 빠지면
				// 남는 것은 절차뿐이고 절차는 급할 때 제일 먼저 버려진다.
				//
				// 값 리터럴을 옮긴다 — 소스가 MIT로 확인됐다(정책 B 등급 1).
				id: "debug-applies-to",
				summary: "이 절차를 어떤 문제에 쓰는지 목록으로 정해둔다",
				detail:
					"'기술적 문제'라고만 적으면 각자 다르게 읽는다. 종류를 열거해두면 '이건 해당 안 되겠지'로 빠져나갈 자리가 줄어든다.",
				role: "trigger",
				kind: "artifact",
				format: {
					count: "6종",
					sections: [
						"테스트 실패",
						"운영 중인 버그",
						"예상 밖의 동작",
						"성능 문제",
						"빌드 실패",
						"연동 문제",
					],
				},
				auditIds: ["SD-04"],
				verifyHint:
					"적용 대상을 열거하는지, '기술적 문제 전반'으로 뭉뚱그리는지",
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				id: "debug-especially-when",
				summary: "건너뛰고 싶어지는 상황을 오히려 '반드시 쓸 때'로 못박는다",
				detail:
					"절차는 여유 있을 때가 아니라 급할 때 필요하다. 그런데 급할 때가 정확히 건너뛰고 싶어지는 때다. 그래서 '이럴 때는 특히'를 따로 적어 그 순간을 미리 가로막는다.",
				role: "trigger",
				kind: "artifact",
				format: {
					count: "5종",
					sections: [
						"시간에 쫓길 때 — 급하면 찍어보고 싶어진다",
						"'딱 하나만 빨리 고치면 될 것' 같아 보일 때",
						"이미 여러 번 고쳐봤을 때",
						"직전 수정이 안 먹혔을 때",
						"문제를 온전히 이해하지 못했을 때",
					],
				},
				auditIds: ["SD-05"],
				verifyHint: "'특히 이럴 때'가 따로 있는지, 적용 대상 목록만 있는지",
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				// 형식(사유 없이 짧게 + 끝에 처방 한 줄)은 testing의 red-flags-list가
				// 담는다. 여기는 그 형식에 넣을 실제 값이다 — banned-phrases와
				// banned-phrase-defaults의 관계와 같다.
				id: "debug-red-flag-defaults",
				summary: "위험 신호는 행동이 아니라 '떠오른 생각' 그대로 적는다",
				detail:
					"'추측하지 마라'처럼 행동으로 적으면 이미 추측하고 있는 사람은 자기가 해당된다고 못 느낀다. 머릿속에 떠오른 문장을 그대로 적어두면 그 문장을 떠올리는 순간 걸린다. 아래는 원문이 제시한 열한 가지다. **이것은 값이고 목록을 어떤 모양으로 쓸지는 red-flags-list가 담는다 — 둘을 함께 볼 것.**",
				role: "constraint",
				kind: "artifact",
				format: { count: "11항목 + 닫는 처방 한 줄" },
				examples: [
					{ polarity: "bad", text: '"일단 빨리 고치고 조사는 나중에"' },
					{ polarity: "bad", text: '"X를 한번 바꿔보고 되는지 보자"' },
					{ polarity: "bad", text: '"여러 군데 고치고 테스트를 돌리자"' },
					{ polarity: "bad", text: '"테스트는 건너뛰고 내가 직접 확인하지"' },
					{ polarity: "bad", text: '"아마 X일 테니 그것부터 고치자"' },
					{
						polarity: "bad",
						text: '"온전히 이해하진 못했지만 이러면 될 것 같다"',
					},
					{
						polarity: "bad",
						text: '"참고한 방식은 X라는데 나는 다르게 응용하겠다"',
					},
					{
						polarity: "bad",
						text: '"주요 문제는 이것들입니다 — 조사 없이 고칠 것부터 늘어놓는다"',
					},
					{
						polarity: "bad",
						text: "값이 어디서 왔는지 따라가기 전에 해결책부터 내놓는다",
					},
					{
						polarity: "bad",
						text: '"한 번만 더 고쳐보자" — 이미 두 번 이상 시도한 뒤라면',
					},
					{
						polarity: "bad",
						text: "고칠 때마다 엉뚱한 곳에서 새 문제가 나온다",
					},
				],
				exception:
					"닫는 처방을 반드시 붙인다 — 하나라도 해당하면 멈추고 조사 단계로 돌아간다. 세 번 이상 실패했으면 구조를 의심한다",
				auditIds: ["SD-22"],
				verifyHint: "신호를 '생각의 형태'로 적는지, 끝에 처방 한 줄이 붙는지",
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				// 형식은 testing의 rationalization-table이 담는다. 여기는 값이다.
				// SD-06(건너뛰면 안 되는 때 3종 + 사유)이 이 표의 1·2행과 같은 내용이라
				// 별도 패턴으로 만들지 않고 여기에 함께 담는다.
				id: "debug-rationalization-defaults",
				summary: "절차를 건너뛸 때 나오는 변명과 그 각각에 대한 반박",
				detail:
					"아래는 원문이 표로 제시한 여덟 가지다. 반박은 예의나 원칙이 아니라 인과로 되받는다 — 그래야 급한 사람에게 통한다. **이것은 값이고 표를 어떤 모양으로 쓸지는 rationalization-table이 담는다 — 둘을 함께 볼 것.**",
				role: "output-rule",
				kind: "artifact",
				format: { count: "8행" },
				examples: [
					{
						polarity: "bad",
						text: '"간단한 문제라 절차까지는 필요 없다" — 간단한 문제에도 원인은 있다. 절차는 간단한 버그에서 오히려 빠르다',
					},
					{
						polarity: "bad",
						text: '"급한 상황이라 절차 밟을 시간이 없다" — 체계적으로 하는 쪽이 찍어보며 헤매는 것보다 빠르다',
					},
					{
						polarity: "bad",
						text: '"일단 이것부터 해보고 그다음 조사하자" — 첫 수정이 방식을 정한다. 처음부터 제대로 한다',
					},
					{
						polarity: "bad",
						text: '"수정이 되는지 확인하고 테스트는 나중에 쓰겠다" — 확인 안 된 수정은 남지 않는다. 테스트를 먼저 써야 증명된다',
					},
					{
						polarity: "bad",
						text: '"여러 개를 한꺼번에 고치면 시간이 절약된다" — 무엇이 들었는지 가릴 수 없고 새 버그를 만든다',
					},
					{
						polarity: "bad",
						text: '"참고할 코드가 너무 길어서 요령껏 응용하겠다" — 반쯤 이해한 채로 쓰면 버그가 확정된다. 끝까지 읽는다',
					},
					{
						polarity: "bad",
						text: '"문제가 보이니 바로 고치겠다" — 증상이 보이는 것과 원인을 아는 것은 다르다',
					},
					{
						polarity: "bad",
						text: '"한 번만 더 고쳐보자" — 두 번 이상 실패했다면 구조 문제다. 또 고치지 말고 방식을 의심한다',
					},
				],
				auditIds: ["SD-06", "SD-24"],
				verifyHint: "변명을 1인칭 속말로 적는지, 반박이 인과로 되받는지",
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				id: "say-what-you-dont-know",
				summary: "모르는 것은 모른다고 적고 넘어가지 않는다",
				detail:
					"아는 척하고 넘어간 자리가 나중에 원인 불명으로 돌아온다. 모른다고 말하는 것 자체를 절차의 한 항목으로 둔다.",
				role: "constraint",
				kind: "artifact",
				format: {
					count: "4항목",
					sections: [
						"'X를 모르겠다'고 그대로 말한다",
						"아는 척하지 않는다",
						"도움을 요청한다",
						"더 조사한다",
					],
				},
				auditIds: ["SD-17"],
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				// 원문은 실행 스크립트(find-polluter.sh)로 제공한다. 산출물에 스크립트를
				// 넣을 수는 없지만 기법 자체는 옮길 수 있다 — 감사 3-5의 판단.
				id: "bisect-to-find-polluter",
				summary: "무엇이 다른 것을 망가뜨리는지는 반씩 갈라 좁힌다",
				detail:
					"따로 돌리면 통과하는데 같이 돌리면 깨지는 경우, 범인을 눈으로 찾으려 들면 개수만큼 걸린다. 절반씩 잘라 어느 쪽에 있는지만 확인하면 훨씬 적은 횟수로 좁혀진다.",
				role: "workflow-step",
				kind: "artifact",
				adapted: true,
				flow: [
					{ id: "confirm", label: "혼자 돌렸을 때는 통과하는지 먼저 확인한다" },
					{ id: "half", label: "후보를 절반으로 나눠 앞쪽만 함께 돌린다" },
					{
						id: "narrow",
						label: "깨지는 쪽을 골라 다시 절반으로 나눈다",
						branches: [{ when: "후보가 하나 남을 때까지", goto: "narrow" }],
					},
					{
						id: "found",
						label: "남은 하나가 원인이다 — 거기서 조사를 시작한다",
					},
				],
				auditIds: ["SD-32"],
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				// 원문 Phase 2. 감사 「잃은 것」 표 9번에 미복원(✗)으로 적혀 있었고,
				// 2026-08-20 A/B에서 이 단계가 생성물에 나오는지가 6 대 0으로 갈렸다.
				// 그때는 four-phase-debugging-order의 label 한 줄뿐이었고 원문의 네
				// 항목은 없었다 — 그 네 항목을 여기서 채운다.
				//
				// 값 리터럴을 옮긴다: 소스가 MIT로 확인됐다(정책 B 등급 1).
				id: "compare-with-working-example",
				summary: "정상 동작하는 사례를 찾아 문제 사례와 끝까지 비교한다",
				detail:
					"문제가 난 쪽만 들여다보면 무엇이 정상인지 기준이 없다. 잘 되는 쪽과 나란히 놓아야 차이가 보인다.",
				role: "workflow-step",
				kind: "artifact",
				flow: [
					{ id: "find", label: "같은 종류인데 정상 동작하는 사례를 찾는다" },
					{
						id: "read",
						label: "참조할 구현을 끝까지 읽는다",
						gate: "훑어보고 넘어가지 않는다 — 훑으면 다른 점이 아니라 비슷한 점만 눈에 들어온다",
					},
					{
						id: "list",
						label: "두 쪽의 차이를 하나도 빠짐없이 적는다",
						gate: "'이건 상관없을 것'이라고 미리 거르지 않는다",
					},
					{ id: "deps", label: "그 코드가 무엇에 기대고 있는지 파악한다" },
				],
				auditIds: ["SD-13"],
				verifyHint:
					"정상 사례를 찾는 행동이 있는지, 훑기 금지와 '상관없을 것' 금지가 붙는지",
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				id: "instrument-component-boundaries",
				summary:
					"여러 조각을 거치는 문제는 경계마다 자국을 남겨 어디서 깨지는지부터 본다",
				detail:
					"어느 조각이 문제인지 모르는 채로 고치기 시작하면 멀쩡한 곳을 계속 건드리게 된다. 증거 없이 조각을 고르면 그냥 찍는 것이다.",
				role: "workflow-step",
				kind: "artifact",
				format: {
					sections: [
						"무엇이 들어왔는지 기록",
						"무엇이 나갔는지 기록",
						"설정·환경이 넘어갔는지 확인",
						"그 층의 상태 확인",
					],
				},
				flow: [
					{
						id: "mark",
						label: "경계마다 위 네 가지를 기록으로 남긴다",
					},
					{ id: "collect", label: "한 번 돌려 증거를 모은다" },
					{ id: "locate", label: "증거로 깨진 조각을 특정한다" },
					{ id: "dig", label: "그 조각만 조사한다" },
				],
				examples: [
					{
						polarity: "good",
						text: "층마다 값이 있는지 찍어보니 앞 단계까지는 넘어오고 다음 단계에서 비어 있었다 — 그 사이가 범인이다",
					},
					{
						polarity: "bad",
						text: "제일 그럴듯한 조각부터 고쳐본다",
					},
				],
				auditIds: ["SD-11", "SD-12"],
				verifyHint: "증거를 먼저 모으고 나서 조각을 고르는 순서가 있는지",
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				id: "trace-backward-to-source",
				summary: "에러가 난 자리가 아니라 잘못된 값이 처음 생긴 자리를 고친다",
				detail:
					"문제는 대개 깊은 곳에서 터지지만 원인은 훨씬 위에 있다. 터진 자리에서 고치면 증상만 가려진다. 한 단계씩 거슬러 올라가 값이 처음 생긴 곳을 찾고 거기서 고친다. 손으로 못 따라가겠으면 위험한 동작 직전에 기록을 남긴다 — 실패한 뒤가 아니라 그 전에 남겨야 한다.",
				role: "workflow-step",
				kind: "artifact",
				format: {
					sections: [
						"증상을 본다",
						"직접 원인이 되는 지점을 찾는다",
						"그것을 부른 곳을 확인한다",
						"계속 위로 올라간다",
						"값이 처음 생긴 자리를 찾는다",
					],
				},
				exception:
					"더 이상 거슬러 올라갈 수 없으면 터진 자리에서 고치되, 대신 층마다 방어를 함께 넣는다. 기록을 남길 때는 걸러지거나 묻힐 수 있는 경로를 쓰지 않는다 — 남긴 것이 화면에 안 보이면 안 남긴 것과 같다.",
				auditIds: ["SD-28", "SD-29", "SD-30", "SD-31", "SD-33", "SD-35"],
				verifyHint:
					"거슬러 올라가는 단계가 있는지, 막다른 길일 때의 처리가 있는지",
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				id: "single-hypothesis",
				summary: "가설은 한 번에 하나만 세우고 가장 작은 변경으로 시험한다",
				detail:
					"'Y 때문에 X가 원인이라고 본다'처럼 분명하게 적어 둔다. 시험은 가장 작은 변경으로, 한 번에 한 가지만 바꿔서 한다. 여러 개를 한꺼번에 바꾸면 무엇이 들었는지 가릴 수 없다. 안 맞았으면 기존 수정 위에 하나 더 얹는 것이 아니라 새 가설을 세운다. 모르는 것이 있으면 아는 척하지 말고 모른다고 말한다.",
				role: "workflow-step",
				kind: "artifact",
				examples: [
					{
						polarity: "good",
						text: "설정이 다음 단계로 넘어가지 않아서 실패한다고 본다 — 넘어가는 값 하나만 바꿔 확인한다",
					},
					{
						polarity: "bad",
						text: "짚이는 세 곳을 한꺼번에 고치고 돌려본다",
					},
					{
						polarity: "bad",
						text: "가설이 빗나갔는데 그 수정을 남겨둔 채 다음 수정을 얹는다",
					},
				],
				auditIds: ["SD-14", "SD-15", "SD-16"],
				verifyHint:
					"가설을 하나로 제한하는지, 빗나갔을 때 덧붙이지 말라는 규정이 있는지",
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				id: "failing-test-before-fix",
				summary: "고치기 전에 그 문제를 재현하는 실패 테스트를 먼저 만든다",
				detail:
					"테스트가 없으면 고쳤다는 것을 증명할 방법이 없고 나중에 같은 문제가 돌아와도 알 수 없다. 가장 단순하게 재현되는 형태로 만들고, 자동화할 수 있으면 자동화하되 마땅한 틀이 없으면 일회용 스크립트라도 만든다. 그리고 고칠 때는 한 번에 하나만 고친다 — 온 김에 다른 것을 손보거나 정리 작업을 묶지 않는다.",
				role: "workflow-step",
				kind: "artifact",
				auditIds: ["SD-18", "SD-19"],
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				id: "three-fix-rule",
				summary: "고친 횟수를 세고, 세 번째부터는 구조를 의심한다",
				detail:
					"같은 곳을 계속 고치는데 안 먹히면 가설이 빗나간 것이 아니라 구조가 틀린 것이다. 구조 문제일 때의 표시가 따로 있다 — 고칠 때마다 엉뚱한 곳에서 새로운 얽힘이 나오고, 제대로 고치려면 대공사가 필요해 보이고, 하나 고치면 다른 데서 증상이 생긴다.",
				role: "constraint",
				kind: "artifact",
				flow: [
					{
						id: "count",
						label: "수정이 안 먹혔으면 먼저 몇 번째인지 센다",
						branches: [
							{ when: "3회 미만", goto: "back-to-investigation" },
							{ when: "3회 이상", goto: "suspect-structure" },
						],
					},
					{
						id: "back-to-investigation",
						label: "조사 단계로 돌아가 새로 알게 된 것을 반영한다",
						patternId: "root-cause-first",
						branches: [{ when: "반영해 다시 조사를 시작했다", goto: "done" }],
					},
					{
						id: "suspect-structure",
						label:
							"멈추고 구조를 의심한다 — 그 논의 없이 네 번째 수정을 시도하지 않는다",
					},
				],
				auditIds: ["SD-20", "SD-21"],
				verifyHint:
					"'가능성이 크다'는 소견으로 적는지, 세고 멈추는 규칙으로 적는지",
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				id: "defense-in-depth-layers",
				summary: "원인을 찾은 뒤에는 값이 지나는 모든 층에 검사를 넣는다",
				detail:
					"한 곳만 막으면 다른 경로나 가짜 객체가 그 검사를 비껴간다. 층마다 잡아내는 것이 다르기 때문에 넷을 다 두는 것이 낫다. 넣은 다음에는 각 층을 일부러 통과시켜 보고 다음 층이 잡는지 확인한다 — 확인까지가 이 작업이다.",
				role: "workflow-step",
				kind: "artifact",
				format: {
					sections: [
						"들어오는 자리 — 딱 봐도 잘못된 입력을 여기서 거른다",
						"처리하는 자리 — 이 작업에 말이 되는 값인지 본다",
						"환경 — 특정 상황에서 위험한 동작을 막는다",
						"기록 — 나중에 따져볼 수 있게 맥락을 남긴다",
					],
				},
				auditIds: ["SD-37", "SD-38", "SD-39", "SD-40", "SD-42"],
				verifyHint: "층이 네 개로 나뉘는지, 우회 시험까지 규정하는지",
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				id: "partner-signals",
				summary:
					"같이 일하는 사람이 흘리는 말을 '내가 틀리고 있다'는 신호로 읽는다",
				detail:
					"위험 신호 목록이 자기 생각을 잡는다면 이건 바깥에서 오는 신호를 잡는다. 이미 판단이 흐려진 상태에서도 작동한다는 것이 이 장치의 값이다. 이런 말이 나오면 하던 것을 멈추고 조사 단계로 돌아간다.",
				role: "constraint",
				kind: "artifact",
				examples: [
					{
						polarity: "bad",
						text: "'그게 안 일어나고 있다는 거야?' — 확인하지 않고 그렇겠거니 했다는 뜻",
					},
					{
						polarity: "bad",
						text: "'그걸 보여줄 수 있어?' — 증거를 남겼어야 했다는 뜻",
					},
					{
						polarity: "bad",
						text: "'추측 그만' — 이해하기 전에 고치려 든다는 뜻",
					},
					{
						polarity: "bad",
						text: "'우리 막힌 거야?' — 접근 자체가 통하지 않고 있다는 뜻",
					},
				],
				auditIds: ["SD-23"],
				verifyHint: "바깥에서 오는 신호를 다루는 항목이 있는지",
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				id: "condition-based-waiting",
				summary:
					"얼마나 걸릴지 찍어서 기다리지 말고 원하는 상태가 됐는지를 본다",
				detail:
					"시간을 찍어서 기다리면 빠른 환경에서는 통과하고 느릴 때 깨진다. 기다려야 할 것은 시간이 아니라 조건이다. 다만 금지만 해두면 쓸 수 없는 규칙이 되므로, 시간을 재는 동작 자체를 확인해야 하는 경우를 위해 예외 조건을 함께 적는다.",
				role: "constraint",
				kind: "artifact",
				format: {
					count: "인자 3개 — 확인할 조건 · 무엇을 기다리는지 설명 · 시간 한도",
					sections: [
						"조건이 만족될 때까지 확인을 되풀이한다",
						"언제까지 기다릴지 한도를 두고, 넘으면 무엇을 기다렸는지가 담긴 오류를 낸다",
						"확인할 값은 매번 새로 읽는다 — 미리 담아두면 낡은 값을 본다",
					],
				},
				options: [
					{
						value: "어떤 일이 일어나기를 기다릴 때",
						character: "그 일이 기록에 남았는지 확인한다",
					},
					{
						value: "어떤 상태가 되기를 기다릴 때",
						character: "상태 값이 원하는 값과 같아졌는지 확인한다",
					},
					{
						value: "개수가 차기를 기다릴 때",
						character: "모인 개수가 기준을 넘었는지 확인한다",
					},
					{
						value: "파일이 생기기를 기다릴 때",
						character: "그 경로에 파일이 있는지 확인한다",
					},
					{
						value: "조건이 여럿일 때",
						character:
							"여러 조건을 함께 확인한다 — 하나만 보고 넘어가지 않는다",
					},
				],
				examples: [
					{
						polarity: "bad",
						text: "정해둔 시간만큼 기다린 다음 값을 읽는다 — 느린 환경에서 아직 준비되지 않은 값을 읽는다",
					},
					{
						polarity: "good",
						text: "값이 준비됐는지를 조건으로 걸고, 참이 될 때까지 기다린 다음 읽는다",
					},
					{
						polarity: "bad",
						text: "확인을 지나치게 자주 되풀이한다 — 짧은 간격을 두는 것으로 충분하다",
					},
				],
				exception:
					"시간에 따라 달라지는 동작 자체를 확인할 때는 시간을 정해 기다려도 된다. 단 세 가지를 지킨다 — 먼저 시작 조건을 기다리고, 아는 주기에 근거해 값을 정하고, 왜 그 값인지 적는다.",
				auditIds: [
					"SD-43",
					"SD-44",
					"SD-45",
					"SD-46",
					"SD-47",
					"SD-48",
					"SD-49",
				],
				verifyHint: "금지만 적는지, 예외 조건까지 같이 적는지",
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				id: "no-root-cause-exit",
				summary: "원인이 없다고 결론 내릴 때의 조건을 정해둔다",
				detail:
					"정말로 환경이나 타이밍 탓인 경우가 있다. 다만 그렇게 결론 내리려면 조사를 다 마쳤어야 하고, 무엇을 확인했는지 남겨야 하고, 그 상황을 견디는 처리를 넣어야 하고, 다음에 다시 볼 수 있게 기록을 켜둬야 한다. 대부분의 '원인 없음'은 조사가 덜 된 것이다.",
				role: "verification",
				kind: "artifact",
				format: {
					sections: [
						"조사를 끝까지 마쳤다",
						"무엇을 확인했는지 적어 둔다",
						"그 상황을 견디는 처리를 넣는다 — 재시도, 시간 제한, 안내 문구",
						"다음에 다시 볼 수 있게 기록을 남긴다",
					],
				},
				auditIds: ["SD-26"],
				verifyHint: "조사를 끝내도 되는 조건이 규정되는지",
				sourceIds: ["sp-systematic-debugging"],
			},
			{
				id: "red-green-regression-proof",
				summary: "재발 방지 테스트는 고친 것을 되돌려 실패시켜 봐야 증명된다",
				detail:
					"테스트를 썼고 통과한다는 것만으로는 그 테스트가 문제를 잡을 수 있는지 알 수 없다. 고친 부분을 잠시 되돌려 실제로 실패하는지 보고, 다시 되살려 통과하는지 본다. 이 왕복이 없으면 재발 방지 테스트를 만들었다는 말은 증명되지 않은 주장이다.",
				role: "verification",
				kind: "artifact",
				flow: [
					{ id: "write", label: "테스트를 쓴다" },
					{ id: "run1", label: "돌린다 — 통과해야 한다" },
					{ id: "revert", label: "고친 것을 잠시 되돌린다" },
					{
						id: "run2",
						label: "돌린다 — 반드시 실패해야 한다",
						gate: "여기서 실패하지 않으면 그 테스트는 문제를 잡지 못한다",
					},
					{ id: "restore", label: "고친 것을 되살린다" },
					{ id: "run3", label: "돌린다 — 다시 통과해야 한다" },
				],
				auditIds: ["V-16"],
				verifyHint: "되돌려 실패를 확인하는 단계가 있는지",
				sourceIds: ["sp-verification-before-completion"],
			},
		],
	},
	{
		id: "planning",
		label: "계획·설계",
		sources: [
			{
				id: "sp-brainstorming",
				name: "brainstorming (superpowers)",
				author: "Jesse Vincent",
				url: "https://github.com/obra/superpowers/tree/main/skills/brainstorming",
				license: "MIT",
				collectedAt: "2026-08-12",
			},
			{
				id: "sp-writing-plans",
				name: "writing-plans (superpowers)",
				author: "Jesse Vincent",
				url: "https://github.com/obra/superpowers/tree/main/skills/writing-plans",
				license: "MIT",
				collectedAt: "2026-08-12",
			},
		],
		// 2026-08-18 복원. 원문 감사 2편(docs/corpus/superpowers-brainstorming.md,
		// superpowers-writing-plans.md) 결과를 반영했다.
		//
		// 가장 큰 발견: brainstorming의 중심 장치인 "요청을 세 종류로 분류해 절차의
		// 무게를 바꾼다"(원문의 11%)가 통째로 빠져 있었다. 그래서 이 카테고리는
		// 결과적으로 "모든 요청에 가장 무거운 절차를 붙여라"고 말하고 있었다 —
		// 코퍼스 서문의 "작업이 단순하면 구조도 단순하게"와 정면으로 어긋난 상태다.
		//
		// writing-plans 쪽은 형식의 이름만 남고 칸이 사라진 경우다. 계획 문서
		// 머리말·작업 형식·자기 검토가 전부 없었다.
		patterns: [
			{
				id: "classify-before-process",
				summary: "일을 시작하기 전에 요청의 무게부터 분류한다",
				detail:
					"세 갈래 중 어디인지 먼저 정하고, 그 분류를 말로 밝힌다 — 사용자가 뒤집을 수 있어야 하기 때문이다. 분류에 따라 만드는 문서와 다음 단계가 달라진다. 둘 사이에서 망설이면 무거운 쪽을 고른다. 그리고 이 톱니는 한 방향이다: 하다가 숨은 복잡도가 드러나면 멈추고 말한 뒤 위 단계로 올린다. 내려가는 일은 없다.",
				role: "workflow-step",
				kind: "artifact",
				options: [
					{
						value: "확인용 (가벼움)",
						character:
							"'되나?'를 알아보는 것. 결과물은 답이지 코드가 아니다. 2~3문장으로 무엇을 해볼지 말하고 동의를 받은 뒤, 가장 싸게 확인하고 권고로 보고한다. 만든 것은 버릴 것으로 표시한다",
					},
					{
						value: "한정된 변경 (중간)",
						character:
							"이미 있는 흐름을 손보는 것. 친숙함이 아니라 '바꿀 흐름이 지금 여기 있는가'로 판정한다 — 없으면 한정된 변경이 아니다. 필요한 것만 묻고 짧은 설계를 대화로 보여준 뒤 멈춘다. 별도 문서는 만들지 않는다",
					},
					{
						value: "구조를 세우는 일 (무거움)",
						character:
							"새 프로젝트, 새 하위 갈래, 남이 의존하는 접점을 바꾸는 것. 질문 → 접근안 → 절 단위 설계 → 문서로 남기기 → 검토까지 전 과정을 밟는다",
					},
				],
				auditIds: ["B-02", "B-03", "B-04", "B-05", "B-06", "B-08"],
				verifyHint:
					"생성된 SKILL.md가 모든 요청에 같은 절차를 붙이는지, 요청 크기에 따라 갈래를 나누는지",
				sourceIds: ["sp-brainstorming"],
			},
			{
				id: "plan-writing-flow",
				summary:
					"범위를 가르고 → 파일 구조부터 그리고 → 작업으로 쪼개고 → 스스로 점검한 뒤 넘긴다",
				detail:
					"계획 쓰기의 규정이 열댓 개 패턴으로 흩어져 있어, **어느 것이 어느 것보다 먼저인지가 어디에도 없었다.** 특히 두 자리가 순서에 걸려 있다. 하나는 파일 구조다 — 작업을 정의하기 전에 그려야 한다. 거기서 분해가 확정되기 때문이고, 작업부터 쪼개고 나중에 구조를 그리면 이미 나눈 것에 구조를 끼워 맞추게 된다. 다른 하나는 자기 점검이다 — 남에게 넘기기 전에 직접 하는 것이지 검토자를 부르는 단계가 아니다.",
				role: "workflow-step",
				kind: "artifact",
				// 2026-08-21 축 1(게이트를 절차에 연결).
				//
				// 원문이 실제로 규정한 순서만 담았다(감사 W-04·05·13·14·16).
				// 자기 점검의 종료 규칙(W-14)이 특히 값이 크다 — "찾으면 인라인으로
				// 고치고 재검토는 없다"가 검토 루프가 무한히 늘어나는 것을 막는다.
				// 그 한 줄이 없으면 점검 단계에 종료 조건이 없어진다.
				flow: [
					{
						id: "scope",
						label: "범위를 가른다",
						gate: "독립적인 하위 시스템이 여럿이면 계획을 나눈다 — 계획 하나는 그 자체로 돌아가는 것을 내놓아야 한다",
					},
					{
						id: "structure",
						label: "파일 구조를 그린다",
						patternId: "file-structure-first",
						gate: "여기서 분해가 확정된다. 작업을 정의하기 전이어야 한다",
					},
					{
						id: "tasks",
						label: "작업 단위로 쪼갠다",
						patternId: "bite-sized-tasks",
						gate: "경계는 남이 하나만 반려할 수 있는 지점에서 긋는다",
					},
					{
						id: "self-review",
						label:
							"직접 점검한다 — 명세를 다 덮었나 · 자리표시자가 남았나 · 타입이 앞뒤로 맞나",
						patternId: "plan-self-review",
						gate: "문제를 찾으면 그 자리에서 고친다. **재검토 라운드를 다시 돌지 않는다**",
					},
					{
						id: "user-gate",
						label: "사용자에게 읽어달라고 요청하고 멈춘다",
						patternId: "user-review-gate",
						branches: [{ when: "변경 요청이 오면", goto: "self-review" }],
					},
					{
						id: "how-to-run",
						label: "어떻게 실행할지 사용자가 고르게 한다",
						patternId: "let-user-pick-execution",
					},
				],
				auditIds: ["W-04", "W-05", "W-13", "W-14", "W-16"],
				sourceIds: ["sp-writing-plans"],
			},
			{
				id: "let-user-pick-execution",
				summary: "계획을 어떻게 실행할지는 사용자가 고른다",
				detail:
					"계획을 다 쓴 뒤 곧바로 실행에 들어가지 않는다. 맡겨서 돌릴지, 같이 한 단계씩 밟을지를 사용자가 고르게 한다. 어느 쪽이 맞는지는 계획의 성질이 아니라 **사용자가 지금 얼마나 개입하고 싶은가**로 갈리는데, 그건 물어보지 않으면 알 수 없다.",
				role: "workflow-step",
				// 실행 방식을 고르게 하는 것은 진행 방식의 문제라 완성된 계획 문서에는
				// 흔적이 남지 않는다.
				kind: "process",
				auditIds: ["W-16"],
				sourceIds: ["sp-writing-plans"],
			},
			{
				id: "approval-gate-never-shrinks",
				summary: "절차는 줄여도 승인 받는 지점은 줄이지 않는다",
				detail:
					"할 일 목록 하나든 설정값 하나든, 무엇을 하려는지 말하고 승인을 받기 전에는 만들기 시작하지 않는다. 설계는 두 문장이어도 되지만 승인은 생략되지 않는다. 간단함에 따라 줄어드는 것은 산출물이지 승인이 아니다 — '간단해서 물어볼 것도 없다'고 넘긴 자리에서 헛수고가 가장 많이 난다.",
				role: "constraint",
				kind: "artifact",
				auditIds: ["B-01"],
				verifyHint:
					"'작은 작업은 바로 진행'류의 예외가 생겼는지. 그 예외가 생기면 이 패턴이 뒤집힌 것",
				sourceIds: ["sp-brainstorming"],
			},
			{
				id: "label-misuse-red-flags",
				summary: "가벼운 쪽으로 분류하고 싶어질 때 나오는 말을 적어둔다",
				detail:
					"분류 장치를 만들면 반드시 따라오는 실패가 있다 — 일을 줄이려고 가벼운 라벨을 집는 것이다. 그 생각을 그대로 적고 반박을 붙여 둔다. **이것은 값이고 목록을 어떤 모양으로 쓸지는 red-flags-list가 담는다 — 둘을 함께 볼 것.**",
				role: "constraint",
				kind: "artifact",
				examples: [
					{
						polarity: "bad",
						text: '"이건 너무 간단해서 설계가 필요 없어" → 간단하다는 건 설계가 짧다는 뜻이지 없다는 뜻이 아니다',
					},
					{
						polarity: "bad",
						text: '"한정된 변경이라고 하고 문서는 건너뛰자" → 일을 건너뛰려고 라벨을 집는 그 행동이 곧 의심의 증거다. 무거운 쪽을 고른다',
					},
					{
						polarity: "bad",
						text: '"설계가 뻔하니까 읽는 동안 시작해야지" → 관문은 설계의 길이가 아니라 승인이다. 보여주고, 예라는 말을 들을 때까지 멈춘다',
					},
					{
						polarity: "bad",
						text: '"이런 종류의 앱은 잘 아니까 한정된 변경이야" → 판정 기준은 내 친숙함이 아니라 저장소의 상태다',
					},
					{
						polarity: "bad",
						text: '"커졌지만 거의 다 했으니 다시 분류할 필요는 없지" → 숨은 복잡도는 단계를 올린다. 멈추고 말한다',
					},
				],
				auditIds: ["B-09"],
				sourceIds: ["sp-brainstorming"],
			},
			{
				id: "design-before-code",
				summary: "구현 전에 설계를 먼저 합의한다",
				detail:
					"맥락을 먼저 보고, 질문은 한 번에 하나씩 한 메시지에 하나만 한다(가능하면 골라 답할 수 있는 형태로, 열린 질문도 괜찮다). 묻는 것은 목적·제약·성공 기준이다. 그다음 접근안 2~3개를 장단점과 함께 내놓되 추천안을 앞에 세우고 왜 그것인지 밝힌다. 필요 없는 기능은 각 안에서 인정사정없이 걷어낸다.",
				role: "workflow-step",
				kind: "artifact",
				auditIds: ["B-13", "B-14"],
				sourceIds: ["sp-brainstorming"],
			},
			{
				id: "design-section-sizing",
				summary: "설계는 절로 나눠 복잡도에 비례해 쓰고, 절마다 확인받는다",
				detail:
					"분량을 정해두지 않으면 '적절히'가 되고 그러면 항상 길어진다. 한 절을 보여준 뒤 여기까지 맞는지 묻고 다음으로 간다.",
				role: "output-rule",
				kind: "artifact",
				format: {
					count: "간단한 절은 몇 문장, 복잡한 절도 200~300단어까지",
					sections: [
						"전체 구조",
						"구성 요소",
						"자료의 흐름",
						"잘못됐을 때의 처리",
						"검증 방법",
					],
				},
				auditIds: ["B-15"],
				sourceIds: ["sp-brainstorming"],
			},
			{
				id: "unit-boundary-questions",
				summary: "쪼갠 단위가 제대로 나뉘었는지 질문으로 판정한다",
				detail:
					"'응집도를 높여라' 같은 말은 지킬 수도 어길 수도 없다. 답할 수 있는 질문으로 바꿔두면 판정이 된다. 답이 막히면 경계를 다시 그어야 한다는 뜻이다.",
				role: "verification",
				kind: "artifact",
				format: {
					sections: [
						"이 단위가 무엇을 하나",
						"어떻게 쓰나",
						"무엇에 기대고 있나",
						"안을 들여다보지 않고도 무엇을 하는지 알 수 있나",
						"안을 바꿔도 쓰는 쪽이 안 깨지나",
					],
				},
				auditIds: ["B-16"],
				sourceIds: ["sp-brainstorming"],
			},
			{
				id: "decompose-oversized-request",
				summary: "요청이 여러 갈래면 세부를 묻기 전에 먼저 알린다",
				detail:
					"나눠야 할 것의 세부를 다듬는 데 질문을 쓰지 않는다. 갈래가 여럿인 채로 세부를 파고들면 어느 갈래의 답인지 모르는 답이 쌓인다.",
				role: "workflow-step",
				kind: "artifact",
				format: {
					sections: [
						"독립된 조각은 무엇인지",
						"서로 어떤 관계인지",
						"어떤 순서로 만들지",
					],
				},
				flow: [
					{
						id: "tell",
						label: "서로 독립된 갈래가 여러 개면 즉시 그 사실을 말한다",
					},
					{ id: "split", label: "나눌 때는 위 세 가지를 함께 정한다" },
					{
						id: "first",
						label:
							"첫 조각만 정상 흐름으로 진행한다 — 조각마다 설계·계획·구현을 각각 한 벌씩 돈다",
					},
				],
				examples: [
					{
						polarity: "bad",
						text: '"대화·파일 보관·결제·통계가 있는 플랫폼" 요청에 곧바로 화면 구성을 묻기 시작한다',
					},
					{
						polarity: "good",
						text: '"네 갈래가 서로 독립적이라 한 번에 다루기 어렵습니다. 나눠서 첫 조각부터 진행할까요?"',
					},
				],
				auditIds: ["B-11", "B-12"],
				sourceIds: ["sp-brainstorming"],
			},
			{
				id: "respect-existing-patterns",
				summary: "이미 있는 코드에서는 관례를 먼저 읽는다",
				detail:
					"바꾸자고 제안하기 전에 지금 구조를 살펴보고 기존 방식을 따른다. 이번 일에 실제로 걸리는 문제(너무 커진 파일, 흐릿한 경계)는 설계에 포함해 고치되, 무관한 정리 작업은 제안하지 않는다.",
				role: "constraint",
				kind: "artifact",
				exception:
					"고치려는 파일 자체가 이미 감당하기 어려울 만큼 커졌다면 나누는 것을 설계에 넣어도 된다",
				auditIds: ["B-17", "W-06"],
				sourceIds: ["sp-brainstorming", "sp-writing-plans"],
			},
			{
				id: "spec-self-review",
				summary: "설계 문서를 쓴 뒤 새 눈으로 네 가지를 점검한다",
				detail:
					"쓴 직후에는 자기 글의 빈 곳이 안 보인다. 점검 항목을 정해두고 한 번 훑는다. 문제를 찾으면 그 자리에서 고친다.",
				role: "verification",
				kind: "artifact",
				format: {
					sections: [
						"빈칸 — '나중에', '정하기로 함', 미완성 절, 뭉뚱그린 요구사항",
						"내부 모순 — 절끼리 어긋나는 곳, 구조 설명과 기능 설명의 불일치",
						"범위 — 한 번의 작업으로 감당되는 크기인가",
						"두 갈래로 읽히는 곳 — 있으면 하나를 골라 못박는다",
					],
				},
				exception:
					"고친 뒤 다시 검토할 필요는 없다 — 고치고 넘어간다. 이 규칙이 없으면 검토가 끝없이 늘어난다",
				auditIds: ["B-19"],
				sourceIds: ["sp-brainstorming"],
			},
			{
				id: "user-review-gate",
				summary: "자기 점검을 통과한 뒤 사용자에게 읽어달라고 요청하고 멈춘다",
				detail:
					"자기 점검과 사용자 검토는 다른 관문이다. 문서를 남긴 자리를 알려주고, 답을 기다린다. 고쳐달라는 말이 오면 고친 뒤 점검을 다시 돌린다. 승인 전에는 다음 단계로 넘어가지 않는다.",
				role: "verification",
				kind: "artifact",
				format: {
					template:
						"설계 문서를 <경로>에 남겼습니다. 다음 단계로 넘어가기 전에 읽어보시고 고칠 부분이 있으면 알려주세요.",
				},
				auditIds: ["B-20"],
				sourceIds: ["sp-brainstorming"],
			},
			{
				id: "assume-low-context-reader",
				summary: "'도메인을 거의 모르는 유능한 개발자'가 읽는다고 가정",
				detail:
					"읽는 사람이 이 코드베이스도, 우리가 쓰는 도구도 거의 모르고 좋은 검증 설계도 잘 모른다고 가정한다. 그래서 어느 파일을 건드리는지, 코드, 검증 방법, 참고할 문서까지 실제 세부를 적는다. 도구 지식은 설명하고 일반 지식은 설명하지 않는다 — 이 가정이 무엇을 생략해도 되는지의 판정 기준이 된다.",
				role: "output-rule",
				kind: "artifact",
				auditIds: ["W-01", "W-02"],
				sourceIds: ["sp-writing-plans"],
			},
			{
				id: "file-structure-first",
				summary: "작업을 나누기 전에 파일 구조부터 그린다",
				detail:
					"어떤 파일을 만들고 고칠지, 각각 무엇을 맡는지 먼저 적는다. 분해가 확정되는 자리가 여기이고, 이 구조가 곧 작업 나누기의 근거가 된다.",
				role: "workflow-step",
				kind: "artifact",
				format: {
					sections: [
						"경계와 접점이 분명한 단위로 나눈다 — 파일 하나에 역할 하나",
						"크고 여러 일을 하는 파일보다 작고 집중된 파일을 택한다",
						"함께 바뀌는 것은 함께 둔다 — 기술 계층이 아니라 역할로 나눈다",
						"기존 코드에서는 그곳의 방식을 따른다",
					],
				},
				auditIds: ["W-05", "W-06"],
				sourceIds: ["sp-writing-plans"],
			},
			{
				id: "plan-header-fields",
				summary: "계획 문서는 정해진 머리말로 시작한다",
				detail:
					"머리말이 없으면 계획만 떠돌고 근거가 된 설계 문서와 끊긴다. 계획은 설계로부터 논증되므로 설계가 계획과 함께 따라다녀야 하고, 실행하는 사람은 둘 다 읽는다.",
				role: "output-rule",
				kind: "artifact",
				format: {
					sections: [
						"목표 — 무엇을 만드는지 한 문장",
						"구조 — 접근 방식 2~3문장",
						"쓰는 기술 — 핵심 도구와 라이브러리",
						"근거 문서 — 이 계획이 구현하는 설계 문서의 위치",
						"전역 제약 — 프로젝트 전체에 걸리는 요구사항을 한 줄에 하나씩, 원문의 값을 그대로 옮겨 적는다",
					],
					template:
						"목표: 한 문장 | 구조: 2~3문장 | 쓰는 기술: 목록 | 근거 문서: 경로 | 전역 제약: 한 줄에 하나",
				},
				auditIds: ["W-08"],
				verifyHint:
					"생성된 SKILL.md가 '계획 문서를 쓴다'에서 멈추는지, 머리말에 무엇이 들어가는지까지 적는지",
				sourceIds: ["sp-writing-plans"],
			},
			{
				id: "task-file-list",
				summary: "작업마다 건드릴 파일을 세 종류로 적는다",
				detail:
					"경로는 정확히 적는다. 고치는 파일은 줄 범위까지 적어야 실행하는 사람이 찾아 헤매지 않는다.",
				role: "output-rule",
				kind: "artifact",
				format: {
					sections: [
						"만들 파일 — 정확한 경로",
						"고칠 파일 — 정확한 경로와 줄 범위",
						"검증할 파일 — 테스트 파일 경로",
					],
				},
				auditIds: ["W-09"],
				sourceIds: ["sp-writing-plans"],
			},
			{
				id: "task-interfaces-block",
				summary: "작업마다 '받는 것'과 '내주는 것'을 적는다",
				detail:
					"이것은 '잘게 쪼개라'의 짝이다. 쪼개면 조각 사이의 약속이 사라지는데, 실행하는 사람은 자기 작업만 본다. 옆 작업이 쓰는 이름과 형태를 알 수 있는 통로가 이 칸뿐이다. 이름과 타입을 정확히 적는다.",
				role: "output-rule",
				kind: "artifact",
				format: {
					sections: [
						"받는 것 — 앞선 작업에서 가져다 쓰는 것, 정확한 형태로",
						"내주는 것 — 뒤 작업이 기대는 것, 정확한 이름·인자·반환 형태로",
					],
				},
				auditIds: ["W-10"],
				verifyHint:
					"작업을 쪼개라는 지시만 있고 조각 사이 약속을 적으라는 지시가 없으면 이 패턴이 안 실린 것",
				sourceIds: ["sp-writing-plans"],
			},
			{
				id: "bite-sized-tasks",
				summary: "계획은 2~5분짜리 독립 작업 단위로 쪼갠다",
				detail:
					"한 단계는 하나의 행동이다. 코드가 필요한 단계에는 실제 코드를 적고, 실행할 명령과 기대하는 결과(실패인지 통과인지)를 함께 적는다.",
				role: "workflow-step",
				kind: "artifact",
				flow: [
					{ id: "write-check", label: "검증부터 쓴다" },
					{ id: "see-fail", label: "실패하는지 확인한다" },
					{ id: "minimal", label: "최소한으로 구현한다" },
					{ id: "see-pass", label: "통과하는지 확인한다" },
					{ id: "save", label: "저장한다" },
				],
				format: {
					template:
						"- [ ] 단계 N: 무엇을 한다 / 실행: <명령> / 기대: 실패 또는 통과",
				},
				auditIds: ["W-07", "W-11"],
				sourceIds: ["sp-writing-plans"],
			},
			{
				id: "task-boundary-by-reviewer",
				summary: "작업 경계는 '남이 하나만 반려할 수 있는 지점'에서 긋는다",
				detail:
					"작업 하나는 자기 검증 주기를 갖는 가장 작은 덩어리다. 설정·구성·뼈대 만들기·문서 같은 곁일은 그것이 필요한 작업 안으로 접어 넣고, 검토하는 사람이 하나는 반려하고 그 옆은 승인할 수 있는 자리에서만 쪼갠다. 작업은 그 자체로 확인 가능한 결과물로 끝난다.",
				role: "constraint",
				kind: "artifact",
				auditIds: ["W-15"],
				sourceIds: ["sp-writing-plans"],
			},
			{
				id: "no-placeholder-strings",
				summary: "계획에 쓰면 안 되는 문장을 그대로 적어 금지한다",
				detail:
					"이것들은 계획의 실패다. 추상적으로 '구체적으로 쓰라'고 하면 자기가 위반 중인지 모르지만, 문장을 못박아 두면 검색으로 잡힌다.",
				role: "constraint",
				kind: "artifact",
				examples: [
					{ polarity: "bad", text: '"정하기로 함", "나중에", "세부는 추후"' },
					{
						polarity: "bad",
						text: '"적절한 에러 처리 추가" / "검증 추가" / "예외 상황 처리"',
					},
					{ polarity: "bad", text: '"위 내용의 검증 작성" (실제 코드 없이)' },
					{
						polarity: "bad",
						text: '"N번 작업과 비슷하게" — 코드를 다시 적는다. 읽는 사람이 순서대로 안 볼 수 있다',
					},
					{
						polarity: "bad",
						text: "어떻게 하는지 없이 무엇을 할지만 적은 단계",
					},
					{
						polarity: "bad",
						text: "어느 작업에서도 정의한 적 없는 이름·함수를 가져다 쓰기",
					},
				],
				auditIds: ["W-12"],
				sourceIds: ["sp-writing-plans"],
			},
			{
				id: "plan-self-review",
				summary: "계획을 다 쓴 뒤 세 가지를 직접 점검한다",
				detail:
					"남에게 맡기는 검토가 아니라 자기가 돌리는 점검이다. 특히 이름 어긋남은 실행 단계에서야 터지기 때문에 여기서 잡아야 한다.",
				role: "verification",
				kind: "artifact",
				format: {
					sections: [
						"빠진 요구사항 — 설계의 각 항목을 훑고, 그것을 구현하는 작업을 짚을 수 있는지 본다. 못 짚는 것을 적는다",
						"빈칸 훑기 — 금지 문장 목록을 검색해 고친다",
						"이름 일관성 — 뒤 작업에서 쓴 이름·형태가 앞 작업에서 정한 것과 맞는지 본다",
					],
				},
				examples: [
					{
						polarity: "bad",
						text: "3번 작업에서는 clearLayers()인데 7번 작업에서는 clearFullLayers()로 적혀 있다",
					},
				],
				exception:
					"고친 뒤 다시 검토하지 않는다 — 고치고 넘어간다. 빠진 요구사항을 찾으면 작업을 추가한다",
				auditIds: ["W-13", "W-14"],
				sourceIds: ["sp-writing-plans"],
			},
			{
				id: "plan-review-categories",
				summary: "남에게 계획 검토를 맡길 때 볼 것과 볼 정도를 함께 정한다",
				detail:
					"무엇을 볼지만 주고 어느 선까지 지적할지를 안 주면 표현 다듬기로 끝난다. 실제로 문제를 일으킬 것만 지적하게 하고, 그 외에는 통과시킨다.",
				role: "verification",
				kind: "artifact",
				format: {
					sections: [
						"완결성 — 빈칸, 미완성 작업, 빠진 단계",
						"설계 부합 — 설계의 요구사항을 덮는가, 범위가 부풀지 않았는가",
						"작업 나누기 — 경계가 분명한가, 단계가 실행 가능한가",
						"만들 수 있는가 — 이 계획만 보고 막히지 않고 진행할 수 있는가",
					],
					template:
						"판정: 통과 / 문제 있음 — 문제는 [위치]: [무엇] - [왜 중요]",
				},
				exception:
					"표현 다듬기, 취향, '있으면 좋은 것'은 지적 대상이 아니다. 심각한 공백이 없으면 통과시킨다",
				// 원문은 별도 검토자에게 넘기는 프롬프트 템플릿이다. 실행 환경 고유
				// 개념을 걷어내고 "검토를 맡길 때의 기준"으로 옮겼으므로 가공이다.
				adapted: true,
				auditIds: ["W-17", "W-18", "W-19"],
				sourceIds: ["sp-writing-plans"],
			},
		],
	},
	{
		id: "code-review",
		label: "코드 리뷰",
		sources: [
			{
				id: "sp-requesting-code-review",
				name: "requesting-code-review (superpowers)",
				author: "Jesse Vincent",
				url: "https://github.com/obra/superpowers/tree/main/skills/requesting-code-review",
				license: "MIT",
				collectedAt: "2026-08-12",
			},
		],
		// 2026-08-18 복원. 원문 감사(docs/corpus/superpowers-requesting-code-review.md)
		// 결과를 반영했다. 감사에서 드러난 핵심: 이 스킬은 2파일이고 분량의 66%가
		// `code-reviewer.md`에 있는데 코퍼스에는 그 파일에서 온 내용이 0개였다.
		// 없어진 것의 정체가 전부 "리뷰를 끝내는 조건"이라, F축(절차 무결성)이
		// code-review 시나리오에서 3.00 → 1.00으로 떨어진 것과 이어진다.
		//
		// kind 판정 주의: 감사의 kind는 "원문에서 그 지시가 무엇에 작용하는가"
		// 기준이고, 여기 kind는 "Tailor가 만든 SKILL.md에서 근거를 짚을 수 있는가"
		// 기준이다. 둘이 갈리는 항목은 개별 주석으로 사유를 남긴다.
		patterns: [
			{
				id: "review-early-often",
				summary: "자주, 일찍 리뷰한다",
				detail:
					"필수는 세 시점이다 — 작업 하나가 끝날 때마다, 주요 기능을 완성한 뒤, 본 줄기에 합치기 전. 여기에 선택 시점 셋이 더 있다: 막혔을 때(새 관점을 얻으려고), 구조를 크게 손보기 전(지금 상태를 기준선으로 잡으려고), 까다로운 버그를 고친 뒤. '간단한' 변경이라고 건너뛰지 않는다.",
				role: "trigger",
				kind: "artifact",
				auditIds: ["R-02", "R-03", "R-04"],
				sourceIds: ["sp-requesting-code-review"],
			},
			{
				id: "severity-with-definitions",
				summary: "심각도는 이름이 아니라 '무엇이 거기 들어가는지'로 정의한다",
				detail:
					"단계 이름만 정해두면 판정이 사람마다 갈린다. 각 단계에 들어갈 일의 종류를 미리 적어두면 판정이 목록 대조로 바뀐다.",
				role: "output-rule",
				kind: "artifact",
				options: [
					{
						value: "치명적 (반드시 고침)",
						character: "버그, 보안 문제, 데이터가 날아갈 위험, 기능이 깨진 것",
					},
					{
						value: "중요 (고쳐야 함)",
						character:
							"구조상의 문제, 빠진 기능, 부실한 에러 처리, 테스트가 비어 있는 곳",
					},
					{
						value: "사소 (있으면 좋음)",
						character: "코드 스타일, 더 빠르게 만들 여지, 문서 다듬기",
					},
				],
				auditIds: ["R-13"],
				verifyHint:
					"생성된 SKILL.md가 심각도 이름 3개만 나열하고 끝나는지, 각 단계에 무엇이 들어가는지까지 적는지",
				sourceIds: ["sp-requesting-code-review"],
			},
			{
				id: "review-request-flow",
				summary: "넘길 것을 닫고 → 훑고 → 판정하고 → 심각도 순으로 처리한다",
				detail:
					"리뷰를 요청하는 쪽과 하는 쪽의 규정이 각각 다른 패턴으로 흩어져 있어, **판정이 무엇을 끝낸 뒤에 오는 것인지가 어디에도 없었다.** 이 흐름이 그 자리를 잇는다. 리뷰를 한 번의 지적으로 여기지 않고, 넘기는 것을 닫는 데서 시작해 심각도 순 처리로 닫히는 한 벌로 본다.",
				role: "workflow-step",
				kind: "artifact",
				// 2026-08-21 축 1(게이트를 절차에 연결). merge-verdict-gate는 자기가
				// 게이트라고만 말할 뿐 무엇을 끝낸 뒤의 게이트인지가 없었다.
				//
				// **되돌아가는 길은 넣지 않았다.** "고친 뒤 다시 판정받는다"가 실제로는
				// 자연스러워 보이지만 원문에 그 규정이 없다. 원문에 없는 순서를 원 소스
				// 크레딧이 붙은 자리에 지어 넣지 않는다 — lint 규칙 8-e가 막으려는
				// 것이 정확히 이것이다(context-appropriate-theme 가필 사고).
				flow: [
					{
						id: "when",
						label: "리뷰를 걸 시점인지 본다",
						patternId: "review-early-often",
						gate: "작업 단위를 끝냈거나 · 주요 기능을 완료했거나 · 병합 직전이면 반드시 건다",
					},
					{
						id: "handoff",
						label: "리뷰하는 쪽에 넘길 것을 닫는다",
						patternId: "isolated-reviewer-context",
						gate: "정해진 네 가지만 넘긴다 — 이쪽 작업 대화의 내력은 넘기지 않는다",
					},
					{
						id: "check",
						label: "정해진 영역을 훑고 이슈를 적는다",
						patternId: "review-checklist-areas",
						gate: "이슈 한 건마다 필수 항목이 다 차 있는가",
					},
					{
						id: "verdict",
						label: "셋 중 하나로 판정하고 사유를 붙인다",
						patternId: "merge-verdict-gate",
					},
					{
						id: "act",
						label: "심각도 순으로 처리한다",
						patternId: "severity-ordered-fixes",
						gate: "치명적인 것은 즉시 · 중요한 것은 다음으로 넘어가기 전에",
					},
				],
				auditIds: ["R-03", "R-05", "R-07", "R-14"],
				sourceIds: ["sp-requesting-code-review"],
			},
			{
				id: "severity-ordered-fixes",
				summary: "피드백은 심각도 순으로 처리한다",
				detail:
					"치명적인 것은 즉시, 중요한 것은 다음 작업으로 넘어가기 전에, 사소한 것은 기록만 해두고 나중에 본다. 지적이 틀렸다고 판단되면 기술적 근거를 들어 반박한다 — 근거로는 실제로 동작한다는 것을 보이는 코드나 테스트를 제시하거나, 무슨 뜻인지 되묻는다.",
				role: "workflow-step",
				kind: "artifact",
				auditIds: ["R-07", "R-08"],
				sourceIds: ["sp-requesting-code-review"],
			},
			{
				id: "review-report-sections",
				summary: "리뷰 결과는 정해진 네 자리로 적는다",
				detail:
					"자리를 정해두지 않으면 지적만 늘어놓은 목록이 되고, 잘된 점도 최종 판정도 사라진다.",
				role: "output-rule",
				kind: "artifact",
				format: {
					sections: [
						"잘된 점 — 구체적으로",
						"이슈 — 심각도 3단계로 나눠서",
						"권고 — 코드·구조·절차 개선 제안",
						"판정 — 넘어가도 되는가 + 사유",
					],
				},
				auditIds: ["R-11"],
				verifyHint: "네 자리가 다 있는지, 특히 '잘된 점'과 '판정'이 있는지",
				sourceIds: ["sp-requesting-code-review"],
			},
			{
				id: "issue-required-fields",
				summary: "이슈 한 건은 네 가지를 다 적어야 성립한다",
				detail:
					"'왜 중요한가'를 필수 칸으로 두는 것이 핵심이다. 이 칸이 없으면 지적이 취향 문제와 구분되지 않는다.",
				role: "output-rule",
				kind: "artifact",
				format: {
					sections: [
						"어디 — 파일과 줄 번호",
						"무엇이 잘못됐나",
						"왜 중요한가",
						"어떻게 고치나 (뻔하지 않을 때)",
					],
					template: "파일:줄 — 무엇이 잘못됐고 / 왜 중요하고 / 어떻게 고치는지",
				},
				examples: [
					{
						polarity: "good",
						text: "search.ts:25 — 잘못된 날짜가 조용히 빈 결과로 처리됨. 사용자는 자료가 없다고 오해한다. 형식을 검사해 예시와 함께 오류를 낼 것.",
					},
					{
						polarity: "bad",
						text: "에러 처리를 개선하세요.",
					},
				],
				auditIds: ["R-12"],
				sourceIds: ["sp-requesting-code-review"],
			},
			{
				id: "merge-verdict-gate",
				summary: "끝에는 반드시 셋 중 하나로 판정한다",
				detail:
					"판정을 닫힌 선택지로 만들어 '대체로 괜찮아 보입니다'로 빠져나갈 길을 막는다. 사유는 한두 문장으로 짧게 붙인다.",
				role: "verification",
				kind: "artifact",
				format: {
					template: "판정: 넘어가도 됨 / 안 됨 / 고치고 나면 됨 — 사유 1~2문장",
				},
				options: [
					{ value: "넘어가도 됨", character: "지금 상태로 다음 단계로 간다" },
					{
						value: "안 됨",
						character: "구조나 방향이 어긋나 다시 만들어야 한다",
					},
					{
						value: "고치고 나면 됨",
						character: "지적한 것만 처리하면 되는 상태",
					},
				],
				auditIds: ["R-14"],
				verifyHint:
					"완료 조건이 문서에 있는지. 판정 없이 '검토한다'로 끝나면 이 패턴이 안 실린 것",
				sourceIds: ["sp-requesting-code-review"],
			},
			{
				id: "review-checklist-areas",
				summary: "무엇을 볼지 다섯 영역으로 나눠 적어둔다",
				detail:
					"영역을 나눠두지 않으면 눈에 먼저 띄는 것만 본다. 각 영역에 실제 질문을 두세 개씩 달아둔다.",
				role: "verification",
				kind: "artifact",
				format: {
					sections: [
						"요구사항 부합 — 계획대로인가, 달라진 부분은 개선인가 이탈인가, 빠진 기능은 없나",
						"코드 품질 — 역할 분리, 에러 처리, 타입 안전성, 성급하지 않은 중복 제거, 경계 상황",
						"구조 — 설계 판단, 확장성과 성능, 보안, 주변 코드와의 접합",
						"테스트 — 흉내가 아니라 실제 동작을 검증하나, 경계 상황, 통합 검증, 전부 통과하나",
						"출시 준비 — 자료 이전 방법, 이전 버전 호환, 문서, 눈에 띄는 버그",
					],
				},
				auditIds: ["R-15", "R-16", "R-17", "R-18", "R-19"],
				sourceIds: ["sp-requesting-code-review"],
			},
			{
				id: "praise-before-issues",
				summary: "잘된 점을 먼저 쓰되, 그 이유까지 문서에 적는다",
				detail:
					"예의 때문이 아니다 — 정확한 칭찬이 있어야 나머지 지적을 신뢰한다. 그리고 전부 치명적으로 매기지 않는다. 사소한 것을 치명적으로 올리면 심각도 구분 자체가 무의미해진다.",
				role: "constraint",
				kind: "artifact",
				auditIds: ["R-20"],
				sourceIds: ["sp-requesting-code-review"],
			},
			{
				id: "review-dos-and-donts",
				summary: "리뷰가 무너지는 다섯 가지를 문자열로 못박는다",
				detail:
					"추상적으로 '구체적으로 쓰라'고 하면 자기가 위반 중인지 모른다. 실제로 나오는 문장을 그대로 금지 목록에 넣으면 검색으로 잡힌다.",
				role: "constraint",
				kind: "artifact",
				examples: [
					{
						polarity: "bad",
						text: "확인도 안 하고 '괜찮아 보입니다'라고 쓰기",
					},
					{ polarity: "bad", text: "사소한 트집을 치명적으로 올리기" },
					{ polarity: "bad", text: "실제로 읽지 않은 코드에 의견 내기" },
					{
						polarity: "bad",
						text: "'에러 처리를 개선하세요' 같은 모호한 지적",
					},
					{ polarity: "bad", text: "명확한 판정을 피하고 얼버무리기" },
					{
						polarity: "good",
						text: "파일과 줄을 짚고, 왜 문제인지 말하고, 판정을 내린다",
					},
				],
				auditIds: ["R-21"],
				sourceIds: ["sp-requesting-code-review"],
			},
			{
				id: "review-rationalizations",
				summary: "리뷰를 건너뛸 때 나오는 생각을 미리 적어 반박해 둔다",
				detail:
					"금지는 규칙을 어긴 뒤에야 걸리지만, 변명을 적어두면 어기기 직전의 생각을 걸어낸다. 그래서 반박에는 사유가 붙어야 한다. **이것은 값이고 표를 어떤 모양으로 쓸지는 rationalization-table이 담는다 — 둘을 함께 볼 것.**",
				role: "constraint",
				kind: "artifact",
				examples: [
					{
						polarity: "bad",
						text: '"그냥 내가 변경 내용을 직접 훑어보면 되지" → 일을 끌고 가는 쪽이 직접 훑으면, 계속 진행하는 데 써야 할 여력을 거기서 태운다. 분리된 자리에 맡기면 결과만 돌아온다.',
					},
					{
						polarity: "bad",
						text: '"지금까지 대화를 통째로 줘야 이해하지" → 다듬은 맥락만 준다. 그래야 생각의 과정이 아니라 결과물을 본다.',
					},
					{
						polarity: "bad",
						text: '"간단하니까 이번엔 건너뛰자" / 치명적 지적을 무시하기 / 중요한 것을 안 고친 채 진행하기 / 타당한 지적과 말싸움하기',
					},
				],
				auditIds: ["R-09", "R-10"],
				sourceIds: ["sp-requesting-code-review"],
			},
			{
				id: "isolated-reviewer-context",
				summary: "리뷰하는 쪽에 넘기는 것은 네 가지로 닫는다",
				detail:
					"세션 전체가 아니라 이 네 가지만 넘겨 판단을 독립시킨다. 무엇을 넘길지 목록으로 못박아 두지 않으면 '맥락을 잘 정리해서 준다'는 말만 남는다.",
				role: "constraint",
				// 감사(9-4)는 위임 자체(R-01)를 process로 봤다. 그러나 "무엇을 넘길지"는
				// 생성된 SKILL.md에 목록으로 남으므로 우리 기준으로는 artifact다.
				kind: "artifact",
				format: {
					sections: [
						"무엇을 만들었는지 — 짧은 요약",
						"무엇을 해야 하는지 — 계획 또는 요구사항",
						"검토 범위의 시작 지점",
						"검토 범위의 끝 지점",
					],
				},
				// 원문은 base/head 커밋 SHA로 범위를 못박는다. git 작업이 아닌 스킬에도
				// 쓸 수 있게 "시작 지점 / 끝 지점"으로 옮겼으므로 가공에 해당한다.
				adapted: true,
				auditIds: ["R-05", "R-06"],
				sourceIds: ["sp-requesting-code-review"],
			},
			{
				id: "review-is-read-only",
				summary: "리뷰하는 동안에는 대상을 고치지 않는다",
				detail:
					"검토하는 자리에서 손을 대면 무엇이 원래 상태였는지 사라진다. 봐야 할 것을 따로 꺼내 보되, 검토 대상 자체는 그대로 둔다.",
				role: "constraint",
				kind: "artifact",
				// 원문은 작업 트리·HEAD·인덱스를 건드리지 말라는 git 특정 규정이다.
				// 도구에 매이지 않는 표현으로 옮겼으므로 가공이다.
				adapted: true,
				auditIds: ["R-22"],
				sourceIds: ["sp-requesting-code-review"],
			},
		],
	},
	{
		id: "baseline",
		label: "공통 기본 (모든 스킬)",
		alwaysApply: true,
		// 2026-08-20 채우기. 두 번째 출처는 별개 스킬이 아니라 systematic-debugging의
		// 제작 기록이다. 감사에서 D 갈래로 갈린 7개(SD-51~57)가 디버깅 내용이 아니라
		// "스킬을 어떻게 쓰는가"였고, 그 자리가 여기다.
		sources: [
			{
				id: "sp-writing-skills",
				name: "writing-skills (superpowers)",
				author: "Jesse Vincent",
				url: "https://github.com/obra/superpowers/tree/main/skills/writing-skills",
				license: "MIT",
				collectedAt: "2026-08-12",
			},
			{
				id: "sp-systematic-debugging-log",
				name: "systematic-debugging 제작 기록 (superpowers)",
				author: "Jesse Vincent",
				url: "https://github.com/obra/superpowers/blob/main/skills/systematic-debugging/CREATION-LOG.md",
				license: "MIT",
				collectedAt: "2026-08-12",
			},
			{
				id: "sp-verification-before-completion",
				name: "verification-before-completion (superpowers)",
				author: "Jesse Vincent",
				url: "https://github.com/obra/superpowers/tree/main/skills/verification-before-completion",
				license: "MIT",
				collectedAt: "2026-08-12",
			},
		],
		patterns: [
			{
				id: "trigger-first-description",
				summary: "description은 'Use when...' 트리거 조건 중심으로",
				detail:
					"워크플로 요약이 아니라 '언제 쓰는지'(어떤 요청·상황·에러·도구에서 호출되는지)를 구체적으로 쓴다. 에이전트가 검색할 키워드를 넣는다. description은 에이전트가 스킬 호출 여부를 판단하는 가장 중요한 필드다. 3인칭으로 쓴다 — 시스템 프롬프트에 그대로 주입되기 때문이다. 증상은 언어에 매인 표현(setTimeout, sleep)이 아니라 문제 자체(경쟁 상태, 결과가 들쭉날쭉함)로 적고, 스킬이 특정 기술 전용일 때만 기술명을 트리거에 명시한다. 워크플로 요약을 금지하는 데는 확인된 근거가 있다 — 설명이 절차를 요약하면 에이전트가 본문을 읽지 않고 설명만 따른다. 원저자가 설명에 '작업 사이 코드 리뷰'라고 적었더니 본문 순서도에 리뷰가 두 단계로 그려져 있는데도 에이전트는 한 번만 수행했고, 설명에서 요약을 빼자 두 단계를 지켰다. 요약된 설명은 에이전트가 타고 갈 지름길을 만들고 본문은 건너뛰는 문서가 된다.",
				role: "trigger",
				kind: "artifact",
				format: {
					count:
						"frontmatter 전체 1024자 이내 · description은 가능하면 500자 이내",
					template: "description: Use when [구체적인 발동 조건과 증상]",
				},
				examples: [
					{
						polarity: "bad",
						text: "Use when executing plans - dispatches subagent per task with code review between tasks — 워크플로를 요약했다. 에이전트가 본문 대신 이것만 따른다",
					},
					{
						polarity: "bad",
						text: "Use for TDD - write test first, watch it fail, write minimal code, refactor — 절차를 그대로 옮겼다",
					},
					{
						polarity: "bad",
						text: "For async testing — 추상적이고 언제 쓰는지가 없다",
					},
					{
						polarity: "bad",
						text: "I can help you with async tests when they're flaky — 1인칭",
					},
					{
						polarity: "bad",
						text: "Use when tests use setTimeout/sleep and are flaky — 스킬은 기술 전용이 아닌데 기술명으로 증상을 적었다",
					},
					{
						polarity: "good",
						text: "Use when executing implementation plans with independent tasks in the current session",
					},
					{
						polarity: "good",
						text: "Use when tests have race conditions, timing dependencies, or pass/fail inconsistently",
					},
					{
						polarity: "good",
						text: "Use when using React Router and handling authentication redirects — 기술 전용 스킬이라 기술명을 밝혔다",
					},
				],
				auditIds: ["W-03"],
				sourceIds: ["sp-writing-skills"],
			},
			{
				id: "form-matches-failure",
				summary: "가이드 형태를 실패 유형에 맞춘다(→ 구조 원형 선택)",
				detail:
					"쓰기 전에 먼저 '가이드가 없을 때 무엇이 잘못되는가'를 분류한다. 한 실패 유형을 막아주는 형태가 다른 유형에서는 측정 가능하게 역효과를 낸다. 이 원칙이 곧 어떤 구조 원형(규율형/절차형/참조형)을 쓸지 결정한다. 금지문이 형태 문제에서 역효과인 이유에는 근거가 있다 — 경쟁하는 동기가 있을 때(예: '프롬프트를 자족적으로 만들어라') 에이전트는 '하지 마라'와 협상한다. 원저자의 문구 대조 실험에서 금지문 쪽이 원치 않는 내용을 뚜렷하게 더 많이 만들었고(분포가 완전히 갈렸다), 가이드가 아예 없는 대조군보다도 나쁜 쪽으로 기울었다. 레시피에는 협상할 여지가 없다 — 출력이 그 모양이거나 아니거나다. 어떤 형태를 골랐든 지킬 규칙이 둘 더 있다. 뉘앙스 조항을 붙이지 않는다 — '중요한 경우가 아니면 하지 마라'는 협상을 다시 여는 말이고, 이긴 레시피에 뉘앙스 조항 하나를 붙였더니 일관되던 결과가 들쭉날쭉해졌다. 진짜 예외라면 관찰 가능한 조건을 건 별도 분기로 적는다. 그리고 면제 조항은 범위를 못 잡는다 — '이 제한은 코드블록에 적용되지 않는다'고 써도 코드블록이 억제된다. 일부를 면제해야 한다면 규칙이 그곳에 닿지 않도록 구조를 바꾼다.",
				role: "constraint",
				// 어떤 골격을 쓸지 고르는 규칙이라 완성된 문서에는 흔적이 남지 않는다.
				kind: "process",
				options: [
					{
						value: "금지문 + 합리화 표 + 위험 신호 목록",
						character:
							"압박받으면 규칙을 어긴다(알면서 그런다) — 틀린 형태는 부드러운 권고('가급적…', '고려해 보라')",
					},
					{
						value:
							"긍정형 레시피 또는 계약 — 출력이 무엇인지, 어떤 부분이 어떤 순서로",
						character:
							"따르긴 하는데 출력 모양이 틀리다(프롬프트가 비대함, 결론이 파묻힘, 요구사항을 되풀이함) — 틀린 형태는 금지 목록('되풀이하지 마라', '서술하지 마라')",
					},
					{
						value: "구조적 — 템플릿에 필수 칸을 만든다",
						character:
							"이미 만드는 산출물에서 필수 요소를 빠뜨린다 — 틀린 형태는 템플릿 옆에 붙인 산문 주의문",
					},
					{
						value:
							"관찰 가능한 조건으로 분기 — '브리프가 있으면 그것을 참조한다'",
						character:
							"조건에 따라 행동이 달라져야 한다 — 틀린 형태는 무조건 규칙 + 예외 조항",
					},
				],
				auditIds: ["W-12"],
				sourceIds: ["sp-writing-skills"],
			},
			{
				id: "token-budget",
				summary: "자주 로드되는 스킬일수록 단어 수를 깎는다",
				detail:
					"시작 워크플로나 자주 참조되는 스킬은 거의 모든 대화에 실린다. 그런 스킬에서는 한 단어가 비용이다. 목표치를 넘겼는지는 단어 수를 직접 세어 확인한다.",
				role: "output-rule",
				kind: "artifact",
				format: {
					count:
						"시작 워크플로 150단어 미만 · 자주 로드되는 스킬 전체 200단어 미만 · 그 외 500단어 미만",
				},
				options: [
					{
						value: "상세를 도구 도움말로 뺀다",
						character:
							"플래그를 전부 문서에 적는 대신 '--help를 실행하면 나온다'로 넘긴다",
					},
					{
						value: "상호 참조를 쓴다",
						character:
							"다른 스킬의 절차를 20줄 옮겨 적지 않고 그 스킬 이름을 가리킨다",
					},
					{
						value: "예시를 압축한다",
						character:
							"42단어짜리 대화 예시를 뼈대만 남겨 20단어로 줄인다 — 예시는 형태만 보이면 된다",
					},
					{
						value: "중복을 없앤다",
						character:
							"상호 참조한 스킬에 있는 내용, 명령만 봐도 자명한 설명, 같은 패턴의 두 번째 예시를 지운다",
					},
				],
				auditIds: ["W-07"],
				sourceIds: ["sp-writing-skills"],
			},
			{
				// 형식은 testing의 rationalization-table이 담는다. 여기는 값이다 —
				// debugging의 debug-rationalization-defaults와 같은 짝 구조다.
				id: "skill-testing-rationalization-defaults",
				summary: "스킬 검증을 건너뛸 때 나오는 변명과 그 각각에 대한 반박",
				detail:
					"만든 스킬을 검증하지 않고 배포하려 할 때 나오는 여덟 가지다. 반박은 원칙이 아니라 인과로 되받는다. 표 끝은 한 문장으로 닫아 개별 행이 협상거리가 되지 않게 한다 — '전부 같은 뜻이다: 배포 전에 테스트하라. 예외 없다'. 변명 목록은 상상해서 채우지 않고 실제 테스트에서 나온 것을 모아 만든다. **이것은 값이고 표를 어떤 모양으로 쓸지는 rationalization-table이 담는다 — 둘을 함께 볼 것.**",
				role: "output-rule",
				kind: "artifact",
				format: { count: "8행" },
				examples: [
					{
						polarity: "bad",
						text: '"스킬이 딱 봐도 명확하다" → 나에게 명확한 것과 다른 에이전트에게 명확한 것은 다르다',
					},
					{
						polarity: "bad",
						text: '"이건 그냥 참조 자료다" → 참조 자료에도 빈틈과 모호한 절이 생긴다. 찾아 쓰는 것을 시험하라',
					},
					{
						polarity: "bad",
						text: '"검증까지 하는 건 과하다" → 검증 안 한 스킬에는 반드시 문제가 있다. 15분 시험이 몇 시간을 아낀다',
					},
					{
						polarity: "bad",
						text: '"문제가 생기면 그때 하겠다" → 문제 = 에이전트가 스킬을 못 쓴다는 뜻이다. 배포 전에 하라',
					},
					{
						polarity: "bad",
						text: '"시험이 너무 지루하다" → 망가진 스킬을 실사용 중에 디버깅하는 것보다는 덜 지루하다',
					},
					{
						polarity: "bad",
						text: '"괜찮다는 확신이 있다" → 그 확신이 문제를 보장한다. 그래도 시험하라',
					},
					{
						polarity: "bad",
						text: '"읽어보는 것으로 충분하다" → 읽는 것과 쓰는 것은 다르다. 실제로 적용하는 시나리오를 돌려라',
					},
					{
						polarity: "bad",
						text: '"시험할 시간이 없다" → 검증 안 한 스킬을 배포하면 나중에 고치느라 더 많은 시간을 쓴다',
					},
				],
				auditIds: ["W-13"],
				sourceIds: ["sp-writing-skills"],
			},
			{
				id: "skill-creation-checklist",
				summary: "스킬을 배포하기 전 다섯 단계 점검을 통과시킨다",
				detail:
					"스킬 쓰기는 문서에 적용한 TDD다 — 가이드 없이 먼저 실패를 관찰하고, 그 실패를 겨냥해 쓰고, 다시 돌려 확인한다. 그래서 TDD를 이해하고 있는 것이 이 절차의 전제다. 점검 항목은 읽고 넘어가는 것이 아니라 항목마다 할 일로 만들어 하나씩 닫는다. 검증하지 않은 스킬을 배포하는 것은 검증하지 않은 코드를 배포하는 것과 같다. **문구를 미세 검증할 때는 분산을 지표로 본다** — 가이드가 실제로 구속력이 있으면 반복이 같은 모양으로 수렴한다. 다섯 번이 다섯 갈래로 갈리면 그 문구는 아무것도 붙들지 못한 것이다.",
				role: "verification",
				kind: "process",
				// 2026-08-21 축 1(게이트를 절차에 연결). 다섯 단계는 순서이고
				// 되돌아가는 길도 있는데 `format.sections`에 평면 목록으로만 있었다.
				//
				// `flow`와 `format.sections`를 함께 두는 이유: 순서·게이트·되돌아감은
				// `flow`가 갖고, 각 단계 안에 무엇이 들어가는지는 `sections`가 갖는다.
				// 24개 항목을 단계 이름에 욱여넣으면 렌더가 읽히지 않는다.
				flow: [
					{
						id: "red",
						label: "가이드 없이 먼저 돌려 실패를 관찰한다",
						gate: "대조군이 실패하지 않으면 고칠 것이 없다 — 멈추고 스킬을 쓰지 않는다",
					},
					{
						id: "green",
						label: "관찰한 실패를 겨냥해 최소한으로 쓴다",
						patternId: "form-matches-failure",
						gate: "가이드 형태가 그 실패 유형에 맞는가",
					},
					{
						id: "verify",
						label: "스킬을 붙이고 다시 돌려 달라지는지 본다",
						patternId: "skill-type-testing",
						gate: "유형에 맞는 시험을 돌렸는가 — 규율형에 참조형 시험을 돌리면 아무것도 재지 못한다",
						branches: [{ when: "여전히 안 지키면", goto: "green" }],
					},
					{
						id: "refactor",
						label: "새로 나온 변명을 찾아 빠져나갈 구멍을 막는다",
						patternId: "bulletproofing-toolkit",
						branches: [{ when: "뚫리는 곳이 남아 있으면", goto: "verify" }],
					},
					{
						id: "ship",
						label: "품질 점검을 마치고 내보낸다",
						patternId: "iron-law-edits-too",
						gate: "스킬 하나를 끝내기 전에 다음 것으로 넘어가지 않는다",
					},
				],
				format: {
					count: "5단계 · 총 24항목",
					sections: [
						"RED(실패 확인) 3항목 — 압박 시나리오 만들기(규율형은 압박 3종 이상 조합) · 스킬 없이 돌려 기준 행동을 그대로 받아적기 · 변명과 실패에서 패턴 찾기",
						"GREEN(최소한으로 쓰기) 11항목 — 이름은 문자·숫자·하이픈만 · frontmatter에 name과 description(1024자 이내) · description은 'Use when…'으로 시작하고 구체적 트리거·증상을 담기 · 3인칭 · 검색될 키워드(에러·증상·도구)를 본문 곳곳에 · 핵심 원칙이 담긴 개요 · RED에서 찾은 실패를 정면으로 겨냥 · 가이드 형태가 실패 유형과 맞는지 · 행동을 바꾸는 문구는 무가이드 대조군과 비교해 미세 검증(5회 이상, 표시된 일치는 전부 사람이 읽기 / 순수 참조형은 해당 없음) · 코드는 인라인이거나 별도 파일 링크 · 훌륭한 예시 하나 · 스킬을 붙이고 다시 돌려 준수 확인",
						"REFACTOR(빠져나갈 구멍 막기) 5항목 — 테스트에서 새로 나온 변명 찾기 · 규율형이면 명시적 반박 추가 · 모든 반복에서 모은 변명으로 표 만들기 · 위험 신호 목록 만들기 · 뚫리지 않을 때까지 재시험",
						"품질 점검 5항목 — 결정이 자명하지 않을 때만 작은 순서도 · 훑기용 표 · 흔한 실수 절 · 서사적 이야기 금지 · 보조 파일은 도구나 무거운 참조 자료에만",
						"배포 2항목 — 버전 관리에 커밋 · 널리 쓸 만하면 원 저장소에 기여 검토",
					],
				},
				// 감사 9-2가 지목한 가공 대상. 원문의 GREEN 마지막 항목에 있던
				// 저장소 고유 절차(포크에 push)는 사용자 환경에 없으므로 "버전 관리에
				// 커밋"으로 옮겼고, 단계 이름도 한국어 맥락에 맞게 풀었다.
				adapted: true,
				// W-01(스킬 쓰기 = 문서에 적용한 TDD, TDD가 필수 배경)과
				// W-16(문구 마이크로 테스트)은 위 detail·format이 이미 담고 있어
				// 패턴을 새로 만들지 않고 번호만 보탠다. W-16의 "분산이 지표"만은
				// 빠져 있어 detail에 한 줄 넣었다.
				auditIds: ["W-01", "W-16", "W-18"],
				sourceIds: ["sp-writing-skills"],
			},
			{
				id: "when-not-to-create",
				summary: "스킬로 만들 것과 만들지 말 것을 먼저 가른다",
				detail:
					"기계로 강제할 수 있는 제약은 문서가 아니라 검사기가 맡는다. 정규식이나 검증으로 잡히는 것을 문서로 적으면, 지켜지지 않아도 아무도 모르는 규칙이 하나 늘 뿐이다. 문서는 판단이 필요한 것에 쓴다.",
				role: "trigger",
				kind: "process",
				options: [
					{
						value: "만든다 — 나에게 직관적으로 명백하지 않았던 기법",
						character: "알아내는 데 시간이 걸렸다면 남에게도 그렇다",
					},
					{
						value: "만든다 — 프로젝트를 옮겨가며 다시 참조할 것",
						character: "한 저장소 안에서만 쓸 것이면 해당 없다",
					},
					{
						value: "만든다 — 넓게 적용되는 패턴",
						character: "특정 프로젝트 사정에 매여 있지 않다",
					},
					{
						value: "만든다 — 남에게도 도움이 될 것",
						character: "나만 쓰는 개인 습관과 가른다",
					},
					{
						value: "만들지 않는다 — 일회성 해결",
						character: "다시 쓸 일이 없다",
					},
					{
						value: "만들지 않는다 — 이미 잘 문서화된 표준 관행",
						character: "찾으면 나오는 것을 옮겨 적는 셈이다",
					},
					{
						value: "만들지 않는다 — 프로젝트 고유 관례",
						character: "그 프로젝트의 지침 파일에 넣는다",
					},
					{
						value: "만들지 않는다 — 기계적 제약",
						character:
							"정규식·검증으로 강제할 수 있으면 자동화한다. 문서는 판단이 필요한 것에 남긴다",
					},
				],
				auditIds: ["W-04"],
				sourceIds: ["sp-writing-skills"],
			},
			{
				id: "one-excellent-example",
				summary: "훌륭한 예시 하나가 그저 그런 여럿을 이긴다",
				detail:
					"주제에 가장 맞는 언어 하나를 골라 예시를 만든다 — 테스트 기법이면 TypeScript, 시스템 디버깅이면 셸이나 Python, 자료 처리면 Python 같은 식이다. 여러 언어로 같은 것을 구현하면 전부 그저 그런 품질이 되고 관리 부담만 는다. 읽는 쪽은 언어를 옮기는 데 능하므로 훌륭한 예시 하나면 충분하다.",
				role: "output-rule",
				kind: "artifact",
				format: {
					sections: [
						"완결돼 있고 실제로 돌아간다",
						"왜 그렇게 하는지를 주석으로 설명한다",
						"실제 상황에서 가져온 것이다",
						"패턴이 분명히 드러난다",
						"바로 고쳐 쓸 수 있다 — 범용 템플릿이 아니라",
					],
				},
				examples: [
					{
						polarity: "bad",
						text: "같은 것을 다섯 언어로 구현 — example-js.js, example-py.py, example-go.go",
					},
					{
						polarity: "bad",
						text: "빈칸 채우기 템플릿 — 무엇을 넣어야 하는지는 여전히 안 알려준다",
					},
					{
						polarity: "bad",
						text: "예시를 위해 지어낸 억지 상황 — 실제로 그렇게 쓰이지 않는다",
					},
				],
				auditIds: ["W-09"],
				sourceIds: ["sp-writing-skills"],
			},
			{
				id: "flowchart-when",
				summary: "순서도는 판단이 갈리는 자리에만 쓴다",
				detail:
					"순서도는 자리를 많이 차지하고 복사해 쓸 수 없다. 그래서 정보를 보여주는 용도가 아니라 잘못 갈 수 있는 결정에만 값을 한다. 그 조건에 맞으면 본문 안에 작게 넣고, 아니면 마크다운으로 쓴다. 노드 라벨에는 의미를 담는다 — step1, helper2 같은 이름은 순서도를 그리기 전보다 나은 것이 없다.",
				role: "output-rule",
				kind: "artifact",
				options: [
					{
						value: "쓴다 — 자명하지 않은 결정 지점",
						character: "고민 없이 답이 나오는 갈림길이면 필요 없다",
					},
					{
						value: "쓴다 — 너무 일찍 멈출 수 있는 반복",
						character: "언제까지 도느냐가 흐릿한 곳",
					},
					{
						value: "쓴다 — A와 B 중 무엇을 쓸지 고르는 결정",
						character: "둘 다 그럴듯해 보일 때",
					},
					{
						value: "쓰지 않는다 — 참조 자료",
						character: "표나 목록이 낫다",
					},
					{
						value: "쓰지 않는다 — 코드 예시",
						character:
							"마크다운 코드블록으로. 순서도 안의 코드는 복사도 안 되고 읽기도 어렵다",
					},
					{
						value: "쓰지 않는다 — 직선으로 이어지는 지시",
						character: "번호 목록이면 충분하다",
					},
					{
						value: "쓰지 않는다 — 의미 없는 라벨",
						character: "step1, helper2처럼 이름이 아무것도 말해주지 않는 경우",
					},
				],
				auditIds: ["W-08"],
				sourceIds: ["sp-writing-skills"],
			},
			{
				id: "skill-type-testing",
				summary: "스킬 유형마다 시험 방법과 통과 기준이 다르다",
				detail:
					"검증했다는 말은 유형을 밝히지 않으면 뜻이 없다. 규율형에서 통하는 시험(압박을 걸어 어기는지 본다)은 참조형에서 아무것도 재지 못하고, 참조형의 시험(찾아 쓰는지 본다)은 규율형의 실패를 못 잡는다. 만든 스킬이 어느 유형인지 먼저 정하고 그 줄의 시험을 돌린다. 압박 시험은 선택지를 A·B·C로 강제하고, 가정적인 질문(무엇을 해야 하는가)이 아니라 무엇을 하겠는가로 묻는다 — 그래야 도망갈 자리가 없다.",
				role: "verification",
				// 시험 방법이라 완성된 문서에는 흔적이 남지 않는다.
				kind: "process",
				format: {
					count: "유형 4종 × (시험 방법 3~4 + 통과 기준 1)",
					sections: [
						"규율형(지켜야 할 원칙) — 학술 질문으로 규칙을 아는지 · 압박 시나리오로 지키는지 · 압박 3종 이상 조합(시간+매몰비용+피로) · 나온 변명마다 명시적 반박 추가. 통과 기준: 최대 압박에서도 규칙을 지킨다",
						"기법형(방법 안내) — 적용 시나리오 · 변형 시나리오(가장자리 경우) · 정보 누락 시험(지시에 빈틈이 있는지). 통과 기준: 새 상황에 기법을 제대로 적용한다",
						"패턴형(사고 틀) — 인식 시나리오(언제 쓸지 알아채는가) · 적용 시나리오 · 반례(언제 쓰지 말아야 하는지 아는가). 통과 기준: 쓸 때와 안 쓸 때를 가른다",
						"참조형(자료·API) — 검색 시나리오(맞는 항목을 찾는가) · 적용 시나리오 · 빈틈 시험(흔한 용례가 덮이는가). 통과 기준: 찾아서 올바로 적용한다",
					],
				},
				// SD 제작 기록의 부하 시험 4종(SD-55·57)이 위 규율형 줄의 실제 사례다.
				// 원저자는 학술 / 시간 압박 + 쉬워 보이는 임시 수정 / 복잡한 다층 시스템 /
				// 첫 수정 실패의 네 가지로 돌렸고 전부 통과했다.
				// W-05(스킬 유형 3종과 각각의 예)는 위 sections가 유형별로 갈라 담고
				// 있어 번호만 보탠다. 원문은 기법·패턴·참조 3종인데 여기는 규율형이
				// 하나 더 있다 — 규율형은 시험 방법이 가장 다르고, 우리 축 1의 골격
				// 4종과도 맞는다.
				auditIds: ["W-05", "W-14", "W-17", "SD-55", "SD-57"],
				sourceIds: ["sp-writing-skills", "sp-systematic-debugging-log"],
			},
			{
				id: "bulletproofing-toolkit",
				summary: "규율형 스킬은 압박 아래 뚫리지 않도록 따로 손봐야 한다",
				detail:
					"규율을 요구하는 스킬은 똑똑한 독자가 압박 아래 빠져나갈 구멍을 찾는다는 전제로 쓴다. 적용 범위를 헷갈리지 말 것 — 이 도구들은 규칙을 알면서 압박에 밀려 건너뛰는 실패에만 쓴다. 출력 모양이 틀리거나 요소를 빠뜨리는 실패에는 금지문 기반 방탄이 역효과다(form-matches-failure를 볼 것). 값을 담는 자리는 이미 있다 — 변명 표의 형식은 rationalization-table이, 위험 신호 목록의 형식은 red-flags-list가 든다. 여기서는 그 둘을 포함한 방어 수단 전체를 어떻게 배치하는지를 정한다.",
				role: "constraint",
				kind: "artifact",
				options: [
					{
						value: "우회로를 하나씩 이름 붙여 막는다",
						character:
							"테스트 전에 코드를 썼으면 지운다로 끝내지 않는다. 참고용으로 남기지 마라 / 테스트 쓰면서 손보지 마라 / 쳐다보지 마라 / 지우라면 지우는 것이다까지 적는다",
					},
					{
						value: "문자 대 정신 논변을 미리 끊는다",
						character:
							"규칙의 문자를 어기는 것이 곧 정신을 어기는 것이다를 앞쪽에 원칙으로 박는다. 나는 정신을 따르고 있다는 부류의 합리화를 통째로 차단한다",
					},
					{
						value: "변명 표를 만든다",
						character:
							"기준 시험에서 실제로 나온 변명을 전부 모아 넣는다. 형식은 rationalization-table",
					},
					{
						value: "위험 신호 목록을 만든다",
						character:
							"스스로 알아챌 수 있게 짧은 신호로. 형식은 red-flags-list",
					},
					{
						value: "위반 직전의 증상을 description에 넣는다",
						character:
							"규칙을 어기려는 순간의 상황을 트리거로 적어두면 그 순간에 스킬이 호출된다",
					},
					{
						value: "핵심 지시를 여러 자리에 일부러 반복한다",
						character:
							"중복은 낭비가 아니라 설계다. 원저자는 근본 원인 지시를 개요·언제 쓰나·1단계·구현 규칙 네 곳에 두고, 증상을 고치지 마라를 서로 다른 맥락에서 네 번 반복했다",
					},
					{
						value: "압박에 견디는 어휘를 쓴다",
						character:
							"should나 try to가 아니라 ALWAYS·NEVER. 그리고 압박 상황을 문장에 직접 넣는다 — 더 빠르더라도, 내가 급해 보이더라도, 멈추고 다시 분석하라",
					},
					{
						value: "구조로 막는다 — 문서 형태 자체가 지름길을 없앤다",
						character:
							"1단계를 필수로 두어 구현으로 건너뛸 수 없게 · 가설은 한 번에 하나만(산탄식 수정 차단) · 실패 모드를 명시하고 그때 할 일을 못박기 · 안티패턴 절을 따로 두기",
					},
				],
				// SD-56 — 원저자가 직접 "가장 중요한 방탄 요소"로 꼽은 것이 안티패턴
				// 절이다. 지름길을 떠올리는 순간 그 문장이 목록에 있으면 인지적 마찰이
				// 생긴다는 것이 근거다. 안티패턴 목록의 값 자체는 anti-patterns가 든다.
				auditIds: ["W-15", "SD-52", "SD-53", "SD-54", "SD-56"],
				sourceIds: ["sp-writing-skills", "sp-systematic-debugging-log"],
			},
			{
				id: "keyword-coverage",
				summary: "찾는 사람이 실제로 칠 법한 말을 본문에 흩어 둔다",
				detail:
					"스킬은 읽히기 전에 찾아져야 한다. 개념을 정확한 용어로만 적어두면, 정작 문제를 겪는 순간에 떠오르는 말(에러 문구, 증상을 부르는 속어)로는 검색되지 않는다. 이름도 마찬가지다 — 하는 일을 능동태 동사로 앞세운다. **검색어를 앞쪽에 자주 두는 데는 이유가 있다** — 찾는 쪽은 문제를 만나고 → 설명으로 훑어 고르고 → 개요만 읽고 관련 있는지 판정하고 → 그다음에야 본문을 읽는다. 뒤쪽에만 있는 말은 그 판정을 통과하기 전에는 읽히지 않으므로 없는 것과 같다.",
				role: "trigger",
				kind: "artifact",
				format: {
					sections: [
						"에러 메시지 — 실제로 화면에 뜨는 문구 그대로",
						"증상 — 사람들이 그 상태를 부르는 말",
						"동의어 — 같은 것을 가리키는 다른 표현들을 함께",
						"도구 — 실제 명령어, 라이브러리 이름, 파일 종류",
					],
				},
				examples: [
					{
						polarity: "good",
						text: '에러 메시지: "Hook timed out", "ENOTEMPTY", "race condition"',
					},
					{
						polarity: "good",
						text: '증상: "flaky", "hanging", "zombie", "pollution" — 정확한 용어가 아니라 부르는 말',
					},
					{
						polarity: "good",
						text: '동의어: "timeout/hang/freeze", "cleanup/teardown/afterEach"를 함께 적어 어느 말로 찾아도 걸리게',
					},
					{
						polarity: "good",
						text: "이름은 동사를 앞세운다 — creating-skills(○) / skill-creation(✕), condition-based-waiting(○) / async-test-helpers(✕)",
					},
				],
				// W-22(발견 흐름 6단계)는 흐름 자체를 단계로 담지 않았다 — 그것은
				// 읽는 쪽의 행동이지 사용자가 만들 스킬이 시키는 일이 아니다. 대신
				// 그 흐름이 근거가 되는 규정("앞쪽에 자주")을 detail에 담았다.
				auditIds: ["W-11", "W-22"],
				sourceIds: ["sp-writing-skills"],
			},
			{
				id: "no-force-load-links",
				summary:
					"다른 스킬은 이름으로 가리키고, 참조가 곧 로드가 되지 않게 한다",
				detail:
					"다른 문서를 가리키는 방식 중에는 가리키는 순간 그 파일을 통째로 읽어 들이는 것이 있다. 그런 참조를 쓰면 아직 필요하지도 않은 내용이 먼저 자리를 차지해, 정작 일할 때 쓸 여유가 줄어든다. 참조는 이름으로 하고, 그것이 필수인지 배경 지식인지를 표시로 밝힌다 — 표시가 없으면 읽는 쪽이 꼭 봐야 하는지 판단할 수 없어 결국 둘 다 실패한다(안 읽거나, 다 읽거나).",
				role: "output-rule",
				kind: "artifact",
				// 원문의 금지 대상은 특정 런타임의 @ 링크 문법이다. 그 문법은 다른
				// 환경 사용자에게 뜻이 통하지 않으므로(감사 9-4), 규정의 알맹이인
				// "참조가 즉시 로드를 일으키지 않게 한다"만 옮겼다.
				adapted: true,
				examples: [
					{
						polarity: "good",
						text: "**필수 하위 스킬:** test-driven-development를 사용한다 — 이름으로 가리키고 필수임을 밝혔다",
					},
					{
						polarity: "good",
						text: "**필수 배경:** systematic-debugging을 이해하고 있어야 한다",
					},
					{
						polarity: "bad",
						text: "skills/testing/test-driven-development 참고 — 꼭 봐야 하는 것인지 알 수 없다",
					},
					{
						polarity: "bad",
						text: "파일 경로를 즉시 로드되는 형태로 삽입하는 것 — 필요해지기 전에 컨텍스트를 태운다",
					},
				],
				auditIds: ["W-21"],
				sourceIds: ["sp-writing-skills"],
			},
			{
				id: "anti-patterns",
				summary: "안티패턴 절에 지름길의 실제 모습을 그대로 적어 둔다",
				detail:
					"원저자가 방탄 장치 중 가장 중요한 것으로 꼽은 것이 이 절이다. 근거는 인지적 마찰이다 — 이번만 이렇게 하자고 생각하는 순간, 바로 그 문장이 하지 말 것 목록에 적혀 있는 것을 보게 된다. 그래서 안티패턴은 추상적인 원칙이 아니라 실제로 그렇게 쓰인 모습으로 적어야 한다. 각 항목에는 왜 나쁜지를 한 줄로 붙인다.",
				role: "constraint",
				kind: "artifact",
				format: {
					count: "원문의 문서 작성 안티패턴은 4종",
					template: "❌ <지름길의 실제 모습> — 왜 나쁜가: <한 줄>",
				},
				examples: [
					{
						polarity: "bad",
						text: '서사형 예시 — "2025-10-03 세션에서 projectDir이 비어 있어…" · 너무 구체적이라 다시 쓸 수 없다',
					},
					{
						polarity: "bad",
						text: "다국어 희석 — example-js.js, example-py.py, example-go.go · 전부 그저 그런 품질이 되고 관리 부담만 는다",
					},
					{
						polarity: "bad",
						text: "순서도 안의 코드 — 복사해 쓸 수 없고 읽기도 어렵다",
					},
					{
						polarity: "bad",
						text: "무의미한 라벨 — helper1, helper2, step3, pattern4 · 라벨에는 뜻이 담겨야 한다",
					},
				],
				auditIds: ["W-20", "SD-56"],
				sourceIds: ["sp-writing-skills", "sp-systematic-debugging-log"],
			},
			{
				id: "iron-law-edits-too",
				summary: "철칙은 새로 만들 때만이 아니라 고칠 때도 적용된다",
				detail:
					"실패를 먼저 확인하지 않고 쓴 스킬은 무엇을 고치는지 모르는 채로 쓴 것이다. 이 원칙은 새 스킬에만 걸리는 것으로 읽히기 쉬운데, 원문은 기존 스킬 수정에도 똑같이 적용된다고 못박는다. 그리고 예외가 될 법한 것들을 하나씩 이름 붙여 막는다 — 이름 붙이지 않으면 각각이 자기만의 예외로 통과한다. 스킬 하나를 끝내기 전에 다음 것으로 넘어가지 않는다. 여러 개를 몰아 만들고 나중에 한꺼번에 검증하는 방식은 금지다 — 검증 안 한 스킬을 배포하는 것은 검증 안 한 코드를 배포하는 것과 같다.",
				role: "constraint",
				kind: "artifact",
				format: {
					count: "봉쇄 6항목",
					sections: [
						"간단한 추가라서 예외가 아니다",
						"섹션 하나 더 붙이는 것도 예외가 아니다",
						"문서 갱신도 예외가 아니다",
						"검증 안 한 변경을 참고용으로 남기지 않는다",
						"시험 도중에 손보지 않는다",
						"지우라면 지우는 것이다",
					],
				},
				examples: [
					{
						polarity: "good",
						text: "핵심 문장을 한 줄로 박아 둔다 — 실패하는 시험 없이는 스킬도 없다",
					},
					{
						polarity: "bad",
						text: "스킬 여러 개를 몰아 만들고 검증은 나중에 한꺼번에 — 몰아서 하는 게 효율적이라는 이유가 가장 흔하다",
					},
				],
				auditIds: ["W-10", "W-19"],
				sourceIds: ["sp-writing-skills"],
			},
			// ── 완료 검증 (2026-08-21 승격) ─────────────────────────────
			//
			// 아래 다섯은 `debugging`에 있었다. 옮긴 근거는 실측이다 — 시나리오
			// 11종 × 2회로 만들어진 22건 중 **완료 확인 절이 붙은 것은 8건(36%)뿐**이고,
			// 붙은 쪽은 대부분 테스트·디버깅 계열이었다. 계획·코드리뷰·디자인·문서·
			// 설명·엑셀 정리는 두 번 다 없었다.
			//
			// **`red-green-regression-proof`는 옮기지 않았다** — "고친 것을 되돌려
			// 실패시켜 본다"는 버그를 고친 뒤에만 성립한다. 모든 스킬에 실릴 성질이
			// 아니라 `debugging`에 남긴다.
			{
				id: "evidence-matches-the-claim",
				summary: "무엇을 주장하느냐에 따라 필요한 증거가 다르다",
				detail:
					"'끝났다'를 선언하기 전에 증거를 본다는 원칙은 어떤 스킬에나 걸리지만, **무엇이 증거인지는 주장마다 다르다.** 원문은 주장별로 필요한 것과 불충분한 것을 짝지어 표로 규정한다. **여기서 특히 볼 것은 「요구사항을 다 채웠다」 줄이다** — 돌려볼 명령이 없는 주장인데도 확인 방법이 있다. 계획을 다시 읽어 한 줄씩 점검표를 만들고 항목마다 확인한 뒤 **못 채운 것을 보고한다.** 문서·설명·기획처럼 돌릴 것이 없는 스킬은 이 줄을 따른다 — 그 스킬이 스스로 적어둔 지켜야 할 것·형식 규정·금지 목록이 그대로 점검표가 된다. 이 구분을 안 하면 돌릴 것이 없는 스킬에 '명령을 돌려 확인하라'가 박혀 실행할 수 없는 지시가 된다.",
				role: "verification",
				kind: "artifact",
				format: {
					sections: [
						"주장 — 무엇을 다 했다고 말하려는가",
						"필요한 것 — 그 주장을 뒷받침하는 증거",
						"불충분한 것 — 증거처럼 보이지만 아닌 것",
					],
				},
				options: [
					{
						value: "테스트가 통과한다",
						character:
							"필요: 테스트 명령 출력에 실패 0 / 불충분: 이전 실행 결과, '통과할 것이다'",
					},
					{
						value: "검사기가 깨끗하다",
						character:
							"필요: 검사기 출력에 에러 0 / 불충분: 일부만 보고 미루어 짐작",
					},
					{
						value: "빌드가 된다",
						character:
							"필요: 빌드 명령의 종료 코드 0 / 불충분: 검사기가 통과함, 로그가 괜찮아 보임",
					},
					{
						value: "버그를 고쳤다",
						character:
							"필요: 원래 증상을 재현하던 것이 통과 / 불충분: 코드를 바꿨으니 됐겠지",
					},
					{
						value: "맡긴 작업이 끝났다",
						character:
							"필요: 실제 변경 내역을 열어 확인 / 불충분: 맡은 쪽이 '됐다'고 보고함",
					},
					{
						value: "요구사항을 다 채웠다",
						character:
							"필요: 한 줄씩 점검표를 만들어 항목마다 확인하고 못 채운 것을 보고 / 불충분: 테스트가 통과함",
					},
				],
				// 원문의 표는 코드 작업을 전제로 쓰였다. 마지막 줄(요구사항)이 돌릴 것이
				// 없는 경우를 이미 다루지만, 그것을 "문서·설명 스킬은 자기가 적어둔
				// 기준을 점검표로 쓴다"로 넓힌 것은 원문에 없는 판단이다.
				adapted: true,
				auditIds: ["V-07", "V-08", "V-14", "V-17"],
				sourceIds: ["sp-verification-before-completion"],
			},
			{
				id: "verify-before-done",
				summary: "'됐다'고 말하기 전에 증명하는 명령을 새로 돌려 결과를 읽는다",
				detail:
					"지금 이 작업에서 직접 돌려보지 않았으면 통과한다고 말할 수 없다. 어느 단계든 건너뛰면 확인한 것이 아니다.",
				role: "verification",
				kind: "artifact",
				flow: [
					{ id: "define", label: "무엇으로 증명되는지 정한다" },
					{ id: "rerun", label: "그 명령을 처음부터 끝까지 새로 돌린다" },
					{
						id: "read",
						label: "출력 전체·종료 상태·실패 건수를 읽는다",
						gate: "셋 중 하나라도 안 봤으면 다음으로 가지 않는다",
					},
					{
						id: "judge",
						label: "결과가 주장을 뒷받침하는지 본다",
						branches: [
							{
								when: "뒷받침하지 않는다 — 주장 대신 실제 상태를 증거와 함께 말한다",
								goto: "stop",
							},
						],
					},
					{ id: "say", label: "그제서야 주장을 증거와 함께 말한다" },
				],
				auditIds: ["V-04", "V-05", "V-06", "V-03"],
				verifyHint:
					"'실패 건수를 센다'까지 들어가는지, 뒷받침하지 않을 때의 처리가 있는지",
				sourceIds: ["sp-verification-before-completion"],
			},
			{
				id: "what-is-not-evidence",
				summary:
					"주장마다 '무엇이 증거이고 무엇은 증거가 아닌지'를 나란히 적는다",
				detail:
					"무엇이 증거인지 아는 것보다 무엇이 증거가 아닌지 아는 쪽이 실제로 막아준다. 한 줄 규칙으로 뭉치면 이 구분이 통째로 사라진다.",
				role: "output-rule",
				kind: "artifact",
				options: [
					{
						value: "테스트가 통과한다",
						character:
							"실패 0으로 끝난 실행 결과가 있어야 한다. 지난번 실행이나 '이제 될 것이다'는 안 된다",
					},
					{
						value: "빌드가 된다",
						character:
							"빌드가 정상 종료했다는 것이 확인돼야 한다. 검사 도구가 통과했다거나 기록이 괜찮아 보인다는 것은 안 된다",
					},
					{
						value: "버그를 고쳤다",
						character:
							"원래 증상을 다시 재현해 보고 통과해야 한다. 코드를 고쳤으니 됐겠지는 안 된다",
					},
					{
						value: "재발 방지 테스트가 동작한다",
						character:
							"고친 것을 되돌렸을 때 실제로 실패하는 것까지 봐야 한다. 한 번 통과한 것으로는 안 된다",
					},
					{
						value: "맡긴 작업이 끝났다",
						character:
							"변경 내역에 실제 변화가 보여야 한다. 끝냈다는 보고만으로는 안 된다",
					},
					{
						value: "요구사항을 다 채웠다",
						character:
							"요구사항을 한 줄씩 대조한 목록이 있어야 한다. 테스트가 통과한다는 것으로는 안 된다",
					},
				],
				auditIds: ["V-07", "V-08", "V-09"],
				verifyHint:
					"'무엇은 증거가 아닌지'가 주장마다 붙는지, 긍정형 지시만 남는지",
				sourceIds: ["sp-verification-before-completion"],
			},
			{
				id: "no-success-words-before-run",
				summary: "돌려보기 전에는 성공을 암시하는 말 자체를 쓰지 않는다",
				detail:
					"막으려는 것은 기술적 실수가 아니라 말버릇이다. '아마', '~인 것 같다', '될 겁니다' 같은 표현이 첫 번째 신호이고, 확인 전에 '좋아요', '완벽합니다', '끝났습니다' 같은 만족 표현을 쓰는 것이 두 번째다. 목록에 없는 표현으로 새어나가지 않게, 마지막에는 열어두는 조항을 붙인다 — 확인하지 않은 채 성공을 암시하는 모든 표현이 여기 해당한다. 정확한 문구뿐 아니라 바꿔 말한 것, 돌려 말한 것, 완료를 시사하는 모든 말에 같은 규칙이 걸린다.",
				role: "constraint",
				kind: "artifact",
				examples: [
					{ polarity: "bad", text: "'이제 잘 될 겁니다'" },
					{ polarity: "bad", text: "확인 전에 '완벽합니다'" },
					{ polarity: "bad", text: "맡긴 쪽이 됐다고 하니 됐다고 전한다" },
					{
						polarity: "good",
						text: "'34개 중 34개 통과를 확인했습니다 — 모두 통과합니다'",
					},
				],
				auditIds: ["V-10", "V-11", "V-12", "V-20"],
				verifyHint: "금지 표현 목록에 열어두는 조항이 붙는지",
				sourceIds: ["sp-verification-before-completion"],
			},
			{
				id: "verify-delegated-work",
				summary: "맡긴 작업은 보고가 아니라 실제 변경 내역으로 확인한다",
				detail:
					"끝냈다는 보고와 실제로 바뀐 것은 다를 수 있다. 보고를 받으면 변경 내역을 열어 무엇이 어떻게 바뀌었는지 직접 보고, 그 실제 상태를 전한다.",
				role: "verification",
				kind: "artifact",
				auditIds: ["V-18"],
				sourceIds: ["sp-verification-before-completion"],
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
				auditIds: ["W-02"],
				sourceIds: ["sp-writing-skills"],
			},
		],
	},
	{
		id: "design",
		label: "디자인·프론트엔드",
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
					"고르지 않은 안이 성급하게 적용되는 것을 막고, 정해진 방향을 전체에 일관되게 반영한다.",
				role: "workflow-step",
				kind: "artifact",
				exception:
					"보여주기용 자료(쇼케이스)는 보여주기만 하고 수정하지 않는다",
				// 2026-08-21 축 1. `custom-option-fallback`이 "같은 승인 절차를 다시
				// 밟는다"고 스스로 적어두고도 그 되돌아감이 흐름에 없었다.
				flow: [
					{ id: "show", label: "선택지를 먼저 눈으로 보게 한다" },
					{
						id: "ask",
						label: "어느 것을 쓸지 묻는다",
						branches: [{ when: "맞는 선택지가 없다고 하면", goto: "make" }],
					},
					{
						id: "make",
						label: "맞는 것이 없으면 새로 만든다",
						patternId: "custom-option-fallback",
						branches: [{ when: "만들었으면 다시", goto: "show" }],
					},
					{
						id: "wait",
						label: "명시적 확인을 기다린다",
						patternId: "wait-for-explicit-choice",
						gate: "제시한 것만으로는 확인받은 것이 아니다",
					},
					{
						id: "apply",
						label: "적용한다 — 대비·가독성을 지키며 전체에 일관되게",
					},
				],
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
		// 2026-08-19 3차 확장. 원문 감사
		// (docs/corpus/entpnomad-tone-of-voice.md) 결과를 반영했다.
		// 감사에서 드러난 핵심 셋:
		// ⓐ 원문 23개 지시 중 형태가 남은 것이 4개, 그중 **구체 값이 남은 것은
		//    0개**였다. 금지 문구 7개·선택지 7개·채널 6종·어휘 3쌍·파일명 9개가
		//    전부 사라지고 "목록을 만들라"는 지시만 남아 효력이 0이었다.
		// ⓑ 본문 비중 1위(36.1%)와 2위(20.6%)에서 각각 1개·0.5개만 건졌다.
		//    특히 `Guardrails` 6개가 한 패턴에 뭉개졌고 그중 3개는 흔적도 없었다.
		// ⓒ 이 소스의 골격은 `Setup Check`가 분기시키는 **2모드**(첫 사용=수집 /
		//    이후=집행)인데 코퍼스는 평면으로 늘어놓아 그 구분이 없었다.
		// 옮기지 않기로 한 것: 원문의 영어 리터럴 질문 문장 9개. 그대로 실으면
		// 생성물이 복사한다. "질문 문장을 미리 정해둔다"는 규정만 살렸다(TV-04).
		patterns: [
			{
				id: "voice-setup-gate",
				summary:
					"무엇보다 먼저 저장된 프로필이 있는지 보고 '수집'과 '집행'으로 갈라진다",
				detail:
					"말투 스킬은 한 가지 일만 하는 것이 아니라 두 가지 일을 한다 — 처음 한 번은 사용자에게서 값을 받아 저장하고, 그 뒤로는 저장된 값을 적용한다. 그래서 문서의 첫 자리는 절차도 규칙도 아니라 **분기 판정**이다. 이 게이트가 없으면 이미 프로필이 있는 사용자에게 설정 질문을 다시 묻게 된다.",
				role: "workflow-step",
				kind: "artifact",
				// 2026-08-21 축 1(게이트를 절차에 연결). 갈림길이 format.sections에
				// 평면 목록으로 들어 있었다 — 머리말의 판정 기준("1번을 끝내야 2번을
				// 할 수 있나")으로 보면 이건 목록이 아니라 분기다. 그리고 갈라진 두
				// 길이 각각 어느 패턴으로 이어지는지가 어디에도 없었다.
				flow: [
					{
						id: "look",
						label: "저장된 프로필이 있는지 먼저 찾는다",
						gate: "찾기 전에는 어떤 질문도 하지 않는다 — 이미 답한 것을 다시 묻게 된다",
						branches: [
							{ when: "있으면 집행 모드로", goto: "enforce" },
							{ when: "없으면 수집부터", goto: "collect" },
						],
					},
					{
						id: "collect",
						label: "프로필 아홉 항목을 받아 항목별로 저장한다",
						patternId: "define-voice-profile",
						gate: "질문은 한 번에 하나씩 — 답마다 따로 저장해 중간에 끊겨도 남게 한다",
					},
					{
						id: "enforce",
						label: "저장된 프로필과 고정 규칙에 맞춰 쓰거나 고친다",
						patternId: "voice-enforcement-checklist",
					},
				],
				auditIds: ["TV-01"],
				verifyHint:
					"'처음 한 번'과 '매번'이 갈라지는지, 아니면 규칙만 평면으로 나열되는지",
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "one-question-at-a-time",
				summary: "설정 질문은 한 번에 하나씩 묻고, 답마다 따로 저장한다",
				detail:
					"여러 질문을 한꺼번에 던지면 사용자가 앞의 것만 답하거나 뭉뚱그려 답한다. 그리고 질문마다 형태를 가른다 — 고를 수 있는 것은 선택지로 제시하고, 사람마다 다를 수밖에 없는 것은 자유롭게 쓰게 둔다. 답은 한 파일에 몰아 적지 않고 항목별로 나눠 저장한다. 나중에 한 항목만 고칠 수 있어야 하기 때문이다.",
				role: "workflow-step",
				kind: "artifact",
				examples: [
					{
						polarity: "bad",
						text: "아홉 가지를 한 번에 물어보고 사용자가 긴 문단으로 답하게 둔다",
					},
					{
						polarity: "good",
						text: "보이스 특성처럼 후보를 미리 줄 수 있는 것은 선택지 + 직접 입력 여지로 묻는다",
					},
				],
				auditIds: ["TV-02"],
				verifyHint: "질문을 나눠 묻는 규정과 항목별 저장이 있는지",
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "define-voice-profile",
				summary: "말투를 먼저 '프로필'로 정의하고 일관 적용한다",
				detail:
					"아홉 항목을 프로필로 정의하고 이후 모든 글을 그 기준으로 쓴다. 순서에는 이유가 있다 — 앞의 것(정체성·신념·독자)이 뒤의 것(어휘·금지 문구·채널 규칙)을 정하는 근거가 된다. 질문 문장은 그때그때 지어내지 말고 항목마다 미리 정해두고, 받은 답은 항목별 파일로 저장해 다음 세션에도 남게 한다.",
				role: "workflow-step",
				kind: "artifact",
				flow: [
					{ id: "identity", label: "정체성 — 배경과 지금 하는 일" },
					{ id: "belief", label: "핵심 신념 — 쓰는 글 전부를 관통하는 하나" },
					{ id: "reader", label: "독자 — 인구통계가 아니라 사람" },
					{
						id: "traits",
						label: "보이스 특성 — 무엇을 쓰는지가 아니라 어떻게 들리는지",
					},
					{ id: "themes", label: "핵심 주제 — 늘 돌아오는 것들" },
					{ id: "words", label: "어휘 — 쓰는 말과 안 쓰는 말" },
					{ id: "banned", label: "금지 문구 — 보면 지우는 것들" },
					{ id: "channels", label: "채널 — 매체별 규칙" },
					{ id: "sample", label: "예시 문단 — 이후의 기준 표본" },
				],
				auditIds: ["TV-03", "TV-04", "TV-05"],
				verifyHint: "아홉 항목의 순서와 항목별 저장이 살아 있는지",
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "voice-profile-field-specs",
				summary: "프로필 항목마다 받을 분량을 숫자로 못박는다",
				detail:
					"'말투를 알려주세요'라고만 물으면 한 단어를 적는 사람과 세 문단을 적는 사람이 갈리고, 둘 다 쓸 수 없는 답이 된다. 개수를 정해두면 답의 밀도가 고르게 맞춰진다. 특성을 3~5개로 묶는 것은 그보다 적으면 다른 사람과 구별되지 않고, 많으면 서로 충돌해 적용할 수 없기 때문이다.",
				role: "output-rule",
				kind: "artifact",
				format: {
					count:
						"정체성 2~3문장 · 보이스 특성 3~5개 단어 · 핵심 주제 3~5개 · 어휘 5~10쌍 · 예시 문단 1~3개",
				},
				examples: [
					{
						polarity: "bad",
						text: "'말투를 설명해 주세요'만 묻고 분량을 정해두지 않는다",
					},
					{
						polarity: "good",
						text: "'어떻게 들려야 하는지 3~5개 단어로 골라주세요 — 무엇을 쓰는지가 아니라'",
					},
				],
				auditIds: ["TV-07", "TV-10", "TV-11", "TV-12", "TV-15"],
				verifyHint: "개수 규정이 몇 군데 살아 있는지, '적당히'로 뭉개지는지",
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "voice-trait-options",
				summary: "고르기 어려운 항목에는 시작 선택지를 미리 깔아준다",
				detail:
					"'어떻게 들리고 싶은지 3~5개 단어로'는 백지에서 답하기 어려운 질문이다. 후보를 몇 개 깔아두면 사용자는 고르거나 반박하면서 자기 답에 도달한다. 선택지는 닫힌 목록이 아니라 마중물이므로 직접 쓸 여지를 반드시 함께 둔다.",
				role: "workflow-step",
				kind: "artifact",
				options: [
					{ value: "역발상", character: "통념을 먼저 뒤집고 시작하는 결" },
					{ value: "직설", character: "돌려 말하지 않고 결론부터 놓는 결" },
					{ value: "기술적", character: "구체적 용어와 수치로 말하는 결" },
					{ value: "따뜻함", character: "읽는 사람 쪽으로 기울어 있는 결" },
					{ value: "장난기", character: "격식을 일부러 흐트러뜨리는 결" },
					{ value: "정밀함", character: "표현의 오차를 줄이는 쪽을 택하는 결" },
					{ value: "도발적", character: "반응을 끌어내려고 각을 세우는 결" },
				],
				exception:
					"사용자가 이미 자기 말로 특성을 말했다면 선택지를 다시 깔지 않는다.",
				auditIds: ["TV-10"],
				verifyHint: "선택지를 주는 규정이 있는지, 직접 입력 여지가 함께 있는지",
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "vocabulary-pairs",
				summary: "어휘는 낱말이 아니라 '이 말 말고 저 말' 짝으로 받는다",
				detail:
					"선호 어휘만 나열하면 실제 글을 쓸 때 걸러낼 기준이 안 된다. 짝으로 받으면 '이 자리에서 무엇을 쓰지 말아야 하는지'가 같이 정해져서 판정 가능한 규칙이 된다. 두 낱말이 뜻은 거의 같은데 결이 다른 쌍이 특히 값을 한다.",
				role: "output-rule",
				kind: "artifact",
				format: {
					count: "5~10쌍",
					template: "'○○'를 쓰고 '△△'는 쓰지 않는다",
				},
				examples: [
					{
						polarity: "good",
						text: "'자력으로 굴렸다'를 쓰고 '자체 자금으로 운영했다'는 쓰지 않는다",
					},
					{
						polarity: "good",
						text: "'내보냈다'를 쓰고 '배포를 진행하였다'는 쓰지 않는다",
					},
					{
						polarity: "bad",
						text: "선호 어휘만 스무 개 나열하고 무엇을 피할지는 적지 않는다",
					},
				],
				auditIds: ["TV-12"],
				verifyHint: "짝 형식과 개수 규정이 있는지, 선호 목록만 남는지",
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "banned-phrases",
				summary: "쓰지 말 표현을 명시적으로 목록화해 제거한다",
				detail:
					"진부하거나 기계가 쓴 티가 나는 문구를 금지 목록으로 만들어 두고, 글을 넘기기 전에 그 목록으로 훑는다. 목록은 사용자가 더하고 뺄 수 있어야 한다 — 어떤 업계에서는 관용구인 표현이 다른 업계에서는 사족이기 때문이다.",
				role: "constraint",
				kind: "artifact",
				auditIds: ["TV-13"],
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "banned-phrase-defaults",
				summary: "금지 목록은 빈칸이 아니라 기본값을 깔고 시작한다",
				detail:
					"'쓰지 말 표현을 정하세요'라고만 하면 대부분 빈칸으로 남는다. 자기가 쓰는 상투어는 자기 눈에 안 보이기 때문이다. 흔한 것들을 먼저 깔아두면 사용자는 지우거나 더하면서 자기 목록을 갖게 된다. 아래는 원문이 기본값으로 제시한 일곱 가지를 한국어 글쓰기 맥락으로 옮긴 것이다.",
				role: "constraint",
				kind: "artifact",
				adapted: true,
				examples: [
					{ polarity: "bad", text: "「○○를 출시하게 되어 기쁩니다」" },
					{ polarity: "bad", text: "「이 글에서는 ○○에 대해 알아보겠습니다」" },
					{ polarity: "bad", text: "「놓치지 마세요!」" },
					{ polarity: "bad", text: "「댓글로 알려주세요」" },
					{ polarity: "bad", text: "「오늘날과 같은 ○○ 시대에」" },
					{
						polarity: "bad",
						text: "「이 글이 와닿았다면 당신은 제대로 찾아온 겁니다」",
					},
					{
						polarity: "bad",
						text: "극적 효과를 노린 삼중 반복 — 「○○ 없이. △△ 없이. □□ 없이.」",
					},
				],
				auditIds: ["TV-13"],
				verifyHint:
					"금지 문구가 실제 값으로 적혀 있는지, '목록을 만들라'는 지시만 있는지",
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "channel-rules",
				summary: "채널마다 다른 규칙을 따로 받아둔다",
				detail:
					"같은 보이스라도 매체가 바뀌면 길이·형식·격식이 달라진다. 채널을 열거해 두고 각각에 규칙을 붙이지 않으면, 블로그용으로 정한 규칙이 짧은 글에 그대로 적용돼 어색해진다.",
				role: "output-rule",
				kind: "artifact",
				options: [
					{
						value: "블로그",
						character: "길이 여유가 있고 구조를 갖춰 쓰는 곳",
					},
					{
						value: "뉴스레터·이메일",
						character: "이미 구독한 사람에게 말하는, 사적인 거리",
					},
					{ value: "짧은 소셜 글", character: "한 문장이 전부일 수 있는 곳" },
					{
						value: "직업 네트워크 글",
						character: "격식과 자기 홍보가 섞이기 쉬운 곳",
					},
					{
						value: "저장소 README",
						character: "설명이 곧 제품 소개인 곳",
					},
					{
						value: "커뮤니티 채팅",
						character: "대화 흐름 안에서 짧게 끊어 쓰는 곳",
					},
				],
				auditIds: ["TV-14"],
				verifyHint: "채널이 열거되고 각각에 규칙이 붙는지",
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "profile-update-flow",
				summary: "저장한 프로필을 고치고 들여다보는 방법을 문서에 적어둔다",
				detail:
					"저장으로 끝내면 사용자는 자기가 뭘 저장했는지 잊고, 바뀐 생각을 반영할 방법도 모른다. 고치는 절차에서 중요한 것은 **현재 내용을 먼저 보여주는 단계**다 — 그것 없이 '무엇을 바꿀까요'라고 물으면 기억에 의존해 답하게 된다.",
				role: "workflow-step",
				kind: "artifact",
				format: {
					sections: [
						"고치기: 해당 항목을 읽는다 → 지금 내용을 보여준다 → 무엇을 바꿀지 묻는다 → 저장한다",
						"보기: 저장된 항목을 전부 읽어 정리된 형태로 보여준다",
					],
				},
				auditIds: ["TV-16", "TV-20", "TV-21"],
				verifyHint: "고치기 절차에 '현재 내용 보여주기' 단계가 있는지",
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "open-with-punch",
				summary: "빌드업 없이 핵심으로 열고, 짧게 쓴다",
				detail:
					"첫 문장은 숫자·대담한 주장·통념을 뒤집는 관점 중 하나로 연다. 정의로 시작하지 않고 '혹시 이런 적 없으신가요' 같은 도입도 쓰지 않는다. 한 문단에 아이디어 하나만 담고, 비교할 것이 나오면 문장으로 늘어놓지 말고 표로 만든다.",
				role: "output-rule",
				kind: "artifact",
				format: {
					count: "문단당 아이디어 1개 · 문장당 20단어 미만 · 비교는 전부 표로",
				},
				examples: [
					{
						polarity: "bad",
						text: "'○○란 무엇인가'로 문서를 연다 — 정의로 시작하지 않는다",
					},
					{
						polarity: "good",
						text: "'세 번 고쳐 썼고 세 번 다 같은 자리에서 막혔다'로 연다",
					},
				],
				auditIds: ["TV-17"],
				verifyHint: "수치 규정(20단어·비교는 표로)이 살아 있는지",
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "scannable-bold",
				summary: "굵은 글씨만 읽어도 논지가 서게 만든다",
				detail:
					"강조는 장식이 아니라 **훑어 읽는 사람을 위한 두 번째 경로**다. 그래서 굵게 칠할 자리는 결론이지 도입부가 아니다. 문단마다 하나둘로 제한하는 이유는 늘어나는 순간 강조가 아무것도 강조하지 않게 되기 때문이다.",
				role: "output-rule",
				kind: "artifact",
				format: {
					count: "문단당 굵은 글씨 1~2개까지",
				},
				examples: [
					{
						polarity: "good",
						text: "굵은 부분만 이어 읽었을 때 글의 주장이 그대로 나온다",
					},
					{
						polarity: "bad",
						text: "설명을 이끄는 앞부분을 굵게 칠하고 정작 결론은 평문으로 둔다",
					},
				],
				auditIds: ["TV-17"],
				verifyHint: "강조 개수 제한과 '무엇을 굵게 칠할지' 기준이 있는지",
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "substance-over-performance",
				summary: "태도가 아니라 근거로 뒷받침된 의견을 낸다",
				detail:
					"'○○에는 단점이 있을 수 있습니다'가 아니라 '○○는 이래서 안 된다'로 쓴다. 읽는 사람은 백과사전이 아니라 관점을 보러 왔다. 다만 관점은 데이터·계산·직접 해본 경험으로 받쳐야 하고, 세게 말하는 태도로 대신하지 않는다.",
				role: "constraint",
				kind: "artifact",
				examples: [
					{
						polarity: "bad",
						text: "'개인적으로는 조금 아쉬운 부분이 있을 수도 있다고 생각합니다'",
					},
					{
						polarity: "good",
						text: "'세 번 재봤고 세 번 다 느렸다 — 이 방식은 쓸 수 없다'",
					},
				],
				auditIds: ["TV-17"],
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "experience-first",
				summary: "직접 해본 것과 아닌 것을 갈라 적는다",
				detail:
					"'이렇게 하세요'보다 '나는 이렇게 했다'가 강하다. 앞의 것은 누구나 쓸 수 있지만 뒤의 것은 해본 사람만 쓸 수 있기 때문이다. 그리고 안 해본 것을 쓸 때는 안 해봤다고 밝힌다 — 밝히지 않으면 글 전체의 신뢰가 같이 깎인다. 야심은 겸손한 척으로도 자랑으로도 아니라 **구체적인 결정을 그대로 적는 방식**으로 드러낸다. '운이 좋았다'로 뭉개지 말고 무엇을 어떻게 정했는지 적으면 판단은 읽는 사람이 한다.",
				role: "output-rule",
				kind: "artifact",
				examples: [
					{
						polarity: "good",
						text: "'두 가지를 다 써봤는데 두 번째에서 이 문제가 났다'",
					},
					{
						polarity: "bad",
						text: "'운이 좋았습니다' — 무엇을 어떻게 정했는지가 빠진다",
					},
				],
				auditIds: ["TV-17"],
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "guardrails-against-performance",
				summary:
					"'세게 쓰라'는 규칙에는 '과시로 넘어가지 말라'는 짝 규칙이 반드시 붙는다",
				detail:
					"강한 목소리를 요구하는 규칙만 두면 결과물이 과시적인 글로 기운다. 그래서 이 종류의 스킬은 작문 규칙과 **함께 적용되는** 견제 규칙을 별도 묶음으로 둔다 — 한쪽만 있으면 다른 쪽이 폭주한다. 판정 기준은 이렇다: 1인칭 과시와 포장을 걷어냈을 때 글이 약해진다면, 그 글은 처음부터 약했던 것이다. 권위는 포장이 아니라 구체가 만든다.",
				role: "constraint",
				kind: "artifact",
				adapted: true,
				examples: [
					{
						polarity: "bad",
						text: "선언문투의 마무리 — 세 번 반복하는 문장, 표어 같은 맺음말",
					},
					{
						polarity: "bad",
						text: "청중에게 설교하듯 쓴다 — 동료에게 말하듯 쓰는 것과 다르다",
					},
					{
						polarity: "good",
						text: "자랑할 대목을 빼고 결정과 수치만 남겼는데도 글이 그대로 선다",
					},
				],
				auditIds: ["TV-18"],
				verifyHint:
					"'세게 쓰라'와 '과시하지 말라'가 짝으로 나오는지, 한쪽만 있는지",
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "say-what-it-is",
				summary: "아닌 것을 나열하지 말고 인 것을 한 문장으로 적는다",
				detail:
					"'이건 A가 아닙니다. B도 아니고요. C는 더더욱 아닙니다.' — 세 문장을 쓰고 아무것도 말하지 않은 상태다. 읽는 사람은 여전히 그게 무엇인지 모른다. 부정으로 경계를 그리는 것은 정의를 먼저 준 다음에나 값을 한다.",
				role: "constraint",
				kind: "artifact",
				examples: [
					{
						polarity: "bad",
						text: "'이건 강의도 아니고 상담도 아니고 컨설팅도 아닙니다'",
					},
					{
						polarity: "good",
						text: "'같이 앉아서 당신 코드를 고치는 두 시간입니다'",
					},
				],
				auditIds: ["TV-18"],
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "foil-is-advice-not-people",
				summary: "대비할 상대가 필요하면 사람이 아니라 나쁜 조언·구조를 세운다",
				detail:
					"금지로 끝내지 않고 **대신 무엇을 쓸지**까지 정하는 것이 이 규칙의 핵심이다. 자기를 돋보이게 하려고 다른 사람을 희화화하면 그 순간 글의 신뢰가 깎이고, 특히 자기보다 앞 단계에 있는 사람을 표적으로 삼는 것이 그렇다. 대비가 필요하면 표적을 사람에서 **잘못된 조언**이나 **잘못된 구조**로 옮긴다.",
				role: "constraint",
				kind: "artifact",
				examples: [
					{
						polarity: "bad",
						text: "'요즘 주니어들은 이것도 모르고 덤빈다'",
					},
					{
						polarity: "good",
						text: "'일단 만들고 나중에 고치라는 조언이 이 문제를 만든다'",
					},
				],
				auditIds: ["TV-18"],
				verifyHint: "금지만 있는지, 사람→조언/구조로 바꾸라는 치환까지 있는지",
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "no-parroting",
				summary: "답글에서 상대 말을 되풀이하지 않고 새로운 것부터 놓는다",
				detail:
					"댓글·리뷰·글에 답할 때 상대가 한 말을 다시 요약하거나 '○○라고 하셨는데'로 시작하지 않는다. 읽는 사람은 원문을 이미 봤다. 첫 줄에 놓을 것은 상대에게 없던 것이다 — 반론이든, 구체적인 수치든, 다른 각도든.",
				role: "output-rule",
				kind: "artifact",
				examples: [
					{
						polarity: "bad",
						text: "'말씀하신 것처럼 성능이 중요하다는 점에 동의합니다. 그런데…'",
					},
					{
						polarity: "good",
						text: "'같은 걸 300만 건에서 재보면 순서가 뒤집힌다'",
					},
				],
				auditIds: ["TV-18"],
				sourceIds: ["tone-of-voice"],
			},
			{
				id: "voice-enforcement-checklist",
				summary: "넘기기 전에 저장된 프로필과 고정 규칙을 함께 훑는다",
				detail:
					"이 점검표는 두 갈래가 한 목록에서 합류하는 자리다 — 절반은 사용자가 채운 프로필(특성·어휘·금지 문구·채널·예시 표본)이고, 절반은 문서가 정한 규칙(도입부·강조·군더더기·과시 금지)이다. 프로필만 보면 글이 늘어지고, 규칙만 보면 누가 쓴 글인지 사라진다. 전수 점검이 아니라 **자주 무너지는 자리만 고른 선별 점검**이다.",
				role: "verification",
				kind: "artifact",
				adapted: true,
				format: {
					sections: [
						"도입부가 빌드업·정의 없이 열리는가",
						"보이스 특성이 저장한 프로필과 맞는가",
						"쓰기로 한 어휘를 쓰고 안 쓰기로 한 어휘를 피했는가",
						"금지 문구가 어디에도 없는가",
						"채널 규칙(길이·톤·형식)을 적용했는가",
						"굵은 글씨만 읽어도 논지가 서는가",
						"저장한 예시 문단과 같은 결인가",
						"모든 문장이 값을 하는가",
						"과시하는 포즈나 선언문 기운이 없는가",
						"사람을 표적으로 삼지 않았는가",
						"아닌 것이 아니라 인 것을 말하는가",
						"답글이 상대 말을 되풀이하지 않는가",
					],
				},
				auditIds: ["TV-19"],
				verifyHint:
					"점검표가 있는지, 사용자 프로필 항목과 고정 규칙 항목이 둘 다 들어 있는지",
				sourceIds: ["tone-of-voice"],
			},
		],
	},
	{
		id: "documentation",
		label: "문서 작성",
		sources: [
			{
				id: "anthropic-doc-coauthoring",
				name: "doc-coauthoring (Anthropic skills)",
				author: "Anthropic",
				url: "https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring",
				// 2026-08-19 정정: 종전 "Apache-2.0" 표기는 확인된 사실이 아니었다.
				// `anthropics/skills`에는 루트 라이선스가 없고 GitHub API의 license도
				// null이다. 스킬 폴더마다 개별 LICENSE.txt를 두는 방식인데 18개 폴더에는
				// 있고 이 폴더에는 없다. README도 "많은(many) 스킬이 Apache 2.0"이라고만
				// 적는다. 화면에 그대로 표시되는 값이므로 추측을 적어둘 수 없다.
				license: "확인되지 않음",
				summaryOnly: true,
				collectedAt: "2026-08-12",
			},
		],
		patterns: [
			{
				id: "context-gathering-first",
				summary: "쓰기 전에 아는 것의 격차부터 메운다",
				detail:
					"글쓴이는 알고 읽는 쪽은 모르는 것이 문서를 망친다. 그래서 초안 전에 맥락부터 채운다. 받을 때는 정리해서 달라고 하지 말고 있는 대로 쏟아내게 한다 — 정리를 요구하면 정리하기 어려운 것이 빠지는데, 그게 대개 가장 중요한 것이다. 짧게 답해도 되고 형식이 없어도 된다고 먼저 알린다. **언제까지 모아야 하는지가 이 절차의 핵심이다** — 기초를 다시 설명받지 않고도 예외 상황과 맞바꿈을 물을 수 있게 되면 충분히 모은 것이다. 이 조건이 없으면 '충분히 모았다'가 판단할 수 없는 말이 된다.",
				role: "workflow-step",
				kind: "artifact",
				format: {
					count: "시작 질문 5개 · 초기 덤프 뒤 빈틈 질문 5~10개(번호를 붙인다)",
					sections: [
						"시작 질문 — 문서 종류 / 주 독자 / 읽고 난 뒤 원하는 변화 / 따를 형식이나 틀 / 그 밖의 제약",
						"쏟아내게 할 것 — 배경 / 관련 논의 / 다른 안을 쓰지 않는 이유 / 조직 사정 / 일정 압박 / 기술 구조와 의존 / 이해관계자 우려",
					],
				},
				exception: "고칠 문서가 이미 있으면 질문보다 현재 상태를 먼저 읽는다",
				// 정책 B 등급 2 — 개념은 우리 말로 요약했다. 수치는 방법의 매개변수라
				// 담고(2026-08-21 정정), 원문의 질문 문장·예시 문구는 담지 않았다.
				adapted: true,
				auditIds: ["DC-02", "DC-03", "DC-06", "DC-11", "DC-12"],
				sourceIds: ["anthropic-doc-coauthoring"],
			},
			{
				id: "section-by-section",
				summary: "한 섹션씩 돌린다 — 질문·발산·선별·초안·다듬기",
				// 원문은 `str_replace`·`create_file`이라는 도구 이름으로 이 규정을 쓴다.
				// 그 이름을 옮기지 않는 이유는 라이선스가 아니라 **환경**이다 — 원문이
				// 전제한 실행 환경의 도구 이름이라 Tailor 사용자의 환경에는 없을 수 있고,
				// 그러면 생성된 스킬에 안 통하는 지시가 박힌다. writing-skills 감사에서
				// `render-graphs.js`와 `@` 링크 문법을 뺀 것과 같은 판단이다.
				// 지시의 알맹이는 "전체 재출력 금지"이므로 그쪽을 남긴다.
				detail:
					"문서 전체를 한 번에 쓰지 않고 섹션 하나씩 같은 회로를 돈다. **모르는 게 가장 많은 섹션부터 시작하고 요약 성격의 섹션은 마지막에 쓴다** — 요약을 먼저 쓰면 아직 정해지지 않은 것을 요약하게 된다. 선별할 때는 무엇을 남길지만 받지 말고 **짧은 이유를 함께 받는다.** 이유가 쌓여야 다음 섹션에서 무엇을 고를지 판단할 수 있고, 그렇지 않으면 매 섹션마다 처음부터 묻게 된다. 번호로 답하지 않고 뭉뚱그려 답해도 뜻을 추려 그대로 진행한다. 고칠 때 문서 전체를 다시 출력하지 않는다 — 바뀐 부분만 손댄다.",
				role: "workflow-step",
				kind: "artifact",
				format: {
					count:
						"섹션 후보 3~5개 제안 · 섹션마다 질문 5~10개 · 담을 것 후보 5~20개",
				},
				flow: [
					{
						id: "structure",
						label: "섹션 구성을 정하고 동의를 받는다",
						gate: "어떤 섹션이 필요한지 모르면 문서 종류에 맞춰 3~5개를 제안한다",
					},
					{
						id: "scaffold",
						label: "모든 섹션에 자리표시자를 넣은 뼈대를 먼저 만든다",
						patternId: "scaffold-before-filling",
					},
					{
						id: "ask",
						label: "이 섹션에 무엇을 담을지 질문 5~10개",
					},
					{
						id: "brainstorm",
						label: "담을 만한 것을 5~20개 펼친다",
						gate: "이미 받았지만 잊힌 맥락과 아직 안 나온 관점을 함께 본다",
					},
					{
						id: "curate",
						label: "남길 것·뺄 것·합칠 것을 이유와 함께 받는다",
					},
					{
						id: "gap",
						label: "빠진 것이 없는지 한 번 더 묻는다",
						branches: [{ when: "빠진 것이 있으면", goto: "brainstorm" }],
					},
					{ id: "draft", label: "자리표시자를 실제 내용으로 바꾼다" },
					{
						id: "refine",
						label: "피드백을 받아 바뀐 부분만 고친다",
						gate: "세 번 연속 큰 변화가 없으면 무엇을 뺄 수 있는지 묻는다",
						branches: [
							{ when: "남은 섹션이 있으면", goto: "ask" },
							{ when: "전부 끝났으면", goto: "done" },
						],
					},
				],
				// 정책 B 등급 2 — 개념은 우리 말로 요약했다. 수치는 방법의 매개변수라
				// 담고(2026-08-21 정정), 원문의 질문 문장·예시 문구는 담지 않았다.
				adapted: true,
				auditIds: [
					"DC-13",
					"DC-14",
					"DC-15",
					"DC-17",
					"DC-18",
					"DC-20",
					"DC-21",
					"DC-23",
					"DC-26",
				],
				sourceIds: ["anthropic-doc-coauthoring"],
			},
			{
				id: "fresh-reader-test",
				summary: "맥락이 섞이지 않은 새 독자에게 읽혀 맹점을 찾는다",
				detail:
					"쓴 사람은 이미 알기 때문에 무엇이 빠졌는지 못 본다. 그래서 이 대화의 맥락을 하나도 모르는 쪽에게 문서만 주고 읽힌다. 먼저 독자가 실제로 물을 법한 질문을 예측해 그것부터 물어보고, 무엇을 맞히고 무엇을 틀렸는지 정리한다. 틀린 곳이 나오면 그 섹션의 다듬기로 되돌아간다. **언제 끝나는지가 정해져 있다** — 일관되게 맞히고 새로운 빈틈이 더 안 나오면 끝이다.",
				role: "verification",
				kind: "artifact",
				format: {
					count: "예측 질문 5~10개 + 추가 점검 3종",
					sections: [
						"모호해서 여러 뜻으로 읽히는 곳이 있는가",
						"이미 안다고 전제하고 넘어간 지식이 있는가",
						"문서 안에서 서로 어긋나는 곳이 있는가",
					],
				},
				// 정책 B 등급 2 — 개념은 우리 말로 요약했다. 수치는 방법의 매개변수라
				// 담고(2026-08-21 정정), 원문의 질문 문장·예시 문구는 담지 않았다.
				adapted: true,
				auditIds: ["DC-28", "DC-29", "DC-30", "DC-31", "DC-32", "DC-33"],
				sourceIds: ["anthropic-doc-coauthoring"],
			},
			{
				id: "trim-filler",
				summary: "8할쯤에서 전체를 다시 읽고 덜어낸다",
				detail:
					"섹션마다 다듬다 보면 섹션 사이의 어긋남은 아무도 안 본다. 대부분의 섹션이 끝난 시점에 전체를 처음부터 다시 읽는다. 마지막까지 미루면 고칠 기운이 남아 있지 않다. 다듬기 중에도 세 번 연속 큰 변화가 없으면 더 넣을 것을 찾지 말고 뺄 것을 묻는다 — 그 지점이 대개 더 나아지지 않는 지점이다.",
				role: "verification",
				kind: "artifact",
				format: {
					sections: [
						"섹션을 넘나드는 흐름과 일관성",
						"중복되거나 서로 어긋나는 곳",
						"맹탕이거나 어디서나 할 수 있는 말",
						"모든 문장이 제 몫을 하는가",
					],
				},
				// 정책 B 등급 2 — 개념은 우리 말로 요약했다. 수치는 방법의 매개변수라
				// 담고(2026-08-21 정정), 원문의 질문 문장·예시 문구는 담지 않았다.
				adapted: true,
				auditIds: ["DC-26", "DC-27"],
				sourceIds: ["anthropic-doc-coauthoring"],
			},
			{
				id: "scaffold-before-filling",
				summary: "자리표시자만 넣은 뼈대를 먼저 만들고 채운다",
				detail:
					"섹션 제목과 빈칸만 있는 문서를 먼저 만들어 두면, 쓰는 쪽과 읽는 쪽이 같은 지도를 보게 된다. 지금 어디를 채우는 중이고 무엇이 남았는지가 문서 자체에 드러나므로 따로 설명할 필요가 없다.",
				role: "workflow-step",
				kind: "artifact",
				// 정책 B 등급 2 — 개념은 우리 말로 요약했다. 수치는 방법의 매개변수라
				// 담고(2026-08-21 정정), 원문의 질문 문장·예시 문구는 담지 않았다.
				adapted: true,
				auditIds: ["DC-16"],
				sourceIds: ["anthropic-doc-coauthoring"],
			},
			{
				id: "offer-then-defer",
				summary: "절차를 제안하되 강요하지 않고, 답답해하면 조정한다",
				detail:
					"이 방식을 쓸지 먼저 제안하고 무엇을 하게 되는지 설명한다. 거절하면 그대로 자유롭게 간다. 어조는 직설적이고 절차적으로 하되 이 방식을 팔려고 하지 않는다 — 좋다고 설득하기 시작하면 사용자는 거절하기 어려워지고, 그건 동의가 아니다. 이유는 사용자의 행동이 달라지는 자리에서만 짧게 붙인다. 중간에 답답해하면 오래 걸린다는 것을 먼저 인정하고 빨리 가는 방법을 제안한다. 단계를 건너뛰고 싶어 하면 자유 형식으로 갈지 묻는다.",
				role: "trigger",
				kind: "artifact",
				// 정책 B 등급 2 — 개념은 우리 말로 요약했다. 수치는 방법의 매개변수라
				// 담고(2026-08-21 정정), 원문의 질문 문장·예시 문구는 담지 않았다.
				adapted: true,
				auditIds: ["DC-01", "DC-38", "DC-39"],
				sourceIds: ["anthropic-doc-coauthoring"],
			},
			{
				id: "user-owns-the-doc",
				summary: "문서의 주인은 사용자다 — 고치지 말고 무엇을 바꿀지 받는다",
				detail:
					"첫 섹션을 쓸 때 알린다 — 직접 고치지 말고 무엇을 어떻게 바꿀지 말해달라고. 그래야 취향과 판단 기준이 쌓여 다음 섹션에서 덜 묻게 된다. 그래도 직접 고쳤다면 무엇을 고쳤는지 기억해 다음 섹션에 반영한다. 그리고 다 끝났을 때 그것으로 끝내지 않는다 — 사용자 본인이 마지막으로 통독하도록 권하고, 사실·링크·기술 세부를 다시 확인하게 한다. **문서의 주인이자 품질에 책임지는 쪽은 사용자다.**",
				role: "constraint",
				kind: "artifact",
				// 정책 B 등급 2 — 개념은 우리 말로 요약했다. 수치는 방법의 매개변수라
				// 담고(2026-08-21 정정), 원문의 질문 문장·예시 문구는 담지 않았다.
				adapted: true,
				auditIds: ["DC-24", "DC-25", "DC-35", "DC-36"],
				sourceIds: ["anthropic-doc-coauthoring"],
			},
			{
				id: "ask-before-reaching-out",
				summary: "모르는 것을 찾아보기 전에 먼저 묻고 기다린다",
				detail:
					"맥락 속에 모르는 이름이나 프로젝트가 나오면 곧바로 찾아 나서지 않는다. 찾아봐도 되는지 묻고 답을 기다린다. 조용히 뻗어 나가면 사용자는 무엇이 어디까지 조회됐는지 모르게 되고, 그 상태로는 결과를 믿기 어렵다. 끌어올 수 있는 경로가 없으면 없다고 밝히고 붙여넣기를 요청한다.",
				role: "constraint",
				kind: "artifact",
				// 정책 B 등급 2 — 개념은 우리 말로 요약했다. 수치는 방법의 매개변수라
				// 담고(2026-08-21 정정), 원문의 질문 문장·예시 문구는 담지 않았다.
				adapted: true,
				auditIds: ["DC-08", "DC-09"],
				sourceIds: ["anthropic-doc-coauthoring"],
			},
		],
	},
	{
		id: "explanation",
		label: "설명형 (쉽게 설명)",
		// 출처=Tailor 자체(용어사전 방식). 외부 clean-라이선스 설명 스킬을 못 찾아,
		// 이미 제품이 실천 중인 접근을 정리함(제품 정체성과 일치, 라이선스 문제 없음).
		//
		// 2026-08-21 채우기. "감사할 원문이 없다"는 이유로 회차에서 빠져 있었으나,
		// **원문은 있었다** — `src/data/glossary.ts`의 용어 21개가 이 방식의 실물이다.
		// 아래 패턴은 그 21개를 읽고 실제로 작동하는 규칙을 뽑은 것이지, 바람직해
		// 보이는 것을 지어낸 것이 아니다. 값(글자 수, 비유 목록)은 실측이다.
		//
		// `auditIds`를 달지 않은 이유: 감사 문서는 외부 원문을 항목화한 것인데 이
		// 소스는 자체 제작이라 대응하는 감사 문서가 없다. 근거를 되짚으려면
		// `glossary.ts`를 직접 보면 된다.
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
				summary:
					"추상 개념을 일상의 구체적 장면에 빗대고, 비유의 항을 되짚는다",
				detail:
					"누구나 아는 일상 상황으로 치환해 설명한다. 다만 비유를 한 번 대고 끝내면 분위기만 남고 내용이 안 남는다 — 비유의 각 항이 개념의 무엇에 해당하는지 곧바로 되짚는다. 한 세계에서 두 개념이 짝을 이루면 그 세계를 그대로 재사용한다(매장의 홀과 주방처럼). 비유는 하나, 많아야 둘이다 — 셋이 넘어가면 비유끼리 헷갈린다.",
				role: "output-rule",
				kind: "artifact",
				options: [
					{
						value: "메모·할 일 목록",
						character:
							"순서대로 실행되는 것 — 스크립트처럼 적어두면 알아서 도는 것",
					},
					{
						value: "식당 메뉴판",
						character:
							"속을 몰라도 정해진 방식으로 요청하면 결과가 나오는 것 — 규약·인터페이스",
					},
					{
						value: "매장의 홀과 주방",
						character:
							"보이는 쪽과 안 보이는 쪽이 짝을 이루는 것 — 앞단과 뒷단",
					},
					{
						value: "표준 전기 어댑터",
						character:
							"제각각인 것들을 하나의 방식으로 연결해주는 것 — 공통 규격",
					},
					{
						value: "심부름꾼",
						character: "따로 보내 결과만 받아오는 것 — 위임되는 작업",
					},
				],
				examples: [
					{
						polarity: "good",
						text: "'식당 메뉴판이라고 생각하면 쉬워요 — 주방이 어떻게 요리하는지 몰라도, 메뉴판에 적힌 대로 주문하면 원하는 요리가 나오죠.' 뒤이어 '이렇게 요청하면 이런 결과를 준다고 미리 정해둔 규칙'으로 되짚는다",
					},
					{
						polarity: "bad",
						text: "'API는 식당 메뉴판 같은 거예요.'로 끝내기 — 무엇이 메뉴판이고 무엇이 주방인지 안 짚으면 읽는 사람이 스스로 옮겨야 한다",
					},
				],
				sourceIds: ["tailor-glossary"],
			},
			{
				id: "plain-words-first",
				summary: "전문용어를 먼저 꺼내지 않되, 없애지도 않는다",
				detail:
					"쉬운 말로 먼저 풀고 전문용어는 뒤에 괄호로 곁들인다. 용어로 시작해 겁주지 않는 것이 목적이지, 용어를 빼는 것이 목적이 아니다 — 빼버리면 나중에 그 말을 만났을 때 알아볼 수가 없다. 영문 원어를 함께 적고, 약어는 무엇의 약자인지 풀어 쓴다.",
				role: "constraint",
				kind: "artifact",
				examples: [
					{
						polarity: "good",
						text: "'까만 화면에 글자를 쳐서 컴퓨터에 명령을 내리는 방식(터미널)이에요' — 쉬운 말이 먼저, 용어는 괄호로",
					},
					{
						polarity: "good",
						text: "'CLI (Command Line Interface)' — 약어는 무엇의 약자인지 밝힌다",
					},
					{
						polarity: "bad",
						text: "'CLI는 셸을 통해 커맨드를 입력하는 인터페이스입니다' — 모르는 말을 모르는 말로 설명했다",
					},
					{
						polarity: "bad",
						text: "용어를 아예 안 쓰고 '까만 화면'으로만 부르기 — 검색도 못 하고 남과 얘기도 못 한다",
					},
				],
				sourceIds: ["tailor-glossary"],
			},
			{
				id: "summary-then-detail",
				summary: "명사구 한 줄로 감을 준 뒤 짧게 풀이한다",
				detail:
					"먼저 '무엇인가'를 명사구 한 줄로 답한다 — 문장이 아니라 '~하는 것' 형태여야 훑을 때 눈에 걸린다. 그다음 풀이는 짧게 유지한다. 길어지면 읽는 사람이 요약만 보고 넘어가고, 그러면 풀이를 쓴 값이 없다.",
				role: "output-rule",
				kind: "artifact",
				format: {
					// glossary.ts 21개 항목 실측치다.
					count: "요약 13~31자(명사구) · 풀이 82~161자(2~3문장)",
					template: "<용어>(<영문 원어>) — <명사구 한 줄>",
				},
				examples: [
					{
						polarity: "good",
						text: "'스크립트 — 미리 적어둔 할 일 목록' · '루틴 — 정해진 시간에 자동으로 실행되는 작업'",
					},
					{
						polarity: "bad",
						text: "'스크립트는 컴퓨터가 순차적으로 실행할 수 있도록 작성된 명령의 집합을 의미합니다' — 문장이고, 길고, 어려운 말로 어려운 말을 설명했다",
					},
				],
				sourceIds: ["tailor-glossary"],
			},
			{
				id: "include-why",
				summary: "무엇이 좋은지·왜 쓰는지를 곁들인다",
				detail:
					"뜻만 알려주면 '그래서 나한테 왜 필요한데'가 남는다. 이것이 없을 때 무엇이 불편했는지, 있으면 무엇이 편해지는지를 함께 적는다. 정의를 정확히 쓰는 것보다 이쪽이 기억에 남는다.",
				role: "workflow-step",
				kind: "artifact",
				examples: [
					{
						polarity: "good",
						text: "'한 번 써두면 매번 사람이 시키지 않아도 컴퓨터가 알아서 처리해요'",
					},
					{
						polarity: "good",
						text: "'매번 같은 설명을 반복하는 대신, 한 번 써두고 필요할 때만 꺼내 쓰는 매뉴얼'",
					},
					{
						polarity: "bad",
						text: "'재사용성과 유지보수성을 높여줍니다' — 무엇이 어떻게 편해지는지가 없다",
					},
				],
				sourceIds: ["tailor-glossary"],
			},
			{
				id: "land-on-what-they-see",
				summary: "설명을 지금 눈앞에 있는 것으로 착지시킨다",
				detail:
					"일반론으로 끝내면 '그래서 이게 나랑 무슨 상관인데'가 남는다. 마지막 한 문장을 읽는 사람이 지금 보고 있는 것·쓰고 있는 것으로 연결한다. 연결할 것이 없으면 억지로 만들지 않는다 — 없는 관련성을 지어내는 것이 일반론으로 끝내는 것보다 나쁘다.",
				role: "output-rule",
				kind: "artifact",
				exception: "설명하는 개념이 이 맥락과 실제로 무관할 때는 붙이지 않는다",
				examples: [
					{
						polarity: "good",
						text: "딥링크를 설명한 뒤 — '이 사이트의 「내 클로드로 보내기」 버튼이 바로 이 방식이에요'",
					},
					{
						polarity: "good",
						text: "스킬을 설명한 뒤 — '이 사이트가 만들어드리는 게 바로 이 파일이에요'",
					},
					{
						polarity: "bad",
						text: "'다양한 분야에서 널리 활용되고 있습니다' — 어디에도 착지하지 않았다",
					},
				],
				sourceIds: ["tailor-glossary"],
			},
			{
				id: "name-the-unfamiliarity",
				summary: "낯설어 보인다는 것을 먼저 인정하고 문턱을 낮춘다",
				detail:
					"겁먹게 생긴 것을 아무렇지 않게 설명하면 읽는 사람은 '나만 어렵나' 하고 닫는다. 낯설어 보인다는 사실을 먼저 말한 뒤, 실제로 넘어야 할 문턱이 무엇인지 좁혀준다. 어렵지 않다고 우기는 것과는 다르다 — 무엇까지만 하면 되는지를 밝히는 것이다.",
				role: "output-rule",
				kind: "artifact",
				examples: [
					{
						polarity: "good",
						text: "'낯설어 보이지만, 일단 여는 법만 익히면 그 다음은 지금 이 대화처럼 그냥 자연스러운 말로 요청하면 됩니다' — 넘을 문턱을 「여는 법」 하나로 좁혔다",
					},
					{
						polarity: "bad",
						text: "'생각보다 어렵지 않아요!' — 무엇이 안 어려운지가 없어서 근거 없는 위로다",
					},
				],
				sourceIds: ["tailor-glossary"],
			},
			{
				id: "point-to-the-better-fit",
				summary: "이것 말고 다른 게 맞는 경우를 알려준다",
				detail:
					"설명하는 대상을 계속 좋게만 말하면, 읽는 사람은 자기 상황에 안 맞는데도 그것을 쓰려 한다. 더 잘 맞는 다른 방법이 있으면 그 조건과 함께 밝힌다. 신뢰를 잃지 않는 쪽이 결국 더 많이 쓰이게 만든다.",
				role: "output-rule",
				kind: "artifact",
				examples: [
					{
						polarity: "good",
						text: "'반복되는 일을 자동화하고 싶을 때는 스킬 대신 이쪽(루틴)이 더 잘 맞는 경우가 많아요'",
					},
					{
						polarity: "bad",
						text: "어떤 상황에서든 이걸 쓰면 된다고만 적기 — 안 맞는 사람이 한 번 겪고 떠난다",
					},
				],
				sourceIds: ["tailor-glossary"],
			},
		],
	},
];

// 생성 시 코퍼스는 "전체를 정적으로" 프롬프트에 주입하고(정적 접두부라 캐시 가능),
// 어떤 카테고리·아키타입·패턴을 참고할지는 생성 AI가 고른다. 키워드 하드필터는
// 부분문자열 오매칭(ui→build)과 캐싱 모순 때문에 두지 않는다.
//
// 2026-08-19: `keywords` 필드를 지웠다. 하드필터를 폐기할 때 "AI에게 주는 힌트로만
// 남긴다"고 적어뒀지만 **그 구현이 따라간 적이 없다** — `buildCorpusSection()`은
// 카테고리 `label`과 패턴만 렌더하므로 keywords는 모델에 도달한 적이 없고,
// 데이터 파일 밖에서 이 필드를 참조하는 코드도 없었다. 그런데 코드에는 남아 있어서
// "협소한 keywords 탓에 패턴이 안 뽑힌다"는 **틀린 진단**을 한 번 낳았다
// (2026-08-18 정정). 죽은 필드가 살아 있는 것처럼 보이는 상태가 가장 나쁘다.
//
// 나중에 카테고리 선별 주입을 하게 되면 거르는 장치가 필요해지는데, 그때는 요청
// 문장을 실제로 분석하는 방식이라 이 필드로는 못 한다. 그때 새로 설계할 것.

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
