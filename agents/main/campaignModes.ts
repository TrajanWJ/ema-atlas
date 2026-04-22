import type { VisibilityMode } from './src-domain-contracts-placeholder';

export type CampaignType =
  | 'public_marketplace'
  | 'private_invite'
  | 'hybrid_shortlist'
  | 'agent_routed';

export interface CampaignTypeDescriptor {
  id: CampaignType;
  label: string;
  visibility: VisibilityMode;
  summary: string;
  bestFor: string;
  routeCopy: string;
}

export const CAMPAIGN_TYPE_DESCRIPTORS: CampaignTypeDescriptor[] = [
  {
    id: 'public_marketplace',
    label: 'Public Marketplace',
    visibility: 'public',
    summary: 'Open discovery for eligible athletes and agents.',
    bestFor: 'Awareness, broad sourcing, seasonal pushes.',
    routeCopy: 'Athletes can discover and express interest directly.',
  },
  {
    id: 'private_invite',
    label: 'Private Invite',
    visibility: 'private',
    summary: 'Stealth shortlist routed only to selected recipients.',
    bestFor: 'Premium launches, exclusives, renewals.',
    routeCopy: 'Use when the brand already knows the target roster.',
  },
  {
    id: 'hybrid_shortlist',
    label: 'Hybrid Shortlist',
    visibility: 'hybrid',
    summary: 'Open a constrained feed while also sending priority invites.',
    bestFor: 'Launches with urgency and active discovery.',
    routeCopy: 'Best default when you want both inbound discovery and direct outreach.',
  },
  {
    id: 'agent_routed',
    label: 'Agent Routed',
    visibility: 'private',
    summary: 'Route the opportunity to representation first, then open athlete access if needed.',
    bestFor: 'Larger budgets and represented-talent workflows.',
    routeCopy: 'Keeps negotiation controlled and representation-aware.',
  },
];

export function getCampaignTypeDescriptor(type: CampaignType): CampaignTypeDescriptor {
  return (
    CAMPAIGN_TYPE_DESCRIPTORS.find((item) => item.id === type) ?? CAMPAIGN_TYPE_DESCRIPTORS[0]
  );
}
