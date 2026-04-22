/**
 * Physics-correct juggling engine ported from sani.js architecture.
 *
 * Core idea: pre-compute a looping animation sequence per ball at init time.
 * Each ball gets an `animations[]` array of segments (catch, throw, wait).
 * At runtime, `ball.update(delta)` just advances a clock pointer through
 * the sequence — no per-frame physics calculations.
 *
 * Coordinate system: millimeters, y-UP (positive y = upward).
 * The renderer flips y when converting to screen coordinates.
 *
 * Patterns:
 *   CASCADE  — siteswap 3: alternating L→R, R→L
 *   FOUNTAIN — siteswap 4: each hand throws to itself
 *   SHOWER   — siteswap [5,1]: high arc one way, quick pass back
 */

// ── Polynomial & Spline (ported from sani.js src/spline.js) ──────────

/** Safe array access — returns 0 for out-of-bounds (valid for numeric arrays in spline math). */
function n(arr: number[], i: number): number {
	return arr[i] ?? 0;
}

class Polynomial {
	readonly coefficients: number[];

	constructor(coefficients: number[]) {
		this.coefficients = coefficients;
	}

	at(x: number): number {
		return this.coefficients.reduce(
			(result, current) => current + x * result,
		);
	}

	differentiate(): Polynomial {
		return new Polynomial(
			this.coefficients
				.slice(0, -1)
				.map((c, i, { length }) => (length - i) * c),
		);
	}
}

class Spline {
	private polynomials: Polynomial[] = [];
	private xs: number[];

	constructor(
		points: { x: number; y: number }[],
		endpoint1 = 0,
		endpoint2 = 0,
	) {
		const ys = points.map(({ y }) => y);
		this.xs = points.map(({ x }) => x);
		const len = this.xs.length;

		const hs: number[] = [];
		const qs: number[] = [];
		const us: number[] = [];
		const vs: number[] = [];
		const zs: number[] = [];

		for (let i = 0; i < len - 1; i++) {
			hs[i] = n(this.xs, i + 1) - n(this.xs, i);
			qs[i] = (n(ys, i + 1) - n(ys, i)) / n(hs, i);
		}

		us[0] = 2 * (n(hs, 0) + n(hs, 1));
		vs[0] = 6 * (n(qs, 1) - n(qs, 0));
		for (let i = 1; i < len - 1; i++) {
			us[i] =
				2 * (n(hs, i) + n(hs, i - 1)) -
				(n(hs, i - 1) * n(hs, i - 1)) / n(us, i - 1);
			vs[i] =
				6 * (n(qs, i) - n(qs, i - 1)) -
				(n(hs, i - 1) * n(vs, i - 1)) / n(us, i - 1);
		}

		zs[0] = endpoint1;
		zs[len - 1] = endpoint2;
		for (let i = len - 2; i > 0; i--) {
			zs[i] = (n(vs, i) - n(hs, i) * n(zs, i + 1)) / n(us, i);
		}

		for (let i = 0; i < len - 1; i++) {
			const d = n(ys, i);
			const c =
				-(n(hs, i) * n(zs, i + 1)) / 6 -
				(n(hs, i) * n(zs, i)) / 3 +
				(n(ys, i + 1) - n(ys, i)) / n(hs, i);
			const b = n(zs, i) / 2;
			const a = (n(zs, i + 1) - n(zs, i)) / (6 * n(hs, i));
			this.polynomials.push(new Polynomial([a, b, c, d]));
		}
	}

	at(x: number): number {
		const { xs, polynomials } = this;
		const pLen = polynomials.length;
		if (pLen === 0) return 0;

		const first = n(xs, 0);
		const last = n(xs, pLen);
		const lo = Math.min(first, last);
		const hi = Math.max(first, last);

		// Clamp to range instead of throwing
		if (x <= lo) return polynomials[0]?.at(0) ?? 0;
		if (x >= hi) {
			const lastPoly = polynomials[pLen - 1];
			return lastPoly?.at(n(xs, pLen) - n(xs, pLen - 1)) ?? 0;
		}

		let i = 0;
		if (first < last) {
			while (i < pLen && x > n(xs, i + 1)) i++;
		} else {
			while (i < pLen && x < n(xs, i + 1)) i++;
		}

		return polynomials[i]?.at(x - n(xs, i)) ?? 0;
	}

	maximum(): { x: number | null; y: number | null } {
		const maximum: { x: number | null; y: number | null } = {
			x: null,
			y: null,
		};
		const { xs } = this;
		if (xs.length < 2) return maximum;

		// Sample the spline to find the maximum — robust for our 5-point catch spline
		const xMin = Math.min(n(xs, 0), n(xs, xs.length - 1));
		const xMax = Math.max(n(xs, 0), n(xs, xs.length - 1));
		const steps = 200;
		for (let s = 0; s <= steps; s++) {
			const xVal = xMin + (s / steps) * (xMax - xMin);
			const yVal = this.at(xVal);
			if (maximum.y === null || yVal > maximum.y) {
				maximum.x = xVal;
				maximum.y = yVal;
			}
		}

		return maximum;
	}
}

// ── Motion utilities (ported from sani.js src/motion.js) ─────────────

// Gravity reduced 20% from real-world for more manageable arcs in tight viewport
const GRAVITY = { x: 0, y: (-9.81 / 1000) * 0.8 }; // mm/ms²

function motionS(u: number, a: number, t: number): number {
	return u * t + 0.5 * a * t * t;
}

function motionV(u: number, a: number, s: number): number {
	return Math.sqrt(Math.abs(u * u + 2 * a * s));
}

// ── Catch spline ─────────────────────────────────────────────────────

// Catch spline: defines the hand scoop path during dwell.
// Wider, more dramatic scoop for visible catch/throw motion.
// Peak at x=35 (slightly early = quick catch), long smooth throw release.
const CATCH_SPLINE = new Spline([
	{ x: 0, y: 0 },      // arrive at catch point
	{ x: 8, y: 50 },     // quick upward scoop (catching)
	{ x: 35, y: 120 },   // peak of carry (ball fully in hand, lifted)
	{ x: 80, y: 60 },    // lower as hand scoops inward toward throw
	{ x: 100, y: 0 },    // release point (back at hand level)
]);

const CATCH_SPLINE_MAX_Y = CATCH_SPLINE.maximum().y ?? 100;

// ── Animation types ──────────────────────────────────────────────────

type Vec2 = { x: number; y: number };

type CatchSegment = {
	type: 'catch';
	duration: number;
	position: Vec2;
	width: number;
	yModifier: number;
};

type ThrowSegment = {
	type: 'throw';
	duration: number;
	position: Vec2;
	velocity: Vec2;
	acceleration: Vec2;
};

