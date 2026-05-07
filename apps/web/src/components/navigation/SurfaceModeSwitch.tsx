'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutGrid, Sparkles } from 'lucide-react';

const LAST_HOLODECK_PATH_KEY = 'ema:last-holodeck-path';
const HOLODECK_FALLBACK_PATH = '/launchpad';
const IMMERSIVE_PATH_PREFIXES = [
	'/about',
	'/community',
	'/companion',
	'/cool-stuff',
	'/portfolio',
	'/services',
] as const;

function canStartViewTransition(): boolean {
	return typeof document !== 'undefined' && 'startViewTransition' in document;
}

function readLastHolodeckPath(): string {
	if (typeof window === 'undefined') return HOLODECK_FALLBACK_PATH;
	const stored = window.localStorage.getItem(LAST_HOLODECK_PATH_KEY);
	if (!stored || stored === '/' || stored.startsWith('/popout')) {
		return HOLODECK_FALLBACK_PATH;
	}
	return stored;
}

function rememberHolodeckPath(pathname: string): void {
	if (typeof window === 'undefined') return;
	if (pathname === '/' || pathname.startsWith('/popout')) return;
	if (isImmersivePath(pathname)) return;
	window.localStorage.setItem(LAST_HOLODECK_PATH_KEY, pathname);
}

function isImmersivePath(pathname: string): boolean {
	return IMMERSIVE_PATH_PREFIXES.some(
		(prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
	);
}

export function SurfaceModeSwitch() {
	const pathname = usePathname() ?? '/';
	const router = useRouter();
	const [lastHolodeckPath, setLastHolodeckPath] = useState(HOLODECK_FALLBACK_PATH);

	useEffect(() => {
		if (pathname === '/') {
			setLastHolodeckPath(readLastHolodeckPath());
			return;
		}

		rememberHolodeckPath(pathname);
		setLastHolodeckPath(pathname);
	}, [pathname]);

	if (pathname.startsWith('/popout') || isImmersivePath(pathname)) return null;

	const onDesktop = pathname === '/';
	const href = onDesktop ? lastHolodeckPath : '/';
	const Icon = onDesktop ? Sparkles : LayoutGrid;
	const label = onDesktop ? 'Holodeck mode' : 'Desktop mode';
	const detail = onDesktop ? 'Open the sidebar workspace' : 'Return to the virtual desktop';

	function handleClick(event: MouseEvent<HTMLAnchorElement>) {
		event.preventDefault();
		const navigate = () => router.push(href);

		if (canStartViewTransition()) {
			(document as unknown as { startViewTransition: (cb: () => void) => void })
				.startViewTransition(navigate);
			return;
		}

		navigate();
	}

	return (
		<Link
			href={href}
			onClick={handleClick}
			aria-label={detail}
			title={detail}
			className="glass fixed z-[70] inline-flex h-10 items-center gap-2 rounded-xl px-3 text-[12px] font-semibold transition-colors hover:text-[var(--place-text-primary)]"
			style={{
				top: onDesktop ? 76 : 10,
				left: onDesktop ? 12 : undefined,
				right: onDesktop ? undefined : 12,
				color: 'var(--place-text-secondary)',
				borderColor: 'var(--place-border-default)',
				boxShadow: onDesktop ? '0 8px 28px rgba(0,0,0,0.22)' : undefined,
			}}
		>
			<Icon size={15} strokeWidth={1.8} aria-hidden="true" />
			<span>{label}</span>
		</Link>
	);
}
