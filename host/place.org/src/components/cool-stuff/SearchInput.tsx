'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface SearchInputProps {
	readonly value: string;
	readonly onChange: (query: string) => void;
}

export function SearchInput({ value, onChange }: SearchInputProps) {
	const [local, setLocal] = useState(value);
	const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

	useEffect(() => {
		setLocal(value);
	}, [value]);

	const handleChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const next = e.target.value;
			setLocal(next);
			if (timerRef.current) clearTimeout(timerRef.current);
			timerRef.current = setTimeout(() => onChange(next), 300);
		},
		[onChange],
	);

	useEffect(() => {
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, []);

	return (
		<div style={{ position: 'relative', marginBottom: '1rem' }}>
			<SearchIcon />
			<input
				type="text"
				value={local}
				onChange={handleChange}
				placeholder="Search tools, sites, articles..."
				style={{
					width: '100%',
					padding: '0.625rem 0.875rem 0.625rem 2.25rem',
					borderRadius: '0.5rem',
					border: '1px solid var(--place-border-default)',
					backgroundColor: 'rgba(255,255,255,0.03)',
					color: 'var(--place-text-primary)',
					fontSize: '0.875rem',
					outline: 'none',
					transition: 'border-color 0.15s',
				}}
				className="search-input"
			/>
			<style>{`
				.search-input::placeholder {
					color: var(--place-text-secondary);
					opacity: 0.5;
				}
				.search-input:focus {
					border-color: var(--place-secondary-400);
				}
			`}</style>
		</div>
	);
}

function SearchIcon() {
	return (
		<svg
			width="15"
			height="15"
			viewBox="0 0 15 15"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			style={{
				position: 'absolute',
				left: '0.75rem',
				top: '50%',
				transform: 'translateY(-50%)',
				color: 'var(--place-text-secondary)',
				opacity: 0.5,
				pointerEvents: 'none',
			}}
		>
			<path
				d="M10 6.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM9.5 10l3.5 3.5"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
			/>
		</svg>
	);
}
