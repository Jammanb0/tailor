"use client";

import type { WizardOption } from "@/data/wizard-questions";

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

	const toggle = (optionValue: string) => {
		if (selectedValues.includes(optionValue)) {
			onChange(selectedValues.filter((v) => v !== optionValue));
		} else {
			onChange([...selectedValues, optionValue]);
		}
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
};

export function TextareaField({
	value,
	onChange,
	placeholder,
}: TextareaFieldProps) {
	return (
		<textarea
			value={value ?? ""}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
			rows={4}
			className="w-full select-text resize-none rounded-2xl border border-border bg-surface px-5 py-4 text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
		/>
	);
}
