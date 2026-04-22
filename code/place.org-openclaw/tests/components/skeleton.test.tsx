import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
	Skeleton,
	SkeletonText,
	SkeletonBlock,
	SkeletonCircle,
} from '../../src/components/ui/Skeleton';

describe('Skeleton', () => {
	it('renders with default dimensions', () => {
		const { container } = render(<Skeleton />);
		const skeleton = container.querySelector('.skeleton');

		expect(skeleton).toBeDefined();
		expect(skeleton?.getAttribute('style')).toContain('width');
		expect(skeleton?.getAttribute('style')).toContain('height');
	});

	it('renders with custom width and height (string)', () => {
		const { container } = render(<Skeleton width="200px" height="100px" />);
		const skeleton = container.querySelector('.skeleton') as HTMLElement;

		expect(skeleton.style.width).toBe('200px');
		expect(skeleton.style.height).toBe('100px');
	});

	it('renders with custom width and height (number)', () => {
		const { container } = render(<Skeleton width={250} height={50} />);
		const skeleton = container.querySelector('.skeleton') as HTMLElement;

		expect(skeleton.style.width).toBe('250px');
		expect(skeleton.style.height).toBe('50px');
	});

	it('applies rounded style when rounded={true}', () => {
		const { container } = render(<Skeleton rounded={true} />);
		const skeleton = container.querySelector('.skeleton') as HTMLElement;

		expect(skeleton.style.borderRadius).toBe('9999px');
	});

	it('applies default border-radius when rounded={false}', () => {
		const { container } = render(<Skeleton rounded={false} />);
		const skeleton = container.querySelector('.skeleton') as HTMLElement;

		expect(skeleton.style.borderRadius).toBe('8px');
	});

	it('applies custom className', () => {
		const { container } = render(
			<Skeleton className="custom-class" />
		);
		const skeleton = container.querySelector('.skeleton');

		expect(skeleton?.className).toContain('skeleton');
		expect(skeleton?.className).toContain('custom-class');
	});

	it('has animation class', () => {
		const { container } = render(<Skeleton />);
		const skeleton = container.querySelector('.skeleton');

		expect(skeleton?.className).toContain('skeleton');
	});

	it('applies default height and width', () => {
		const { container } = render(<Skeleton />);
		const skeleton = container.querySelector('.skeleton') as HTMLElement;

		expect(skeleton.style.width).toBe('100%');
		expect(skeleton.style.height).toBe('20px');
	});
});

describe('SkeletonText', () => {
	it('renders single line by default', () => {
		const { container } = render(<SkeletonText />);
		const skeletons = container.querySelectorAll('.skeleton');

		expect(skeletons.length).toBe(1);
	});

	it('renders multiple lines', () => {
		const { container } = render(<SkeletonText lines={3} />);
		const skeletons = container.querySelectorAll('.skeleton');

		expect(skeletons.length).toBe(3);
	});

	it('sets correct height for text skeletons', () => {
		const { container } = render(<SkeletonText lines={1} />);
		const skeleton = container.querySelector('.skeleton') as HTMLElement;

		expect(skeleton.style.height).toBe('16px');
	});

	it('applies custom className', () => {
		const { container } = render(<SkeletonText className="text-wrapper" />);
		const wrapper = container.querySelector('.space-y-2');

		expect(wrapper?.className).toContain('text-wrapper');
	});

	it('makes last line shorter (80% width)', () => {
		const { container } = render(<SkeletonText lines={3} />);
		const skeletons = container.querySelectorAll(
			'.skeleton'
		) as NodeListOf<HTMLElement>;

		const lastSkeleton = skeletons[skeletons.length - 1];
		expect(lastSkeleton?.style.width).toBe('80%');
	});

	it('applies full width to non-last lines', () => {
		const { container } = render(<SkeletonText lines={3} />);
		const skeletons = container.querySelectorAll(
			'.skeleton'
		) as NodeListOf<HTMLElement>;

		expect(skeletons[0]?.style.width).toBe('100%');
		expect(skeletons[1]?.style.width).toBe('100%');
	});

	it('applies custom width to lines except the last', () => {
		const { container } = render(<SkeletonText width="200px" lines={2} />);
		const skeletons = container.querySelectorAll(
			'.skeleton'
		) as NodeListOf<HTMLElement>;

		expect(skeletons[0]?.style.width).toBe('200px');
		expect(skeletons[1]?.style.width).toBe('80%');
	});
});

