'use client';

import { useScroll, type MotionValue } from 'motion/react';
import { useRef } from 'react';

/**
 * Returns a 0→1 progress value for a section element's scroll visibility.
 *
 * 0 = section's top edge has just reached the bottom of the viewport
 * 1 = section's bottom edge has just left the top of the viewport
 *
 * Attach `ref` to the `<section>` element you want to track.
 */
export function useSectionProgress(): {
	ref: React.RefObject<HTMLElement>;
	progress: MotionValue<number>;
} {
	const ref = useRef<HTMLElement>(null!);

	const { scrollYProgress } = useScroll({
		target: ref,
		offset: ['start end', 'end start'],
	});

	return { ref, progress: scrollYProgress };
}
