'use client';

import { motion } from 'motion/react';
import type { SortMode } from '../../data/cool-stuff';

interface SortButtonsProps {
	readonly active: SortMode;
	readonly onChange: (mode: SortMode) => void;
}

const SORT_OPTIONS: readonly { readonly value: SortMode; readonly label: string }[] = [
	{ value: 'newest', label: 'Newest' },
	{ value: 'category', label: 'Category' },
	{ value: 'az', label: 'A-Z' },
] as const;

export function SortButtons({ active, onChange }: SortButtonsProps) {
	return (
		<div
			role="group"
			aria-label="Sort items"
			style={{
				display: 'flex',
				gap: '0.375rem',
				marginBottom: '1rem',
			}}
		>
			<span
				style={{
					fontSize: '0.75rem',
					color: 'var(--place-text-secondary)',
					opacity: 0.5,
					alignSelf: 'center',
					marginRight: '0.25rem',
				}}
			>
				Sort:
			</span>
			{SORT_OPTIONS.map(({ value, label }) => {
				const isActive = active === value;
				return (
					<motion.button
						key={value}
						onClick={() => onChange(value)}
						whileHover={{ scale: 1.04 }}
						whileTap={{ scale: 0.97 }}
						style={{
							padding: '0.25rem 0.625rem',
							borderRadius: '0.25rem',
							fontSize: '0.75rem',
							fontWeight: isActive ? 600 : 400,
							cursor: 'pointer',
							border: 'none',
							backgroundColor: isActive
								? 'rgba(255,255,255,0.08)'
								: 'transparent',
							color: isActive
								? 'var(--place-text-primary)'
								: 'var(--place-text-secondary)',
							transition: 'color 0.15s, background-color 0.15s',
							outline: 'none',
						}}
						aria-pressed={isActive}
					>
						{label}
					</motion.button>
				);
			})}
		</div>
	);
}
