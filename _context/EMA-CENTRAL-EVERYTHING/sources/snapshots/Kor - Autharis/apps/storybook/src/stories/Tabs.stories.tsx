import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { Tabs } from '@autharis/ui';

function ThreePanels() {
  const [value, setValue] = React.useState('overview');
  return (
    <div style={{ width: 520 }}>
      <Tabs value={value} onValueChange={setValue}>
        <Tabs.List ariaLabel="Project sections">
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
          <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Panel value="overview">
          <p style={{ color: 'var(--ink-2)' }}>
            High-level summary of the engagement. Use arrow keys to navigate tabs.
          </p>
        </Tabs.Panel>
        <Tabs.Panel value="activity">
          <p style={{ color: 'var(--ink-2)' }}>
            Recent events, timesheet submissions, and disputes.
          </p>
        </Tabs.Panel>
        <Tabs.Panel value="settings">
          <p style={{ color: 'var(--ink-2)' }}>
            Scope, billing, and notification preferences.
          </p>
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

const meta: Meta<typeof Tabs> = {
  title: 'Primitives/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const ThreePanelsStory: Story = {
  name: 'Three panels',
  render: () => <ThreePanels />,
};