type WaitSegment = {
	type: 'wait';
	duration: number;
	position: Vec2;
};

type AnimationSegment = CatchSegment | ThrowSegment | WaitSegment;

function segmentGetPosition(seg: AnimationSegment, elapsed: number): Vec2 {
	switch (seg.type) {
		case 'catch': {
			const percent = elapsed / seg.duration;
			return {
				x: seg.position.x + percent * seg.width,
				y: seg.position.y - CATCH_SPLINE.at(percent * 100) * seg.yModifier,
			};
		}
		case 'throw': {
			return {
				x:
					seg.position.x +
					motionS(seg.velocity.x, seg.acceleration.x, elapsed),
				y:
					seg.position.y +
					motionS(seg.velocity.y, seg.acceleration.y, elapsed),
			};
		}
		case 'wait': {
			return { x: seg.position.x, y: seg.position.y };
		}
	}
}

// ── JuggleBall class (ported from sani.js src/Ball.js) ───────────────

class JuggleBall {
	position: Vec2 = { x: 0, y: 0 };
	animations: AnimationSegment[] = [];
	private initialWait: WaitSegment | null = null;
	private animationAt = -1;
	private elapsed = 0;

	setInitialWait(duration: number, pos: Vec2): void {
		this.initialWait = {
			type: 'wait',
			duration,
			position: { x: pos.x, y: pos.y },
		};
	}

	update(delta: number): void {
		if (this.animations.length === 0) return;

		this.elapsed += delta;

		// Handle initial wait (index -1)
		if (this.animationAt === -1) {
			if (this.initialWait) {
				if (this.elapsed >= this.initialWait.duration) {
					this.elapsed -= this.initialWait.duration;
					this.animationAt = 0;
				} else {
					this.position = segmentGetPosition(
						this.initialWait,
						this.elapsed,
					);
					return;
				}
			} else {
				this.animationAt = 0;
			}
		}

		let animation = this.animations[this.animationAt];
		while (animation && this.elapsed >= animation.duration) {
			this.elapsed -= animation.duration;
			this.animationAt = (this.animationAt + 1) % this.animations.length;
			animation = this.animations[this.animationAt];
		}

		if (animation) {
			this.position = segmentGetPosition(animation, this.elapsed);
		}
	}

	reset(): void {
		this.animationAt = -1;
		this.elapsed = 0;
		this.position = { x: 0, y: 0 };
	}

	get currentSegmentType(): 'catch' | 'throw' | 'wait' {
		if (this.animationAt === -1) return 'wait';
		return this.animations[this.animationAt]?.type ?? 'wait';
	}

	get currentSegment(): AnimationSegment | null {
		if (this.animationAt === -1) return this.initialWait;
		return this.animations[this.animationAt] ?? null;
	}
}

// ── Pattern types ────────────────────────────────────────────────────

export type JugglePattern =
	| 'cascade' | 'fountain' | 'shower'
	| 'reverse' | 'columns' | 'orbit'
	| '423' | '531' | '441'
	| 'windmill' | 'half-shower' | '552';

export type PatternMeta = {
	label: string;
	balls: number;
	minBalls?: number;
	maxBalls?: number;
	/** Custom slider definitions for this pattern */
	sliders?: { key: string; label: string; min: number; max: number; step: number; default: number }[];
};

export const PATTERN_META: Record<JugglePattern, PatternMeta> = {
	cascade:       { label: 'Cascade',      balls: 3, minBalls: 3, maxBalls: 9 },
	fountain:      { label: 'Fountain',     balls: 4, minBalls: 4, maxBalls: 8 },
	shower:        { label: 'Shower',       balls: 3, minBalls: 3, maxBalls: 7 },
	reverse:       { label: 'Reverse',      balls: 3, minBalls: 3, maxBalls: 9 },
	columns:       { label: 'Columns',      balls: 3, minBalls: 3, maxBalls: 7 },
	orbit:         { label: 'Orbit',        balls: 3, minBalls: 3, maxBalls: 7 },
	'423':         { label: '423',          balls: 3 },
	'531':         { label: '531',          balls: 3 },
	'441':         { label: '441',          balls: 3 },
	windmill:      { label: 'Windmill',     balls: 3, minBalls: 3, maxBalls: 7, sliders: [
		{ key: 'crossDepth', label: 'cross', min: 0.2, max: 1.0, step: 0.05, default: 0.7 },
	] },
	'half-shower': { label: 'Half Shower',  balls: 3, minBalls: 3, maxBalls: 7, sliders: [
		{ key: 'bias', label: 'bias', min: 0, max: 0.9, step: 0.05, default: 0.4 },
	] },
	'552':         { label: '552',          balls: 4 },
};

export const PATTERN_ROWS = [
	{ label: 'Basics',     patterns: ['cascade', 'fountain', 'shower'] as JugglePattern[] },
	{ label: 'Variations', patterns: ['reverse', 'columns', 'orbit'] as JugglePattern[] },
	{ label: 'Siteswap',   patterns: ['423', '531', '441'] as JugglePattern[] },
	{ label: 'Advanced',   patterns: ['windmill', 'half-shower', '552'] as JugglePattern[] },
];

// ── Prepare config ───────────────────────────────────────────────────

type PrepareConfig = {
	pattern: JugglePattern;
	beatDuration: number;
	dwell: number;
	objectCount: number;
	/** Half-shower bias: 0 = symmetric cascade, ~0.9 = near-shower. */
	bias?: number;
	/** Windmill cross depth: 0 = normal cascade, 1 = full reverse on one side. */
	crossDepth?: number;
};

type PrepareResult = {
	balls: JuggleBall[];
	innerWidth: number;
	innerHeight: number;
	catchHeight: number;
};

// ── Helper ───────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

// ── prepare() — the core engine (ported from sani.js src/prepare.js) ─

