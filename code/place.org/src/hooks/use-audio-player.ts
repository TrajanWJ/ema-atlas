'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { STATIONS } from '@/src/lib/music-stations';
import type { Station } from '@/src/lib/music-stations';

export interface AudioPlayerState {
	readonly isPlaying: boolean;
	readonly currentStation: Station;
	readonly volume: number;
	readonly error: string | null;
	readonly analyserNode: AnalyserNode | null;
}

export interface AudioPlayerActions {
	play(): void;
	pause(): void;
	setVolume(volume: number): void;
	setStation(station: Station): void;
}

export type AudioPlayer = AudioPlayerState & AudioPlayerActions;

export function useAudioPlayer(): AudioPlayer {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentStation, setCurrentStationState] = useState<Station>(STATIONS[0]);
	const [volume, setVolumeState] = useState(0.7);
	const [error, setError] = useState<string | null>(null);
	const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

	const audioRef = useRef<HTMLAudioElement | null>(null);
	const audioContextRef = useRef<AudioContext | null>(null);
	const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);

	const setupAudioContext = useCallback((audio: HTMLAudioElement) => {
		if (audioContextRef.current) return;

		try {
			const ctx = new AudioContext();
			const analyser = ctx.createAnalyser();
			analyser.fftSize = 64;
			analyser.smoothingTimeConstant = 0.8;

			const source = ctx.createMediaElementSource(audio);
			source.connect(analyser);
			analyser.connect(ctx.destination);

			audioContextRef.current = ctx;
			sourceNodeRef.current = source;
			analyserRef.current = analyser;
			setAnalyserNode(analyser);
		} catch {
			// Audio context not available (e.g. test environment), skip
		}
	}, []);

	const initAudio = useCallback(
		(station: Station) => {
			const audio = new Audio();
			audio.crossOrigin = 'anonymous';
			audio.src = station.url;
			audio.volume = volume;
			audio.preload = 'none';

			audio.addEventListener('error', () => {
				setError('Stream unavailable');
				setIsPlaying(false);
			});

			audio.addEventListener('playing', () => {
				setError(null);
			});

			audioRef.current = audio;
			return audio;
		},
		[volume],
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			audioRef.current?.pause();
			audioRef.current = null;
			audioContextRef.current?.close();
			audioContextRef.current = null;
			sourceNodeRef.current = null;
			analyserRef.current = null;
		};
	}, []);

	const play = useCallback(() => {
		if (!audioRef.current) {
			initAudio(currentStation);
		}

		const audio = audioRef.current;
		if (!audio) return;

		setupAudioContext(audio);

		if (audioContextRef.current?.state === 'suspended') {
			audioContextRef.current.resume().catch(() => {});
		}

		audio.play().then(() => {
			setIsPlaying(true);
			setError(null);
		}).catch((err: unknown) => {
			const isAutoplayBlocked = err instanceof DOMException && err.name === 'NotAllowedError';
			setError(isAutoplayBlocked ? 'Click play to start' : 'Stream unavailable');
			setIsPlaying(false);
		});
	}, [currentStation, initAudio, setupAudioContext]);

	const pause = useCallback(() => {
		audioRef.current?.pause();
		setIsPlaying(false);
	}, []);

	const setVolume = useCallback((vol: number) => {
		const clamped = Math.max(0, Math.min(1, vol));
		setVolumeState(clamped);
		if (audioRef.current) {
			audioRef.current.volume = clamped;
		}
	}, []);

	const setStation = useCallback(
		(station: Station) => {
			const wasPlaying = isPlaying;

			// Tear down old audio and source node (can't reuse MediaElementAudioSourceNode)
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}

			// Disconnect old source node so the context can connect a new one
			if (sourceNodeRef.current) {
				try {
					sourceNodeRef.current.disconnect();
				} catch {
					// already disconnected
				}
				sourceNodeRef.current = null;
			}

			setCurrentStationState(station);
			setError(null);

			const audio = new Audio();
			audio.crossOrigin = 'anonymous';
			audio.src = station.url;
			audio.volume = volume;
			audio.preload = 'none';

			audio.addEventListener('error', () => {
				setError('Stream unavailable');
				setIsPlaying(false);
			});

			audio.addEventListener('playing', () => {
				setError(null);
			});

			audioRef.current = audio;

			if (wasPlaying) {
				// Re-attach to existing context
				if (audioContextRef.current && analyserRef.current) {
					try {
						const source = audioContextRef.current.createMediaElementSource(audio);
						source.connect(analyserRef.current);
						sourceNodeRef.current = source;
					} catch {
						// Fallback: reset context
						audioContextRef.current = null;
					}
				}

				if (audioContextRef.current?.state === 'suspended') {
					audioContextRef.current.resume().catch(() => {});
				}

				audio.play().then(() => {
					setIsPlaying(true);
					setError(null);
				}).catch((err: unknown) => {
					const blocked = err instanceof DOMException && err.name === 'NotAllowedError';
					setError(blocked ? 'Click play to start' : 'Stream unavailable');
					setIsPlaying(false);
				});
			}
		},
		[isPlaying, volume],
	);

	return {
		isPlaying,
		currentStation,
		volume,
		error,
		analyserNode,
		play,
		pause,
		setVolume,
		setStation,
	};
}
