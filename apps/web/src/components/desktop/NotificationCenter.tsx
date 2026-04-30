'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useNotificationStore } from '@/src/stores/notification-store';
import type { Notification } from '@/src/stores/notification-store';

function relativeTime(timestamp: number): string {
	const seconds = Math.floor((Date.now() - timestamp) / 1000);
	if (seconds < 60) return 'just now';
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	return `${Math.floor(hours / 24)}d ago`;
}

function NotificationItem({
	notification,
	onAction,
}: {
	readonly notification: Notification;
	readonly onAction: (n: Notification) => void;
}) {
	return (
		<button
			type="button"
			onClick={() => onAction(notification)}
			style={{
				display: 'flex',
				width: '100%',
				textAlign: 'left',
				padding: '10px 14px',
				background: 'transparent',
				border: 'none',
				borderLeft: notification.read
					? '3px solid transparent'
					: '3px solid var(--place-primary-400, #2DD4A8)',
				cursor: 'default',
				gap: '8px',
				transition: 'background 0.1s',
			}}
			onMouseEnter={(e) => {
				(e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
			}}
			onMouseLeave={(e) => {
				(e.currentTarget as HTMLElement).style.background = 'transparent';
			}}
		>
			{/* Unread dot */}
			<div style={{ paddingTop: '4px', flexShrink: 0 }}>
				<div
					style={{
						width: 6,
						height: 6,
						borderRadius: '50%',
						background: notification.read
							? 'transparent'
							: 'var(--place-primary-400, #2DD4A8)',
					}}
				/>
			</div>

			<div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
					<span
						style={{
							fontSize: '0.75rem',
							fontWeight: 600,
							color: 'var(--place-text-primary, rgba(255,255,255,0.87))',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						}}
					>
						{notification.title}
					</span>
					<span
						style={{
							fontSize: '0.6rem',
							color: 'var(--place-text-muted, rgba(255,255,255,0.25))',
							whiteSpace: 'nowrap',
							flexShrink: 0,
						}}
					>
						{relativeTime(notification.timestamp)}
					</span>
				</div>
				<span
					style={{
						fontSize: '0.7rem',
						color: 'var(--place-text-secondary, rgba(255,255,255,0.6))',
						lineHeight: 1.4,
					}}
				>
					{notification.body}
				</span>
			</div>
		</button>
	);
}

interface NotificationCenterProps {
	readonly isOpen: boolean;
	readonly onClose: () => void;
	readonly anchorRef: React.RefObject<HTMLElement | null>;
}

export function NotificationCenter({ isOpen, onClose, anchorRef }: NotificationCenterProps) {
	const notifications = useNotificationStore((s) => s.notifications);
	const markRead = useNotificationStore((s) => s.markRead);
	const markAllRead = useNotificationStore((s) => s.markAllRead);
	const clearAll = useNotificationStore((s) => s.clearAll);
	const panelRef = useRef<HTMLDivElement>(null);

	const handleAction = useCallback(
		(n: Notification) => {
			markRead(n.id);
			n.action?.();
		},
		[markRead],
	);

	// Close on click outside or Escape
	useEffect(() => {
		if (!isOpen) return;
		const handleClick = (e: MouseEvent) => {
			const target = e.target as Node;
			if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
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

	// Position: anchor to the right side, clamped to viewport
	const getRight = (): number => {
		const anchor = anchorRef.current;
		if (!anchor) return 8;
		const rect = anchor.getBoundingClientRect();
		return Math.max(8, window.innerWidth - rect.right);
	};

	const unreadCount = notifications.filter((n) => !n.read).length;

	const content = (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					ref={panelRef}
					initial={{ opacity: 0, y: -6, scale: 0.97 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					exit={{ opacity: 0, y: -6, scale: 0.97 }}
					transition={{ duration: 0.15 }}
					style={{
						position: 'fixed',
						top: '44px',
						right: `${getRight()}px`,
						width: '320px',
						maxWidth: 'calc(100vw - 16px)',
						maxHeight: 'calc(100vh - 60px)',
						zIndex: 99998,
						background: 'var(--place-surface-1, #0E1017)',
						border: '1px solid var(--place-border-default, rgba(255,255,255,0.08))',
						borderRadius: '10px',
						boxShadow: '0 12px 40px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.05)',
						display: 'flex',
						flexDirection: 'column',
						overflow: 'hidden',
					}}
				>
					{/* Header */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							padding: '12px 14px 8px',
							borderBottom: '1px solid var(--place-border-subtle, rgba(255,255,255,0.04))',
						}}
					>
						<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
							<span
								style={{
									fontSize: '0.8rem',
									fontWeight: 600,
									color: 'var(--place-text-primary, rgba(255,255,255,0.87))',
								}}
							>
								Inbox
							</span>
							{unreadCount > 0 && (
								<span
									style={{
										fontSize: '0.6rem',
										fontWeight: 600,
										color: 'var(--place-primary-400, #2DD4A8)',
										background: 'var(--place-primary-subtle, rgba(13,147,115,0.10))',
										padding: '1px 6px',
										borderRadius: '9999px',
									}}
								>
									{unreadCount}
								</span>
							)}
						</div>
						<div style={{ display: 'flex', gap: '8px' }}>
							{notifications.length > 0 && (
								<>
									<button
										type="button"
										onClick={markAllRead}
										style={{
											fontSize: '0.6rem',
											color: 'var(--place-secondary-400, #6B95F0)',
											background: 'none',
											border: 'none',
											cursor: 'default',
											padding: 0,
										}}
									>
										Read all
									</button>
									<button
										type="button"
										onClick={clearAll}
										style={{
											fontSize: '0.6rem',
											color: 'var(--place-text-muted, rgba(255,255,255,0.25))',
											background: 'none',
											border: 'none',
											cursor: 'default',
											padding: 0,
										}}
									>
										Clear
									</button>
								</>
							)}
						</div>
					</div>

					{/* List */}
					<div style={{ flex: 1, overflowY: 'auto', maxHeight: '340px' }}>
						{notifications.length === 0 ? (
							<div
								style={{
									padding: '32px 14px',
									textAlign: 'center',
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									gap: '6px',
								}}
							>
								<svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
									<polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
									<path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
								</svg>
								<span style={{ fontSize: '0.7rem', color: 'var(--place-text-muted, rgba(255,255,255,0.25))' }}>
									All clear
								</span>
							</div>
						) : (
							notifications.map((n) => (
								<NotificationItem key={n.id} notification={n} onAction={handleAction} />
							))
						)}
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);

	if (typeof document === 'undefined') return null;
	return createPortal(content, document.body);
}
