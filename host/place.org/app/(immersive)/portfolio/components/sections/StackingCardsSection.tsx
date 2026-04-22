'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import type { VariantConfig } from '../../lib/variantStore';

const EASE: [number, number, number, number] = [0.23, 0.32, 0.23, 0.2];

const CARDS = [
	{
		number: '01',
		heading: 'AI Agents',
		text: 'Orchestrated systems that reason, plan, and act autonomously. Multi-step workflows, tool use, memory — not chatbots.',
		accent: '#3b82f6',
	},
	{
		number: '02',
		heading: 'Interfaces',
		text: 'Local-first apps with 60fps interactions. Desktop metaphors, real-time sync, the kind of craft that makes you forget it\'s a browser.',
		accent: undefined, // uses config.accent
	},
	{
		number: '03',
		heading: 'Infrastructure',
		text: 'CI/CD, Docker, migrations, monitoring. The invisible systems that let everything else move fast without breaking.',
		accent: '#8b5cf6',
	},
];

type Props = { config: VariantConfig };

export function StackingCardsSection({ config }: Props) {
	const sectionRef = useRef<HTMLElement>(null);
	const { scrollYProgress } = useScroll({
		target: sectionRef,
		offset: ['start end', 'end start'],
	});

	return (
		<section
			ref={sectionRef}
			style={{
				background: '#060610',
				padding: 'clamp(80px, 12vw, 160px) clamp(24px, 5vw, 80px)',
				overflow: 'hidden',
			}}
		>
			<div style={{ maxWidth: 1100, margin: '0 auto' }}>
				{CARDS.map((card, i) => {
					const accent = card.accent ?? config.accent;
					const isEven = i % 2 === 0;

					return (
						<CardRow
							key={card.heading}
							card={card}
							accent={accent}
							index={i}
							isEven={isEven}
							scrollYProgress={scrollYProgress}
						/>
					);
				})}
			</div>
		</section>
	);
}

function CardRow({
	card,
	accent,
	index,
	isEven,
	scrollYProgress,
}: {
	card: (typeof CARDS)[number];
	accent: string;
	index: number;
	isEven: boolean;
	scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress'];
}) {
	// Stagger entrance based on scroll position
	const start = 0.05 + index * 0.12;
	const opacity = useTransform(scrollYProgress, [start, start + 0.08], [0, 1]);
	const y = useTransform(scrollYProgress, [start, start + 0.1], [60, 0]);

	return (
		<motion.div
			style={{
				opacity,
				y,
				display: 'flex',
				alignItems: 'flex-start',
				gap: 'clamp(32px, 5vw, 80px)',
				flexDirection: isEven ? 'row' : 'row-reverse',
				marginBottom: index < CARDS.length - 1 ? 'clamp(64px, 10vh, 120px)' : 0,
			}}
		>
			{/* Number + accent line */}
			<div
				style={{
					flexShrink: 0,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					gap: 12,
					paddingTop: 4,
				}}
			>
				<span
					style={{
						fontFamily: 'var(--font-cinzel, serif)',
						fontSize: 'clamp(40px, 5vw, 64px)',
						fontWeight: 700,
						color: accent,
						lineHeight: 1,
						opacity: 0.2,
					}}
				>
					{card.number}
				</span>
				<div
					style={{
						width: 2,
						height: 48,
						background: `linear-gradient(to bottom, ${accent}, transparent)`,
						borderRadius: 1,
						opacity: 0.3,
					}}
				/>
			</div>

			{/* Content */}
			<div style={{ flex: 1, minWidth: 0 }}>
				<h3
					style={{
						fontFamily: 'var(--font-cinzel, serif)',
						fontSize: 'clamp(28px, 3.5vw, 44px)',
						fontWeight: 600,
						color: '#fafaf9',
						letterSpacing: '0.02em',
						lineHeight: 1.15,
						marginBottom: 16,
					}}
				>
					{card.heading}
				</h3>
				<p
					style={{
						fontFamily: "'Satoshi', system-ui, -apple-system, sans-serif",
						fontSize: 'clamp(16px, 1.6vw, 20px)',
						color: 'rgba(255,255,255,0.50)',
						lineHeight: 1.7,
						maxWidth: '48ch',
					}}
				>
					{card.text}
				</p>
			</div>
		</motion.div>
	);
}
