'use client';

export type EditorMode = 'edit' | 'preview' | 'split';

interface EditorToggleProps {
	mode: EditorMode;
	onChange: (mode: EditorMode) => void;
}

const MODES: { value: EditorMode; label: string }[] = [
	{ value: 'edit', label: 'Edit' },
	{ value: 'preview', label: 'Preview' },
	{ value: 'split', label: 'Split' },
];

export function EditorToggle({ mode, onChange }: EditorToggleProps) {
	return (
		<div
			role="group"
			aria-label="Editor mode"
			style={{
				display: 'flex',
				gap: '2px',
				padding: '0.3rem 0.75rem',
				borderBottom: '1px solid var(--border)',
				flexShrink: 0,
			}}
		>
			{MODES.map(({ value, label }) => (
				<button
					key={value}
					type="button"
					onClick={() => onChange(value)}
					aria-pressed={mode === value}
					style={{
						background: mode === value ? 'var(--bg-glass)' : 'transparent',
						border: `1px solid ${mode === value ? 'var(--border-hover)' : 'transparent'}`,
						borderRadius: '4px',
						color: mode === value ? 'var(--accent-blue)' : 'var(--text-secondary)',
						cursor: 'pointer',
						fontSize: '0.7rem',
						fontFamily: 'monospace',
						letterSpacing: '0.03em',
						padding: '0.2rem 0.55rem',
						transition: 'color 0.15s, border-color 0.15s',
					}}
				>
					{label}
				</button>
			))}
		</div>
	);
}
