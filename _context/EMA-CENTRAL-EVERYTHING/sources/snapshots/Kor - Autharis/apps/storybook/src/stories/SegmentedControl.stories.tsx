import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { SegmentedControl } from '@autharis/ui';

type Density = 'comfortable' | 'compact' | 'dense';

const OPTIONS: { value: Density; label: string }[] = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
  { value: 'dense', label: 'Dense' },
];

function Controlled({ fullWidth = false }: { fullWidth?: boolean }) {
  const [value, setValue] = React.useState<Density>('comfortable');
  return (
    <div style={{ width: fullWidth ? 480 : undefined }}>
      <SegmentedControl
        ariaLabel="Density"
        value={value}
        options={OPTIONS}
        onValueChange={setValue}
        fullWidth={fullWidth}
      />
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>
        Current: {value}
      </p>
    </div>
  );
}

const meta: Meta<typeof SegmentedControl> = {
  title: 'Primitives/SegmentedControl',
  component: SegmentedControl,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

export const ThreeOptions: Story = {
  render: () => <Controlled />,
};

export const FullWidth: Story = {
  render: () => <Controlled fullWidth />,
};