function prepareCascade(config: PrepareConfig): PrepareResult {
	const { beatDuration, dwell, objectCount } = config;
	// Siteswap value = object count for cascade (3 balls = ss3, 5 balls = ss5, etc.)
	// Higher count = higher throws = more air time. This is real juggling math.
	const siteswapValue = objectCount;

	const balls: JuggleBall[] = Array.from(
		{ length: objectCount },
		() => new JuggleBall(),
	);

	let maxThrowHeight = 0;
	let maxCatchHeight = 0;
	const maxCatchWidth = 250;
	const handsGap =
		350 - Math.abs(0.5 - dwell) * 200 + (siteswapValue - 3) * 15;
	const innerWidth = maxCatchWidth * 2 + handsGap;

	const minDwell = 0.1;
	const computedDwell = clamp(dwell, minDwell, 0.9);

	const launchTime = computedDwell * beatDuration;
	const airTime = (siteswapValue - computedDwell) * beatDuration;
	const throwHeight = motionS(0, -GRAVITY.y, airTime / 2);

	// Catch parameters
	const catchWidth = clamp(
		maxCatchWidth - Math.abs(0.5 - dwell) * 100,
		150,
		maxCatchWidth,
	);
	// Catch height — how far the hand scoops upward during catch/carry.
	// Larger = more visible hand motion. Scale with throw height for proportion.
	let catchHeight = Math.max(throwHeight * 0.25, 40);
	catchHeight = Math.min(catchHeight, 200);

	const yModifier = catchHeight / CATCH_SPLINE_MAX_Y;

	if (throwHeight > maxThrowHeight) maxThrowHeight = throwHeight;
	if (catchHeight > maxCatchHeight) maxCatchHeight = catchHeight;

	// Build animation sequences for each ball.
	// CASCADE: Ball i is first thrown at beat i.
	// Each ball alternates: thrown from left (even beat) or right (odd beat).
	// One full cycle for each ball = objectCount beats (the LCM period).
	// In each cycle, the ball is thrown once per siteswapValue beats,
	// so the number of throws per cycle = lcm(objectCount, siteswapValue) / siteswapValue.

	// For a standard 3-ball cascade: each ball throws from alternating hands.
	// Ball 0: beat 0 (left), beat 3 (right), beat 6 (left) -> period = 6 beats = 2 throws
	// Ball 1: beat 1 (right), beat 4 (left), beat 7 (right) -> period = 6 beats = 2 throws
	// Ball 2: beat 2 (left), beat 5 (right), beat 8 (left) -> period = 6 beats = 2 throws

	// For N-ball cascade with siteswap 3: each ball is thrown every 3 beats.
	// Period of the whole pattern = lcm(N, 2) * siteswapValue / gcd stuff...
	// Simpler: each ball does 2 throws to complete one L-R-L cycle (for odd siteswap).
	// Period per ball = 2 * siteswapValue beats = 2 * 3 * beatDuration ms.

	const throwsPerCycle = 2; // each ball alternates hands: L then R (or R then L)

	for (let b = 0; b < objectCount; b++) {
		const ball = balls[b];
		if (!ball) continue; // unreachable: array was created with objectCount elements
		const firstBeat = b; // ball b is first thrown at beat b
		const firstHand = firstBeat % 2; // 0 = left, 1 = right

		for (let t = 0; t < throwsPerCycle; t++) {
			const hand = (firstHand + t) % 2; // alternates

			// Catch position: ball arrives at hand's catch point, carries to throw point
			const catchX1 = hand === 0 ? 0 : innerWidth;
			const catchX2 = hand === 0 ? catchWidth : innerWidth - catchWidth;

			ball.animations.push({
				type: 'catch',
				duration: launchTime,
				width: catchX2 - catchX1,
				yModifier,
				position: { x: catchX1, y: 0 },
			});

			// Throw: from throw point to opposite hand's catch point
			const throwX = hand === 0 ? catchWidth : innerWidth - catchWidth;
			const otherHand = (hand + 1) % 2;
			const landX = otherHand === 0 ? 0 : innerWidth;

			ball.animations.push({
				type: 'throw',
				duration: airTime,
				position: { x: throwX, y: 0 },
				velocity: {
					x: (landX - throwX) / airTime,
					y: motionV(0, -GRAVITY.y, throwHeight),
				},
				acceleration: GRAVITY,
			});
		}

		// Initial wait: ball b waits for b beats before its first catch
		const waitDuration = firstBeat * beatDuration;
		// Compute starting position: where the ball will appear (at the catch point of first hand)
		const startHand = firstHand;
		const startX = startHand === 0 ? 0 : innerWidth;
		ball.setInitialWait(waitDuration, { x: startX, y: 0 });
	}

	const innerHeight = maxThrowHeight + maxCatchHeight;

	return { balls, innerWidth, innerHeight, catchHeight: maxCatchHeight };
}

function prepareFountain(config: PrepareConfig): PrepareResult {
	const { beatDuration, dwell, objectCount } = config;
	// Fountain siteswap = object count (must be even for fountain)
	const siteswapValue = objectCount;

	const balls: JuggleBall[] = Array.from(
		{ length: objectCount },
		() => new JuggleBall(),
	);

	let maxThrowHeight = 0;
	let maxCatchHeight = 0;
	const maxCatchWidth = 250;
	const handsGap =
		350 - Math.abs(0.5 - dwell) * 200 + (siteswapValue - 3) * 15;
	const innerWidth = maxCatchWidth * 2 + handsGap;

	const minDwell = 0.1;
	const computedDwell = clamp(dwell, minDwell, 0.9);

	// Fountain is degree 2 (sync), so beat duration is doubled
	const syncBeatDuration = beatDuration * 2;
	const launchTime = computedDwell * syncBeatDuration;
	const airTime = (siteswapValue / 2 - computedDwell) * syncBeatDuration;
	const throwHeight = motionS(0, -GRAVITY.y, airTime / 2);

	const catchWidth = clamp(
		maxCatchWidth - Math.abs(0.5 - dwell) * 100,
		150,
		maxCatchWidth,
	);
	let catchHeight = Math.max(throwHeight * 0.25, 40);
	catchHeight = Math.min(catchHeight, 200);

	const yModifier = catchHeight / CATCH_SPLINE_MAX_Y;

	if (throwHeight > maxThrowHeight) maxThrowHeight = throwHeight;
	if (catchHeight > maxCatchHeight) maxCatchHeight = catchHeight;

	// FOUNTAIN: each hand throws to ITSELF.
	// Even-index balls use left hand, odd-index use right hand.
	// Each ball does 1 throw per cycle (catch from self, throw to self).

	for (let b = 0; b < objectCount; b++) {
		const ball = balls[b];
		if (!ball) continue;
		const hand = b % 2; // 0 = left, 1 = right

		// Catch: ball arrives at hand, carried across catch width
		const catchX1 = hand === 0 ? 0 : innerWidth;
		const catchX2 = hand === 0 ? catchWidth : innerWidth - catchWidth;

		ball.animations.push({
			type: 'catch',
			duration: launchTime,
			width: catchX2 - catchX1,
			yModifier,
			position: { x: catchX1, y: 0 },
		});

		// Throw: from throw point back to same hand's catch point (slight arc outward)
		const throwX = hand === 0 ? catchWidth : innerWidth - catchWidth;
		const landX = hand === 0 ? 0 : innerWidth;

		ball.animations.push({
			type: 'throw',
			duration: airTime,
			position: { x: throwX, y: 0 },
			velocity: {
				x: (landX - throwX) / airTime,
				y: motionV(0, -GRAVITY.y, throwHeight),
			},
			acceleration: GRAVITY,
		});

		// Initial wait: distribute ALL balls evenly across one full cycle.
		// One cycle = catch + throw = launchTime + airTime.
		// Ball b enters at (b / objectCount) * cycleDuration.
		const cycleDuration = launchTime + airTime;
		const waitDuration = (b / objectCount) * cycleDuration;
		const startX = hand === 0 ? 0 : innerWidth;
		ball.setInitialWait(waitDuration, { x: startX, y: 0 });
	}

	const innerHeight = maxThrowHeight + maxCatchHeight;

	return { balls, innerWidth, innerHeight, catchHeight: maxCatchHeight };
}

