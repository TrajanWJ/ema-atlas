import type { ReactNode } from 'react';
import { ImmersiveNav } from '@/src/components/navigation/ImmersiveNav';
import { BackToDesktop } from '@/src/components/navigation/BackToDesktop';

export default function ImmersiveLayout({ children }: { children: ReactNode }) {
	return (
		<div
			className="h-dvh overflow-y-auto bg-[var(--bg-deep)] text-[var(--text-primary)]"
			style={{ animation: 'page-fade-in 0.2s ease' }}
		>
			<style>{`
				@keyframes page-fade-in {
					from { opacity: 0; }
					to { opacity: 1; }
				}
			`}</style>
			<ImmersiveNav />
			<main className="pt-14">
				{children}
			</main>
			<BackToDesktop />
		</div>
	);
}
