import type { Tab } from '@contracts/tabs';
import type { PageManifest, NavNode } from '@contracts/manifests';
import type { SessionMessage } from '@contracts/messages';
import { initialNavTree } from '@contracts/manifests';

export const INITIAL_TABS: Tab[] = [
  {
    id: 'tab-em',
    kind: 'session',
    title: 'Executive Management',
    linkedAgentId: 'agent-em',
    revision: 0,
  },
  {
    id: 'tab-md',
    kind: 'session',
    title: 'Meta-Development',
    linkedAgentId: 'agent-md',
    revision: 0,
  },
];

export const INITIAL_MANIFESTS: PageManifest[] = [
  {
    id: 'page-blank-a',
    version: 1,
    title: 'Blank Page A',
    layout: 'single-column',
    root: {
      id: 'root-a',
      componentId: 'text-element',
      props: {
        content: 'This page is empty. An agent can propose content here.',
      },
    },
  },
];

export const INITIAL_NAV_TREE: NavNode[] = initialNavTree;

export const WELCOME_MESSAGE: SessionMessage = {
  id: 'msg-welcome',
  timestamp: Date.now(),
  sender: 'Executive Management',
  token: '>',
  blocks: [
    {
      type: 'narrative',
      content:
        'Welcome to ExecuDeck. I am your Executive Management agent — your governor for high-level reasoning, planning, and agent orchestration.',
    },
    {
      type: 'status',
      content: 'System initialized. Two anchor tabs active: [EM] and [MD].',
    },
    {
      type: 'hint',
      content:
        'Type a command or describe what you need. Use /help for available commands.',
    },
  ],
};

export const INITIAL_ACTIVE_TAB_ID = 'tab-em';