function prepareShower(config: PrepareConfig): PrepareResult {
	const { beatDuration, dwell, objectCount } = config;
	const highValue = 5;
	const lowValue = 1;
	const greatestValue = highValue;

	const balls: JuggleBall[] = Array.from(
		{ length: objectCount },
		() => new JuggleBall(),
	);

	let maxThrowHeight = 0;
	let maxCatchHeight = 0;
	const maxCatchWidth = 250;
	const handsGap =
		350 - Math.abs(0.5 - dwell) * 200 + (greatestValue - 3) * 15;
	const innerWidth = maxCatchWidth * 2 + handsGap;

	const minDwell = 0.1;

	// High throw (5): normal dwell
	const highDwell = clamp(dwell, minDwell, 0.9);
	const highLaunchTime = highDwell * beatDuration;
	const highAirTime = (highValue - highDwell) * beatDuration;
	const highThrowHeight = motionS(0, -GRAVITY.y, highAirTime / 2);

	// Low pass (1): clamp dwell small since 1-beat throw leaves almost no air time
	const lowDwell = clamp(dwell, minDwell, 1 - minDwell);
	const lowLaunchTime = Math.min(lowDwell, 1 - minDwell) * beatDuration;
	const lowAirTime = (lowValue - Math.min(lowDwell, 1 - minDwell)) * beatDuration;
	const lowThrowHeight = motionS(0, -GRAVITY.y, lowAirTime / 2);

	// Catch parameters for high throw (right hand, the throwing hand)
	const highCatchWidth = clamp(
		maxCatchWidth - Math.abs(0.5 - dwell) * 100,
		150,
		maxCatchWidth,
	);

	let highCatchHeight = Math.max(highThrowHeight * 0.25, 40);
	highCatchHeight = Math.min(highCatchHeight, 200);
	const highYModifier = highCatchHeight / CATCH_SPLINE_MAX_Y;

	// Catch parameters for low pass (left hand)
	const lowCatchWidth = clamp(
		maxCatchWidth - Math.abs(0.5 - dwell) * 100 - 50,
		100,
		maxCatchWidth,
	);
	let lowCatchHeight = Math.max(lowThrowHeight * 0.25, 20);
	lowCatchHeight = Math.min(lowCatchHeight, 100);
	const lowYModifier = lowCatchHeight / CATCH_SPLINE_MAX_Y;

	if (highThrowHeight > maxThrowHeight) maxThrowHeight = highThrowHeight;
	if (lowThrowHeight > maxThrowHeight) maxThrowHeight = lowThrowHeight;
	if (highCatchHeight > maxCatchHeight) maxCatchHeight = highCatchHeight;
	if (lowCatchHeight > maxCatchHeight) maxCatchHeight = lowCatchHeight;

	// SHOWER: each ball cycles through both throws.
	// Right hand throws 5 (high arc to left), left hand throws 1 (quick pass to right).
	// Ball sequence: catch(right) → throw(5, high arc R→L) → catch(left) → throw(1, low pass L→R)

	for (let b = 0; b < objectCount; b++) {
		const ball = balls[b];
		if (!ball) continue;

		// Catch by right hand (before high throw)
		const rightCatchX1 = innerWidth; // arrives at right edge
		const rightCatchX2 = innerWidth - highCatchWidth; // carried to throw point

		ball.animations.push({
			type: 'catch',
			duration: highLaunchTime,
			width: rightCatchX2 - rightCatchX1,
			yModifier: highYModifier,
			position: { x: rightCatchX1, y: 0 },
		});

		// High throw: right → left (5)
		const highThrowX = innerWidth - highCatchWidth;
		const highLandX = 0; // lands at left edge

		ball.animations.push({
			type: 'throw',
			duration: highAirTime,
			position: { x: highThrowX, y: 0 },
			velocity: {
				x: (highLandX - highThrowX) / highAirTime,
				y: motionV(0, -GRAVITY.y, highThrowHeight),
			},
			acceleration: GRAVITY,
		});

		// Catch by left hand (before low pass)
		const leftCatchX1 = 0; // arrives at left edge
		const leftCatchX2 = lowCatchWidth; // carried to throw point

		ball.animations.push({
			type: 'catch',
			duration: lowLaunchTime,
			width: leftCatchX2 - leftCatchX1,
			yModifier: lowYModifier,
			position: { x: leftCatchX1, y: 0 },
		});

		// Low pass: left → right (1)
		const lowThrowX = lowCatchWidth;
		const lowLandX = innerWidth; // lands at right edge

		ball.animations.push({
			type: 'throw',
			duration: lowAirTime,
			position: { x: lowThrowX, y: 0 },
			velocity: {
				x: (lowLandX - lowThrowX) / lowAirTime,
				y: motionV(0, -GRAVITY.y, lowThrowHeight),
			},
			acceleration: GRAVITY,
		});

		// Stagger evenly across the full shower cycle so hands are never idle.
		// Full cycle = high catch + high throw + low catch + low throw
		const cycleDuration = highLaunchTime + highAirTime + lowLaunchTime + lowAirTime;
		const waitDuration = (b / objectCount) * cycleDuration;
		ball.setInitialWait(waitDuration, { x: innerWidth, y: 0 });
	}

	const innerHeight = maxThrowHeight + maxCatchHeight;

	return { balls, innerWidth, innerHeight, catchHeight: maxCatchHeight };
}

// ── Reverse Cascade — outward throws (over the pattern) ──────────────

