'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PageTransitionLink } from '@/src/components/ui/PageTransitionLink';

const NAV_LINKS = [
	{ label: 'Portfolio', href: '/portfolio' },
	{ label: 'Cool Stuff', href: '/cool-stuff' },
	{ label: 'About', href: '/about' },
	{ label: 'Community', href: '/community' },
	{ label: 'Services', href: '/services' },
] as const;

export function ImmersiveNav() {
	const pathname = usePathname();
	const sentinelRef = useRef<HTMLDivElement>(null);
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				setScrolled(entry !== undefined && !entry.isIntersecting);
			},
			{ threshold: 0 },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, []);

	return (
		<>
			<div ref={sentinelRef} className="absolute top-0 left-0 h-px w-full pointer-events-none" />
			<header
				className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
					scrolled
						? 'bg-[var(--place-surface-1)] border-b border-[var(--place-border-default)]'
						: 'glass'
				}`}
			>
				<nav className="flex items-center justify-between px-6 h-14 max-w-7xl mx-auto">
					{/* Left: logo */}
					<Link
						href="/"
						className="text-[var(--place-text-primary)] font-semibold tracking-tight hover:text-[var(--place-secondary-400)] transition-colors"
					>
						place.org
					</Link>

					{/* Center: nav links */}
					<ul className="hidden sm:flex items-center gap-1">
						{NAV_LINKS.map(({ label, href }) => {
							const isActive = pathname === href || pathname.startsWith(`${href}/`);
							return (
								<li key={href}>
									<PageTransitionLink
										href={href}
										className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
											isActive
												? 'bg-[var(--place-surface-1)] text-[var(--place-text-primary)] border border-[var(--place-border-strong)]'
												: 'text-[var(--place-text-secondary)] hover:text-[var(--place-text-primary)]'
										}`}
									>
										{label}
									</PageTransitionLink>
								</li>
							);
						})}
					</ul>

					{/* Mobile: horizontal scroll nav */}
					<ul className="flex sm:hidden items-center gap-1 overflow-x-auto max-w-[60vw] scrollbar-hide">
						{NAV_LINKS.map(({ label, href }) => {
							const isActive = pathname === href || pathname.startsWith(`${href}/`);
							return (
								<li key={href} className="shrink-0">
									<PageTransitionLink
										href={href}
										className={`px-3 py-1 rounded-full text-xs transition-colors whitespace-nowrap ${
											isActive
												? 'bg-[var(--place-surface-1)] text-[var(--place-text-primary)] border border-[var(--place-border-strong)]'
												: 'text-[var(--place-text-secondary)] hover:text-[var(--place-text-primary)]'
										}`}
									>
										{label}
									</PageTransitionLink>
								</li>
							);
						})}
					</ul>

					{/* Right: back to desktop */}
					<Link
						href="/"
						className="text-sm text-[var(--place-text-secondary)] hover:text-[var(--place-text-primary)] transition-colors flex items-center gap-1.5"
					>
						<span aria-hidden="true">←</span>
						<span>Desktop</span>
					</Link>
				</nav>
			</header>
		</>
	);
}
