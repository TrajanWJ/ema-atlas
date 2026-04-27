import type { Meta, StoryObj } from '@storybook/react';
import { Badge, type BadgeVariant } from '@autharis/ui';

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['default', 'success', 'warning', 'danger', 'info'],
    },
    dot: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

const VARIANTS: BadgeVariant[] = ['default', 'success', 'warning', 'danger', 'info'];

export const Default: Story = {
  args: { variant: 'default', children: 'Default' },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {VARIANTS.map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
};

export const WithDot: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {VARIANTS.map((variant) => (
        <Badge key={variant} variant={variant} dot>
          {variant}
        </Badge>
      ))}
    </div>
  ),
};
