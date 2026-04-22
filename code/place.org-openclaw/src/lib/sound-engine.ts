// Sound engine using Web Audio API — all sounds are synthesized, no external files.
// Designed to be self-contained and easily removed.

const GAIN = 0.08;

function scheduleNote(
	ctx: AudioContext,
	type: OscillatorType,
	frequency: number,
	startTime: number,
	durationMs: number,
): void {
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();

	osc.type = type;
	osc.frequency.setValueAtTime(frequency, startTime);

	const durationSec = durationMs / 1000;
	gain.gain.setValueAtTime(GAIN, startTime);
	gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationSec);

	osc.connect(gain);
	gain.connect(ctx.destination);

	osc.start(startTime);
	osc.stop(startTime + durationSec + 0.01);
}

export class SoundEngine {
	private ctx: AudioContext | null = null;

	init(audioContext: AudioContext): void {
		this.ctx = audioContext;
	}

	// Short high-frequency blip: 1200 Hz, 30 ms, triangle
	playClick(): void {
		if (this.ctx === null) return;
		const now = this.ctx.currentTime;
		scheduleNote(this.ctx, "triangle", 1200, now, 30);
	}

	// Ascending two-tone: 400 Hz → 600 Hz, 100 ms each, sine
	playOpen(): void {
		if (this.ctx === null) return;
		const now = this.ctx.currentTime;
		scheduleNote(this.ctx, "sine", 400, now, 100);
		scheduleNote(this.ctx, "sine", 600, now + 0.1, 100);
	}

	// Descending two-tone: 600 Hz → 400 Hz, 80 ms each, sine
	playClose(): void {
		if (this.ctx === null) return;
		const now = this.ctx.currentTime;
		scheduleNote(this.ctx, "sine", 600, now, 80);
		scheduleNote(this.ctx, "sine", 400, now + 0.08, 80);
	}

	// Gentle 3-note chime: 800 Hz, 1000 Hz, 1200 Hz, 150 ms each, sine
	playNotification(): void {
		if (this.ctx === null) return;
		const now = this.ctx.currentTime;
		scheduleNote(this.ctx, "sine", 800, now, 150);
		scheduleNote(this.ctx, "sine", 1000, now + 0.15, 150);
		scheduleNote(this.ctx, "sine", 1200, now + 0.3, 150);
	}
}

export const soundEngine = new SoundEngine();
