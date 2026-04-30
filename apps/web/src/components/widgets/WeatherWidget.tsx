'use client';

import { useWeather } from '@/src/hooks/use-weather';

// ---------------------------------------------------------------------------
// Weather icon mapping (WMO code ranges → emoji)
// ---------------------------------------------------------------------------

function weatherEmoji(code: number): string {
	if (code === 0) return '☀️';
	if (code <= 3) return '⛅';
	if (code <= 48) return '🌫️';
	if (code <= 57) return '🌧️';
	if (code <= 67) return '🌧️';
	if (code <= 77) return '❄️';
	if (code <= 82) return '🌦️';
	if (code <= 86) return '🌨️';
	if (code <= 99) return '⛈️';
	return '🌤️';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function WeatherWidget() {
	const { temp, description, weatherCode, loading, error } = useWeather();

	return (
		<div
			style={{
				width: 140,
				padding: '8px 12px 10px',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 2,
			}}
		>
			{loading && (
				<span style={{ fontSize: '0.65rem', color: 'var(--place-text-tertiary)' }}>
					Loading...
				</span>
			)}

			{error && !loading && (
				<span style={{ fontSize: '0.6rem', color: 'var(--place-text-tertiary)' }}>
					Weather unavailable
				</span>
			)}

			{!loading && !error && (
				<>
					<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
						<span style={{ fontSize: '1.4rem', lineHeight: 1 }}>
							{weatherEmoji(weatherCode)}
						</span>
						<span
							style={{
								fontSize: '1.5rem',
								fontWeight: 600,
								color: 'var(--place-text-primary)',
								lineHeight: 1,
							}}
						>
							{Math.round(temp)}°
						</span>
					</div>
					<span
						style={{
							fontSize: '0.6rem',
							color: 'var(--place-text-secondary)',
							textTransform: 'capitalize',
							textAlign: 'center',
						}}
					>
						{description}
					</span>
				</>
			)}
		</div>
	);
}
