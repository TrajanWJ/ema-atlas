'use client';

import type { ReactNode } from 'react';

export function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<div style={{ marginBottom: '1.5rem' }}>
			<div
				style={{
					fontSize: '0.65rem',
					textTransform: 'uppercase',
					letterSpacing: '0.06em',
					color: 'var(--place-primary-400)',
					padding: '0 0 0.4rem',
				}}
			>
				{title}
			</div>
			<div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
				{children}
			</div>
		</div>
	);
}

export function SettingRow({
	label,
	description,
	children,
}: {
	label: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<div
			style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				padding: '0.4rem 0',
			}}
		>
			<div>
				<div style={{ fontSize: '0.78rem', color: 'var(--place-text-primary)' }}>
					{label}
				</div>
				{description && (
					<div
						style={{
							fontSize: '0.65rem',
							color: 'var(--place-text-muted)',
							marginTop: 2,
						}}
					>
						{description}
					</div>
				)}
			</div>
			{children}
		</div>
	);
}
