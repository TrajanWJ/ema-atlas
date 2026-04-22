import type { CSSProperties } from "react";

// ---------------------------------------------------------------------------
// Weather condition buckets derived from Open-Meteo weather codes
// ---------------------------------------------------------------------------

export type WeatherBucket =
	| "clear"
	| "cloudy"
	| "rain"
	| "snow"
	| "fog"
	| "storm";

export type TimeOfDay =
	| "night"
	| "dawn"
	| "morning"
	| "midday"
	| "afternoon"
	| "sunset"
	| "evening";

export function weatherCodeToBucket(code: number): WeatherBucket {
	if (code === 0) return "clear";
	if (code <= 3) return "cloudy";
	if (code <= 48) return "fog";
	if (code <= 65) return "rain";
	if (code <= 77) return "snow";
	if (code <= 86) return "rain";
	return "storm";
}

// ---------------------------------------------------------------------------
// Color palettes: time-of-day x weather-bucket
// Each palette defines layered gradient stops for a rich, photorealistic feel
// ---------------------------------------------------------------------------

interface Palette {
	readonly base: string;
	readonly atmosphere: string;
	readonly highlight: string;
	readonly glow: string;
}

const PALETTES: Record<TimeOfDay, Record<WeatherBucket, Palette>> = {
	night: {
		clear: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #0a0e27 0%, #050816 40%, #020410 100%)",
			atmosphere: "radial-gradient(ellipse 80% 50% at 30% 20%, rgba(40,60,120,0.15) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 70% 15%, rgba(180,200,255,0.06) 0%, transparent 40%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(10,15,40,0.8) 0%, transparent 60%)",
		},
		cloudy: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #0c1020 0%, #080c18 40%, #040810 100%)",
			atmosphere: "radial-gradient(ellipse 100% 60% at 40% 30%, rgba(30,40,70,0.2) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 60% 25%, rgba(100,120,160,0.05) 0%, transparent 50%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(8,12,30,0.9) 0%, transparent 60%)",
		},
		rain: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #080c1a 0%, #060a14 40%, #030610 100%)",
			atmosphere: "radial-gradient(ellipse 100% 70% at 50% 40%, rgba(20,30,60,0.25) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 40% 20%, rgba(60,80,120,0.06) 0%, transparent 50%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(5,8,20,0.95) 0%, transparent 55%)",
		},
		snow: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #0e1228 0%, #0a0e20 40%, #060a18 100%)",
			atmosphere: "radial-gradient(ellipse 90% 60% at 50% 30%, rgba(50,60,100,0.18) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 55% 20%, rgba(140,160,200,0.07) 0%, transparent 45%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(10,14,30,0.85) 0%, transparent 60%)",
		},
		fog: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #0c1020 0%, #0a0e1c 40%, #060a14 100%)",
			atmosphere: "radial-gradient(ellipse 120% 80% at 50% 50%, rgba(40,50,80,0.22) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 50% 40%, rgba(80,100,140,0.08) 0%, transparent 50%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(8,10,24,0.9) 0%, transparent 60%)",
		},
		storm: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #060814 0%, #04060e 40%, #02040a 100%)",
			atmosphere: "radial-gradient(ellipse 100% 70% at 50% 40%, rgba(15,20,45,0.3) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 45% 30%, rgba(80,70,120,0.06) 0%, transparent 50%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(3,4,12,0.95) 0%, transparent 55%)",
		},
	},
	dawn: {
		clear: {
			base: "radial-gradient(ellipse 120% 100% at 50% 100%, #1a0a20 0%, #200e30 30%, #0e0818 60%, #060610 100%)",
			atmosphere: "radial-gradient(ellipse 100% 60% at 50% 90%, rgba(180,80,60,0.15) 0%, rgba(120,50,80,0.08) 40%, transparent 70%)",
			highlight: "radial-gradient(circle at 50% 85%, rgba(255,140,80,0.1) 0%, transparent 40%)",
			glow: "radial-gradient(ellipse 80% 40% at 50% 95%, rgba(200,100,60,0.12) 0%, transparent 60%)",
		},
		cloudy: {
			base: "radial-gradient(ellipse 120% 100% at 50% 100%, #140a1c 0%, #180c24 30%, #0c0814 60%, #060610 100%)",
			atmosphere: "radial-gradient(ellipse 110% 60% at 50% 85%, rgba(120,60,50,0.12) 0%, rgba(80,40,60,0.06) 40%, transparent 70%)",
			highlight: "radial-gradient(circle at 50% 80%, rgba(200,110,70,0.06) 0%, transparent 45%)",
			glow: "radial-gradient(ellipse 80% 40% at 50% 95%, rgba(150,70,50,0.08) 0%, transparent 60%)",
		},
		rain: {
			base: "radial-gradient(ellipse 120% 100% at 50% 100%, #100a18 0%, #140c1e 30%, #0a0812 60%, #040610 100%)",
			atmosphere: "radial-gradient(ellipse 110% 70% at 50% 80%, rgba(80,50,60,0.15) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 50% 75%, rgba(160,80,60,0.05) 0%, transparent 50%)",
			glow: "radial-gradient(ellipse 80% 40% at 50% 95%, rgba(100,50,40,0.1) 0%, transparent 60%)",
		},
		snow: {
			base: "radial-gradient(ellipse 120% 100% at 50% 100%, #140e22 0%, #1a1028 30%, #0e0a18 60%, #080610 100%)",
			atmosphere: "radial-gradient(ellipse 100% 60% at 50% 85%, rgba(140,100,120,0.12) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 50% 80%, rgba(200,160,180,0.06) 0%, transparent 45%)",
			glow: "radial-gradient(ellipse 80% 40% at 50% 95%, rgba(160,80,80,0.08) 0%, transparent 60%)",
		},
		fog: {
			base: "radial-gradient(ellipse 120% 100% at 50% 100%, #120a1c 0%, #160c22 30%, #0c0a16 60%, #060610 100%)",
			atmosphere: "radial-gradient(ellipse 120% 80% at 50% 70%, rgba(100,70,80,0.15) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 50% 60%, rgba(160,120,140,0.06) 0%, transparent 50%)",
			glow: "radial-gradient(ellipse 80% 40% at 50% 95%, rgba(120,60,50,0.08) 0%, transparent 60%)",
		},
		storm: {
			base: "radial-gradient(ellipse 120% 100% at 50% 100%, #0e0814 0%, #120a1a 30%, #080610 60%, #04040c 100%)",
			atmosphere: "radial-gradient(ellipse 100% 70% at 50% 85%, rgba(60,30,50,0.18) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 45% 75%, rgba(120,60,80,0.06) 0%, transparent 50%)",
			glow: "radial-gradient(ellipse 80% 40% at 50% 95%, rgba(80,30,40,0.1) 0%, transparent 60%)",
		},
	},
	morning: {
		clear: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #0c1830 0%, #0e1a38 30%, #081020 60%, #060c18 100%)",
			atmosphere: "radial-gradient(ellipse 100% 50% at 60% 10%, rgba(80,140,220,0.12) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 65% 5%, rgba(180,210,255,0.08) 0%, transparent 35%)",
			glow: "radial-gradient(ellipse 80% 30% at 60% 0%, rgba(100,160,240,0.06) 0%, transparent 50%)",
		},
		cloudy: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #0c1428 0%, #0e1630 30%, #080e1c 60%, #060a14 100%)",
			atmosphere: "radial-gradient(ellipse 110% 60% at 50% 20%, rgba(60,80,120,0.15) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 55% 15%, rgba(120,150,200,0.06) 0%, transparent 40%)",
			glow: "radial-gradient(ellipse 80% 30% at 50% 0%, rgba(70,100,160,0.05) 0%, transparent 50%)",
		},
		rain: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #0a1222 0%, #0c142a 30%, #080c18 60%, #050a12 100%)",
			atmosphere: "radial-gradient(ellipse 110% 70% at 50% 30%, rgba(40,60,100,0.18) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 50% 20%, rgba(80,110,160,0.05) 0%, transparent 45%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(8,12,24,0.6) 0%, transparent 50%)",
		},
		snow: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #0e1630 0%, #101838 30%, #0a1024 60%, #080c18 100%)",
			atmosphere: "radial-gradient(ellipse 100% 55% at 50% 15%, rgba(80,110,170,0.12) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 55% 10%, rgba(160,180,220,0.07) 0%, transparent 40%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(10,14,28,0.5) 0%, transparent 50%)",
		},
		fog: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #0c1428 0%, #0e162e 30%, #0a0e1c 60%, #080c16 100%)",
			atmosphere: "radial-gradient(ellipse 120% 80% at 50% 40%, rgba(60,80,120,0.18) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 50% 30%, rgba(100,130,180,0.07) 0%, transparent 45%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(10,14,26,0.55) 0%, transparent 50%)",
		},
		storm: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #080e1c 0%, #0a1020 30%, #060a14 60%, #04080e 100%)",
			atmosphere: "radial-gradient(ellipse 100% 70% at 50% 30%, rgba(30,40,70,0.22) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 40% 25%, rgba(70,60,110,0.06) 0%, transparent 50%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(5,8,16,0.7) 0%, transparent 50%)",
		},
	},
	midday: {
		clear: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #0a1838 0%, #0c1c42 25%, #081430 55%, #060e22 100%)",
			atmosphere: "radial-gradient(ellipse 90% 45% at 50% 5%, rgba(90,160,255,0.1) 0%, transparent 65%)",
			highlight: "radial-gradient(circle at 50% 0%, rgba(200,225,255,0.08) 0%, transparent 30%)",
			glow: "radial-gradient(ellipse 60% 20% at 50% 0%, rgba(120,180,255,0.06) 0%, transparent 40%)",
		},
		cloudy: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #0c1630 0%, #0e183a 25%, #0a1228 55%, #080e1e 100%)",
			atmosphere: "radial-gradient(ellipse 110% 60% at 50% 15%, rgba(60,90,140,0.15) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 50% 10%, rgba(130,160,210,0.06) 0%, transparent 35%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(8,12,24,0.4) 0%, transparent 50%)",
		},
		rain: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #081228 0%, #0a1430 25%, #070e1e 55%, #050a16 100%)",
			atmosphere: "radial-gradient(ellipse 110% 70% at 50% 25%, rgba(40,60,110,0.2) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 45% 15%, rgba(80,110,170,0.05) 0%, transparent 40%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(6,10,22,0.6) 0%, transparent 50%)",
		},
		snow: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #0e1838 0%, #101c42 25%, #0a1430 55%, #080e22 100%)",
			atmosphere: "radial-gradient(ellipse 100% 50% at 50% 10%, rgba(80,120,190,0.12) 0%, transparent 65%)",
			highlight: "radial-gradient(circle at 50% 5%, rgba(170,195,235,0.08) 0%, transparent 30%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(10,14,30,0.4) 0%, transparent 50%)",
		},
		fog: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #0c1630 0%, #0e1836 25%, #0a1226 55%, #080e1c 100%)",
			atmosphere: "radial-gradient(ellipse 120% 80% at 50% 35%, rgba(60,80,130,0.2) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 50% 25%, rgba(110,140,190,0.07) 0%, transparent 45%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(8,12,24,0.5) 0%, transparent 50%)",
		},
		storm: {
			base: "radial-gradient(ellipse 120% 100% at 50% 0%, #080e20 0%, #0a1228 25%, #060c1a 55%, #040812 100%)",
			atmosphere: "radial-gradient(ellipse 100% 70% at 50% 25%, rgba(30,40,80,0.25) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 40% 20%, rgba(80,70,130,0.06) 0%, transparent 45%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(4,6,14,0.75) 0%, transparent 50%)",
		},
	},
	afternoon: {
		clear: {
			base: "radial-gradient(ellipse 120% 100% at 30% 20%, #0c1835 0%, #0a1630 30%, #081228 60%, #060e1e 100%)",
			atmosphere: "radial-gradient(ellipse 80% 50% at 25% 15%, rgba(100,160,240,0.1) 0%, transparent 65%)",
			highlight: "radial-gradient(circle at 20% 10%, rgba(200,220,255,0.07) 0%, transparent 30%)",
			glow: "radial-gradient(ellipse 60% 30% at 80% 90%, rgba(80,60,40,0.06) 0%, transparent 50%)",
		},
		cloudy: {
			base: "radial-gradient(ellipse 120% 100% at 40% 20%, #0a1428 0%, #0c1630 30%, #080e20 60%, #060c18 100%)",
			atmosphere: "radial-gradient(ellipse 100% 60% at 35% 20%, rgba(60,80,130,0.14) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 30% 15%, rgba(120,150,200,0.05) 0%, transparent 40%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(8,10,20,0.5) 0%, transparent 50%)",
		},
		rain: {
			base: "radial-gradient(ellipse 120% 100% at 50% 20%, #081022 0%, #0a1228 30%, #060e1a 60%, #050a14 100%)",
			atmosphere: "radial-gradient(ellipse 110% 70% at 50% 30%, rgba(35,55,95,0.2) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 45% 20%, rgba(70,100,150,0.05) 0%, transparent 45%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(6,8,18,0.65) 0%, transparent 50%)",
		},
		snow: {
			base: "radial-gradient(ellipse 120% 100% at 35% 20%, #0c1632 0%, #0e1838 30%, #0a1228 60%, #080e1e 100%)",
			atmosphere: "radial-gradient(ellipse 90% 50% at 30% 15%, rgba(80,120,180,0.1) 0%, transparent 65%)",
			highlight: "radial-gradient(circle at 25% 10%, rgba(160,185,225,0.06) 0%, transparent 35%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(10,14,28,0.4) 0%, transparent 50%)",
		},
		fog: {
			base: "radial-gradient(ellipse 120% 100% at 40% 25%, #0a142a 0%, #0c1630 30%, #080e20 60%, #070c18 100%)",
			atmosphere: "radial-gradient(ellipse 120% 80% at 45% 40%, rgba(55,75,120,0.18) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 40% 30%, rgba(100,130,180,0.06) 0%, transparent 45%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(8,12,22,0.5) 0%, transparent 50%)",
		},
		storm: {
			base: "radial-gradient(ellipse 120% 100% at 45% 25%, #070c1a 0%, #0a0e22 30%, #060a16 60%, #040810 100%)",
			atmosphere: "radial-gradient(ellipse 100% 70% at 50% 30%, rgba(25,35,70,0.25) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 35% 20%, rgba(80,65,120,0.06) 0%, transparent 50%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(4,6,14,0.75) 0%, transparent 50%)",
		},
	},
	sunset: {
		clear: {
			base: "radial-gradient(ellipse 120% 100% at 80% 90%, #1a0810 0%, #200e18 20%, #180820 50%, #0a0614 80%, #060610 100%)",
			atmosphere: "radial-gradient(ellipse 80% 50% at 75% 85%, rgba(220,100,40,0.14) 0%, rgba(180,60,60,0.08) 40%, transparent 70%)",
			highlight: "radial-gradient(circle at 80% 80%, rgba(255,160,60,0.12) 0%, transparent 35%)",
			glow: "radial-gradient(ellipse 100% 40% at 75% 95%, rgba(200,80,30,0.1) 0%, transparent 50%)",
		},
		cloudy: {
			base: "radial-gradient(ellipse 120% 100% at 70% 85%, #160810 0%, #1a0c14 20%, #140820 50%, #0a0612 80%, #060610 100%)",
			atmosphere: "radial-gradient(ellipse 100% 60% at 65% 80%, rgba(160,70,40,0.12) 0%, rgba(120,40,50,0.06) 40%, transparent 70%)",
			highlight: "radial-gradient(circle at 70% 75%, rgba(200,120,60,0.08) 0%, transparent 40%)",
			glow: "radial-gradient(ellipse 90% 35% at 65% 95%, rgba(150,60,30,0.08) 0%, transparent 50%)",
		},
		rain: {
			base: "radial-gradient(ellipse 120% 100% at 70% 90%, #120810 0%, #160a14 20%, #100818 50%, #080610 80%, #050508 100%)",
			atmosphere: "radial-gradient(ellipse 100% 70% at 60% 80%, rgba(100,50,40,0.15) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 65% 80%, rgba(160,80,50,0.06) 0%, transparent 45%)",
			glow: "radial-gradient(ellipse 90% 35% at 65% 95%, rgba(100,40,25,0.08) 0%, transparent 50%)",
		},
		snow: {
			base: "radial-gradient(ellipse 120% 100% at 75% 88%, #160c18 0%, #1c1020 20%, #140a1e 50%, #0c0814 80%, #080610 100%)",
			atmosphere: "radial-gradient(ellipse 90% 50% at 70% 85%, rgba(180,100,100,0.1) 0%, transparent 65%)",
			highlight: "radial-gradient(circle at 75% 80%, rgba(220,150,120,0.07) 0%, transparent 35%)",
			glow: "radial-gradient(ellipse 80% 30% at 70% 95%, rgba(160,70,50,0.06) 0%, transparent 50%)",
		},
		fog: {
			base: "radial-gradient(ellipse 120% 100% at 70% 85%, #140a14 0%, #180c18 20%, #120a1c 50%, #0a0812 80%, #060610 100%)",
			atmosphere: "radial-gradient(ellipse 120% 80% at 65% 70%, rgba(120,70,60,0.15) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 65% 65%, rgba(180,120,100,0.06) 0%, transparent 45%)",
			glow: "radial-gradient(ellipse 90% 35% at 65% 95%, rgba(120,50,35,0.08) 0%, transparent 50%)",
		},
		storm: {
			base: "radial-gradient(ellipse 120% 100% at 70% 90%, #0e060c 0%, #120810 20%, #0e0616 50%, #06040e 80%, #040408 100%)",
			atmosphere: "radial-gradient(ellipse 100% 70% at 60% 80%, rgba(70,30,40,0.2) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 55% 75%, rgba(120,50,60,0.06) 0%, transparent 50%)",
			glow: "radial-gradient(ellipse 90% 35% at 65% 95%, rgba(80,25,20,0.1) 0%, transparent 50%)",
		},
	},
	evening: {
		clear: {
			base: "radial-gradient(ellipse 120% 100% at 50% 20%, #0a0e24 0%, #080c1e 30%, #060818 60%, #040610 100%)",
			atmosphere: "radial-gradient(ellipse 90% 50% at 40% 15%, rgba(50,70,130,0.12) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 60% 10%, rgba(140,170,230,0.06) 0%, transparent 35%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(8,10,28,0.7) 0%, transparent 55%)",
		},
		cloudy: {
			base: "radial-gradient(ellipse 120% 100% at 50% 20%, #0a0c1e 0%, #080a18 30%, #060814 60%, #04060e 100%)",
			atmosphere: "radial-gradient(ellipse 100% 60% at 45% 25%, rgba(35,45,80,0.16) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 50% 15%, rgba(100,120,170,0.05) 0%, transparent 40%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(6,8,20,0.8) 0%, transparent 55%)",
		},
		rain: {
			base: "radial-gradient(ellipse 120% 100% at 50% 20%, #080a18 0%, #060a14 30%, #050810 60%, #03060c 100%)",
			atmosphere: "radial-gradient(ellipse 110% 70% at 50% 35%, rgba(25,35,65,0.2) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 45% 25%, rgba(60,80,120,0.05) 0%, transparent 45%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(4,6,16,0.85) 0%, transparent 55%)",
		},
		snow: {
			base: "radial-gradient(ellipse 120% 100% at 50% 20%, #0c1026 0%, #0a0e20 30%, #080a1a 60%, #060812 100%)",
			atmosphere: "radial-gradient(ellipse 90% 55% at 45% 20%, rgba(55,70,120,0.14) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 55% 12%, rgba(150,170,210,0.06) 0%, transparent 35%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(8,10,24,0.7) 0%, transparent 55%)",
		},
		fog: {
			base: "radial-gradient(ellipse 120% 100% at 50% 25%, #0a0e1e 0%, #0a0c1a 30%, #080a16 60%, #060810 100%)",
			atmosphere: "radial-gradient(ellipse 120% 80% at 50% 45%, rgba(40,55,90,0.18) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 50% 35%, rgba(90,110,160,0.06) 0%, transparent 45%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(6,8,20,0.8) 0%, transparent 55%)",
		},
		storm: {
			base: "radial-gradient(ellipse 120% 100% at 50% 20%, #060810 0%, #04060c 30%, #030508 60%, #020408 100%)",
			atmosphere: "radial-gradient(ellipse 100% 70% at 50% 35%, rgba(18,22,50,0.28) 0%, transparent 70%)",
			highlight: "radial-gradient(circle at 40% 25%, rgba(70,55,110,0.06) 0%, transparent 50%)",
			glow: "radial-gradient(circle at 50% 100%, rgba(3,4,10,0.9) 0%, transparent 55%)",
		},
	},
} as const;

