import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AboutHero } from "../../src/components/about/AboutHero";
import { ValuesList } from "../../src/components/about/ValuesList";
import { TechStack } from "../../src/components/about/TechStack";

// ScrollReveal uses IntersectionObserver — stub it for tests
vi.stubGlobal(
	"IntersectionObserver",
	class {
		observe = vi.fn();
		disconnect = vi.fn();
		constructor(_cb: IntersectionObserverCallback) {}
	},
);

describe("AboutHero", () => {
	it("renders the name 'Trajan'", () => {
		render(<AboutHero />);
		expect(screen.getByRole("heading", { level: 1 })).toBeDefined();
		expect(screen.getByText("Trajan")).toBeDefined();
	});

	it("renders the subtitle", () => {
		render(<AboutHero />);
		expect(screen.getByText(/Builder/)).toBeDefined();
		expect(screen.getByText(/System thinker/)).toBeDefined();
		expect(screen.getByText(/Executor/)).toBeDefined();
	});

	it("renders current focus section", () => {
		render(<AboutHero />);
		expect(screen.getByText(/Current focus/i)).toBeDefined();
	});
});

describe("ValuesList", () => {
	it("renders all five core values", () => {
		render(<ValuesList />);
		expect(screen.getByText("Execution over aspiration")).toBeDefined();
		expect(screen.getByText("The site IS the pitch")).toBeDefined();
		expect(screen.getByText("Progress over perfection")).toBeDefined();
		expect(screen.getByText("Systems thinking")).toBeDefined();
		expect(screen.getByText("Local-first, self-hosted")).toBeDefined();
	});

	it("renders the Philosophy section label", () => {
		render(<ValuesList />);
		expect(screen.getByText(/Philosophy/i)).toBeDefined();
	});
});

describe("TechStack", () => {
	it("renders all five tech categories", () => {
		render(<TechStack />);
		expect(screen.getByText("Frontend")).toBeDefined();
		expect(screen.getByText("Backend")).toBeDefined();
		expect(screen.getByText("AI / ML")).toBeDefined();
		expect(screen.getByText("Infrastructure")).toBeDefined();
		expect(screen.getByText("Tools")).toBeDefined();
	});

	it("renders representative technologies", () => {
		render(<TechStack />);
		expect(screen.getByText("Next.js")).toBeDefined();
		expect(screen.getByText("TypeScript")).toBeDefined();
		expect(screen.getByText("Claude")).toBeDefined();
		expect(screen.getByText("Docker")).toBeDefined();
		expect(screen.getByText("Vitest")).toBeDefined();
	});
});
