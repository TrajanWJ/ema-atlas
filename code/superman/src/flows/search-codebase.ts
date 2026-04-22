import type { IntentStatus } from '../types.js';

interface DetectedAction {
  id: string;
  label: string;
  description: string;
  status: IntentStatus;
  codeIds: string[];
}

interface DetectedFlow {
  id: string;
  label: string;
  description: string;
  status: IntentStatus;
  codeIds: string[];
  actions: DetectedAction[];
}

export const searchCodebaseFlow: DetectedFlow = {
  id: 'flow-search-codebase',
  label: 'Search Codebase',
  description: 'Search and navigate the codebase using the knowledge graph',
  status: 'complete',
  codeIds: [],
  actions: [
    {
      id: 'action-search-query',
      label: 'Enter Search Query',
      description: 'User provides a search term or question about the codebase',
      status: 'complete',
      codeIds: [],
    },
    {
      id: 'action-search-results',
      label: 'View Results',
      description: 'System returns matching nodes, files, and connections from the knowledge graph',
      status: 'complete',
      codeIds: [],
    },
  ],
};
