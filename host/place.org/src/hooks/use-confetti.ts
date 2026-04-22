'use client';

import { useCallback, useRef } from 'react';
import { fireConfetti, type ConfettiOptions } from '@/src/lib/confetti';

interface UseConfettiReturn {
	fire: (options?: ConfettiOptions) => void;
}

const THROTTLE_DELAY = 3000; // 3 seconds

export function useConfetti(): UseConfettiReturn {
	const lastFireTimeRef = useRef<number>(0);

	const fire = useCallback((options?: ConfettiOptions): void => {
		const now = Date.now();
		const timeSinceLastFire = now - lastFireTimeRef.current;

		if (timeSinceLastFire < THROTTLE_DELAY) {
			return;
		}

		lastFireTimeRef.current = now;
		fireConfetti(options);
	}, []);

	return { fire };
}
