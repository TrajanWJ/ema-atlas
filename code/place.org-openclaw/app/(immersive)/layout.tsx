import type { ReactNode } from 'react';
import { ImmersiveNav } from '@/src/components/navigation/ImmersiveNav';
import { BackToDesktop } from '@/src/components/navigation/BackToDesktop';

export default function ImmersiveLayout({ children }: { children: ReactNode }) {
	return (
		<div className="min-h-dvh bg-[var(--bg-deep)] text-[var(--text-primary)]">
			<ImmersiveNav />
			<main className="pt-14">
				{children}
			</main>
			<BackToDesktop />
		</div>
	);
}
