import type { Metadata } from "next";
import { ToastContainer } from "@/src/components/ui/ToastContainer";

export const metadata: Metadata = {
	title: "Desk — place.org",
	description: "Your work-companion window",
};

export default function DeskLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div
			className="relative h-dvh w-dvw overflow-hidden"
			style={{
				backgroundColor: "var(--place-void, #060610)",
				color: "var(--place-text-primary, rgba(255,255,255,0.87))",
			}}
		>
			{children}
			<ToastContainer />
		</div>
	);
}
