import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PROJECTS } from '../../src/data/projects';

beforeAll(() => {
	// jsdom does not implement IntersectionObserver
	if (!('IntersectionObserver' in globalThis)) {
		class MockIntersectionObserver {
			observe() {}
			disconnect() {}
			unobserve() {}
		}
		Object.defineProperty(globalThis, 'IntersectionObserver', {
			writable: true,
			configurable: true,
			value: MockIntersectionObserver,
		});
	}
});
import { PortfolioHero } from '../../src/components/portfolio/PortfolioHero';
import { ProjectGrid } from '../../src/components/portfolio/ProjectGrid';
import { ProjectCard } from '../../src/components/portfolio/ProjectCard';

describe('PROJECTS data', () => {
	it('contains 9 projects', () => {
		expect(PROJECTS).toHaveLength(9);
	});

	it('every project has required fields', () => {
		for (const project of PROJECTS) {
			expect(project.id).toBeTruthy();
			expect(project.name).toBeTruthy();
			expect(project.description).toBeTruthy();
			expect(Array.isArray(project.stack)).toBe(true);
			expect(project.stack.length).toBeGreaterThan(0);
		}
	});
});

describe('PortfolioHero', () => {
	it('renders hero text', () => {
		render(<PortfolioHero />);
		// sr-only span contains the full title text
		expect(screen.getByText('Built by Trajan')).toBeDefined();
		expect(
			screen.getByText('Full-stack engineer. Tool builder. System thinker.'),
		).toBeDefined();
	});
});

describe('ProjectCard', () => {
	it('renders project name and description', () => {
		const project = PROJECTS[0];
		if (!project) throw new Error('No project at index 0');
		render(<ProjectCard project={project} />);
		expect(screen.getByText(project.name)).toBeDefined();
		expect(screen.getByText(project.description)).toBeDefined();
	});

	it('renders tech stack tags', () => {
		const project = PROJECTS[0];
		if (!project) throw new Error('No project at index 0');
		render(<ProjectCard project={project} />);
		for (const tech of project.stack) {
			expect(screen.getByText(tech)).toBeDefined();
		}
	});
});

describe('ProjectGrid', () => {
	it('renders all 9 projects', () => {
		render(<ProjectGrid projects={PROJECTS} />);
		for (const project of PROJECTS) {
			expect(screen.getByText(project.name)).toBeDefined();
		}
	});

	it('renders project descriptions', () => {
		render(<ProjectGrid projects={PROJECTS} />);
		for (const project of PROJECTS) {
			expect(screen.getByText(project.description)).toBeDefined();
		}
	});
});
