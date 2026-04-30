'use client';

import type { ReactNode } from 'react';

type Props = {
	icon: string;
	title: string;
	description: string;
	children: ReactNode;
};

export function SettingsPage({ icon, title, description, children }: Props) {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
			<div
				style={{
					padding: '0.85rem 1rem 0.75rem',
					borderBottom: '1px solid var(--place-border-default)',
					flexShrink: 0,
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '0.5rem',
						marginBottom: '0.2rem',
					}}
				>
					{icon && (
						<span style={{ fontSize: '1rem', lineHeight: 1 }}>{icon}</span>
					)}
					<span
						style={{
							fontSize: '0.8rem',
							fontWeight: 600,
							color: 'var(--place-text-primary)',
						}}
					>
						{title}
					</span>
				</div>
				<p
					style={{
						fontSize: '0.68rem',
						color: 'var(--place-text-muted)',
						margin: 0,
						lineHeight: 1.4,
					}}
				>
					{description}
				</p>
			</div>
			<div style={{ flex: 1, overflowY: 'auto' }}>{children}</div>
		</div>
	);
}
