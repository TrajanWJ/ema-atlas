import type { Meta, StoryObj } from '@storybook/react';
import { Pill, Icon } from '@autharis/ui';

const meta: Meta<typeof Pill> = {
  title: 'Primitives/Pill',
  component: Pill,
  tags: ['autodocs'],
  argTypes: {
    removable: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Pill>;

export const Plain: Story = {
  args: { children: 'React' },
};

export const Removable: Story = {
  args: { children: 'Typescript', removable: true },
};

export const WithLeading: Story = {
  args: {
    children: 'Search',
    leading: <Icon name="search" size={12} />,
  },
};

export const RemovableWithLeading: Story = {
  args: {
    children: 'Filter',
    leading: <Icon name="filter" size={12} />,
    removable: true,
  },
};
