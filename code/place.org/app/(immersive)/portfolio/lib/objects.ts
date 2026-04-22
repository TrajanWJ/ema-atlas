export type ObjectId = 'sneaker' | 'browser' | 'ball-1' | 'ball-2' | 'ball-3' | 'ball-4' | 'ball-5' | 'ball-6' | 'ball-7';

export type ObjectDef = {
	id: ObjectId;
	label: string;
	initialX: number;
	initialY: number;
	scale: number;
	mass: number;
	restitution: number;
	friction: number;
	frictionAir: number;
	gravityScale: number;
};

// 7 balls + sneaker + browser = 9 objects
export const OBJECTS: ObjectDef[] = [
	{ id: 'ball-1', label: 'Ball', initialX: 60, initialY: 15, scale: 0.6, mass: 1, restitution: 0.85, friction: 0.05, frictionAir: 0.01, gravityScale: 1 },
	{ id: 'ball-2', label: 'Ball', initialX: 70, initialY: 20, scale: 0.6, mass: 1, restitution: 0.85, friction: 0.05, frictionAir: 0.01, gravityScale: 1 },
	{ id: 'ball-3', label: 'Ball', initialX: 80, initialY: 25, scale: 0.6, mass: 1, restitution: 0.85, friction: 0.05, frictionAir: 0.01, gravityScale: 1 },
	{ id: 'ball-4', label: 'Ball', initialX: 65, initialY: 30, scale: 0.6, mass: 1, restitution: 0.85, friction: 0.05, frictionAir: 0.01, gravityScale: 1 },
	{ id: 'ball-5', label: 'Ball', initialX: 75, initialY: 10, scale: 0.6, mass: 1, restitution: 0.85, friction: 0.05, frictionAir: 0.01, gravityScale: 1 },
	{ id: 'ball-6', label: 'Ball', initialX: 55, initialY: 18, scale: 0.6, mass: 1, restitution: 0.85, friction: 0.05, frictionAir: 0.01, gravityScale: 1 },
	{ id: 'ball-7', label: 'Ball', initialX: 85, initialY: 22, scale: 0.6, mass: 1, restitution: 0.85, friction: 0.05, frictionAir: 0.01, gravityScale: 1 },
	{ id: 'sneaker', label: 'Sneaker', initialX: 70, initialY: 35, scale: 0.7, mass: 1, restitution: 0.7, friction: 0.05, frictionAir: 0.01, gravityScale: 1 },
	{ id: 'browser', label: 'Browser', initialX: 80, initialY: 40, scale: 0.7, mass: 1, restitution: 0.7, friction: 0.05, frictionAir: 0.01, gravityScale: 1 },
];

export const BALL_COLORS: Record<string, string> = {
	'ball-1': '#f43f5e', // rose
	'ball-2': '#8b5cf6', // violet
	'ball-3': '#f59e0b', // amber
	'ball-4': '#3b82f6', // blue
	'ball-5': '#10b981', // emerald
	'ball-6': '#06b6d4', // cyan
	'ball-7': '#ec4899', // pink
};
