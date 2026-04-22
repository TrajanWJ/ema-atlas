'use client';

import { useEffect, useState } from 'react';

interface TimeDisplay {
	readonly time: string;
	readonly date: string;
}

interface WorldTimezone {
	readonly zone: string;
	readonly label: string;
}

const DEFAULT_TIMEZONES: readonly WorldTimezone[] = [
	{ zone: 'UTC', label: 'UTC' },
	{ zone: 'America/New_York', label: 'New York' },
	{ zone: 'Europe/London', label: 'London' },
	{ zone: 'Asia/Tokyo', label: 'Tokyo' },
] as const;

export function ClockApp() {
	const [localTime, setLocalTime] = useState<TimeDisplay>({ time: '--:--', date: '' });
	const [worldTimes, setWorldTimes] = useState<readonly { readonly label: string; readonly time: string }[]>([]);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;

		const updateTime = () => {
			const now = new Date();

			// Local time
			const localFormatter = new Intl.DateTimeFormat('en-US', {
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit',
				hour12: false,
			});
			const dateFormatter = new Intl.DateTimeFormat('en-US', {
				weekday: 'short',
				month: 'short',
				day: 'numeric',
				year: 'numeric',
			});

			setLocalTime({
				time: localFormatter.format(now),
				date: dateFormatter.format(now),
			});

			// World timezones
			const times = DEFAULT_TIMEZONES.map((tz) => {
				const formatter = new Intl.DateTimeFormat('en-US', {
					hour: '2-digit',
					minute: '2-digit',
					hour12: false,
					timeZone: tz.zone,
				});
				return {
					label: tz.label,
					time: formatter.format(now),
				};
			});
			setWorldTimes(times);
		};

		updateTime();
		const interval = setInterval(updateTime, 1000);

		return () => clearInterval(interval);
	}, [mounted]);

	return (
		<div
			className="flex h-full flex-col"
			style={{
				padding: '2rem',
				gap: '2rem',
				justifyContent: 'center',
				alignItems: 'center',
			}}
		>
			{/* Local time display */}
			<div style={{ textAlign: 'center', gap: '0.5rem', display: 'flex', flexDirection: 'column' }}>
				<div
					style={{
						fontFamily: 'monospace',
						fontSize: '3.5rem',
						fontWeight: 600,
						color: 'var(--text-primary)',
						letterSpacing: '0.05em',
					}}
				>
					{localTime.time}
				</div>
				<div
					style={{
						fontSize: '0.875rem',
						color: 'var(--text-secondary)',
						fontFamily: 'monospace',
					}}
				>
					{localTime.date}
				</div>
			</div>

			{/* World timezones */}
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					gap: '0.75rem',
					width: '100%',
					maxWidth: '200px',
				}}
			>
				{worldTimes.map((tz) => (
					<div
						key={tz.label}
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							padding: '0.5rem 0.75rem',
							backgroundColor: 'rgba(255, 255, 255, 0.02)',
							borderRadius: '0.375rem',
							fontSize: '0.875rem',
							fontFamily: 'monospace',
						}}
					>
						<span style={{ color: 'var(--text-secondary)' }}>{tz.label}</span>
						<span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{tz.time}</span>
					</div>
				))}
			</div>
		</div>
	);
}