function prepareReverseCascade(config: PrepareConfig): PrepareResult {
	const { beatDuration, dwell, objectCount } = config;
	const siteswapValue = objectCount;

	const balls: JuggleBall[] = Array.from(
		{ length: objectCount },
		() => new JuggleBall(),
	);

	let maxThrowHeight = 0;
	let maxCatchHeight = 0;
	const maxCatchWidth = 250;
	const handsGap =
		350 - Math.abs(0.5 - dwell) * 200 + (siteswapValue - 3) * 15;
	const innerWidth = maxCatchWidth * 2 + handsGap;

	const computedDwell = clamp(dwell, 0.1, 0.9);
	const launchTime = computedDwell * beatDuration;
	const airTime = (siteswapValue - computedDwell) * beatDuration;
	const throwHeight = motionS(0, -GRAVITY.y, airTime / 2);

	const catchWidth = clamp(
		maxCatchWidth - Math.abs(0.5 - dwell) * 100,
		150,
		maxCatchWidth,
	);
	let catchHeight = clamp(throwHeight * 0.25, 40, 200);
	const yModifier = catchHeight / CATCH_SPLINE_MAX_Y;

	if (throwHeight > maxThrowHeight) maxThrowHeight = throwHeight;
	if (catchHeight > maxCatchHeight) maxCatchHeight = catchHeight;

	const throwsPerCycle = 2;

	for (let b = 0; b < objectCount; b++) {
		const ball = balls[b];
		if (!ball) continue;
		const firstBeat = b;
		const firstHand = firstBeat % 2;

		for (let t = 0; t < throwsPerCycle; t++) {
			const hand = (firstHand + t) % 2;

			// Reverse: catch at INSIDE, carry OUTWARD, throw from EDGE
			const catchX1 = hand === 0 ? catchWidth : innerWidth - catchWidth;
			const catchX2 = hand === 0 ? 0 : innerWidth;

			ball.animations.push({
				type: 'catch',
				duration: launchTime,
				width: catchX2 - catchX1,
				yModifier,
				position: { x: catchX1, y: 0 },
			});

			// Throw from edge to opposite hand's inside
			const throwX = hand === 0 ? 0 : innerWidth;
			const otherHand = (hand + 1) % 2;
			const landX = otherHand === 0 ? catchWidth : innerWidth - catchWidth;

			ball.animations.push({
				type: 'throw',
				duration: airTime,
				position: { x: throwX, y: 0 },
				velocity: {
					x: (landX - throwX) / airTime,
					y: motionV(0, -GRAVITY.y, throwHeight),
				},
				acceleration: GRAVITY,
			});
		}

		const waitDuration = firstBeat * beatDuration;
		const startHand = firstHand;
		const startX = startHand === 0 ? catchWidth : innerWidth - catchWidth;
		ball.setInitialWait(waitDuration, { x: startX, y: 0 });
	}

	const innerHeight = maxThrowHeight + maxCatchHeight;
	return { balls, innerWidth, innerHeight, catchHeight: maxCatchHeight };
}

// ── Columns — parallel vertical paths ────────────────────────────────
//
// Each ball goes straight up/down in its own column. Hands travel
// across the horizontal space to reach each column, creating visible
// lateral hand motion between catches.

function prepareColumns(config: PrepareConfig): PrepareResult {
	const { beatDuration, dwell, objectCount } = config;

	const balls: JuggleBall[] = Array.from(
		{ length: objectCount },
		() => new JuggleBall(),
	);

	const innerWidth = 600 + (objectCount - 3) * 100;
	const computedDwell = clamp(dwell, 0.1, 0.9);

	const ssValue = objectCount;
	const launchTime = computedDwell * beatDuration;
	const airTime = (ssValue - computedDwell) * beatDuration;
	const throwHeight = motionS(0, -GRAVITY.y, airTime / 2);

	const catchHeight = clamp(throwHeight * 0.25, 40, 200);
	const yModifier = catchHeight / CATCH_SPLINE_MAX_Y;

	// Visible hand carry: hand scoops from one side of the column, creating
	// lateral movement that the hand-tracking in the renderer can follow.
	const carryWidth = 60 + (objectCount - 3) * 10;

	for (let b = 0; b < objectCount; b++) {
		const ball = balls[b];
		if (!ball) continue;

		const colX =
			objectCount > 1
				? (b / (objectCount - 1)) * innerWidth
				: innerWidth / 2;

		// Alternate scoop direction per ball for natural hand motion
		const scoopDir = b % 2 === 0 ? -1 : 1;
		const catchStart = colX + scoopDir * carryWidth / 2;
		const catchEnd = colX - scoopDir * carryWidth / 2;

		ball.animations.push({
			type: 'catch',
			duration: launchTime,
			width: catchEnd - catchStart,
			yModifier,
			position: { x: catchStart, y: 0 },
		});

		// Throw straight up from catch end, drift back to catch start
		ball.animations.push({
			type: 'throw',
			duration: airTime,
			position: { x: catchEnd, y: 0 },
			velocity: {
				x: (catchStart - catchEnd) / airTime,
				y: motionV(0, -GRAVITY.y, throwHeight),
			},
			acceleration: GRAVITY,
		});

		const waitDuration = b * beatDuration;
		ball.setInitialWait(waitDuration, { x: catchStart, y: 0 });
	}

	const innerHeight = throwHeight + catchHeight;
	return { balls, innerWidth, innerHeight, catchHeight };
}

// ── Generic siteswap engine ──────────────────────────────────────────
//
// Handles arbitrary async siteswap sequences: [4,2,3], [5,3,1], etc.
// Simulates the siteswap to track ball assignments, then builds
// pre-computed animation segments per ball.

