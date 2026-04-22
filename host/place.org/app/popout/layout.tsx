import type { Metadata } from "next";
import { ToastContainer } from "@/src/components/ui/ToastContainer";

export const metadata: Metadata = {
	title: "place.org",
};

export default function PopoutLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div
			className="relative h-dvh w-dvw overflow-hidden"
			style={
				{
					"--titlebar-height": "36px",
					backgroundColor: "var(--place-void, #060610)",
					color: "var(--place-text-primary, rgba(255,255,255,0.87))",
				} as React.CSSProperties
			}
		>
			{children}
			<ToastContainer />
		</div>
	);
}
