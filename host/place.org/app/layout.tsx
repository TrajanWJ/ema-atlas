import type { Metadata } from "next";
import { Cinzel, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const cinzel = Cinzel({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-cinzel",
	display: "swap",
});

const instrumentSerif = Instrument_Serif({
	subsets: ["latin"],
	weight: "400",
	style: ["normal", "italic"],
	variable: "--font-instrument-serif",
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
	variable: "--font-jetbrains-mono",
	display: "swap",
});

export const metadata: Metadata = {
	title: "place.org",
	description: "A virtual desktop OS that actually works",
	manifest: "/manifest.json",
	themeColor: "#060610",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${cinzel.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}
		>
			<body>{children}</body>
		</html>
	);
}
