'use client';

import { motion } from 'motion/react';
import type { CoolStuffItem } from '../../data/cool-stuff';
import { CATEGORY_COLORS } from '../../data/cool-stuff';

interface CoolStuffCardProps {
	readonly item: CoolStuffItem;
	readonly index?: number;
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

function getDomain(url: string): string {
	try {
		return new URL(url).hostname;
	} catch {
		return '';
	}
}

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString('en-US', {
		month: 'short',
		year: 'numeric',
	});
}

export function CoolStuffCard({ item, index = 0 }: CoolStuffCardProps) {
	const color = CATEGORY_COLORS[item.category];
	const label = CATEGORY_LABELS[item.category] ?? item.category;
	const domain = getDomain(item.url);
	const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

	return (
		<motion.a
			href={item.url}
			target="_blank"
			rel="noopener noreferrer"
			layout
			layoutId={`card-${item.id}`}
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.96 }}
			transition={{
				duration: 0.3,
				delay: index * 0.04,
				ease: [0.65, 0.05, 0, 1],
			}}
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
					backgroundColor: 'var(--place-surface-1)',
					backdropFilter: 'blur(var(--glass-blur))',
					WebkitBackdropFilter: 'blur(var(--glass-blur))',
					border: item.featured
						? `1px solid ${color}40`
						: '1px solid var(--place-border-default)',
					borderLeft: `3px solid ${color}`,
					cursor: 'pointer',
					textDecoration: 'none',
					overflow: 'hidden',
					transition: 'border-color 0.2s, box-shadow 0.2s',
					boxShadow: item.featured
						? `0 0 24px -6px ${color}25`
						: 'none',
				} as React.CSSProperties
			}
			className="cool-card group"
		>
			<CardGlow color={color} />
			<CardLinkIcon />
			<CardContent
				item={item}
				color={color}
				label={label}
				domain={domain}
				faviconUrl={faviconUrl}
			/>
			<CardStyles />
		</motion.a>
	);
}

function CardGlow({ color }: { readonly color: string }) {
	return (
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
	);
}

function CardLinkIcon() {
	return (
		<div
			style={{
				position: 'absolute',
				top: '0.875rem',
				right: '0.875rem',
				color: 'var(--place-text-secondary)',
				opacity: 0.4,
				transition: 'opacity 0.2s, color 0.2s',
			}}
			className="card-link-icon"
		>
			<ExternalLinkIcon />
		</div>
	);
}

function CardContent({
	item,
	color,
	label,
	domain,
	faviconUrl,
}: {
	readonly item: CoolStuffItem;
	readonly color: string;
	readonly label: string;
	readonly domain: string;
	readonly faviconUrl: string;
}) {
	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				gap: '0.5rem',
				paddingRight: '1.5rem',
			}}
		>
			{/* Title row with favicon */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '0.5rem',
				}}
			>
				<img
					src={faviconUrl}
					alt=""
					width={16}
					height={16}
					style={{
						borderRadius: '2px',
						flexShrink: 0,
						opacity: 0.85,
					}}
				/>
				<h3
					style={{
						fontSize: '0.9375rem',
						fontWeight: 600,
						color: 'var(--place-text-primary)',
						margin: 0,
						lineHeight: 1.3,
					}}
				>
					{item.title}
				</h3>
			</div>

			<p
				style={{
					fontSize: '0.8125rem',
					color: 'var(--place-text-secondary)',
					margin: 0,
					lineHeight: 1.5,
				}}
			>
				{item.description}
			</p>

			{/* Note (shown as subtitle) */}
			{item.note ? (
				<p
					style={{
						fontSize: '0.75rem',
						color: 'var(--place-text-secondary)',
						margin: 0,
						lineHeight: 1.4,
						fontStyle: 'italic',
						opacity: 0.7,
					}}
				>
					{item.note}
				</p>
			) : null}

			{/* Tags */}
			{item.tags.length > 0 ? (
				<div
					style={{
						display: 'flex',
						flexWrap: 'wrap',
						gap: '0.25rem',
						marginTop: '0.125rem',
					}}
				>
					{item.tags.map((tag) => (
						<span
							key={tag}
							style={{
								fontSize: '0.625rem',
								padding: '0.1rem 0.375rem',
								borderRadius: '0.25rem',
								backgroundColor: 'rgba(255,255,255,0.05)',
								color: 'var(--place-text-secondary)',
								letterSpacing: '0.02em',
							}}
						>
							{tag}
						</span>
					))}
				</div>
			) : null}

			{/* Category + date row */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '0.5rem',
					marginTop: '0.375rem',
				}}
			>
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
				<span
					style={{
						fontSize: '0.6875rem',
						color: 'var(--place-text-secondary)',
						opacity: 0.5,
					}}
				>
					{domain}
				</span>
				<span
					style={{
						fontSize: '0.625rem',
						color: 'var(--place-text-secondary)',
						opacity: 0.4,
						marginLeft: 'auto',
					}}
				>
					{formatDate(item.dateAdded)}
				</span>
			</div>
		</div>
	);
}

function CardStyles() {
	return (
		<style>{`
			.cool-card:hover .card-glow {
				opacity: 1;
			}
			.cool-card:hover .card-link-icon {
				opacity: 0.9;
				color: var(--card-color, currentColor);
			}
			.cool-card:hover {
				border-color: var(--card-color, var(--place-border-strong));
				box-shadow: 0 0 20px -4px color-mix(in srgb, var(--card-color, transparent) 30%, transparent);
			}
		`}</style>
	);
}
