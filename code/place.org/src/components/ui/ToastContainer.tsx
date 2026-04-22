'use client';

import { AnimatePresence } from "motion/react";
import { useToastStore } from "@/src/stores/toast-store";
import { Toast } from "./Toast";

// ----------------------------------------------------------------------------
// Container — fixed top-right, stacks toasts vertically
// ----------------------------------------------------------------------------

export function ToastContainer() {
	const toasts = useToastStore((s) => s.toasts);

	return (
		<div
			style={{
				position: 'fixed',
				top: '1rem',
				right: '1rem',
				zIndex: 9999,
				display: 'flex',
				flexDirection: 'column',
				gap: '0.5rem',
				pointerEvents: 'none',
			}}
		>
			<AnimatePresence initial={false}>
				{toasts.map((toast) => (
					<div key={toast.id} style={{ pointerEvents: 'auto' }}>
						<Toast toast={toast} />
					</div>
				))}
			</AnimatePresence>
		</div>
	);
}
