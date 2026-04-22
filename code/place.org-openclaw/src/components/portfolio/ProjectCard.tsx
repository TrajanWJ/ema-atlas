'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { Project, ProjectCategory } from '@/src/data/projects';

const CATEGORY_COLORS: Record<ProjectCategory, string> = {
	Agency: '#e8a84c',
	Productivity: '#5b9cf5',
	'AI/ML': '#a78bfa',
	Consumer: '#38c97a',
	Enterprise: '#ef6b6b',
	'AI Infrastructure': '#a78bfa',
	Logistics: '#38c97a',
	Meta: '#5b9cf5',
};

const STATUS_COLORS: Record<string, string> = {
	'In Progress': '#e8a84c',
	Production: '#38c97a',
	Building: '#5b9cf5',
	Demo: '#8088a0',
};

function getStatusColor(status: string): string {
	for (const [key, color] of Object.entries(STATUS_COLORS)) {
		if (status.includes(key)) return color;
	}
	return '#8088a0';
}

type Props = {
	project: Project;
};

export function ProjectCard({ project }: Props) {
	const [hovered, setHovered] = useState(false);
	const categoryColor = CATEGORY_COLORS[project.category] ?? '#5b9cf5';
	const statusColor = getStatusColor(project.status);

	return (
		<motion.article
			onHoverStart={() => setHovered(true)}
			onHoverEnd={() => setHovered(false)}
			whileHover={{ scale: 1.025 }}
			transition={{ duration: 0.2, ease: [0.65, 0.05, 0, 1] }}
			className="relative flex flex-col overflow-hidden rounded-2xl p-6 cursor-default"
			style={{
				background: 'rgba(80, 130, 220, 0.06)',
				backdropFilter: 'blur(16px)',
				WebkitBackdropFilter: 'blur(16px)',
				border: hovered
					? '1px solid rgba(100, 160, 255, 0.28)'
					: '1px solid rgba(100, 160, 255, 0.08)',
				boxShadow: hovered
					? '0 0 32px rgba(91,156,245,0.15), 0 8px 32px rgba(0,0,0,0.3)'
					: '0 4px 16px rgba(0,0,0,0.2)',
				transition: 'border 0.25s ease, box-shadow 0.25s ease',
				minHeight: '240px',
			}}
		>
			{/* Category dot + label */}
			<div className="mb-4 flex items-center gap-2">
				<span
					className="h-2 w-2 rounded-full flex-shrink-0"
					style={{ background: categoryColor }}
				/>
				<span className="text-xs font-medium uppercase tracking-widest" style={{ color: categoryColor }}>
					{project.category}
				</span>
			</div>

			{/* Project name */}
			<h2 className="mb-2 text-2xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
				{project.name}
			</h2>

			{/* Description */}
			<p className="mb-4 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
				{project.description}
			</p>

			{/* Status */}
			<p className="mb-4 text-xs font-medium" style={{ color: statusColor }}>
				{project.status}
			</p>

			{/* Stack tags */}
			<div className="mt-auto flex flex-wrap gap-1.5">
				{project.stack.map((tech) => (
					<span
						key={tech}
						className="rounded-full px-2.5 py-0.5 text-xs"
						style={{
							background: 'rgba(100, 160, 255, 0.08)',
							border: '1px solid rgba(100, 160, 255, 0.12)',
							color: 'var(--text-secondary)',
						}}
					>
						{tech}
					</span>
				))}
			</div>

			{/* Clip-path reveal on hover: highlights panel */}
			<AnimatePresence>
				{hovered && (
					<motion.div
						key="reveal"
						initial={{ clipPath: 'inset(100% 0 0 0 round 12px)' }}
						animate={{ clipPath: 'inset(0% 0 0 0 round 12px)' }}
						exit={{ clipPath: 'inset(100% 0 0 0 round 12px)' }}
						transition={{ duration: 0.3, ease: [0.65, 0.05, 0, 1] }}
						className="absolute inset-x-0 bottom-0 rounded-b-2xl p-5"
						style={{
							background: 'linear-gradient(180deg, rgba(6,6,16,0) 0%, rgba(6,6,16,0.92) 100%)',
						}}
					>
						<ul className="flex flex-col gap-1">
							{project.highlights.map((h) => (
								<li key={h} className="flex items-start gap-2 text-xs" style={{ color: '#c8d0e8' }}>
									<span style={{ color: categoryColor }}>→</span>
									{h}
								</li>
							))}
						</ul>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.article>
	);
}