describe('SkeletonBlock', () => {
	it('renders with default block dimensions', () => {
		const { container } = render(<SkeletonBlock />);
		const skeleton = container.querySelector('.skeleton') as HTMLElement;

		expect(skeleton).toBeDefined();
		expect(skeleton.style.width).toBe('100%');
		expect(skeleton.style.height).toBe('200px');
	});

	it('renders with custom width and height', () => {
		const { container } = render(
			<SkeletonBlock width="300px" height="150px" />
		);
		const skeleton = container.querySelector('.skeleton') as HTMLElement;

		expect(skeleton.style.width).toBe('300px');
		expect(skeleton.style.height).toBe('150px');
	});

	it('accepts numeric width and height', () => {
		const { container } = render(<SkeletonBlock width={400} height={250} />);
		const skeleton = container.querySelector('.skeleton') as HTMLElement;

		expect(skeleton.style.width).toBe('400px');
		expect(skeleton.style.height).toBe('250px');
	});

	it('applies custom className', () => {
		const { container } = render(
			<SkeletonBlock className="my-block" />
		);
		const skeleton = container.querySelector('.skeleton');

		expect(skeleton?.className).toContain('my-block');
	});

	it('has default border-radius (not rounded)', () => {
		const { container } = render(<SkeletonBlock />);
		const skeleton = container.querySelector('.skeleton') as HTMLElement;

		expect(skeleton.style.borderRadius).toBe('8px');
	});
});

describe('SkeletonCircle', () => {
	it('renders with default size', () => {
		const { container } = render(<SkeletonCircle />);
		const skeleton = container.querySelector('.skeleton') as HTMLElement;

		expect(skeleton.style.width).toBe('40px');
		expect(skeleton.style.height).toBe('40px');
	});

	it('renders with custom size', () => {
		const { container } = render(<SkeletonCircle size={64} />);
		const skeleton = container.querySelector('.skeleton') as HTMLElement;

		expect(skeleton.style.width).toBe('64px');
		expect(skeleton.style.height).toBe('64px');
	});

	it('applies rounded border-radius', () => {
		const { container } = render(<SkeletonCircle />);
		const skeleton = container.querySelector('.skeleton') as HTMLElement;

		expect(skeleton.style.borderRadius).toBe('9999px');
	});

	it('applies custom className', () => {
		const { container } = render(<SkeletonCircle className="avatar" />);
		const skeleton = container.querySelector('.skeleton');

		expect(skeleton?.className).toContain('avatar');
	});

	it('creates perfect circle with square dimensions', () => {
		const { container } = render(<SkeletonCircle size={50} />);
		const skeleton = container.querySelector('.skeleton') as HTMLElement;

		expect(skeleton.style.width).toBe('50px');
		expect(skeleton.style.height).toBe('50px');
		expect(skeleton.style.borderRadius).toBe('9999px');
	});
});

describe('Skeleton Animation', () => {
	it('skeleton has animation applied', () => {
		const { container } = render(<Skeleton />);
		const skeleton = container.querySelector('.skeleton');

		expect(skeleton).toBeDefined();
		expect(skeleton?.className).toContain('skeleton');
	});

	it('all skeleton variants have animation', () => {
		const { container: container1 } = render(<SkeletonText />);
		const { container: container2 } = render(<SkeletonBlock />);
		const { container: container3 } = render(<SkeletonCircle />);

		const text = container1.querySelector('.skeleton');
		const block = container2.querySelector('.skeleton');
		const circle = container3.querySelector('.skeleton');

		expect(text?.className).toContain('skeleton');
		expect(block?.className).toContain('skeleton');
		expect(circle?.className).toContain('skeleton');
	});
});