function prepareSiteswapGeneric(
	beatDuration: number,
	dwell: number,
	siteswap: number[],
): PrepareResult {
	const objectCount = Math.round(
		siteswap.reduce((a, b) => a + b, 0) / siteswap.length,
	);
	const seqLen = siteswap.length;
	const maxSsValue = Math.max(...siteswap);

	const balls: JuggleBall[] = Array.from(
		{ length: objectCount },
		() => new JuggleBall(),
	);

	// Layout
	const maxCatchWidth = 250;
	const handsGap =
		350 - Math.abs(0.5 - dwell) * 200 + (maxSsValue - 3) * 15;
	const innerWidth = maxCatchWidth * 2 + handsGap;
	const computedDwell = clamp(dwell, 0.1, 0.9);

	let maxThrowHeight = 0;
	let maxCatchHeight = 0;

	// ── Simulate siteswap to track ball assignments ──

	const simBeats = seqLen * objectCount * 8;
	const schedule: (number | undefined)[] = [];

	// Initialize: ball i available at beat i
	for (let i = 0; i < objectCount; i++) {
		schedule[i] = i;
	}

	type ThrowEvt = {
		beat: number;
		hand: number;
		value: number;
		landHand: number;
	};

	const ballThrows: ThrowEvt[][] = Array.from(
		{ length: objectCount },
		() => [],
	);

	for (let beat = 0; beat < simBeats; beat++) {
		const bi = schedule[beat];
		if (bi === undefined) continue;

		const value = siteswap[beat % seqLen];
		if (value === undefined || value === 0) continue;

		const hand = beat % 2;
		const landBeat = beat + value;
		const landHand = value % 2 === 0 ? hand : 1 - hand;

		if (landBeat < simBeats) {
			schedule[landBeat] = bi;
		}

		ballThrows[bi]?.push({ beat, hand, value, landHand });
	}

	// ── Build animation segments per ball ──

	const fullPeriod = seqLen * 2; // accounts for hand alternation

	for (let b = 0; b < objectCount; b++) {
		const ball = balls[b];
		const throws = ballThrows[b];
		if (!ball || !throws || throws.length < 2) continue;

		// Find cycle: first repeat of (beat % fullPeriod, hand)
		const first = throws[0];
		if (!first) continue;
		const firstKey = (first.beat % fullPeriod) * 10 + first.hand;

		let cycleLen = throws.length;
		for (let i = 1; i < throws.length; i++) {
			const t = throws[i];
			if (!t) continue;
			const key = (t.beat % fullPeriod) * 10 + t.hand;
			if (key === firstKey) {
				cycleLen = i;
				break;
			}
		}

		// Build catch + throw pairs for each throw in the cycle
		for (let t = 0; t < cycleLen; t++) {
			const evt = throws[t];
			if (!evt) continue;
			const { hand, value, landHand } = evt;

			const launchTime = computedDwell * beatDuration;
			const airTime = Math.max(
				(value - computedDwell) * beatDuration,
				10,
			);
			const throwHeight = motionS(0, -GRAVITY.y, airTime / 2);

			const catchWidth = clamp(
				maxCatchWidth - Math.abs(0.5 - dwell) * 100,
				150,
				maxCatchWidth,
			);
			const catchHeight = clamp(throwHeight * 0.25, 20, 200);
			const yModifier = catchHeight / CATCH_SPLINE_MAX_Y;

			if (throwHeight > maxThrowHeight) maxThrowHeight = throwHeight;
			if (catchHeight > maxCatchHeight) maxCatchHeight = catchHeight;

			// Catch: arrive at hand edge, carry inward to throw point
			const catchX1 = hand === 0 ? 0 : innerWidth;
			const catchX2 =
				hand === 0 ? catchWidth : innerWidth - catchWidth;

			ball.animations.push({
				type: 'catch',
				duration: launchTime,
				width: catchX2 - catchX1,
				yModifier,
				position: { x: catchX1, y: 0 },
			});

			// Throw: from throw point to landing hand's catch point
			const throwX =
				hand === 0 ? catchWidth : innerWidth - catchWidth;
			const landX = landHand === 0 ? 0 : innerWidth;

			ball.animations.push({
				type: 'throw',
				duration: airTime,
				position: { x: throwX, y: 0 },
				velocity: {
					x: (landX - throwX) / airTime,
					y: motionV(0, -GRAVITY.y, throwHeight),
				},
				acceleration: GRAVITY,
			});
		}

		// Initial wait
		if (first) {
			const waitDuration = first.beat * beatDuration;
			const startX = first.hand === 0 ? 0 : innerWidth;
			ball.setInitialWait(waitDuration, { x: startX, y: 0 });
		}
	}

	const innerHeight = maxThrowHeight + maxCatchHeight;
	return { balls, innerWidth, innerHeight, catchHeight: maxCatchHeight };
}

// ── Windmill — reverse cascade on one side, normal on the other ──────
//
// Left hand throws outward (reverse), right hand throws inward (normal).
// crossDepth controls how "reversed" the reverse side is (0.2..1).
// Creates a spinning wheel visual where balls arc over on one side.

function prepareWindmill(config: PrepareConfig): PrepareResult {
	const { beatDuration, dwell, objectCount } = config;
	const crossDepth = config.crossDepth ?? 0.7;
	const siteswapValue = objectCount;

	const balls: JuggleBall[] = Array.from(
		{ length: objectCount },
		() => new JuggleBall(),
	);

	let maxThrowHeight = 0;
	let maxCatchHeight = 0;
	const maxCatchWidth = 250;
	const handsGap =
		350 - Math.abs(0.5 - dwell) * 200 + (siteswapValue - 3) * 15;
	const innerWidth = maxCatchWidth * 2 + handsGap;

	const computedDwell = clamp(dwell, 0.1, 0.9);
	const launchTime = computedDwell * beatDuration;
	const airTime = (siteswapValue - computedDwell) * beatDuration;
	const throwHeight = motionS(0, -GRAVITY.y, airTime / 2);

	const catchWidth = clamp(
		maxCatchWidth - Math.abs(0.5 - dwell) * 100,
		150,
		maxCatchWidth,
	);
	const catchHeight = clamp(throwHeight * 0.25, 40, 200);
	const yModifier = catchHeight / CATCH_SPLINE_MAX_Y;

	if (throwHeight > maxThrowHeight) maxThrowHeight = throwHeight;
	if (catchHeight > maxCatchHeight) maxCatchHeight = catchHeight;

	const throwsPerCycle = 2;

	for (let b = 0; b < objectCount; b++) {
		const ball = balls[b];
		if (!ball) continue;
		const firstBeat = b;
		const firstHand = firstBeat % 2;

		for (let t = 0; t < throwsPerCycle; t++) {
			const hand = (firstHand + t) % 2;
			const isReverseSide = hand === 0; // left hand does reverse

			if (isReverseSide) {
				// Reverse throw: catch inside, carry outward, throw from edge
				// crossDepth interpolates between normal (0) and full reverse (1)
				const normalCatchX1 = 0;
				const reverseCatchX1 = catchWidth;
				const catchX1 =
					normalCatchX1 +
					(reverseCatchX1 - normalCatchX1) * crossDepth;

				const normalCatchX2 = catchWidth;
				const reverseCatchX2 = 0;
				const catchX2 =
					normalCatchX2 +
					(reverseCatchX2 - normalCatchX2) * crossDepth;

				ball.animations.push({
					type: 'catch',
					duration: launchTime,
					width: catchX2 - catchX1,
					yModifier,
					position: { x: catchX1, y: 0 },
				});

				const throwX = catchX2;
				const normalLandX = innerWidth;
				const reverseLandX = innerWidth - catchWidth;
				const landX =
					normalLandX +
					(reverseLandX - normalLandX) * crossDepth;

				ball.animations.push({
					type: 'throw',
					duration: airTime,
					position: { x: throwX, y: 0 },
					velocity: {
						x: (landX - throwX) / airTime,
						y: motionV(0, -GRAVITY.y, throwHeight),
					},
					acceleration: GRAVITY,
				});
			} else {
				// Normal cascade throw: catch at edge, carry inward, throw
				const catchX1 = innerWidth;
				const catchX2 = innerWidth - catchWidth;

				ball.animations.push({
					type: 'catch',
					duration: launchTime,
					width: catchX2 - catchX1,
					yModifier,
					position: { x: catchX1, y: 0 },
				});

				const throwX = innerWidth - catchWidth;
				const landX =
					catchWidth * crossDepth; // land at reverse side's catch start

				ball.animations.push({
					type: 'throw',
					duration: airTime,
					position: { x: throwX, y: 0 },
					velocity: {
						x: (landX - throwX) / airTime,
						y: motionV(0, -GRAVITY.y, throwHeight),
					},
					acceleration: GRAVITY,
				});
			}
		}

		const waitDuration = firstBeat * beatDuration;
		const startHand = firstHand;
		const startX =
			startHand === 0
				? catchWidth * crossDepth
				: innerWidth;
		ball.setInitialWait(waitDuration, { x: startX, y: 0 });
	}

	const innerHeight = maxThrowHeight + maxCatchHeight;
	return { balls, innerWidth, innerHeight, catchHeight: maxCatchHeight };
}

