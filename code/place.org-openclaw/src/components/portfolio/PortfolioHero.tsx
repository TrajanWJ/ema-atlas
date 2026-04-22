'use client';

import { motion } from 'motion/react';

const TITLE = 'Built by Trajan';
const SUBTITLE = 'Full-stack engineer. Tool builder. System thinker.';

export function PortfolioHero() {
	return (
		<section
			className="flex min-h-dvh flex-col items-center justify-center px-6 pt-16 text-center"
			aria-label="Hero"
		>
			{/* Background parallax layer */}
			<div
				className="pointer-events-none absolute inset-0 -z-10"
				style={{
					background:
						'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(91,156,245,0.12) 0%, transparent 70%)',
				}}
			/>

			<h1 className="mb-6 text-[clamp(2.5rem,8vw,7rem)] font-bold leading-none tracking-tight">
				<span className="sr-only">{TITLE}</span>
				<span aria-hidden="true" className="inline-flex flex-wrap justify-center gap-[0.05em]">
					{TITLE.split('').map((char, i) => (
						<motion.span
							key={`${char}-${i}`}
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								delay: i * 0.03,
								duration: 0.4,
								ease: [0.65, 0.05, 0, 1],
							}}
							style={
								char === ' '
									? { display: 'inline-block', width: '0.3em' }
									: {
											display: 'inline-block',
											background: 'linear-gradient(135deg, #e8eaf0 30%, #5b9cf5 100%)',
											WebkitBackgroundClip: 'text',
											WebkitTextFillColor: 'transparent',
											backgroundClip: 'text',
										}
							}
						>
							{char === ' ' ? '\u00A0' : char}
						</motion.span>
					))}
				</span>
			</h1>

			<motion.p
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: TITLE.length * 0.03 + 0.1, duration: 0.5 }}
				className="max-w-lg text-[clamp(1rem,2.5vw,1.375rem)] leading-relaxed"
				style={{ color: 'var(--text-secondary)' }}
			>
				{SUBTITLE}
			</motion.p>

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: TITLE.length * 0.03 + 0.5, duration: 0.6 }}
				className="mt-16 flex flex-col items-center gap-2"
				aria-hidden="true"
			>
				<span className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>
					scroll
				</span>
				<motion.div
					animate={{ y: [0, 6, 0] }}
					transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
					className="h-4 w-px"
					style={{ background: 'var(--text-secondary)' }}
				/>
			</motion.div>
		</section>
	);
}
