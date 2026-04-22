'use client';

import type { ReactNode, MouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PageTransitionLinkProps {
	readonly href: string;
	readonly children: ReactNode;
	readonly className?: string;
}

export function PageTransitionLink({
	href,
	children,
	className,
}: PageTransitionLinkProps) {
	const router = useRouter();

	function handleClick(e: MouseEvent<HTMLAnchorElement>) {
		e.preventDefault();
		setTimeout(() => {
			router.push(href);
		}, 200);
	}

	return (
		<Link href={href} onClick={handleClick} className={className}>
			{children}
		</Link>
	);
}
