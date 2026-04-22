import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PeopleGrid } from "../../src/components/community/PeopleGrid";
import { OrganizationsSection } from "../../src/components/community/OrganizationsSection";
import { ServicesSection } from "../../src/components/community/ServicesSection";
import { TimeMachine } from "../../src/components/community/TimeMachine";

describe("PeopleGrid", () => {
	it("renders all 5 people", () => {
		render(<PeopleGrid />);
		expect(screen.getByText("Allen Varney")).toBeDefined();
		expect(screen.getByText("Paul")).toBeDefined();
		expect(screen.getByText("Elizabeth Wiley")).toBeDefined();
		expect(screen.getByText("Kusco")).toBeDefined();
		expect(screen.getByText("Zachary")).toBeDefined();
	});

	it("links to each person's homepage", () => {
		render(<PeopleGrid />);
		const allenLink = screen.getByRole("link", { name: /allenvarney\.com/i });
		expect(allenLink).toBeDefined();
		expect((allenLink as HTMLAnchorElement).href).toContain("allenvarney.com");
	});
});

describe("OrganizationsSection", () => {
	it("renders all 4 organizations", () => {
		render(<OrganizationsSection />);
		expect(screen.getByText("Texas Juggling Society")).toBeDefined();
		expect(screen.getByText("Multiplexing.org")).toBeDefined();
		expect(screen.getByText("Siteswap.org")).toBeDefined();
		expect(screen.getByText("KoFightClub")).toBeDefined();
	});

	it("renders organization descriptions", () => {
		render(<OrganizationsSection />);
		expect(screen.getByText(/statewide community for jugglers/i)).toBeDefined();
		expect(screen.getByText(/multiplexing juggling/i)).toBeDefined();
		expect(screen.getByText(/siteswap notation/i)).toBeDefined();
		expect(screen.getByText(/board gaming/i)).toBeDefined();
	});

	it("renders external visit links for each org", () => {
		render(<OrganizationsSection />);
		const visitLinks = screen.getAllByRole("link", { name: /visit/i });
		expect(visitLinks).toHaveLength(4);
	});
});

describe("ServicesSection", () => {
	it("renders all 3 services", () => {
		render(<ServicesSection />);
		expect(screen.getByText("Searx")).toBeDefined();
		expect(screen.getByText("Commafeed")).toBeDefined();
		expect(screen.getByText("Hubzilla")).toBeDefined();
	});

	it("renders service descriptions", () => {
		render(<ServicesSection />);
		expect(screen.getByText(/privacy-focused metasearch/i)).toBeDefined();
		expect(screen.getByText(/RSS reader/i)).toBeDefined();
		expect(screen.getByText(/federated social/i)).toBeDefined();
	});

	it("renders a Launch button for each service", () => {
		render(<ServicesSection />);
		const launchLinks = screen.getAllByRole("link", { name: /launch/i });
		expect(launchLinks).toHaveLength(3);
	});

	it("Launch buttons open external links", () => {
		render(<ServicesSection />);
		const launchLinks = screen.getAllByRole("link", { name: /launch/i });
		for (const link of launchLinks) {
			expect((link as HTMLAnchorElement).target).toBe("_blank");
		}
	});
});

describe("TimeMachine", () => {
	it("renders the heading prompt", () => {
		render(<TimeMachine />);
		expect(
			screen.getByText(/want to see how place\.org looked before/i),
		).toBeDefined();
	});

	it("links to /oldplace/", () => {
		render(<TimeMachine />);
		const link = screen.getByRole("link", { name: /enter the time machine/i });
		expect(link).toBeDefined();
		expect((link as HTMLAnchorElement).getAttribute("href")).toBe("/oldplace/");
	});
});
