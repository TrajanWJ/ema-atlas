'use client';

import { motion } from 'motion/react';
import type { Variants } from 'motion/react';
import type { VariantConfig } from '../../lib/variantStore';

const EASE: [number, number, number, number] = [0.23, 0.32, 0.23, 0.2];

const fadeUp: Variants = {
	hidden: { opacity: 0, y: 30 },
	visible: (d: number) => ({
		opacity: 1,
		y: 0,
		transition: { duration: 0.7, ease: EASE, delay: d },
	}),
};

const CAPABILITIES = [
	{
		emoji: '⚡',
		label: 'Automation',
		detail: 'If a human does it twice, I automate it.',
		tech: 'Puppeteer · Python · Node',
		color: '#3b82f6',
	},
	{
		emoji: '🧠',
		label: 'AI Agents',
		detail: 'Systems that reason, plan, and act.',
		tech: 'Claude · LangChain · RAG',
		color: '#8b5cf6',
	},
	{
		emoji: '🌐',
		label: 'Web Systems',
		detail: 'Full-stack, local-first, 60fps.',
		tech: 'Next.js · React · TypeScript',
		color: '#f59e0b',
	},
	{
		emoji: '📖',
		label: 'NLP',
		detail: 'Reading language like code.',
		tech: 'spaCy · Transformers · regex',
		color: '#ec4899',
	},
	{
		emoji: '🏗️',
		label: 'Infrastructure',
		detail: 'The invisible foundation.',
		tech: 'Docker · Linux · PostgreSQL',
		color: '#10b981',
	},
	{
		emoji: '✨',
		label: 'Design',
		detail: 'Interfaces that feel alive.',
		tech: 'Motion · Tailwind · Figma',
		color: '#f43f5e',
	},
];

type Props = { config: VariantConfig };

export function ExperienceSection({ config }: Props) {
	return (
		<section
			style={{
				background: config.bg,
				padding: 'clamp(80px, 10vw, 140px) clamp(24px, 5vw, 80px)',
			}}
		>
			<div style={{ maxWidth: 1000, margin: '0 auto' }}>
				{/* Header */}
				<motion.h2
					variants={fadeUp}
					custom={0}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true }}
					style={{
						fontFamily: 'var(--font-cinzel, serif)',
						fontSize: 'clamp(32px, 4vw, 52px)',
						fontWeight: 600,
						color: config.textColor,
						letterSpacing: '0.02em',
						marginBottom: 56,
					}}
				>
					What I Do
				</motion.h2>

				{/* 3x2 grid of cards */}
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(3, 1fr)',
						gap: 16,
					}}
				>
					{CAPABILITIES.map((cap, i) => (
						<motion.div
							key={cap.label}
							variants={fadeUp}
							custom={0.06 + i * 0.07}
							initial="hidden"
							whileInView="visible"
							viewport={{ once: true }}
							whileHover={{
								y: -6,
								boxShadow: `0 8px 30px ${cap.color}15`,
								borderColor: `${cap.color}25`,
							}}
							transition={{ type: 'spring', stiffness: 300, damping: 20 }}
							style={{
								padding: 28,
								borderRadius: 16,
								border: '1px solid rgba(0,0,0,0.06)',
								background: '#ffffff',
								cursor: 'default',
								display: 'flex',
								flexDirection: 'column',
								gap: 12,
							}}
						>
							{/* Emoji + colored dot */}
							<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
								<span style={{ fontSize: 28 }}>{cap.emoji}</span>
								<div
									style={{
										width: 6,
										height: 6,
										borderRadius: '50%',
										background: cap.color,
									}}
								/>
							</div>

							{/* Label */}
							<h3
								style={{
									fontFamily: 'var(--font-cinzel, serif)',
									fontSize: 18,
									fontWeight: 600,
									color: config.textColor,
									letterSpacing: '0.03em',
								}}
							>
								{cap.label}
							</h3>

							{/* Detail */}
							<p
								style={{
									fontSize: 15,
									color: config.textSecondary,
									lineHeight: 1.5,
								}}
							>
								{cap.detail}
							</p>

							{/* Tech — small, playful colored text */}
							<span
								style={{
									fontFamily: 'var(--font-jetbrains-mono, monospace)',
									fontSize: 11,
									color: cap.color,
									opacity: 0.7,
									marginTop: 'auto',
								}}
							>
								{cap.tech}
							</span>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
