import type { Metadata } from "next";
import { CommunityHero } from "@/src/components/community/CommunityHero";
import { PeopleGrid } from "@/src/components/community/PeopleGrid";
import { OrganizationsSection } from "@/src/components/community/OrganizationsSection";
import { ServicesSection } from "@/src/components/community/ServicesSection";
import { TimeMachine } from "@/src/components/community/TimeMachine";

export const metadata: Metadata = {
	title: "Community — place.org",
	description:
		"The people, organizations, and services that make place.org a home for creators, thinkers, and builders.",
};

export default function CommunityPage() {
	return (
		<main className="mx-auto max-w-5xl px-6 pb-16">
			<CommunityHero />
			<PeopleGrid />
			<OrganizationsSection />
			<ServicesSection />
			<TimeMachine />
		</main>
	);
}
