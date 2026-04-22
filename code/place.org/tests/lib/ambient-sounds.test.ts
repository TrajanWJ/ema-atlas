import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// AudioContext mock
// ---------------------------------------------------------------------------

// Captured references so tests can inspect created nodes
let lastFilter: {
	type: string;
	frequency: { value: number };
	Q: { value: number };
	connect: ReturnType<typeof vi.fn>;
} | null = null;

let lastOscillators: Array<{
	type: string;
	frequency: { value: number };
	connect: ReturnType<typeof vi.fn>;
	start: ReturnType<typeof vi.fn>;
	stop: ReturnType<typeof vi.fn>;
}> = [];

let lastBufferSources: Array<{
	buffer: AudioBuffer | null;
	loop: boolean;
	connect: ReturnType<typeof vi.fn>;
	start: ReturnType<typeof vi.fn>;
	stop: ReturnType<typeof vi.fn>;
}> = [];

function makeGain() {
	return {
		connect: vi.fn(),
		gain: {
			value: 0,
			linearRampToValueAtTime: vi.fn(),
			setTargetAtTime: vi.fn(),
		},
	};
}

// Must be a real constructor function for `new AudioContext()` to work
function MockAudioContext(this: unknown) {
	const self = this as ReturnType<typeof buildCtx>;
	const ctx = buildCtx();
	Object.assign(self, ctx);
}

function buildCtx() {
	return {
		state: "running" as AudioContextState,
		currentTime: 0,
		sampleRate: 44100,
		destination: { connect: vi.fn() },
		resume: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),

		createGain() {
			return makeGain();
		},
		createBiquadFilter() {
			const f = {
				connect: vi.fn(),
				type: "lowpass",
				frequency: { value: 0 },
				Q: { value: 0 },
			};
			lastFilter = f;
			return f;
		},
		createOscillator() {
			const o = {
				connect: vi.fn(),
				type: "sine",
				frequency: { value: 0 },
				start: vi.fn(),
				stop: vi.fn(),
			};
			lastOscillators.push(o);
			return o;
		},
		createBuffer(_ch: number, len: number, rate: number) {
			return {
				numberOfChannels: 1,
				length: len,
				sampleRate: rate,
				getChannelData: () => new Float32Array(len),
			} as unknown as AudioBuffer;
		},
		createBufferSource() {
			const s = {
				buffer: null as AudioBuffer | null,
				loop: false,
				connect: vi.fn(),
				start: vi.fn(),
				stop: vi.fn(),
			};
			lastBufferSources.push(s);
			return s;
		},
	};
}

vi.stubGlobal("AudioContext", MockAudioContext);

// ---------------------------------------------------------------------------
// Import module under test AFTER mock is set up
// ---------------------------------------------------------------------------

const { createSoundscape, resumeAudioContext } = await import(
	"../../src/lib/ambient-sounds"
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
	lastFilter = null;
	lastOscillators = [];
	lastBufferSources = [];
});

// ---------------------------------------------------------------------------
// resumeAudioContext
// ---------------------------------------------------------------------------

describe("resumeAudioContext", () => {
	it("resolves without throwing", async () => {
		await expect(resumeAudioContext()).resolves.toBeUndefined();
	});
});

// ---------------------------------------------------------------------------
// Rain
// ---------------------------------------------------------------------------

describe("rain soundscape", () => {
	it("creates a lowpass filter at 800 Hz", () => {
		const s = createSoundscape("rain");
		s.start();
		expect(lastFilter).not.toBeNull();
		expect(lastFilter?.type).toBe("lowpass");
		expect(lastFilter?.frequency.value).toBe(800);
	});

	it("start returns without throwing", () => {
		const s = createSoundscape("rain");
		expect(() => s.start()).not.toThrow();
	});

	it("stop returns without throwing after start", () => {
		const s = createSoundscape("rain");
		s.start();
		expect(() => s.stop()).not.toThrow();
	});
});

// ---------------------------------------------------------------------------
// Brown noise
// ---------------------------------------------------------------------------

describe("brown noise soundscape", () => {
	it("creates a lowpass filter at 200 Hz", () => {
		const s = createSoundscape("brown");
		s.start();
		expect(lastFilter).not.toBeNull();
		expect(lastFilter?.type).toBe("lowpass");
		expect(lastFilter?.frequency.value).toBe(200);
	});

	it("filter frequency is lower than rain (200 < 800)", () => {
		const rain = createSoundscape("rain");
		rain.start();
		const rainFreq = lastFilter?.frequency.value ?? 0;

		lastFilter = null;

		const brown = createSoundscape("brown");
		brown.start();
		const brownFreq = (lastFilter as { frequency: { value: number } } | null)?.frequency.value ?? 0;

		expect(brownFreq).toBeLessThan(rainFreq);
	});
});

// ---------------------------------------------------------------------------
// White noise
// ---------------------------------------------------------------------------

describe("white noise soundscape", () => {
	it("does not create any filter node", () => {
		const s = createSoundscape("white");
		s.start();
		expect(lastFilter).toBeNull();
	});

	it("creates a buffer source", () => {
		const s = createSoundscape("white");
		s.start();
		expect(lastBufferSources.length).toBeGreaterThan(0);
	});
});

// ---------------------------------------------------------------------------
// Ocean
// ---------------------------------------------------------------------------

describe("ocean soundscape", () => {
	it("creates a lowpass filter at 1200 Hz", () => {
		const s = createSoundscape("ocean");
		s.start();
		expect(lastFilter).not.toBeNull();
		expect(lastFilter?.frequency.value).toBe(1200);
	});

	it("creates an LFO oscillator with 8-second cycle (1/8 Hz)", () => {
		const s = createSoundscape("ocean");
		s.start();
		const lfo = lastOscillators.find((o) => Math.abs(o.frequency.value - 1 / 8) < 0.001);
		expect(lfo).toBeDefined();
	});
});

// ---------------------------------------------------------------------------
// Lo-fi
// ---------------------------------------------------------------------------

describe("lofi soundscape", () => {
	it("creates a 40 Hz sine oscillator", () => {
		const s = createSoundscape("lofi");
		s.start();
		const sine40 = lastOscillators.find(
			(o) => o.type === "sine" && o.frequency.value === 40,
		);
		expect(sine40).toBeDefined();
	});

	it("creates an 80 Hz triangle oscillator", () => {
		const s = createSoundscape("lofi");
		s.start();
		const tri80 = lastOscillators.find(
			(o) => o.type === "triangle" && o.frequency.value === 80,
		);
		expect(tri80).toBeDefined();
	});

	it("creates a slow LFO oscillator below 1 Hz", () => {
		const s = createSoundscape("lofi");
		s.start();
		const lfo = lastOscillators.find((o) => o.frequency.value < 1);
		expect(lfo).toBeDefined();
	});

	it("does not create any filter node", () => {
		const s = createSoundscape("lofi");
		s.start();
		expect(lastFilter).toBeNull();
	});
});

// ---------------------------------------------------------------------------
// stop idempotency
// ---------------------------------------------------------------------------

describe("stop idempotency", () => {
	it("can be called multiple times without throwing", () => {
		const s = createSoundscape("rain");
		s.start();
		expect(() => {
			s.stop();
			s.stop();
		}).not.toThrow();
	});

	it("can be called without ever calling start", () => {
		const s = createSoundscape("white");
		expect(() => s.stop()).not.toThrow();
	});
});
