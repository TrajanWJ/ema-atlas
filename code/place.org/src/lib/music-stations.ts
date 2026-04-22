export const STATIONS = [
	{ name: 'Lofi Girl', url: 'https://play.streamafrica.net/lofiradio', color: '#5b9cf5' },
	{ name: 'ChillHop', url: 'https://streams.fluxfm.de/Chillhop/mp3-128/audio/', color: '#38c97a' },
	{ name: 'Jazz Radio', url: 'https://streaming.radio.co/s774887f7b/listen', color: '#e8a84c' },
] as const;

export type Station = (typeof STATIONS)[number];
