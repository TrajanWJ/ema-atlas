// ----------------------------------------------------------------------------
// Confetti celebration effect
// Pure CSS/JS animation with no external dependencies
// ----------------------------------------------------------------------------

export interface ConfettiOptions {
	particleCount?: number;
	duration?: number;
}

const ACCENT_COLORS = ['#3b82f6', '#10b981', '#a855f7', '#f59e0b'];
const DEFAULT_PARTICLE_COUNT = 65;
const DEFAULT_DURATION = 2000;

interface Particle {
	element: HTMLDivElement;
	startX: number;
	startY: number;
	vx: number;
	vy: number;
}

function createConfettiStyle(): HTMLStyleElement {
	const style = document.createElement('style');
	style.textContent = `
		@keyframes confetti-fall {
			0% {
				transform: translateY(0) translateX(0) rotateZ(0deg);
				opacity: 1;
			}
			100% {
				transform: translateY(600px) translateX(var(--tx)) rotateZ(720deg);
				opacity: 0;
			}
		}
		.confetti-particle {
			position: fixed;
			pointer-events: none;
			will-change: transform, opacity;
		}
	`;
	document.head.appendChild(style);
	return style;
}

function createParticle(): HTMLDivElement {
	const particle = document.createElement('div');
	particle.className = 'confetti-particle';

	const isCircle = Math.random() > 0.5;
	const size = Math.random() * 6 + 4;
	const color = ACCENT_COLORS[Math.floor(Math.random() * ACCENT_COLORS.length)] ?? '#3b82f6';

	if (isCircle) {
		particle.style.width = `${size}px`;
		particle.style.height = `${size}px`;
		particle.style.borderRadius = '50%';
	} else {
		particle.style.width = `${size}px`;
		particle.style.height = `${size * 0.5}px`;
		particle.style.borderRadius = '2px';
	}

	particle.style.backgroundColor = color;
	particle.style.left = `${window.innerWidth / 2}px`;
	particle.style.top = `${window.innerHeight}px`;

	return particle;
}

export function fireConfetti(options?: ConfettiOptions): void {
	const particleCount = options?.particleCount ?? DEFAULT_PARTICLE_COUNT;
	const duration = options?.duration ?? DEFAULT_DURATION;

	if (typeof document === 'undefined') return;

	// Ensure style exists
	if (!document.querySelector('style[data-confetti]')) {
		const style = createConfettiStyle();
		style.setAttribute('data-confetti', 'true');
	}

	const particles: Particle[] = [];

	// Create particles
	for (let i = 0; i < particleCount; i++) {
		const element = createParticle();
		document.body.appendChild(element);

		const vx = (Math.random() - 0.5) * 200;
		const vy = Math.random() * 200 + 300;

		particles.push({
			element,
			startX: window.innerWidth / 2,
			startY: window.innerHeight,
			vx,
			vy,
		});
	}

	// Animate particles
	const startTime = Date.now();

	const animate = (): void => {
		const elapsed = Date.now() - startTime;
		const progress = Math.min(elapsed / duration, 1);

		particles.forEach((particle) => {
			const time = progress * (duration / 1000);
			const tx = particle.vx * time;
			const ty = particle.vy * time + (9.8 * 50 * time * time) / 2;

			particle.element.style.setProperty('--tx', `${tx}px`);
			particle.element.style.animation = `confetti-fall ${duration / 1000}s ease-in forwards`;
		});

		if (progress < 1) {
			requestAnimationFrame(animate);
		} else {
			// Remove particles after animation
			particles.forEach((particle) => {
				particle.element.remove();
			});
		}
	};

	animate();
}
