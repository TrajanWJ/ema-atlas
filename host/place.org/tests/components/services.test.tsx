import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ServicesPage from "../../app/(immersive)/services/page";

describe("ServicesPage", () => {
	it("renders all 3 services", () => {
		render(<ServicesPage />);
		expect(screen.getByText("Searx")).toBeDefined();
		expect(screen.getByText("Commafeed")).toBeDefined();
		expect(screen.getByText("Hubzilla")).toBeDefined();
	});

	it("renders the page header", () => {
		render(<ServicesPage />);
		expect(screen.getByText("place.org Services")).toBeDefined();
		expect(screen.getByText("Self-hosted tools running on Debian GNU/Linux")).toBeDefined();
	});

	it("each service has a Launch link", () => {
		render(<ServicesPage />);
		const launchLinks = screen.getAllByRole("link");
		expect(launchLinks).toHaveLength(3);
		for (const link of launchLinks) {
			expect(link.textContent).toBe("Launch");
		}
	});

	it("Searx launch link has an href", () => {
		render(<ServicesPage />);
		const searxLink = screen.getByLabelText("Launch Searx");
		expect(searxLink).toBeDefined();
		expect((searxLink as HTMLAnchorElement).href).toBeTruthy();
	});

	it("Commafeed launch link has an href", () => {
		render(<ServicesPage />);
		const link = screen.getByLabelText("Launch Commafeed");
		expect(link).toBeDefined();
		expect((link as HTMLAnchorElement).href).toBeTruthy();
	});

	it("Hubzilla launch link has an href", () => {
		render(<ServicesPage />);
		const link = screen.getByLabelText("Launch Hubzilla");
		expect(link).toBeDefined();
		expect((link as HTMLAnchorElement).href).toBeTruthy();
	});

	it("all services show Available status", () => {
		render(<ServicesPage />);
		const statusIndicators = screen.getAllByText("Available");
		expect(statusIndicators).toHaveLength(3);
	});
});
