import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { Button, Dialog } from '@autharis/ui';

function DialogDemo() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        labelledBy="demo-title"
        describedBy="demo-desc"
      >
        <div style={{ padding: 24, maxWidth: 420 }}>
          <h2
            id="demo-title"
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-xl)',
              color: 'var(--ink)',
            }}
          >
            Confirm action
          </h2>
          <p
            id="demo-desc"
            style={{
              marginTop: 8,
              color: 'var(--ink-3)',
              fontSize: 'var(--fs-sm)',
            }}
          >
            This is a sample dialog with focus trap, Esc close, and backdrop close.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setOpen(false)}>
              Confirm
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}

const meta: Meta<typeof Dialog> = {
  title: 'Primitives/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const TriggerAndContent: Story = {
  render: () => <DialogDemo />,
};
