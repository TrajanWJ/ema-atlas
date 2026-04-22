import { ToastContainer } from "@/src/components/ui/ToastContainer";

export default function DesktopLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative h-dvh w-dvw overflow-hidden">
			{children}
			<ToastContainer />
		</div>
	);
}