// ── Half Shower — asymmetric throw heights ───────────────────────────
//
// Both hands throw crossing, but one hand throws much higher than the
// other. bias=0 is a symmetric cascade, bias→1 approaches a shower.
// Left hand throws high (N + bias*N), right throws low (N - bias*N).

function prepareHalfShower(config: PrepareConfig): PrepareResult {
	const { beatDuration, dwell, objectCount } = config;
	const bias = config.bias ?? 0.4;

	const balls: JuggleBall[] = Array.from(
		{ length: objectCount },
		() => new JuggleBall(),
	);

	// Two siteswap values: high and low, averaging to objectCount
	const highValue = objectCount * (1 + bias);
	const lowValue = objectCount * (1 - bias);

	let maxThrowHeight = 0;
	let maxCatchHeight = 0;
	const maxCatchWidth = 250;
	const maxSsValue = highValue;
	const handsGap =
		350 - Math.abs(0.5 - dwell) * 200 + (maxSsValue - 3) * 15;
	const innerWidth = maxCatchWidth * 2 + handsGap;

	const computedDwell = clamp(dwell, 0.1, 0.9);

	// High throw (left hand)
	const highLaunchTime = computedDwell * beatDuration;
	const highAirTime = Math.max(
		(highValue - computedDwell) * beatDuration,
		20,
	);
	const highThrowHeight = motionS(0, -GRAVITY.y, highAirTime / 2);

	// Low throw (right hand)
	const lowLaunchTime = computedDwell * beatDuration;
	const lowAirTime = Math.max(
		(lowValue - computedDwell) * beatDuration,
		20,
	);
	const lowThrowHeight = motionS(0, -GRAVITY.y, lowAirTime / 2);

	const catchWidth = clamp(
		maxCatchWidth - Math.abs(0.5 - dwell) * 100,
		150,
		maxCatchWidth,
	);

	const highCatchHeight = clamp(highThrowHeight * 0.25, 40, 200);
	const lowCatchHeight = clamp(lowThrowHeight * 0.15, 20, 120);
	const highYModifier = highCatchHeight / CATCH_SPLINE_MAX_Y;
	const lowYModifier = lowCatchHeight / CATCH_SPLINE_MAX_Y;

	maxThrowHeight = Math.max(highThrowHeight, lowThrowHeight);
	maxCatchHeight = Math.max(highCatchHeight, lowCatchHeight);

	const throwsPerCycle = 2;

	for (let b = 0; b < objectCount; b++) {
		const ball = balls[b];
		if (!ball) continue;
		const firstBeat = b;
		const firstHand = firstBeat % 2;

		for (let t = 0; t < throwsPerCycle; t++) {
			const hand = (firstHand + t) % 2;
			const isHigh = hand === 0; // left hand throws high

			const launchTime = isHigh ? highLaunchTime : lowLaunchTime;
			const airTime = isHigh ? highAirTime : lowAirTime;
			const throwHeight = isHigh
				? highThrowHeight
				: lowThrowHeight;
			const yMod = isHigh ? highYModifier : lowYModifier;

			const catchX1 = hand === 0 ? 0 : innerWidth;
			const catchX2 =
				hand === 0 ? catchWidth : innerWidth - catchWidth;

			ball.animations.push({
				type: 'catch',
				duration: launchTime,
				width: catchX2 - catchX1,
				yModifier: yMod,
				position: { x: catchX1, y: 0 },
			});

			const throwX =
				hand === 0 ? catchWidth : innerWidth - catchWidth;
			const otherHand = (hand + 1) % 2;
			const landX = otherHand === 0 ? 0 : innerWidth;

			ball.animations.push({
				type: 'throw',
				duration: airTime,
				position: { x: throwX, y: 0 },
				velocity: {
					x: (landX - throwX) / airTime,
					y: motionV(0, -GRAVITY.y, throwHeight),
				},
				acceleration: GRAVITY,
			});
		}

		const waitDuration = firstBeat * beatDuration;
		const startX = firstHand === 0 ? 0 : innerWidth;
		ball.setInitialWait(waitDuration, { x: startX, y: 0 });
	}

	const innerHeight = maxThrowHeight + maxCatchHeight;
	return { balls, innerWidth, innerHeight, catchHeight: maxCatchHeight };
}

// ── Siteswap pattern definitions ─────────────────────────────────────

const SITESWAP_DEFS: Partial<Record<JugglePattern, number[]>> = {
	'423': [4, 2, 3],
	'531': [5, 3, 1],
	'441': [4, 4, 1],
	'552': [5, 5, 2],
};

// ── prepare() router ─────────────────────────────────────────────────

function prepare(config: PrepareConfig): PrepareResult {
	// Orbit: dynamic siteswap [3N-4, 2, 2] scales with ball count
	if (config.pattern === 'orbit') {
		const n = config.objectCount;
		return prepareSiteswapGeneric(
			config.beatDuration,
			config.dwell,
			[3 * n - 4, 2, 2],
		);
	}

	// Static siteswap patterns
	const siteswap = SITESWAP_DEFS[config.pattern];
	if (siteswap) {
		return prepareSiteswapGeneric(
			config.beatDuration,
			config.dwell,
			siteswap,
		);
	}

	switch (config.pattern) {
		case 'fountain':
			return prepareFountain(config);
		case 'shower':
			return prepareShower(config);
		case 'reverse':
			return prepareReverseCascade(config);
		case 'columns':
			return prepareColumns(config);
		case 'windmill':
			return prepareWindmill(config);
		case 'half-shower':
			return prepareHalfShower(config);
		default:
			return prepareCascade(config);
	}
}

// ── Legacy types and exports (kept for compatibility) ────────────────

export type CascadeConfig = {
	beatsPerSecond: number;
	arcHeight: number;
	handSpacing: number;
	handY: number;
	dwellFraction: number;
	objectCount: number;
	pattern: JugglePattern;
};