// ---------------------------------------------------------------------------
// Stars layer for clear night/evening/dawn skies
// ---------------------------------------------------------------------------

function buildStarsLayer(time: TimeOfDay, weather: WeatherBucket): string {
	const showStars =
		weather === "clear" &&
		(time === "night" || time === "evening" || time === "dawn");

	if (!showStars) return "";

	// Use radial-gradient dots to simulate stars
	const stars: string[] = [];
	// Deterministic pseudo-random based on simple seed
	for (let i = 0; i < 60; i++) {
		const x = ((i * 137 + 43) % 100).toFixed(1);
		const y = ((i * 89 + 17) % 100).toFixed(1);
		const size = i % 3 === 0 ? 1.5 : 1;
		const opacity = 0.3 + (i % 5) * 0.1;
		stars.push(
			`radial-gradient(circle ${size}px at ${x}% ${y}%, rgba(200,210,255,${opacity}) 0%, transparent 100%)`
		);
	}
	return stars.join(", ");
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getBackgroundStyles(
	time: TimeOfDay,
	weather: WeatherBucket
): CSSProperties {
	const palette = PALETTES[time][weather];
	const stars = buildStarsLayer(time, weather);

	const layers = [
		palette.glow,
		palette.highlight,
		palette.atmosphere,
		stars,
		palette.base,
	].filter(Boolean);

	return {
		background: layers.join(", "),
	};
}

export function getBackgroundKey(time: TimeOfDay, weather: WeatherBucket): string {
	return `${time}-${weather}`;
}
