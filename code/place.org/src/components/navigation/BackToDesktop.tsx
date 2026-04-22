'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function BackToDesktop() {
	const router = useRouter();

	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				router.push('/');
			}
		}

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [router]);

	return (
		<a
			href="/"
			onClick={(e) => {
				e.preventDefault();
				router.push('/');
			}}
			className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full glass text-sm text-[var(--place-text-secondary)] hover:text-[var(--place-text-primary)] hover:border-[var(--place-border-strong)] hover:shadow-[0_0_16px_var(--place-secondary-glow)] transition-all duration-200 select-none"
			aria-label="Back to Desktop"
		>
			<span aria-hidden="true">↩</span>
			<span>Desktop</span>
		</a>
	);
}
