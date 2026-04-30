import type { Metadata } from "next";
import { CompanionDownload } from "@/src/components/companion/CompanionDownload";

export const metadata: Metadata = {
	title: "Companion App — place.org",
	description:
		"Download the place.org companion app for transparent native popout windows on your desktop.",
};

export default function CompanionPage() {
	return <CompanionDownload />;
}
