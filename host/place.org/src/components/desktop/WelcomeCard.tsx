'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { shouldShowBootNudge, dismissBootNudge } from '@/src/lib/companion-nudge';
import { companionBridge } from '@/src/lib/companion-bridge';

const STORAGE_KEY = 'place-welcome-dismissed';

const FEATURES = [
	{ icon: '\u{1F512}', text: 'Your data stays in your browser — nothing leaves' },
	{ icon: '\u{1F5D6}', text: 'Drag windows, snap to edges, pop out to new tabs' },
	{ icon: '\u2318', text: 'Cmd+K to search everything' },
	{ icon: '\u{1F3A8}', text: 'Ambient sounds, themes, and screensaver built in' },
] as const;

function isDismissed(): boolean {
	if (typeof window === 'undefined') return true;
	return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function WelcomeCard() {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (!isDismissed()) {
			setVisible(true);
		}
	}, []);

	const handleDismiss = () => {
		setVisible(false);
		localStorage.setItem(STORAGE_KEY, 'true');
	};

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					initial={{ opacity: 0, scale: 0.92, y: 12 }}
					animate={{ opacity: 1, scale: 1, y: 0 }}
					exit={{ opacity: 0, scale: 0.92, y: 12 }}
					transition={{ duration: 0.3, ease: [0.65, 0.05, 0, 1] }}
					className="fixed inset-0 flex items-center justify-center"
					style={{ zIndex: 40 }}
				>
					<div
						className="glass-elevated rounded-2xl shadow-2xl"
						style={{
							maxWidth: 440,
							width: '90vw',
							padding: '2rem',
						}}
					>
						<WelcomeContent onDismiss={handleDismiss} />
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

function WelcomeContent({
	onDismiss,
}: {
	readonly onDismiss: () => void;
}) {
	return (
		<>
			<h2
				className="text-lg font-semibold"
				style={{ color: 'var(--place-text-primary)' }}
			>
				This is place.org
			</h2>
			<p
				className="mt-1 text-sm"
				style={{ color: 'var(--place-text-secondary)' }}
			>
				A virtual desktop that actually works.
			</p>
			<p
				className="mt-1 text-xs"
				style={{ color: 'var(--place-text-tertiary)' }}
			>
				Click any icon in the dock to start.
			</p>

			<ul className="mt-5 space-y-2.5">
				{FEATURES.map((f) => (
					<li
						key={f.text}
						className="flex items-start gap-2.5 text-sm"
						style={{ color: 'var(--place-text-secondary)' }}
					>
						<span className="shrink-0 text-base leading-5">{f.icon}</span>
						<span>{f.text}</span>
					</li>
				))}
			</ul>

			<button
				type="button"
				onClick={onDismiss}
				className="mt-6 w-full rounded-lg py-2 text-sm font-medium transition-colors"
				style={{
					background: 'var(--place-primary-500)',
					color: 'var(--place-text-primary)',
				}}
			>
				Get Started
			</button>

			<CompanionHint />
		</>
	);
}

function CompanionHint() {
	const [show, setShow] = useState(false);

	useEffect(() => {
		// Delay check slightly so companion bridge has time to connect
		const timer = setTimeout(() => {
			if (shouldShowBootNudge() && !companionBridge.isAvailable()) {
				setShow(true);
			}
		}, 2000);
		return () => clearTimeout(timer);
	}, []);

	if (!show) return null;

	return (
		<a
			href="/companion"
			onClick={() => dismissBootNudge()}
			className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-colors"
			style={{
				background: 'rgba(45, 212, 168, 0.06)',
				border: '1px solid rgba(45, 212, 168, 0.12)',
				color: 'rgba(45, 212, 168, 0.7)',
				textDecoration: 'none',
			}}
		>
			<span style={{ fontSize: '14px' }}>&#x2728;</span>
			<span>Want transparent native windows? <strong>Get the companion app</strong></span>
		</a>
	);
}
