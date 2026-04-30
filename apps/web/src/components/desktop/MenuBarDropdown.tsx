'use client';

import { useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

interface MenuBarDropdownProps {
	readonly isOpen: boolean;
	readonly onClose: () => void;
	readonly anchorRef: React.RefObject<HTMLElement | null>;
	readonly children: ReactNode;
	readonly align?: 'left' | 'center' | 'right';
}

export function MenuBarDropdown({
	isOpen,
	onClose,
	anchorRef,
	children,
	align = 'left',
}: MenuBarDropdownProps) {
	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isOpen) return;
		const handleClick = (e: MouseEvent) => {
			const target = e.target as Node;
			if (
				dropdownRef.current?.contains(target) ||
				anchorRef.current?.contains(target)
			) return;
			onClose();
		};
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('mousedown', handleClick);
		window.addEventListener('keydown', handleKey);
		return () => {
			window.removeEventListener('mousedown', handleClick);
			window.removeEventListener('keydown', handleKey);
		};
	}, [isOpen, onClose, anchorRef]);

	const getPosition = (): { left: number; transform: string } => {
		const anchor = anchorRef.current;
		if (!anchor) return { left: 0, transform: 'none' };
		const rect = anchor.getBoundingClientRect();
		const vw = window.innerWidth;
		const padding = 8;

		if (align === 'right') {
			// Right-align: dropdown ends at anchor's right edge
			// But clamp so it doesn't go off the left edge
			const rawLeft = rect.right;
			return { left: Math.max(padding, rawLeft), transform: 'translateX(-100%)' };
		}
		if (align === 'center') {
			return { left: rect.left + rect.width / 2, transform: 'translateX(-50%)' };
		}
		// Left-align: clamp so dropdown doesn't overflow right edge
		const left = Math.min(rect.left, vw - 300 - padding);
		return { left: Math.max(padding, left), transform: 'none' };
	};

	const dropdown = (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					ref={dropdownRef}
					className="fixed rounded-[10px] overflow-hidden"
					style={{
						top: '40px',
						left: `${getPosition().left}px`,
						transform: getPosition().transform,
						maxWidth: `calc(100vw - 16px)`,
						zIndex: 99998,
						background: 'var(--place-surface-1)',
						border: '1px solid var(--place-border-default)',
						backdropFilter: 'blur(20px)',
						WebkitBackdropFilter: 'blur(20px)',
						minWidth: '200px',
						boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
					}}
					initial={{ opacity: 0, y: -4, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: -4, scale: 0.98 }}
					transition={{ duration: 0.12 }}
				>
					{children}
				</motion.div>
			)}
		</AnimatePresence>
	);

	if (typeof document === 'undefined') return null;
	return createPortal(dropdown, document.body);
}

// ── Reusable menu primitives ──

interface MenuItemProps {
	readonly label: string;
	readonly value?: string;
	readonly shortcut?: string;
	readonly onClick?: () => void;
	readonly accent?: boolean;
	readonly danger?: boolean;
}

export function MenuItem({
	label,
	value,
	shortcut,
	onClick,
	accent,
	danger,
}: MenuItemProps) {
	const color = danger
		? 'var(--place-error, #E24B4A)'
		: accent
			? 'var(--place-primary-400, #2DD4A8)'
			: 'var(--place-text-primary)';

	return (
		<button
			type="button"
			onClick={onClick}
			className="flex w-full items-center justify-between gap-4 px-3 py-1.5 text-left transition-colors rounded-[6px]"
			style={{
				fontSize: '0.75rem',
				color,
				background: 'transparent',
				border: 'none',
				cursor: onClick ? 'default' : 'default',
			}}
			onMouseEnter={(e) => {
				(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
			}}
			onMouseLeave={(e) => {
				(e.currentTarget as HTMLElement).style.background = 'transparent';
			}}
		>
			<span>{label}</span>
			<span style={{
				color: 'var(--place-text-muted)',
				fontSize: '0.65rem',
				fontFamily: shortcut ? 'monospace' : 'inherit',
				opacity: 0.7,
			}}>
				{value ?? shortcut ?? ''}
			</span>
		</button>
	);
}

export function MenuDivider() {
	return (
		<div
			style={{
				height: '1px',
				background: 'var(--place-border-subtle)',
				margin: '4px 0',
			}}
		/>
	);
}

export function MenuSection({ label }: { readonly label: string }) {
	return (
		<div
			className="px-3 pt-2 pb-1"
			style={{
				fontSize: '0.6rem',
				fontWeight: 600,
				color: 'var(--place-text-tertiary)',
				textTransform: 'uppercase',
				letterSpacing: '0.06em',
			}}
		>
			{label}
		</div>
	);
}
