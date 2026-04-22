'use client';

import { motion } from "motion/react";
import type { Toast as ToastData } from "@/src/stores/toast-store";
import { useToastStore } from "@/src/stores/toast-store";

// ----------------------------------------------------------------------------
// Type stripe colours (CSS vars)
// ----------------------------------------------------------------------------

const STRIPE_COLOR: Record<ToastData['type'], string> = {
	info:    'var(--accent-blue)',
	success: 'var(--accent-success)',
	warning: 'var(--accent-warm)',
	error:   'var(--accent-urgent)',
};

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

interface ToastProps {
	readonly toast: ToastData;
}

export function Toast({ toast }: ToastProps) {
	const removeToast = useToastStore((s) => s.removeToast);
	const stripeColor = STRIPE_COLOR[toast.type];

	return (
		<motion.div
			layout
			initial={{ x: 110, opacity: 0 }}
			animate={{ x: 0, opacity: 1 }}
			exit={{ x: 110, opacity: 0 }}
			transition={{ duration: 0.22, ease: [0.65, 0.05, 0, 1] }}
			style={{
				display: 'flex',
				alignItems: 'stretch',
				width: '20rem',
				borderRadius: '0.5rem',
				overflow: 'hidden',
				background: 'var(--bg-glass)',
				backdropFilter: 'blur(var(--glass-blur))',
				WebkitBackdropFilter: 'blur(var(--glass-blur))',
				border: '1px solid var(--border)',
				boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
				position: 'relative',
			}}
			role="alert"
			aria-live="assertive"
		>
			{/* Left colour stripe */}
			<div
				style={{
					width: '4px',
					flexShrink: 0,
					background: stripeColor,
				}}
			/>

			{/* Body */}
			<div
				style={{
					flex: 1,
					padding: '0.625rem 0.75rem',
					display: 'flex',
					flexDirection: 'column',
					gap: '0.375rem',
				}}
			>
				{/* Message row */}
				<div
					style={{
						display: 'flex',
						alignItems: 'flex-start',
						justifyContent: 'space-between',
						gap: '0.5rem',
					}}
				>
					<span
						style={{
							color: 'var(--text-primary)',
							fontSize: '0.8125rem',
							lineHeight: 1.4,
						}}
					>
						{toast.message}
					</span>

					<button
						type="button"
						onClick={() => removeToast(toast.id)}
						aria-label="Dismiss"
						style={{
							flexShrink: 0,
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							color: 'var(--text-secondary)',
							fontSize: '1rem',
							lineHeight: 1,
							padding: '0 0.125rem',
						}}
					>
						×
					</button>
				</div>

				{/* Progress bar */}
				<motion.div
					initial={{ scaleX: 1 }}
					animate={{ scaleX: 0 }}
					transition={{ duration: toast.duration / 1000, ease: 'linear' }}
					style={{
						height: '2px',
						background: stripeColor,
						borderRadius: '1px',
						transformOrigin: 'left center',
						opacity: 0.6,
					}}
				/>
			</div>
		</motion.div>
	);
}
