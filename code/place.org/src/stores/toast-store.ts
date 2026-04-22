'use client';

import { create } from "zustand";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
	readonly id: string;
	readonly message: string;
	readonly type: ToastType;
	readonly duration: number;
	readonly createdAt: number;
}

interface ToastState {
	readonly toasts: readonly Toast[];
}

interface ToastActions {
	addToast(message: string, type?: ToastType, duration?: number): string;
	removeToast(id: string): void;
}

type ToastStore = ToastState & ToastActions;

// ----------------------------------------------------------------------------
// Store
// ----------------------------------------------------------------------------

const DEFAULT_DURATION = 4000;

export const useToastStore = create<ToastStore>((set) => ({
	toasts: [],

	addToast(message, type = 'info', duration = DEFAULT_DURATION) {
		const id = crypto.randomUUID();
		const toast: Toast = {
			id,
			message,
			type,
			duration,
			createdAt: Date.now(),
		};

		set((state) => ({ toasts: [...state.toasts, toast] }));

		setTimeout(() => {
			set((state) => ({
				toasts: state.toasts.filter((t) => t.id !== id),
			}));
		}, duration);

		return id;
	},

	removeToast(id) {
		set((state) => ({
			toasts: state.toasts.filter((t) => t.id !== id),
		}));
	},
}));
