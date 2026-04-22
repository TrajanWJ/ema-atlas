'use client';

import { useToastStore } from "@/src/stores/toast-store";

// ----------------------------------------------------------------------------
// Convenience hook
// ----------------------------------------------------------------------------

export function useToast() {
	const addToast = useToastStore((s) => s.addToast);

	return {
		toast: (message: string) => addToast(message, 'info'),
		success: (message: string) => addToast(message, 'success'),
		warning: (message: string) => addToast(message, 'warning'),
		error: (message: string) => addToast(message, 'error'),
	};
}
