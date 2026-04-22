'use client';

import { STATIONS } from '@/src/lib/music-stations';
import type { Station } from '@/src/lib/music-stations';

interface StationSelectorProps {
	readonly currentStation: Station;
	readonly onSelect: (station: Station) => void;
}

export function StationSelector({ currentStation, onSelect }: StationSelectorProps) {
	return (
		<div
			role="group"
			aria-label="Select station"
			style={{
				display: 'flex',
				flexDirection: 'row',
				gap: '0.5rem',
				justifyContent: 'center',
				flexWrap: 'wrap',
			}}
		>
			{STATIONS.map((station) => {
				const isActive = station.name === currentStation.name;
				return (
					<button
						key={station.name}
						type="button"
						onClick={() => onSelect(station)}
						aria-pressed={isActive}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '0.375rem',
							padding: '0.25rem 0.625rem',
							borderRadius: '999px',
							border: `1px solid ${isActive ? station.color : 'rgba(255,255,255,0.08)'}`,
							background: isActive
								? `${station.color}22`
								: 'rgba(255,255,255,0.04)',
							color: isActive ? station.color : 'var(--text-secondary)',
							fontSize: '0.7rem',
							fontFamily: 'monospace',
							cursor: 'pointer',
							transition: 'all 0.15s ease',
							letterSpacing: '0.04em',
						}}
					>
						<span
							style={{
								width: '6px',
								height: '6px',
								borderRadius: '50%',
								background: station.color,
								opacity: isActive ? 1 : 0.4,
								flexShrink: 0,
							}}
						/>
						{station.name}
					</button>
				);
			})}
		</div>
	);
}
