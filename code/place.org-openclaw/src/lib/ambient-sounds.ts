// Ambient soundscapes generated entirely via Web Audio API — no external files.
// Each soundscape returns start() and stop() functions.
// Master gain is kept very low (0.05–0.1) to avoid distraction.

export type SoundscapeId = "rain" | "lofi" | "white" | "brown" | "ocean";

export interface Soundscape {
	readonly start: () => void;
	readonly stop: () => void;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function fillWhiteNoise(buffer: AudioBuffer): void {
	for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
		const data = buffer.getChannelData(ch);
		for (let i = 0; i < data.length; i++) {
			data[i] = Math.random() * 2 - 1;
		}
	}
}

function createWhiteNoiseSource(ctx: AudioContext): AudioBufferSourceNode {
	// 2-second looping buffer
	const bufferSize = ctx.sampleRate * 2;
	const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
	fillWhiteNoise(buffer);
	const source = ctx.createBufferSource();
	source.buffer = buffer;
	source.loop = true;
	return source;
}

// ---------------------------------------------------------------------------
// Rain — white noise through a lowpass filter at ~800 Hz
// ---------------------------------------------------------------------------

function createRain(ctx: AudioContext): Soundscape {
	let source: AudioBufferSourceNode | null = null;
	let filter: BiquadFilterNode | null = null;
	let master: GainNode | null = null;

	return {
		start() {
			source = createWhiteNoiseSource(ctx);
			filter = ctx.createBiquadFilter();
			filter.type = "lowpass";
			filter.frequency.value = 800;
			filter.Q.value = 0.5;

			master = ctx.createGain();
			master.gain.value = 0;

			source.connect(filter);
			filter.connect(master);
			master.connect(ctx.destination);
			source.start();

			master.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.2);
		},
		stop() {
			if (!master || !source) return;
			const stopAt = ctx.currentTime + 0.2;
			master.gain.linearRampToValueAtTime(0, stopAt);
			source.stop(stopAt);
			source = null;
			filter = null;
			master = null;
		},
	};
}

// ---------------------------------------------------------------------------
// Lo-fi — 40 Hz sine + 80 Hz triangle, very quiet, slow LFO modulation
// ---------------------------------------------------------------------------

function createLofi(ctx: AudioContext): Soundscape {
	let osc1: OscillatorNode | null = null;
	let osc2: OscillatorNode | null = null;
	let lfo: OscillatorNode | null = null;
	let lfoGain: GainNode | null = null;
	let master: GainNode | null = null;

	return {
		start() {
			osc1 = ctx.createOscillator();
			osc1.type = "sine";
			osc1.frequency.value = 40;

			osc2 = ctx.createOscillator();
			osc2.type = "triangle";
			osc2.frequency.value = 80;

			lfo = ctx.createOscillator();
			lfo.type = "sine";
			lfo.frequency.value = 0.05; // very slow: 20-second cycle

			lfoGain = ctx.createGain();
			lfoGain.gain.value = 0.02;

			master = ctx.createGain();
			master.gain.value = 0;

			lfo.connect(lfoGain);
			lfoGain.connect(master.gain);

			osc1.connect(master);
			osc2.connect(master);
			master.connect(ctx.destination);

			osc1.start();
			osc2.start();
			lfo.start();

			// Fade in to 0.06 over 200 ms
			master.gain.setTargetAtTime(0.06, ctx.currentTime, 0.07);
		},
		stop() {
			if (!master || !osc1 || !osc2 || !lfo) return;
			const stopAt = ctx.currentTime + 0.2;
			master.gain.linearRampToValueAtTime(0, stopAt);
			osc1.stop(stopAt);
			osc2.stop(stopAt);
			lfo.stop(stopAt);
			osc1 = null;
			osc2 = null;
			lfo = null;
			lfoGain = null;
			master = null;
		},
	};
}

// ---------------------------------------------------------------------------
// White noise — raw white noise at low volume
// ---------------------------------------------------------------------------

