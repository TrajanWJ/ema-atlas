import { describe, it, expect, vi, beforeEach } from "vitest";
import { SoundEngine } from "../../src/lib/sound-engine";

// ---------------------------------------------------------------------------
// Mock AudioContext
// ---------------------------------------------------------------------------

interface MockOscillator {
	type: OscillatorType;
	frequency: { setValueAtTime: ReturnType<typeof vi.fn> };
	connect: ReturnType<typeof vi.fn>;
	start: ReturnType<typeof vi.fn>;
	stop: ReturnType<typeof vi.fn>;
}

interface MockGain {
	gain: {
		setValueAtTime: ReturnType<typeof vi.fn>;
		exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
	};
	connect: ReturnType<typeof vi.fn>;
}

function makeMockOscillator(): MockOscillator {
	return {
		type: "sine",
		frequency: { setValueAtTime: vi.fn() },
		connect: vi.fn(),
		start: vi.fn(),
		stop: vi.fn(),
	};
}

function makeMockGain(): MockGain {
	return {
		gain: {
			setValueAtTime: vi.fn(),
			exponentialRampToValueAtTime: vi.fn(),
		},
		connect: vi.fn(),
	};
}

function makeMockAudioContext() {
	const oscillators: MockOscillator[] = [];
	const gains: MockGain[] = [];

	return {
		currentTime: 0,
		destination: {},
		createOscillator: vi.fn(() => {
			const osc = makeMockOscillator();
			oscillators.push(osc);
			return osc;
		}),
		createGain: vi.fn(() => {
			const gain = makeMockGain();
			gains.push(gain);
			return gain;
		}),
		_oscillators: oscillators,
		_gains: gains,
	};
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SoundEngine", () => {
	let engine: SoundEngine;
	let ctx: ReturnType<typeof makeMockAudioContext>;

	beforeEach(() => {
		engine = new SoundEngine();
		ctx = makeMockAudioContext();
		engine.init(ctx as unknown as AudioContext);
	});

	it("playClick creates one oscillator with triangle type at 1200 Hz", () => {
		engine.playClick();
		expect(ctx._oscillators).toHaveLength(1);
		expect(ctx._oscillators[0]?.type).toBe("triangle");
		expect(ctx._oscillators[0]?.frequency.setValueAtTime).toHaveBeenCalledWith(
			1200,
			expect.any(Number),
		);
	});

	it("playOpen creates two oscillators at 400 Hz and 600 Hz", () => {
		engine.playOpen();
		expect(ctx._oscillators).toHaveLength(2);
		const freqs = ctx._oscillators.map(
			(o) => o.frequency.setValueAtTime.mock.calls[0]?.[0],
		);
		expect(freqs).toContain(400);
		expect(freqs).toContain(600);
	});

	it("playClose creates two oscillators at 600 Hz and 400 Hz", () => {
		engine.playClose();
		expect(ctx._oscillators).toHaveLength(2);
		const freqs = ctx._oscillators.map(
			(o) => o.frequency.setValueAtTime.mock.calls[0]?.[0],
		);
		expect(freqs).toContain(600);
		expect(freqs).toContain(400);
	});

	it("playNotification creates three oscillators at 800, 1000, 1200 Hz", () => {
		engine.playNotification();
		expect(ctx._oscillators).toHaveLength(3);
		const freqs = ctx._oscillators.map(
			(o) => o.frequency.setValueAtTime.mock.calls[0]?.[0],
		);
		expect(freqs).toContain(800);
		expect(freqs).toContain(1000);
		expect(freqs).toContain(1200);
	});

	it("does nothing before init is called", () => {
		const uninitEngine = new SoundEngine();
		// None of these should throw
		expect(() => uninitEngine.playClick()).not.toThrow();
		expect(() => uninitEngine.playOpen()).not.toThrow();
		expect(() => uninitEngine.playClose()).not.toThrow();
		expect(() => uninitEngine.playNotification()).not.toThrow();
	});

	it("all sounds use gain nodes connected to destination", () => {
		engine.playNotification();
		for (const gain of ctx._gains) {
			expect(gain.connect).toHaveBeenCalledWith(ctx.destination);
		}
	});

	it("oscillators are started and stopped", () => {
		engine.playOpen();
		for (const osc of ctx._oscillators) {
			expect(osc.start).toHaveBeenCalledOnce();
			expect(osc.stop).toHaveBeenCalledOnce();
		}
	});
});
