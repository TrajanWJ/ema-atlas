import type { Preview, Decorator } from '@storybook/react';
import '@autharis/tokens/tokens.css';
import '@autharis/ui/styles.css';

// Seven swatches drawn from the Autharis token palette.
const ACCENT_SWATCHES: Record<string, string> = {
  terra: '#E8552B',
  lime: '#D4F755',
  moss: '#5C8F3A',
  sky: '#4B8FC9',
  rose: '#F2B5A0',
  ink: '#0A0A0B',
  cream: '#EDEBE0',
};

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string) ?? 'light';
  const accentKey = (context.globals.accent as string) ?? 'terra';
  const accent = ACCENT_SWATCHES[accentKey] ?? ACCENT_SWATCHES.terra;

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.setProperty('--accent', accent);
    // Pick readable ink on lighter accents.
    const lightAccents = new Set(['lime', 'cream', 'rose']);
    root.style.setProperty(
      '--accent-ink',
      lightAccents.has(accentKey) ? '#0A0A0B' : '#FFFFFF',
    );
    root.style.setProperty('--accent-text', accent);
  }

  return Story();
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: { disable: true },
    layout: 'centered',
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Light or dark surface',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
    accent: {
      name: 'Accent',
      description: 'Accent swatch',
      defaultValue: 'terra',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'terra', title: 'Terra' },
          { value: 'lime', title: 'Lime' },
          { value: 'moss', title: 'Moss' },
          { value: 'sky', title: 'Sky' },
          { value: 'rose', title: 'Rose' },
          { value: 'ink', title: 'Ink' },
          { value: 'cream', title: 'Cream' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [withTheme],
};

export default preview;
