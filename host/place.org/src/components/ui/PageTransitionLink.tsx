'use client';

import type { ReactNode, MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PageTransitionLinkProps {
	readonly href: string;
	readonly children: ReactNode;
	readonly className?: string;
}

function supportsViewTransitions(): boolean {
	return typeof document !== 'undefined' && 'startViewTransition' in document;
}

export function PageTransitionLink({
	href,
	children,
	className,
}: PageTransitionLinkProps) {
	const router = useRouter();

	function handleClick(e: MouseEvent<HTMLAnchorElement>) {
		e.preventDefault();

		if (supportsViewTransitions()) {
			(document as unknown as { startViewTransition: (cb: () => void) => void })
				.startViewTransition(() => {
					router.push(href);
				});
		} else {
			router.push(href);
		}
	}

	return (
		<Link href={href} onClick={handleClick} className={className}>
			{children}
		</Link>
	);
}
