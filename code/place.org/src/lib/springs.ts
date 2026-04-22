export const SPRINGS = {
	default: { type: 'spring' as const, stiffness: 300, damping: 25 },
	snappy: { type: 'spring' as const, stiffness: 500, damping: 30 },
	gentle: { type: 'spring' as const, stiffness: 200, damping: 20 },
	bouncy: { type: 'spring' as const, stiffness: 400, damping: 15 },
} as const;

type SpringConfig = (typeof SPRINGS)[keyof typeof SPRINGS];

export function getTransition(
	spring: SpringConfig,
	reducedMotion: boolean,
): SpringConfig | { duration: number } {
	return reducedMotion ? { duration: 0 } : spring;
}
