'use client';

import { motion } from 'motion/react';
import { PROJECTS } from '@/src/data/projects';

// --- Data ---

const SKILLS = [
	{ category: 'Frontend', items: ['React 19', 'Next.js 16', 'TypeScript', 'Tailwind', 'Motion'] },
	{ category: 'Backend', items: ['Node.js', 'FastAPI', 'Express', 'PostgreSQL', 'Prisma'] },
	{ category: 'AI / Infra', items: ['Claude Code', 'MCP', 'Docker', 'KVM/QEMU', 'Vector DBs'] },
	{ category: 'Tools', items: ['Zustand', 'Biome', 'Vitest', 'pnpm', 'Git'] },
] as const;

const LINKS = [
	{ label: 'Portfolio', url: 'https://place.org/portfolio', icon: '🌐' },
	{ label: 'GitHub', url: 'https://github.com/trajan', icon: '🐙' },
	{ label: 'LinkedIn', url: 'https://linkedin.com/in/trajan', icon: '💼' },
	{ label: 'X / Twitter', url: 'https://x.com/trajan', icon: '𝕏' },
] as const;

// --- Section Components ---

function Bio() {
	return (
		<div className="mb-5 text-center">
			<motion.div
				className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl"
				style={{
					background: 'var(--place-surface-1)',
					border: '1px solid var(--place-border-default)',
				}}
				initial={{ scale: 0.8, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 0.3 }}
			>
				👨‍💻
			</motion.div>
			<h1
				className="mb-1 text-xl font-bold"
				style={{ color: 'var(--place-text-primary)' }}
			>
				Trajan
			</h1>
			<p
				className="mb-2 text-sm"
				style={{ color: 'var(--place-secondary-400)' }}
			>
				Full-Stack Engineer &middot; Tool Builder &middot; System Thinker
			</p>
			<p
				className="mx-auto max-w-sm text-xs leading-relaxed"
				style={{ color: 'var(--place-text-secondary)' }}
			>
				I build products that feel like magic — fast, local-first,
				and deeply considered. I think in systems, ship in iterations,
				and believe the best tools disappear into the workflow.
			</p>
		</div>
	);
}

function ProjectsSection() {
	const featured = PROJECTS.slice(0, 6);

	return (
		<Section title="Current Projects">
			<div className="grid grid-cols-2 gap-2">
				{featured.map((project) => (
					<ProjectCard
						key={project.id}
						name={project.name}
						description={project.description}
						status={project.status}
						category={project.category}
					/>
				))}
			</div>
			<p
				className="mt-2 text-center text-[11px]"
				style={{ color: 'var(--place-text-secondary)' }}
			>
				+ {PROJECTS.length - featured.length} more projects
			</p>
		</Section>
	);
}

function ProjectCard({
	name,
	description,
	status,
	category,
}: {
	readonly name: string;
	readonly description: string;
	readonly status: string;
	readonly category: string;
}) {
	return (
		<div
			className="rounded-lg p-2.5"
			style={{
				background: 'var(--place-surface-1)',
				border: '1px solid var(--place-border-default)',
			}}
		>
			<div className="mb-0.5 flex items-center justify-between">
				<span
					className="text-xs font-semibold"
					style={{ color: 'var(--place-text-primary)' }}
				>
					{name}
				</span>
				<span
					className="rounded-full px-1.5 py-0.5 text-[9px]"
					style={{
						background: 'var(--place-surface-1)',
						color: 'var(--place-secondary-400)',
						border: '1px solid var(--place-border-default)',
					}}
				>
					{category}
				</span>
			</div>
			<p
				className="mb-1 text-[10px] leading-snug"
				style={{ color: 'var(--place-text-secondary)' }}
			>
				{description}
			</p>
			<span
				className="text-[9px] font-medium"
				style={{ color: 'var(--place-success)' }}
			>
				{status}
			</span>
		</div>
	);
}

function SkillsSection() {
	return (
		<Section title="Tech Stack">
			<div className="grid grid-cols-2 gap-3">
				{SKILLS.map((group) => (
					<div key={group.category}>
						<div
							className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
							style={{ color: 'var(--place-text-secondary)' }}
						>
							{group.category}
						</div>
						<div className="flex flex-wrap gap-1">
							{group.items.map((item) => (
								<span
									key={item}
									className="rounded-md px-1.5 py-0.5 text-[10px]"
									style={{
										background: 'var(--place-surface-1)',
										color: 'var(--place-text-primary)',
										border: '1px solid var(--place-border-default)',
									}}
								>
									{item}
								</span>
							))}
						</div>
					</div>
				))}
			</div>
		</Section>
	);
}

function LinksSection() {
	return (
		<Section title="Links">
			<div className="flex flex-wrap gap-2">
				{LINKS.map((link) => (
					<a
						key={link.label}
						href={link.url}
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors"
						style={{
							background: 'var(--place-surface-1)',
							border: '1px solid var(--place-border-default)',
							color: 'var(--place-text-primary)',
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.borderColor = 'var(--place-border-strong)';
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.borderColor = 'var(--place-border-default)';
						}}
					>
						<span>{link.icon}</span>
						<span>{link.label}</span>
					</a>
				))}
			</div>
		</Section>
	);
}

function ContactSection() {
	return (
		<div
			className="mt-4 rounded-lg p-3 text-center"
			style={{
				background: 'var(--place-surface-1)',
				border: '1px solid var(--place-border-default)',
			}}
		>
			<p
				className="mb-1 text-xs font-medium"
				style={{ color: 'var(--place-text-primary)' }}
			>
				Want to work together?
			</p>
			<p
				className="text-[11px]"
				style={{ color: 'var(--place-text-secondary)' }}
			>
				Reach out via any of the links above, or find me on the{' '}
				<span style={{ color: 'var(--place-secondary-400)' }}>community</span> page.
			</p>
		</div>
	);
}

function Section({
	title,
	children,
}: {
	readonly title: string;
	readonly children: React.ReactNode;
}) {
	return (
		<div className="mb-4">
			<h2
				className="mb-2 text-xs font-semibold uppercase tracking-wider"
				style={{ color: 'var(--place-secondary-400)' }}
			>
				{title}
			</h2>
			{children}
		</div>
	);
}

// --- Main Component ---

export function AboutTrajanApp() {
	return (
		<div
			className="h-full overflow-y-auto p-5"
			style={{ color: 'var(--place-text-primary)' }}
		>
			<Bio />
			<ProjectsSection />
			<SkillsSection />
			<LinksSection />
			<ContactSection />
		</div>
	);
}
