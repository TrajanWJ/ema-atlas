'use client';

import type { ReactNode } from 'react';
import { motion } from 'motion/react';

interface PageTransitionProps {
	readonly children: ReactNode;
	readonly className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 0 }}
			transition={{
				duration: 0.3,
				ease: [0.65, 0.05, 0, 1],
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
}
