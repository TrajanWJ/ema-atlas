interface WeatherResponse {
	temp: number;
	unit: string;
	description: string;
	icon: string;
	weatherCode: number;
}

interface OpenMeteoResponse {
	current: {
		temperature_2m: number;
		weather_code: number;
	};
}

const WEATHER_CODE_MAP: Record<number, { emoji: string; description: string }> = {
	0: { emoji: "☀️", description: "Clear sky" },
	1: { emoji: "⛅", description: "Mostly clear" },
	2: { emoji: "⛅", description: "Partly cloudy" },
	3: { emoji: "⛅", description: "Overcast" },
	45: { emoji: "🌫", description: "Foggy" },
	48: { emoji: "🌫", description: "Depositing rime fog" },
	51: { emoji: "🌧", description: "Light drizzle" },
	53: { emoji: "🌧", description: "Moderate drizzle" },
	55: { emoji: "🌧", description: "Dense drizzle" },
	61: { emoji: "🌧", description: "Slight rain" },
	63: { emoji: "🌧", description: "Moderate rain" },
	65: { emoji: "🌧", description: "Heavy rain" },
	71: { emoji: "❄️", description: "Slight snow" },
	73: { emoji: "❄️", description: "Moderate snow" },
	75: { emoji: "❄️", description: "Heavy snow" },
	77: { emoji: "❄️", description: "Snow grains" },
	80: { emoji: "🌦", description: "Slight rain showers" },
	81: { emoji: "🌦", description: "Moderate rain showers" },
	82: { emoji: "🌦", description: "Violent rain showers" },
	85: { emoji: "🌦", description: "Slight snow showers" },
	86: { emoji: "🌦", description: "Heavy snow showers" },
	95: { emoji: "⛈", description: "Thunderstorm" },
	96: { emoji: "⛈", description: "Thunderstorm with hail" },
	99: { emoji: "⛈", description: "Thunderstorm with heavy hail" },
};

let cachedData: (WeatherResponse & { timestamp: number }) | null = null;
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export async function fetchWeather(
	lat: number,
	lon: number
): Promise<WeatherResponse | null> {
	// Check cache
	if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION_MS) {
		return {
			temp: cachedData.temp,
			unit: cachedData.unit,
			description: cachedData.description,
			icon: cachedData.icon,
			weatherCode: cachedData.weatherCode,
		};
	}

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

		const response = await fetch(
			`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`,
			{ signal: controller.signal }
		);

		clearTimeout(timeoutId);

		if (!response.ok) {
			return null;
		}

		const data: OpenMeteoResponse = await response.json();

		const weatherCode = data.current.weather_code;
		const mapping =
			WEATHER_CODE_MAP[weatherCode] || { emoji: "🌡", description: "Unknown" };

		const result: WeatherResponse & { timestamp: number } = {
			temp: Math.round(data.current.temperature_2m),
			unit: "°F",
			description: mapping.description,
			icon: mapping.emoji,
			weatherCode,
			timestamp: Date.now(),
		};

		cachedData = result;
		return result;
	} catch (error) {
		return null;
	}
}