export function getDefaultConfig(): CascadeConfig {
	return {
		beatsPerSecond: 2.5,
		arcHeight: 220,
		handSpacing: 200,
		handY: 90,
		dwellFraction: 0.2,
		objectCount: 3,
		pattern: 'cascade',
	};
}

export function configFromVariant(v: {
	cascadeSpeed: number;
	cascadeArcHeight: number;
	cascadeHandSpacing: number;
}): CascadeConfig {
	return {
		beatsPerSecond: v.cascadeSpeed,
		arcHeight: v.cascadeArcHeight,
		handSpacing: v.cascadeHandSpacing,
		handY: 90,
		dwellFraction: 0.2,
		objectCount: 3,
		pattern: 'cascade',
	};
}

// ── Bridge: legacy objectPosition using new engine ───────────────────
//
// The renderer currently calls objectPosition(i, tSeconds, config) per frame.
// We maintain this API but internally use the pre-computed engine.
// A cache holds prepared results keyed by config signature.

type CachedEngine = {
	key: string;
	result: PrepareResult;
	lastResetTime: number;
};

let cachedEngine: CachedEngine | null = null;

function engineKey(config: CascadeConfig): string {
	return `${config.pattern}-${config.beatsPerSecond}-${config.dwellFraction}-${config.objectCount}`;
}

function getEngine(config: CascadeConfig): PrepareResult {
	const key = engineKey(config);
	if (cachedEngine?.key === key) return cachedEngine.result;

	const beatDuration = 1000 / config.beatsPerSecond;
	const result = prepare({
		pattern: config.pattern,
		beatDuration,
		dwell: config.dwellFraction,
		objectCount: config.objectCount,
	});

	cachedEngine = { key, result, lastResetTime: 0 };
	return result;
}

// Track previous time to compute deltas for each ball
let lastObjectPositionTime = -1;

export function objectPosition(
	i: number,
	tSeconds: number,
	config: CascadeConfig,
): { x: number; y: number } {
	const engine = getEngine(config);
	const { balls, innerWidth } = engine;

	if (i < 0 || i >= balls.length) {
		return { x: 0, y: 0 };
	}

	const tMs = tSeconds * 1000;

	// On first call or time going backwards, reset all balls
	if (lastObjectPositionTime < 0 || tMs < lastObjectPositionTime) {
		for (const ball of balls) {
			ball.reset();
		}
		// Advance all balls to current time in one big step
		for (const ball of balls) {
			ball.update(tMs);
		}
		lastObjectPositionTime = tMs;
	} else if (i === 0) {
		// Only compute delta once per frame (when i === 0)
		const delta = tMs - lastObjectPositionTime;
		if (delta > 0) {
			for (const ball of balls) {
				ball.update(delta);
			}
			lastObjectPositionTime = tMs;
		}
	}

	const ball = balls[i];
	if (!ball) return { x: 0, y: 0 };

	// Convert from sani.js mm coords (y-up) to screen coords.
	// sani.js: x ranges 0..innerWidth, y ranges -catchHeight..innerHeight-catchHeight
	// Screen: center horizontally, y-down, handY at config.handY
	const screenX = ball.position.x - innerWidth / 2;
	const screenY = config.handY + ball.position.y;

	return { x: screenX, y: screenY };
}

// ── Hand state derivation ────────────────────────────────────────────
//
// sani.js insight: there are no separate hand entities. The hand position
// is derived from whichever ball is currently in its catch phase on that side.

export type HandState = {
	x: number;
	y: number;
	rotate: number;
};

function deriveHandState(
	balls: JuggleBall[],
	side: 'left' | 'right',
	innerWidth: number,
	config: CascadeConfig,
	catchHeight: number,
): HandState {
	const midX = innerWidth / 2;
	const isLeft = side === 'left';

	// Find a ball in catch phase on this side
	for (const ball of balls) {
		if (ball.currentSegmentType !== 'catch') continue;
		const seg = ball.currentSegment;
		if (!seg || seg.type !== 'catch') continue;

		// Determine which side this catch is on based on position
		const catchMidX = seg.position.x + seg.width / 2;
		const onLeft = catchMidX < midX;

		if ((isLeft && onLeft) || (!isLeft && !onLeft)) {
			// This ball is being caught on our side — hand follows ball
			const screenX = ball.position.x - midX;
			const screenY = config.handY + ball.position.y;

			// Rotation based on catch progress
			const dir = isLeft ? 1 : -1;
			const seg_ = ball.currentSegment;
			let rotate = 0;
			if (seg_ && seg_.type === 'catch' && seg_.duration > 0) {
				// Slight tilt during catch scoop
				rotate = dir * 10;
			}

			return { x: screenX, y: screenY, rotate };
		}
	}

	// No ball in catch on this side — hand rests at default position
	const restX = isLeft
		? -config.handSpacing / 2
		: config.handSpacing / 2;
	return { x: restX, y: config.handY, rotate: 0 };
}

export function leftHandState(
	tSeconds: number,
	config: CascadeConfig,
): HandState {
	const engine = getEngine(config);
	return deriveHandState(
		engine.balls,
		'left',
		engine.innerWidth,
		config,
		engine.catchHeight,
	);
}

export function rightHandState(
	tSeconds: number,
	config: CascadeConfig,
): HandState {
	const engine = getEngine(config);
	return deriveHandState(
		engine.balls,
		'right',
		engine.innerWidth,
		config,
		engine.catchHeight,
	);
}

// ── Legacy hand position exports ─────────────────────────────────────

export function leftHandPosition(
	beatPhase: number,
	config: CascadeConfig,
): { x: number; y: number } {
	const state = leftHandState(beatPhase / config.beatsPerSecond, config);
	return { x: state.x, y: state.y };
}

export function rightHandPosition(
	beatPhase: number,
	config: CascadeConfig,
): { x: number; y: number } {
	const state = rightHandState(beatPhase / config.beatsPerSecond, config);
	return { x: state.x, y: state.y };
}

export const IAN_INDEX = -1;
export const IAN_DRIFT = 0;

export function lerpConfig(
	a: CascadeConfig,
	b: CascadeConfig,
	t: number,
): CascadeConfig {
	const mix = (v1: number, v2: number) => v1 + (v2 - v1) * t;
	return {
		beatsPerSecond: mix(a.beatsPerSecond, b.beatsPerSecond),
		arcHeight: mix(a.arcHeight, b.arcHeight),
		handSpacing: mix(a.handSpacing, b.handSpacing),
		handY: mix(a.handY, b.handY),
		dwellFraction: mix(a.dwellFraction, b.dwellFraction),
		objectCount: b.objectCount,
		pattern: b.pattern,
	};
}

// ── New API exports ──────────────────────────────────────────────────

export {
	JuggleBall,
	prepare,
	Spline,
	type PrepareConfig,
	type PrepareResult,
	type AnimationSegment,
};
