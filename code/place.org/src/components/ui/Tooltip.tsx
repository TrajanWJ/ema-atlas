'use client';

import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
	readonly content: ReactNode;
	readonly children: ReactNode;
	readonly delay?: number;
}

export function Tooltip({ content, children, delay = 300 }: TooltipProps) {
	const [isVisible, setIsVisible] = useState(false);
	const [position, setPosition] = useState({ top: 0, left: 0 });
	const [measured, setMeasured] = useState(false);
	const triggerRef = useRef<HTMLDivElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleMouseEnter = () => {
		hoverTimeoutRef.current = setTimeout(() => {
			setMeasured(false);
			setIsVisible(true);
		}, delay);
	};

	const handleMouseLeave = () => {
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
			hoverTimeoutRef.current = null;
		}
		setIsVisible(false);
		setMeasured(false);
	};

	const measure = useCallback(() => {
		const trigger = triggerRef.current;
		const tooltip = tooltipRef.current;
		if (!trigger || !tooltip) return;

		const tr = trigger.getBoundingClientRect();
		const tt = tooltip.getBoundingClientRect();

		const top = tr.top - tt.height - 10;
		const left = Math.max(
			8,
			Math.min(
				tr.left + tr.width / 2 - tt.width / 2,
				window.innerWidth - tt.width - 8,
			),
		);

		setPosition({ top, left });
		setMeasured(true);
	}, []);

	// Measure after portal renders the tooltip into the DOM
	// Double rAF ensures the portal element is fully laid out before measuring
	useEffect(() => {
		if (!isVisible) return;
		let outerRaf: number;
		let innerRaf: number;
		outerRaf = requestAnimationFrame(() => {
			innerRaf = requestAnimationFrame(() => {
				measure();
			});
		});
		return () => {
			cancelAnimationFrame(outerRaf);
			cancelAnimationFrame(innerRaf);
		};
	}, [isVisible, measure]);

	const tooltipEl = (
		<AnimatePresence>
			{isVisible && (
				<motion.div
					ref={tooltipRef}
					className="fixed pointer-events-none rounded-[10px] px-3 py-2 text-xs font-medium"
					style={{
						top: `${position.top}px`,
						left: `${position.left}px`,
						zIndex: 99999,
						color: 'var(--place-text-primary)',
						background: 'var(--place-surface-1)',
						border: '1px solid var(--place-border-default)',
						backdropFilter: 'blur(16px)',
						WebkitBackdropFilter: 'blur(16px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
						opacity: measured ? 1 : 0,
					}}
					initial={{ opacity: 0, y: 4 }}
					animate={{ opacity: measured ? 1 : 0, y: 0 }}
					exit={{ opacity: 0, y: 4 }}
					transition={{ duration: 0.12 }}
				>
					{content}
				</motion.div>
			)}
		</AnimatePresence>
	);

	return (
		<div ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
			{children}
			{typeof document !== 'undefined' && createPortal(tooltipEl, document.body)}
		</div>
	);
}
