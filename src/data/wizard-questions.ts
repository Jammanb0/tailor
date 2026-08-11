export type WizardFieldType = "radio" | "textarea" | "checkbox";

export type WizardOption = {
	value: string;
	label: string;
	hint?: string;
};

export type WizardNote = {
	whenValue: string;
	message: string;
	glossarySlug?: string;
};

export type WizardQuestion = {
	id: string;
	mode: "required" | "advanced";
	title: string;
	description?: string;
	type: WizardFieldType;
	required: boolean;
	options?: WizardOption[];
	placeholder?: string;
	glossarySlug?: string;
	glossaryNote?: string;
	notes?: WizardNote[];
};

export const requiredQuestions: WizardQuestion[] = [
	{
		id: "tool",
		mode: "required",
		title: "어떤 AI 도구를 쓰고 계세요?",
		type: "radio",
		required: true,
		options: [
			{ value: "cli", label: "Claude Code (CLI, 터미널에서 실행)" },
			{ value: "desktop", label: "Claude 데스크톱 앱" },
			{ value: "both", label: "둘 다 써요" },
			{ value: "unsure", label: "잘 모르겠어요" },
		],
		glossarySlug: "cli",
		glossaryNote: "CLI가 뭔지 잘 모르겠다면 용어사전에서 먼저 확인해보세요.",
	},
	{
		id: "situation",
		mode: "required",
		title: "AI가 어떤 상황에서, 어떤 일을 해주면 좋겠어요?",
		description:
			"예: '깃허브 이슈가 올라오면 자동으로 라벨을 붙여줘'처럼, 상황과 할 일을 순서대로 자유롭게 적어주세요.",
		type: "textarea",
		required: true,
		placeholder: "예: 새 이슈가 등록되면, 내용을 읽고 알맞은 라벨을 붙여줘",
	},
	{
		id: "costPreference",
		mode: "required",
		title: "속도·품질·비용 중 뭘 더 중요하게 볼까요?",
		type: "radio",
		required: true,
		options: [
			{ value: "economy", label: "절약형", hint: "비용을 최대한 아껴요" },
			{
				value: "balanced",
				label: "균형형",
				hint: "적당한 비용에 무난한 품질",
			},
			{
				value: "performance",
				label: "고성능형",
				hint: "비용보다 품질을 우선해요",
			},
		],
	},
	{
		id: "reference",
		mode: "required",
		title: "참고할 만한 예시가 있나요?",
		description: "선택 사항이에요. 없으면 비워두고 넘어가도 괜찮아요.",
		type: "textarea",
		required: false,
		placeholder: "비슷한 스킬의 링크나 설명을 붙여넣어도 좋아요",
	},
];

export const languageQuestion: WizardQuestion = {
	id: "language",
	mode: "required",
	title: "완성된 스킬은 어떤 언어로 만들까요?",
	type: "radio",
	required: true,
	options: [
		{ value: "ko", label: "한국어", hint: "추천" },
		{ value: "en", label: "영어" },
	],
};

export const advancedQuestions: WizardQuestion[] = [
	{
		id: "autonomy",
		mode: "advanced",
		title: "AI가 알아서 실행해도 되는 일인가요, 사람 확인이 필요한 일인가요?",
		type: "radio",
		required: true,
		options: [
			{
				value: "autonomous",
				label: "알아서 실행해도 돼요",
				hint: "예: 파일 읽기, 요약",
			},
			{
				value: "confirm",
				label: "실행 전에 꼭 확인받아야 해요",
				hint: "예: 파일 삭제, 배포",
			},
			{ value: "mixed", label: "상황에 따라 달라요" },
		],
	},
	{
		id: "autonomyDetail",
		mode: "advanced",
		title: "구체적으로 어떤 상황인가요?",
		description: "선택 사항이에요. 예시가 있으면 더 정확하게 만들 수 있어요.",
		type: "textarea",
		required: false,
		placeholder: "예: 파일을 읽고 요약하는 건 알아서, 삭제는 꼭 물어보고 나서",
	},
	{
		id: "variableInput",
		mode: "advanced",
		title: "매번 다른 입력값이 필요한 작업인가요?",
		type: "radio",
		required: true,
		options: [
			{ value: "yes", label: "네, 매번 달라요" },
			{ value: "no", label: "아니요, 거의 똑같아요" },
			{ value: "sometimes", label: "가끔 달라요" },
		],
	},
	{
		id: "frequency",
		mode: "advanced",
		title: "얼마나 자주 하는 작업이에요?",
		type: "radio",
		required: true,
		options: [
			{ value: "rarely", label: "가끔", hint: "한 달에 몇 번 이하" },
			{ value: "sometimes", label: "종종", hint: "일주일에 몇 번" },
			{ value: "often", label: "거의 매일" },
		],
		notes: [
			{
				whenValue: "often",
				message:
					"정말 자주 하는 작업이라면 스킬보다 루틴이 더 잘 맞을 수도 있어요.",
				glossarySlug: "routine",
			},
		],
	},
	{
		id: "scope",
		mode: "advanced",
		title: "파일 읽기 / 수정 / 명령 실행 중 어디까지 필요해요?",
		description: "해당하는 항목을 모두 선택해주세요.",
		type: "checkbox",
		required: true,
		options: [
			{ value: "read", label: "파일 읽기" },
			{ value: "edit", label: "파일 수정" },
			{ value: "exec", label: "명령 실행", hint: "터미널 명령 등" },
		],
	},
	{
		id: "audience",
		mode: "advanced",
		title: "개인용으로 쓸까요, 팀과 공유할까요?",
		type: "radio",
		required: true,
		options: [
			{ value: "personal", label: "개인용" },
			{ value: "team", label: "팀 공유용" },
			{ value: "unsure", label: "아직 잘 모르겠어요" },
		],
	},
	{
		id: "constraints",
		mode: "advanced",
		title: "꼭 하지 않았으면 하는 것이 있나요?",
		description: "선택 사항이에요.",
		type: "textarea",
		required: false,
		placeholder: "예: 커밋은 절대 하지 마",
	},
];

export const allQuestions: WizardQuestion[] = [
	...requiredQuestions,
	languageQuestion,
	...advancedQuestions,
];

export type WizardAnswers = Record<string, string | string[] | undefined>;
