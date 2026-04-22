/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0F',
        surface: '#111118',
        card: '#16161F',
        border: 'rgba(255,255,255,0.07)',
        cyan: '#00E5FF',
        violet: '#7B2FFF',
        success: '#00C851',
        warning: '#FFB800',
        danger: '#FF3D6B',
        muted: '#8A8A9A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
