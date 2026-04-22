'use client';

import { motion } from 'motion/react';
import type { CoolStuffItem } from '../../data/cool-stuff';
import { CATEGORY_COLORS } from '../../data/cool-stuff';

interface FeaturedSectionProps {
	readonly items: readonly CoolStuffItem[];
}

function getDomain(url: string): string {
	try {
		return new URL(url).hostname;
	} catch {
		return '';
	}
}

export function FeaturedSection({ items }: FeaturedSectionProps) {
	if (items.length === 0) return null;

	return (
		<section style={{ marginBottom: '2.5rem' }}>
			<h2
				style={{
					fontSize: '0.8125rem',
					fontWeight: 600,
					letterSpacing: '0.08em',
					textTransform: 'uppercase',
					color: 'var(--place-text-secondary)',
					marginBottom: '1rem',
				}}
			>
				Featured
			</h2>
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
					gap: '1rem',
				}}
			>
				{items.map((item, i) => (
					<FeaturedCard key={item.id} item={item} index={i} />
				))}
			</div>
		</section>
	);
}

function FeaturedCard({
	item,
	index,
}: {
	readonly item: CoolStuffItem;
	readonly index: number;
}) {
	const color = CATEGORY_COLORS[item.category];
	const domain = getDomain(item.url);
	const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

	return (
		<motion.a
			href={item.url}
			target="_blank"
			rel="noopener noreferrer"
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: 0.4,
				delay: index * 0.08,
				ease: [0.65, 0.05, 0, 1],
			}}
			whileHover={{ scale: 1.015, y: -3 }}
			style={
				{
					'--card-color': color,
					display: 'block',
					position: 'relative',
					padding: '1.5rem',
					borderRadius: '0.875rem',
					backgroundColor: 'var(--place-surface-1)',
					backdropFilter: 'blur(var(--glass-blur))',
					WebkitBackdropFilter: 'blur(var(--glass-blur))',
					border: `1px solid ${color}30`,
					borderBottom: `2px solid ${color}50`,
					cursor: 'pointer',
					textDecoration: 'none',
					overflow: 'hidden',
					transition: 'border-color 0.2s, box-shadow 0.2s',
					boxShadow: `0 0 30px -8px ${color}20`,
				} as React.CSSProperties
			}
			className="cool-card"
		>
			{/* Background glow */}
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: '0.875rem',
					background: `radial-gradient(ellipse at 30% 0%, ${color}12 0%, transparent 70%)`,
					pointerEvents: 'none',
				}}
			/>

			<div
				style={{
					position: 'relative',
					display: 'flex',
					flexDirection: 'column',
					gap: '0.625rem',
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '0.625rem',
					}}
				>
					<img
						src={faviconUrl}
						alt=""
						width={20}
						height={20}
						style={{ borderRadius: '3px', opacity: 0.9 }}
					/>
					<h3
						style={{
							fontSize: '1.0625rem',
							fontWeight: 700,
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
						fontSize: '0.875rem',
						color: 'var(--place-text-secondary)',
						margin: 0,
						lineHeight: 1.6,
					}}
				>
					{item.description}
				</p>

				{item.note ? (
					<p
						style={{
							fontSize: '0.8125rem',
							color: color,
							margin: 0,
							lineHeight: 1.4,
							fontStyle: 'italic',
							opacity: 0.7,
						}}
					>
						{item.note}
					</p>
				) : null}

				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
						marginTop: '0.25rem',
					}}
				>
					<span
						style={{
							fontSize: '0.625rem',
							color: 'var(--place-text-secondary)',
							opacity: 0.5,
						}}
					>
						{domain}
					</span>
				</div>
			</div>
		</motion.a>
	);
}
