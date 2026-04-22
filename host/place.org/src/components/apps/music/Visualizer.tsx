'use client';

import { useEffect, useRef } from 'react';

interface VisualizerProps {
	readonly analyserNode: AnalyserNode | null;
	readonly isPlaying: boolean;
}

const BAR_COUNT = 32;

export function Visualizer({ analyserNode, isPlaying }: VisualizerProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animFrameRef = useRef<number | null>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dataArray = new Uint8Array(BAR_COUNT);

		const draw = () => {
			const { width, height } = canvas;
			ctx.clearRect(0, 0, width, height);

			if (analyserNode && isPlaying) {
				analyserNode.getByteFrequencyData(dataArray);
			} else {
				// Idle: flat low bars
				dataArray.fill(0);
			}

			const barWidth = (width / BAR_COUNT) - 1;
			const gradient = ctx.createLinearGradient(0, height, 0, 0);
			gradient.addColorStop(0, 'rgba(91, 156, 245, 0.4)');
			gradient.addColorStop(1, 'rgba(91, 156, 245, 0.9)');

			ctx.fillStyle = gradient;

			for (let i = 0; i < BAR_COUNT; i++) {
				const value = dataArray[i] ?? 0;
				const barHeight = Math.max(2, (value / 255) * height);
				const x = i * (barWidth + 1);
				const y = height - barHeight;

				const radius = Math.min(2, barWidth / 2);
				ctx.beginPath();
				ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
				ctx.fill();
			}

			animFrameRef.current = requestAnimationFrame(draw);
		};

		draw();

		return () => {
			if (animFrameRef.current !== null) {
				cancelAnimationFrame(animFrameRef.current);
			}
		};
	}, [analyserNode, isPlaying]);

	return (
		<canvas
			ref={canvasRef}
			width={310}
			height={36}
			style={{
				width: '100%',
				height: '36px',
				display: 'block',
				borderRadius: '4px',
			}}
			aria-hidden="true"
		/>
	);
}
