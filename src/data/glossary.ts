export type GlossaryTerm = {
	slug: string;
	term: string;
	english?: string;
	acronymOf?: string;
	summary: string;
	explanation: string;
};

export const glossaryTerms: GlossaryTerm[] = [
	{
		slug: "script",
		term: "스크립트",
		english: "Script",
		summary: "미리 적어둔 할 일 목록",
		explanation:
			"카페 사장님이 알바생에게 남긴 메모 — '냉장고 열기 → 재고 확인 → 부족하면 발주서 쓰기'처럼, 순서대로 실행할 일을 적어둔 목록이에요. 스크립트는 이 메모를 사람이 아니라 컴퓨터가 읽고 그대로 실행하게 만든 거예요. 한 번 써두면 매번 사람이 시키지 않아도 컴퓨터가 알아서 처리해요.",
	},
	{
		slug: "agent",
		term: "에이전트",
		english: "Agent",
		summary: "스스로 판단해서 일하는 AI 프로그램",
		explanation:
			"파일을 읽고, 고치고, 명령을 실행하고, 그 결과를 보고 다음 행동을 스스로 정하는 프로그램이에요. 한 줄씩 시키는 게 아니라 '이거 고쳐줘'라고만 말해도, 필요한 단계를 알아서 여러 번 거쳐서 끝까지 처리해요. Claude Code가 대표적인 예시예요.",
	},
	{
		slug: "skill",
		term: "스킬",
		english: "Skill",
		summary: "에이전트에게 미리 적어둔 업무 매뉴얼",
		explanation:
			"에이전트에게 '이런 상황에선 이렇게 일해'라고 미리 적어둔 지시문 파일(SKILL.md) 하나예요. 매번 같은 설명을 반복하는 대신, 한 번 써두고 필요할 때만 꺼내 쓰는 매뉴얼이라고 보시면 돼요. 이 사이트가 만들어드리는 게 바로 이 파일이에요.",
	},
	{
		slug: "cli",
		term: "CLI",
		acronymOf: "Command Line Interface",
		summary: "마우스 없이 글자로 명령하는 방식",
		explanation:
			"까만 화면에 글자를 쳐서 컴퓨터에 명령을 내리는 방식(터미널)이에요. 낯설어 보이지만, 일단 여는 법만 익히면 그 다음은 지금 이 대화처럼 그냥 자연스러운 말로 요청하면 됩니다. Claude Code는 이 방식으로도, 앱(Desktop) 형태로도 쓸 수 있어요.",
	},
	{
		slug: "subagent",
		term: "서브에이전트",
		english: "Subagent",
		summary: "메인 에이전트가 보내는 심부름꾼",
		explanation:
			"메인 에이전트가 '이거 좀 찾아봐 줘' 하고 보내는 보조 일꾼이에요. 심부름꾼은 결과만 들고 돌아오고, 그 사이 무슨 일이 있었는지는 메인 에이전트에게만 보고해요 — 사람은 결과만 받아보면 됩니다. 조사처럼 빠르게 끝날 일에 자주 쓰여요.",
	},
	{
		slug: "routine",
		term: "루틴",
		english: "Routine",
		summary: "정해진 시간에 자동으로 실행되는 작업",
		explanation:
			"'매일 아침 9시에 어제 올라온 이슈 요약해줘'처럼, 정해진 시간이나 조건이 되면 사람 없이도 자동으로 실행되는 작업이에요. 코드를 몰라도 화면에서 클릭 몇 번으로 설정할 수 있어서, 반복되는 일을 자동화하고 싶을 때 스킬 대신 이쪽이 더 잘 맞는 경우가 많아요.",
	},
	{
		slug: "cowork",
		term: "Cowork",
		summary: "코딩이 아닌 일반 업무를 대신 처리",
		explanation:
			"코드가 아니라 엑셀 정리, 보고서 작성, 계약서 검토 같은 일반 사무 업무를 대신 처리해주는 기능이에요. 다루는 대상이 '코드'가 아니라 '문서·스프레드시트'라는 점만 빼면, 목표를 말하면 알아서 처리한다는 발상은 에이전트와 같아요.",
	},
	{
		slug: "deep-link",
		term: "딥링크",
		english: "Deep Link",
		summary: "클릭하면 특정 앱의 특정 화면으로 데려가는 주소",
		explanation:
			"인터넷 주소가 브라우저의 특정 페이지로 데려다주듯, 딥링크는 클릭하면 내 컴퓨터에 설치된 앱의 특정 화면으로 바로 데려다주는 특수한 주소예요. 이 사이트의 '내 클로드로 보내기' 버튼이 바로 이 방식으로, 만든 스킬을 여러분의 Claude 앱으로 곧장 전달합니다.",
	},
	{
		slug: "api",
		term: "API",
		acronymOf: "Application Programming Interface",
		summary: "서로 다른 프로그램이 대화하는 정해진 규칙",
		explanation:
			"식당 메뉴판이라고 생각하면 쉬워요 — 주방이 어떻게 요리하는지 몰라도, 메뉴판에 적힌 대로 주문하면 원하는 요리가 나오죠. API는 '이렇게 요청하면 이런 결과를 준다'고 미리 정해둔 규칙이에요. 우리 서비스도 이 규칙대로 Claude에게 요청을 보내서 스킬을 만듭니다.",
	},
	{
		slug: "mcp",
		term: "MCP",
		acronymOf: "Model Context Protocol",
		summary: "AI가 외부 도구·서비스에 연결하는 공통 규격",
		explanation:
			"AI 에이전트가 슬랙, 노션, 깃허브 같은 외부 서비스와 대화할 수 있게 해주는 '공용 어댑터'예요. 나라마다 다른 전기 콘센트 모양을 표준 어댑터 하나로 다 꽂을 수 있게 해주는 것처럼, MCP는 어떤 AI 툴이든 같은 방식으로 외부 도구에 연결할 수 있게 해줍니다.",
	},
	{
		slug: "frontend",
		term: "프론트엔드",
		english: "Frontend",
		summary: "사용자가 직접 보고 만지는 화면 부분",
		explanation:
			"웹사이트에서 눈에 보이는 모든 것 — 버튼, 글자, 색깔, 화면 배치 — 을 만드는 부분이에요. 매장으로 치면 손님이 드나드는 홀 공간에 해당해요.",
	},
	{
		slug: "backend",
		term: "백엔드",
		english: "Backend",
		summary: "화면 뒤에서 몰래 일하는 서버 부분",
		explanation:
			"사용자 눈에는 안 보이지만, 데이터를 저장하고 계산하고 외부 서비스(Claude API 등)에 요청을 보내는 부분이에요. 매장의 주방이라고 보면 돼요 — 손님은 못 보지만 실제 요리는 여기서 이뤄지죠. 비밀번호나 API 키처럼 숨겨야 할 값도 전부 이쪽에만 둡니다.",
	},
	{
		slug: "deploy",
		term: "배포",
		english: "Deploy",
		summary: "만든 걸 인터넷에 올려서 누구나 쓰게 하는 것",
		explanation:
			"내 컴퓨터에서만 돌아가던 걸, 전 세계 누구나 주소만 알면 접속할 수 있게 인터넷에 올리는 과정이에요. 이 프로젝트는 Vercel이라는 서비스를 통해 배포합니다.",
	},
	{
		slug: "env-var",
		term: "환경변수",
		english: "Environment Variable",
		summary: "코드에 직접 안 적고 따로 보관하는 비밀 값",
		explanation:
			"API 키나 비밀번호처럼 남에게 보이면 안 되는 값을, 코드 파일 안에 직접 적지 않고 서버에만 따로 보관해두는 방식이에요. 이렇게 하면 코드를 공개해도 비밀 값은 새어나가지 않아요.",
	},
	{
		slug: "repository",
		term: "저장소",
		english: "Repository (Repo)",
		summary: "코드를 버전별로 기록해두는 폴더",
		explanation:
			"코드가 바뀔 때마다 스냅샷을 찍어 기록해두는 폴더예요. 누가 언제 뭘 바꿨는지 전부 남아서, 문제가 생기면 예전 버전으로 되돌릴 수도 있어요. GitHub은 이 저장소를 인터넷에 올려두고 공유하는 서비스입니다.",
	},
	{
		slug: "open-source",
		term: "오픈소스",
		english: "Open Source",
		summary: "코드를 공개해서 누구나 보고 가져다 쓸 수 있게 한 것",
		explanation:
			"레시피를 숨기지 않고 누구나 보고 따라 만들 수 있게 공개하는 것과 같아요. 코드를 공개하면 다른 사람이 보고, 고치고, 자기 프로젝트에 가져다 쓸 수 있어요. 지금까지 살펴본 여러 스킬 저장소들도 대부분 오픈소스예요.",
	},
	{
		slug: "framework",
		term: "프레임워크",
		english: "Framework",
		summary: "미리 뼈대를 갖춰둔 개발 도구",
		explanation:
			"집을 지을 때 기초 골조가 미리 세워져 있으면 처음부터 다 지을 필요가 없는 것처럼, 자주 필요한 기본 구조를 미리 만들어둔 도구예요. 이 프로젝트는 'Next.js'라는 프레임워크 위에서 만들어지고 있어요.",
	},
	{
		slug: "package-manager",
		term: "패키지 매니저",
		english: "Package Manager",
		summary: "필요한 부품(라이브러리)을 자동으로 받아 관리해주는 도구",
		explanation:
			"다른 사람들이 미리 만들어둔 코드 조각(라이브러리)을 매번 손으로 찾아 다운받는 대신, 이름만 알려주면 자동으로 받아서 설치·관리해주는 도구예요. 이 프로젝트는 'pnpm'이라는 패키지 매니저를 씁니다.",
	},
	{
		slug: "webhook",
		term: "웹훅",
		english: "Webhook",
		summary: "어떤 일이 생기면 자동으로 알림을 보내주는 장치",
		explanation:
			"택배가 도착하면 문자로 알림이 오는 것처럼, 어떤 이벤트(코드가 올라옴, 결제가 됨 등)가 발생하면 정해둔 주소로 자동으로 소식을 보내주는 장치예요. 사람이 계속 확인하러 갈 필요 없이, 일이 생기면 저쪽에서 먼저 알려줍니다.",
	},
	{
		slug: "cache",
		term: "캐시",
		english: "Cache",
		summary: "자주 쓰는 걸 미리 꺼내놔서 빠르게 다시 쓰는 것",
		explanation:
			"매번 창고까지 가서 재료를 꺼내오는 대신, 자주 쓰는 재료를 조리대 옆에 미리 꺼내두는 것과 같아요. 한 번 계산하거나 조회한 결과를 잠깐 저장해뒀다가, 같은 요청이 다시 오면 새로 계산하지 않고 바로 꺼내 씁니다. 더 빠르고, 비용도 아낄 수 있어요.",
	},
	{
		slug: "markdown",
		term: "마크다운",
		english: "Markdown",
		summary: "간단한 기호로 글 서식을 표현하는 문서 형식",
		explanation:
			"제목 앞에 '#'을 붙이면 큰 글씨가 되고, 글자를 별표(**)로 감싸면 굵어지는 식으로, 간단한 기호만으로 문서 서식을 표현하는 방식이에요. 스킬 파일(SKILL.md)도 이 형식으로 작성됩니다 — 복잡한 프로그램 없이 메모장으로도 쓸 수 있어요.",
	},
];
