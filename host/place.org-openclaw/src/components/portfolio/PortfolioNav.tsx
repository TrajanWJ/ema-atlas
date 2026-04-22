'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const NAV_LINKS = [
	{ label: 'Portfolio', href: '/portfolio' },
	{ label: 'Cool Stuff', href: '/cool-stuff' },
	{ label: 'About', href: '/about' },
	{ label: 'Community', href: '/community' },
] as const;

export function PortfolioNav() {
	const [solid, setSolid] = useState(false);
	const sentinelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				setSolid(!(entry?.isIntersecting ?? true));
			},
			{ threshold: 0 },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, []);

	return (
		<>
			<div ref={sentinelRef} className="absolute top-0 left-0 h-px w-full pointer-events-none" />
			<nav
				className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3 transition-all duration-300"
				style={{
					background: solid
						? 'rgba(6, 6, 16, 0.92)'
						: 'rgba(6, 6, 16, 0.4)',
					backdropFilter: 'blur(16px)',
					WebkitBackdropFilter: 'blur(16px)',
					borderBottom: solid
						? '1px solid rgba(100, 160, 255, 0.12)'
						: '1px solid transparent',
				}}
			>
				<Link
					href="/"
					className="text-sm font-semibold tracking-wider transition-opacity hover:opacity-80"
					style={{ color: 'var(--accent-blue)' }}
				>
					place.org
				</Link>
				<ul className="flex items-center gap-6">
					{NAV_LINKS.map((link) => (
						<li key={link.href}>
							<Link
								href={link.href}
								className="text-sm transition-colors duration-200 hover:text-white"
								style={{ color: 'var(--text-secondary)' }}
							>
								{link.label}
							</Link>
						</li>
					))}
				</ul>
			</nav>
		</>
	);
}
