import type { Metadata } from "next";
import { AboutHero } from "@/src/components/about/AboutHero";
import { ValuesList } from "@/src/components/about/ValuesList";
import { TechStack } from "@/src/components/about/TechStack";
import { CurrentWork } from "@/src/components/about/CurrentWork";
import { ContactSection } from "@/src/components/about/ContactSection";

export const metadata: Metadata = {
	title: "About — Trajan",
	description: "Builder. System thinker. Executor.",
};

function SectionDivider() {
	return (
		<div
			aria-hidden="true"
			style={{
				height: "1px",
				background:
					"linear-gradient(to right, transparent, rgba(91,156,245,0.25) 30%, rgba(91,156,245,0.25) 70%, transparent)",
				margin: "0 auto",
				maxWidth: "900px",
			}}
		/>
	);
}

export default function AboutPage() {
	return (
		<main
			style={{
				background: "var(--bg-deep)",
				color: "var(--text-primary)",
				minHeight: "100dvh",
			}}
		>
			<AboutHero />
			<SectionDivider />
			<ValuesList />
			<SectionDivider />
			<TechStack />
			<SectionDivider />
			<CurrentWork />
			<SectionDivider />
			<ContactSection />
		</main>
	);
}