function createWhiteNoise(ctx: AudioContext): Soundscape {
	let source: AudioBufferSourceNode | null = null;
	let master: GainNode | null = null;

	return {
		start() {
			source = createWhiteNoiseSource(ctx);
			master = ctx.createGain();
			master.gain.value = 0;

			source.connect(master);
			master.connect(ctx.destination);
			source.start();

			master.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.2);
		},
		stop() {
			if (!master || !source) return;
			const stopAt = ctx.currentTime + 0.2;
			master.gain.linearRampToValueAtTime(0, stopAt);
			source.stop(stopAt);
			source = null;
			master = null;
		},
	};
}

// ---------------------------------------------------------------------------
// Brown noise — white noise through a steep lowpass filter at ~200 Hz
// ---------------------------------------------------------------------------

function createBrownNoise(ctx: AudioContext): Soundscape {
	let source: AudioBufferSourceNode | null = null;
	let filter: BiquadFilterNode | null = null;
	let master: GainNode | null = null;

	return {
		start() {
			source = createWhiteNoiseSource(ctx);
			filter = ctx.createBiquadFilter();
			filter.type = "lowpass";
			filter.frequency.value = 200;
			filter.Q.value = 0.8;

			master = ctx.createGain();
			master.gain.value = 0;

			source.connect(filter);
			filter.connect(master);
			master.connect(ctx.destination);
			source.start();

			master.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.2);
		},
		stop() {
			if (!master || !source) return;
			const stopAt = ctx.currentTime + 0.2;
			master.gain.linearRampToValueAtTime(0, stopAt);
			source.stop(stopAt);
			source = null;
			filter = null;
			master = null;
		},
	};
}

// ---------------------------------------------------------------------------
// Ocean — white noise with a slow volume LFO (8-second wave swell cycle)
// ---------------------------------------------------------------------------

function createOcean(ctx: AudioContext): Soundscape {
	let source: AudioBufferSourceNode | null = null;
	let filter: BiquadFilterNode | null = null;
	let lfo: OscillatorNode | null = null;
	let lfoGain: GainNode | null = null;
	let master: GainNode | null = null;

	return {
		start() {
			source = createWhiteNoiseSource(ctx);

			filter = ctx.createBiquadFilter();
			filter.type = "lowpass";
			filter.frequency.value = 1200;
			filter.Q.value = 0.3;

			master = ctx.createGain();
			master.gain.value = 0;

			// LFO modulates gain to create wave swells (8-second cycle)
			lfo = ctx.createOscillator();
			lfo.type = "sine";
			lfo.frequency.value = 1 / 8;

			lfoGain = ctx.createGain();
			lfoGain.gain.value = 0.04;

			lfo.connect(lfoGain);
			lfoGain.connect(master.gain);

			source.connect(filter);
			filter.connect(master);
			master.connect(ctx.destination);

			source.start();
			lfo.start();

			master.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.2);
		},
		stop() {
			if (!master || !source || !lfo) return;
			const stopAt = ctx.currentTime + 0.2;
			master.gain.linearRampToValueAtTime(0, stopAt);
			source.stop(stopAt);
			lfo.stop(stopAt);
			source = null;
			filter = null;
			lfo = null;
			lfoGain = null;
			master = null;
		},
	};
}

// ---------------------------------------------------------------------------
// Public API — factory keyed by SoundscapeId
// ---------------------------------------------------------------------------

let sharedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
	if (!sharedCtx || sharedCtx.state === "closed") {
		sharedCtx = new AudioContext();
	}
	return sharedCtx;
}

export function createSoundscape(id: SoundscapeId): Soundscape {
	const ctx = getAudioContext();
	switch (id) {
		case "rain":
			return createRain(ctx);
		case "lofi":
			return createLofi(ctx);
		case "white":
			return createWhiteNoise(ctx);
		case "brown":
			return createBrownNoise(ctx);
		case "ocean":
			return createOcean(ctx);
	}
}

// Resume a suspended context (browsers require user-gesture unlock)
export async function resumeAudioContext(): Promise<void> {
	const ctx = getAudioContext();
	if (ctx.state === "suspended") {
		await ctx.resume();
	}
}
