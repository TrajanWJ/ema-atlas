import type { Meta, StoryObj } from '@storybook/react';
import { Button, type ButtonVariant, type ButtonSize } from '@autharis/ui';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost'];
const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];

export const Primary: Story = {
  args: { variant: 'primary', size: 'md', children: 'Continue' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', size: 'md', children: 'Cancel' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', size: 'md', children: 'Skip' },
};

export const Matrix: Story = {
  render: () => (
    <table style={{ borderCollapse: 'collapse', color: 'var(--ink)' }}>
      <thead>
        <tr>
          <th style={{ padding: 8, textAlign: 'left' }} />
          {SIZES.map((s) => (
            <th
              key={s}
              style={{
                padding: 8,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--ink-3)',
              }}
            >
              {s}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {VARIANTS.map((variant) => (
          <tr key={variant}>
            <th
              style={{
                padding: 8,
                textAlign: 'left',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--ink-3)',
              }}
            >
              {variant}
            </th>
            {SIZES.map((size) => (
              <td key={size} style={{ padding: 10 }}>
                <Button variant={variant} size={size}>
                  Button
                </Button>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
};
