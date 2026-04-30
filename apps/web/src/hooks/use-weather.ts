'use client';

import { useEffect, useState } from 'react';
import { fetchWeather } from '@/src/lib/weather';

interface WeatherData {
	temp: number;
	description: string;
	icon: string;
	weatherCode: number;
	loading: boolean;
	error: boolean;
}

const DEFAULT_STATE: WeatherData = {
	temp: 0,
	description: '',
	icon: '',
	weatherCode: 0,
	loading: true,
	error: false,
};

export function useWeather(): WeatherData {
	const [weather, setWeather] = useState<WeatherData>(DEFAULT_STATE);

	useEffect(() => {
		let isMounted = true;
		let refreshInterval: NodeJS.Timeout | null = null;

		async function getWeather() {
			if (!navigator.geolocation) {
				if (isMounted) {
					setWeather((prev) => ({
						...prev,
						loading: false,
						error: true,
					}));
				}
				return;
			}

			navigator.geolocation.getCurrentPosition(
				async (position) => {
					const { latitude, longitude } = position.coords;
					const result = await fetchWeather(latitude, longitude);

					if (isMounted) {
						if (result) {
							setWeather({
								temp: result.temp,
								description: result.description,
								icon: result.icon,
								weatherCode: result.weatherCode,
								loading: false,
								error: false,
							});
						} else {
							setWeather((prev) => ({
								...prev,
								loading: false,
								error: true,
							}));
						}
					}
				},
				() => {
					if (isMounted) {
						setWeather((prev) => ({
							...prev,
							loading: false,
							error: true,
						}));
					}
				}
			);
		}

		getWeather();

		// Refresh every 30 minutes
		refreshInterval = setInterval(getWeather, 30 * 60 * 1000);

		return () => {
			isMounted = false;
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
		};
	}, []);

	return weather;
}
