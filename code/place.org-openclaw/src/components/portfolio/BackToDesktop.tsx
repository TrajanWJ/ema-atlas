'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export function BackToDesktop() {
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === 'Escape') {
				window.location.href = '/';
			}
		}
		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, []);

	return (
		<Link
			href="/"
			className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-300 hover:scale-105"
			style={{
				background: 'rgba(10, 14, 26, 0.7)',
				backdropFilter: 'blur(16px)',
				WebkitBackdropFilter: 'blur(16px)',
				border: '1px solid rgba(100, 160, 255, 0.18)',
				color: 'var(--text-primary)',
				boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
			}}
		>
			<span>↩</span>
			<span>Desktop</span>
		</Link>
	);
}
