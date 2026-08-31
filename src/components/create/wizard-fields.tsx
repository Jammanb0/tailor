"use client";

import type { WizardOption } from "@/data/wizard-questions";
import { formatLengthCounter } from "@/lib/input-limits";

type RadioFieldProps = {
	options: WizardOption[];
	value: string | undefined;
	onChange: (value: string) => void;
};

export function RadioField({ options, value, onChange }: RadioFieldProps) {
	return (
		<div className="flex flex-col gap-2.5">
			{options.map((option) => {
				const selected = value === option.value;
				return (
					<button
						key={option.value}
						type="button"
						onClick={() => onChange(option.value)}
						aria-pressed={selected}
						className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
							selected
								? "border-accent bg-accent/10"
								: "border-border bg-surface hover:border-accent/40"
						}`}
					>
						<span>
							<span
								className={`block font-medium ${selected ? "text-accent" : "text-foreground"}`}
							>
								{option.label}
							</span>
							{option.hint && (
								<span className="mt-0.5 block text-sm text-muted">
									{option.hint}
								</span>
							)}
						</span>
						<span
							aria-hidden
							className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
								selected ? "border-accent bg-accent" : "border-border"
							}`}
						>
							{selected && (
								<span className="h-2 w-2 rounded-full bg-accent-foreground" />
							)}
						</span>
					</button>
				);
			})}
		</div>
	);
}

type CheckboxFieldProps = {
	options: WizardOption[];
	value: string[] | undefined;
	onChange: (value: string[]) => void;
};

export function CheckboxField({
	options,
	value,
	onChange,
}: CheckboxFieldProps) {
	const selectedValues = value ?? [];

	const exclusiveValues = options
		.filter((option) => option.exclusive)
		.map((option) => option.value);

	const toggle = (optionValue: string) => {
		if (selectedValues.includes(optionValue)) {
			onChange(selectedValues.filter((v) => v !== optionValue));
			return;
		}
		// "필요 없음" 같은 배타 항목은 나머지를 지우고 혼자 남는다.
		if (exclusiveValues.includes(optionValue)) {
			onChange([optionValue]);
			return;
		}
		// 반대로 일반 항목을 고르면 배타 항목이 해제된다.
		onChange([
			...selectedValues.filter((v) => !exclusiveValues.includes(v)),
			optionValue,
		]);
	};

	return (
		<div className="flex flex-col gap-2.5">
			{options.map((option) => {
				const selected = selectedValues.includes(option.value);
				return (
					<button
						key={option.value}
						type="button"
						onClick={() => toggle(option.value)}
						aria-pressed={selected}
						className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-5 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
							selected
								? "border-accent bg-accent/10"
								: "border-border bg-surface hover:border-accent/40"
						}`}
					>
						<span>
							<span
								className={`block font-medium ${selected ? "text-accent" : "text-foreground"}`}
							>
								{option.label}
							</span>
							{option.hint && (
								<span className="mt-0.5 block text-sm text-muted">
									{option.hint}
								</span>
							)}
						</span>
						<span
							aria-hidden
							className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
								selected
									? "border-accent bg-accent text-accent-foreground"
									: "border-border"
							}`}
						>
							{selected && "✓"}
						</span>
					</button>
				);
			})}
		</div>
	);
}

type TextareaFieldProps = {
	value: string | undefined;
	onChange: (value: string) => void;
	placeholder?: string;
	/** 서버와 같은 상한. 붙여넣기가 조용히 잘리지 않도록 글자 수도 함께 보여준다. */
	maxLength: number;
};

/**
 * 자유 서술 입력.
 *
 * `maxLength`는 서버가 정한 상한과 같은 값이다. 브라우저는 그 길이에서
 * 입력을 멈추는데, 긴 글을 붙여넣은 사람은 그걸 알아채지 못한다. 그래서 남은
 * 여유가 얼마 없을 때부터 글자 수를 보여주고, 상한에 닿으면 그렇다고 적는다.
 */
export function TextareaField({
	value,
	onChange,
	placeholder,
	maxLength,
}: TextareaFieldProps) {
	const current = (value ?? "").length;
	const atLimit = current >= maxLength;
	// 여유가 10%보다 적게 남았을 때부터 보여준다. 평소에는 방해가 된다.
	const showCounter = current > maxLength * 0.9;

	return (
		<div className="flex flex-col gap-1.5">
			<textarea
				value={value ?? ""}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				rows={4}
				maxLength={maxLength}
				className="w-full select-text resize-none rounded-2xl border border-border bg-surface px-5 py-4 text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
			/>
			{showCounter && (
				<p
					className={`text-right text-xs ${atLimit ? "text-accent" : "text-muted"}`}
					aria-live="polite"
				>
					{atLimit
						? `최대 ${maxLength.toLocaleString("ko-KR")}자까지 입력할 수 있어요. 여기서부터는 입력되지 않아요.`
						: formatLengthCounter(current, maxLength)}
				</p>
			)}
		</div>
	);
}
