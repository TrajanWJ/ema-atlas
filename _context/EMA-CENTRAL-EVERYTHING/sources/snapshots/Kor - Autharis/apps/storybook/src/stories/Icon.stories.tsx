import type { Meta, StoryObj } from '@storybook/react';
import { Icon, ICON_NAMES } from '@autharis/ui';

const meta: Meta<typeof Icon> = {
  title: 'Primitives/Icon',
  component: Icon,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'select', options: [...ICON_NAMES] },
    size: { control: { type: 'range', min: 12, max: 64, step: 2 } },
    strokeWidth: { control: { type: 'range', min: 1, max: 3, step: 0.25 } },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Single: Story = {
  args: {
    name: 'arrow',
    size: 24,
  },
};

export const Gallery: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 20,
        padding: 20,
        color: 'var(--ink)',
      }}
    >
      {ICON_NAMES.map((name) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            padding: 12,
            border: '1px solid var(--line)',
            borderRadius: 'var(--r-md)',
            background: 'var(--bg-raised)',
          }}
        >
          <Icon name={name} size={24} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            {name}
          </span>
        </div>
      ))}
    </div>
  ),
};
