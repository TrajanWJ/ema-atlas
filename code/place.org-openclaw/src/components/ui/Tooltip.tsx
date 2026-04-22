'use client';

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
	readonly content: string;
	readonly children: ReactNode;
	readonly delay?: number;
}

export function Tooltip({ content, children, delay = 500 }: TooltipProps) {
	const [isVisible, setIsVisible] = useState(false);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const triggerRef = useRef<HTMLDivElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	const handleMouseEnter = () => {
		hoverTimeoutRef.current = setTimeout(() => {
			setIsVisible(true);
			updatePosition();
		}, delay);
	};

	const handleMouseLeave = () => {
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
		}
		setIsVisible(false);
	};

	const updatePosition = () => {
		if (!triggerRef.current || !tooltipRef.current) return;

		const triggerRect = triggerRef.current.getBoundingClientRect();
		const tooltipRect = tooltipRef.current.getBoundingClientRect();

		// Position above the trigger element, centered horizontally
		const top = triggerRect.top - tooltipRect.height - 8;
		const left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;

		setPosition({ top, left });
	};

	useEffect(() => {
		if (isVisible) {
			updatePosition();
			const handleScroll = () => updatePosition();
			window.addEventListener('scroll', handleScroll);
			window.addEventListener('resize', handleScroll);

			return () => {
				window.removeEventListener('scroll', handleScroll);
				window.removeEventListener('resize', handleScroll);
			};
		}
	}, [isVisible]);

	return (
		<div ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
			{children}

			<AnimatePresence>
				{isVisible && (
					<motion.div
						ref={tooltipRef}
						className="fixed glass pointer-events-none whitespace-nowrap rounded-lg px-2 py-1 text-xs font-medium"
						style={{
							top: `${position.top}px`,
							left: `${position.left}px`,
							zIndex: 9999,
							color: 'var(--text-primary)',
						}}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{ duration: 0.15 }}
					>
						{content}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
