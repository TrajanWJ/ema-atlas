import type { Meta, StoryObj } from '@storybook/react';
import { Wordmark } from '@autharis/ui';

const meta: Meta<typeof Wordmark> = {
  title: 'Primitives/Wordmark',
  component: Wordmark,
  tags: ['autodocs'],
  argTypes: {
    scale: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Wordmark>;

export const Default: Story = {
  args: {
    scale: 'md',
  },
};

export const WithKicker: Story = {
  args: {
    scale: 'md',
    kicker: 'Catalog',
  },
};

export const AllScales: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <Wordmark scale="sm" />
      <Wordmark scale="md" />
      <Wordmark scale="lg" />
    </div>
  ),
};
