"use client";

import { useMemo, useState } from "react";
import { CardToggleIcon } from "@/components/card-toggle-icon";
import type { GallerySkill } from "@/data/gallery";

function downloadSkillMarkdown(content: string) {
	const blob = new Blob([content], { type: "text/markdown" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = "SKILL.md";
	a.click();
	URL.revokeObjectURL(url);
}

function GalleryCard({
	skill,
	isOpen,
	onToggle,
}: {
	skill: GallerySkill;
	isOpen: boolean;
	onToggle: () => void;
}) {
	return (
		<div
			className={`rounded-2xl border bg-surface transition-colors ${
				isOpen ? "border-accent/50" : "border-border hover:border-accent/50"
			}`}
		>
			<button
				type="button"
				onClick={onToggle}
				aria-expanded={isOpen}
				className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
			>
				<span className="flex min-w-0 flex-col gap-1">
					{skill.self && (
						<span className="w-fit rounded-full bg-accent/15 px-2 py-0.5 font-semibold text-accent text-xs">
							Tailor-made
						</span>
					)}
					<span className="font-semibold text-foreground">{skill.name}</span>
					<span className="text-muted text-xs">{skill.category}</span>
					<span className="text-foreground/80 text-sm">
						{skill.description}
					</span>
					<span className="text-muted text-xs">
						{skill.self
							? "Tailor가 직접 만든 방식"
							: `${skill.author} · ${skill.license}`}
					</span>
				</span>
				<CardToggleIcon isOpen={isOpen} />
			</button>

			{isOpen && (
				<div className="flex flex-col gap-3 border-border border-t px-5 py-4">
					{skill.goodPoints.length > 0 && (
						<div>
							<p className="text-muted text-xs">이 스킬의 좋은 점</p>
							<ul className="mt-1.5 flex flex-col gap-1 text-foreground/80 text-sm">
								{skill.goodPoints.map((point) => (
									<li key={point} className="flex gap-2">
										<span aria-hidden className="text-accent">
											·
										</span>
										<span>{point}</span>
									</li>
								))}
							</ul>
						</div>
					)}
					<div className="flex flex-wrap gap-2">
						{skill.url && !skill.self && (
							<a
								href={skill.url}
								target="_blank"
								rel="noreferrer"
								className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
							>
								원본 보기 ↗
							</a>
						)}
						{skill.self && skill.skillMarkdown && (
							<button
								type="button"
								onClick={() =>
									downloadSkillMarkdown(skill.skillMarkdown as string)
								}
								className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent-hover"
							>
								SKILL.md 다운로드
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export function GalleryGrid({ skills }: { skills: GallerySkill[] }) {
	const [query, setQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
	const [openIds, setOpenIds] = useState<Set<string>>(new Set());

	const byQuery = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return skills;
		return skills.filter((skill) =>
			[skill.name, skill.description, skill.category, skill.author]
				.filter(Boolean)
				.some((field) => field.toLowerCase().includes(q)),
		);
	}, [skills, query]);

	// 검색 결과에 실제로 존재하는 카테고리만 칩으로 보여줌(검색과 함께 좁혀짐).
	const categories = useMemo(() => {
		const seen: string[] = [];
		for (const skill of byQuery) {
			if (!seen.includes(skill.category)) seen.push(skill.category);
		}
		return seen;
	}, [byQuery]);

	// 선택한 카테고리가 현재 검색 결과에 없으면 전체로 취급.
	const activeCategory =
		selectedCategory && categories.includes(selectedCategory)
			? selectedCategory
			: null;

	const filtered = activeCategory
		? byQuery.filter((skill) => skill.category === activeCategory)
		: byQuery;

	// 한쪽 카드가 펼쳐져도 반대쪽 칸이 재배치되지 않도록 두 칸으로 미리 나눔.
	const leftColumn = filtered.filter((_, i) => i % 2 === 0);
	const rightColumn = filtered.filter((_, i) => i % 2 === 1);

	const toggle = (id: string) => {
		setOpenIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	const collapseAll = () => setOpenIds(new Set());

	const renderCard = (skill: GallerySkill) => (
		<GalleryCard
			key={skill.id}
			skill={skill}
			isOpen={openIds.has(skill.id)}
			onToggle={() => toggle(skill.id)}
		/>
	);

	const hasFilter = query.trim().length > 0 || activeCategory !== null;

	return (
		<div>
			<div className="relative">
				<input
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="스킬 검색 (이름·설명·카테고리)"
					className="w-full select-text rounded-full border border-border bg-surface px-5 py-3 pr-11 text-sm text-foreground placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
				/>
				{query && (
					<button
						type="button"
						onClick={() => setQuery("")}
						aria-label="검색어 지우기"
						className="-translate-y-1/2 absolute top-1/2 right-4 text-muted transition-colors hover:text-foreground"
					>
						✕
					</button>
				)}
			</div>

			{categories.length > 1 && (
				<div className="mt-3 flex flex-wrap gap-2">
					<CategoryChip
						label="전체"
						active={activeCategory === null}
						onClick={() => setSelectedCategory(null)}
					/>
					{categories.map((category) => (
						<CategoryChip
							key={category}
							label={category}
							active={activeCategory === category}
							onClick={() => setSelectedCategory(category)}
						/>
					))}
				</div>
			)}

			<div className="mt-3 flex items-center justify-between text-muted text-sm">
				<span>
					{hasFilter
						? `총 ${skills.length}개 중 ${filtered.length}개`
						: `총 ${skills.length}개`}
				</span>
				{openIds.size > 0 && (
					<button
						type="button"
						onClick={collapseAll}
						className="text-muted transition-colors hover:text-accent"
					>
						모두 닫기
					</button>
				)}
			</div>

			<div className="mt-4">
				{filtered.length === 0 ? (
					<div className="rounded-2xl border border-border bg-surface px-5 py-12 text-center text-muted">
						일치하는 스킬이 없어요. 다른 검색어로 찾아보세요.
					</div>
				) : (
					<div className="flex flex-col gap-3 sm:flex-row">
						<div className="flex flex-1 flex-col gap-3">
							{leftColumn.map(renderCard)}
						</div>
						<div className="flex flex-1 flex-col gap-3">
							{rightColumn.map(renderCard)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function CategoryChip({
	label,
	active,
	onClick,
}: {
	label: string;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
				active
					? "border-accent bg-accent/10 text-accent"
					: "border-border text-muted hover:border-accent hover:text-accent"
			}`}
		>
			{label}
		</button>
	);
}
