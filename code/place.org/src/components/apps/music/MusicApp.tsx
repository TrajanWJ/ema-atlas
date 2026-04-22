'use client';

import { useAudioPlayer } from '@/src/hooks/use-audio-player';
import { Visualizer } from './Visualizer';
import { StationSelector } from './StationSelector';
import type { Station } from '@/src/lib/music-stations';

function PlayIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<polygon points="5,3 19,12 5,21" />
		</svg>
	);
}

function PauseIcon() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<rect x="6" y="4" width="4" height="16" />
			<rect x="14" y="4" width="4" height="16" />
		</svg>
	);
}

export function MusicApp() {
	const { isPlaying, currentStation, volume, error, analyserNode, play, pause, setVolume, setStation } =
		useAudioPlayer();

	const handlePlayPause = () => {
		if (isPlaying) {
			pause();
		} else {
			play();
		}
	};

	const handleStationSelect = (station: Station) => {
		setStation(station);
	};

	const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setVolume(Number(e.target.value));
	};

	return (
		<div
			style={{
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				padding: '1rem 1.25rem',
				gap: '0.75rem',
				justifyContent: 'space-between',
				boxSizing: 'border-box',
			}}
		>
			{/* Station name + status */}
			<div style={{ textAlign: 'center' }}>
				<div
					style={{
						fontSize: '0.8rem',
						fontFamily: 'monospace',
						color: currentStation.color,
						letterSpacing: '0.08em',
						textTransform: 'uppercase',
						fontWeight: 600,
					}}
				>
					{currentStation.name}
				</div>
				{error && (
					<div
						role="alert"
						style={{
							fontSize: '0.65rem',
							color: 'var(--place-text-secondary)',
							marginTop: '0.25rem',
							fontFamily: 'monospace',
						}}
					>
						{error}
					</div>
				)}
				{!error && (
					<div
						style={{
							fontSize: '0.65rem',
							color: 'var(--place-text-secondary)',
							marginTop: '0.25rem',
							fontFamily: 'monospace',
						}}
					>
						{isPlaying ? '● LIVE' : '— PAUSED'}
					</div>
				)}
			</div>

			{/* Play/Pause button */}
			<div style={{ display: 'flex', justifyContent: 'center' }}>
				<button
					type="button"
					onClick={handlePlayPause}
					aria-label={isPlaying ? 'Pause' : 'Play'}
					style={{
						width: '56px',
						height: '56px',
						borderRadius: '50%',
						border: `2px solid ${currentStation.color}`,
						background: `${currentStation.color}18`,
						color: currentStation.color,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						cursor: 'pointer',
						transition: 'all 0.15s ease',
						flexShrink: 0,
					}}
				>
					{isPlaying ? <PauseIcon /> : <PlayIcon />}
				</button>
			</div>

			{/* Visualizer */}
			<div
				style={{
					background: 'rgba(0,0,0,0.2)',
					borderRadius: '6px',
					padding: '0.375rem',
					overflow: 'hidden',
				}}
			>
				<Visualizer analyserNode={analyserNode} isPlaying={isPlaying} />
			</div>

			{/* Volume slider */}
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					gap: '0.5rem',
				}}
			>
				<span
					style={{
						fontSize: '0.65rem',
						color: 'var(--place-text-secondary)',
						fontFamily: 'monospace',
						minWidth: '1rem',
					}}
				>
					VOL
				</span>
				<input
					type="range"
					min={0}
					max={1}
					step={0.01}
					value={volume}
					onChange={handleVolumeChange}
					aria-label="Volume"
					style={{
						flex: 1,
						height: '3px',
						accentColor: currentStation.color,
						cursor: 'pointer',
					}}
				/>
				<span
					style={{
						fontSize: '0.65rem',
						color: 'var(--place-text-secondary)',
						fontFamily: 'monospace',
						minWidth: '2rem',
						textAlign: 'right',
					}}
				>
					{Math.round(volume * 100)}%
				</span>
			</div>

			{/* Station selector */}
			<StationSelector currentStation={currentStation} onSelect={handleStationSelect} />
		</div>
	);
}
