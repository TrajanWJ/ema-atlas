import React from 'react';

type MotionProps = Record<string, unknown> & { children?: React.ReactNode };

const createMotionComponent = (tag: string) => {
	const Component = ({ children, animate: _animate, transition: _transition, initial: _initial, exit: _exit, variants: _variants, whileHover: _whileHover, whileTap: _whileTap, ...props }: MotionProps) => {
		return React.createElement(tag, props, children);
	};
	Component.displayName = `motion.${tag}`;
	return Component;
};

export const motion = new Proxy({} as Record<string, ReturnType<typeof createMotionComponent>>, {
	get(_target, key: string) {
		return createMotionComponent(key);
	},
});

export const AnimatePresence = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export const useAnimation = () => ({
	start: () => Promise.resolve(),
	stop: () => undefined,
	set: () => undefined,
});

export const useMotionValue = (initial: number) => ({
	get: () => initial,
	set: () => undefined,
	onChange: () => () => undefined,
});

export const useTransform = () => ({ get: () => 0 });
export const useSpring = () => ({ get: () => 0 });
export const useAnimate = () => [null, () => Promise.resolve()];
export const useInView = () => false;
