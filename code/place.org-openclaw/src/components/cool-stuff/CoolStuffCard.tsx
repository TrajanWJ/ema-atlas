'use client';

import { motion } from 'motion/react';
import type { CoolStuffItem } from '../../data/cool-stuff';
import { CATEGORY_COLORS } from '../../data/cool-stuff';

interface CoolStuffCardProps {
	readonly item: CoolStuffItem;
}

function ExternalLinkIcon() {
	return (
		<svg
			width="14"
			height="14"
			viewBox="0 0 14 14"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path
				d="M2 12L12 2M12 2H7M12 2V7"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}

const CATEGORY_LABELS: Record<string, string> = {
	tools: 'Tools',
	sites: 'Sites',
	articles: 'Articles',
	experiments: 'Experiments',
	resources: 'Resources',
};

export function CoolStuffCard({ item }: CoolStuffCardProps) {
	const color = CATEGORY_COLORS[item.category];
	const label = CATEGORY_LABELS[item.category] ?? item.category;

	return (
		<motion.a
			href={item.url}
			target="_blank"
			rel="noopener noreferrer"
			layout
			layoutId={`card-${item.id}`}
			initial={{ opacity: 0, scale: 0.96 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={{ opacity: 0, scale: 0.96 }}
			transition={{ duration: 0.2, ease: [0.65, 0.05, 0, 1] }}
			whileHover={{ scale: 1.02, y: -2 }}
			style={
				{
					'--card-color': color,
					display: 'block',
					position: 'relative',
					height: '100%',
					minHeight: '120px',
					padding: '1.25rem',
					borderRadius: '0.75rem',
					backgroundColor: 'var(--bg-glass)',
					backdropFilter: 'blur(var(--glass-blur))',
					WebkitBackdropFilter: 'blur(var(--glass-blur))',
					border: '1px solid var(--border)',
					borderLeft: `3px solid ${color}`,
					cursor: 'pointer',
					textDecoration: 'none',
					overflow: 'hidden',
					transition: 'border-color 0.2s, box-shadow 0.2s',
				} as React.CSSProperties
			}
			className="cool-card group"
		>
			{/* Glow effect on hover */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: '0.75rem',
					background: `radial-gradient(ellipse at 20% 50%, ${color}18 0%, transparent 60%)`,
					opacity: 0,
					transition: 'opacity 0.3s',
					pointerEvents: 'none',
				}}
				className="card-glow"
			/>

			{/* External link icon */}
			<div
				style={{
					position: 'absolute',
					top: '0.875rem',
					right: '0.875rem',
					color: 'var(--text-secondary)',
					opacity: 0.4,
					transition: 'opacity 0.2s, color 0.2s',
				}}
				className="card-link-icon"
			>
				<ExternalLinkIcon />
			</div>

			{/* Content */}
			<div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '1.5rem' }}>
				<h3
					style={{
						fontSize: '0.9375rem',
						fontWeight: 600,
						color: 'var(--text-primary)',
						margin: 0,
						lineHeight: 1.3,
					}}
				>
					{item.title}
				</h3>

				<p
					style={{
						fontSize: '0.8125rem',
						color: 'var(--text-secondary)',
						margin: 0,
						lineHeight: 1.5,
					}}
				>
					{item.description}
				</p>

				{/* Category tag */}
				<div style={{ marginTop: '0.5rem' }}>
					<span
						style={{
							display: 'inline-block',
							fontSize: '0.6875rem',
							fontWeight: 600,
							letterSpacing: '0.06em',
							textTransform: 'uppercase',
							padding: '0.2rem 0.5rem',
							borderRadius: '0.25rem',
							backgroundColor: `${color}20`,
							color: color,
						}}
					>
						{label}
					</span>
				</div>
			</div>

			<style>{`
				.cool-card:hover .card-glow {
					opacity: 1;
				}
				.cool-card:hover .card-link-icon {
					opacity: 0.9;
					color: var(--card-color, currentColor);
				}
				.cool-card:hover {
					border-color: var(--card-color, var(--border-hover));
					box-shadow: 0 0 20px -4px color-mix(in srgb, var(--card-color, transparent) 30%, transparent);
				}
			`}</style>
		</motion.a>
	);
}
