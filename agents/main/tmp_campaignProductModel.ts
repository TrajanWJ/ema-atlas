import type { ComplianceDecisionStatus, InviteRoute, VisibilityMode } from './contracts';

export type CampaignMode =
  | 'public_marketplace'
  | 'private_invite'
  | 'hybrid_shortlist'
  | 'agent_routed';

export type OperatorCampaignStatus =
  | 'draft'
  | 'targeting_ready'
  | 'matching_ready'
  | 'sourcing_live'
  | 'shortlisting'
  | 'negotiating'
  | 'contracting'
  | 'live'
  | 'completed'
  | 'archived';

export type RecommendationBucket =
  | 'priority_invite'
  | 'strong_fit'
  | 'discovery_fit'
  | 'watchlist'
  | 'manual_review';

export type RecommendedAction =
  | 'invite_now'
  | 'send_to_agent'
  | 'shortlist'
  | 'keep_public'
  | 'watch'
  | 'manual_review';

export type InviteLifecycleState =
  | 'draft'
  | 'queued'
  | 'sent'
  | 'viewed'
  | 'interested'
  | 'declined'
  | 'expired'
  | 'withdrawn'
  | 'converted_to_deal';

export type CandidatePipelineStage =
  | 'recommended'
  | 'shortlisted'
  | 'invited'
  | 'responded'
  | 'negotiating'
  | 'deal_created'
  | 'contracted'
  | 'live'
  | 'completed'
  | 'lost';

export interface RecommendationProfile {
  bucket: RecommendationBucket;
  recommendedAction: RecommendedAction;
  visibilityMode: VisibilityMode;
  route: InviteRoute;
  explanationSummary: string;
}

export interface DemoChoreographyHint {
  label: string;
  narrative: string;
  recommendedScreens: string[];
}

export function deriveCampaignMode(input: {
  visibilityMode: VisibilityMode;
  requiresAgentRouting?: boolean;
}): CampaignMode {
  if (input.requiresAgentRouting) return 'agent_routed';
  if (input.visibilityMode === 'public') return 'public_marketplace';
  if (input.visibilityMode === 'hybrid') return 'hybrid_shortlist';
  return 'private_invite';
}

export function deriveRecommendationProfile(input: {
  score: number;
  complianceStatus: ComplianceDecisionStatus;
  route: InviteRoute;
}): RecommendationProfile {
  if (
    input.complianceStatus === 'deny' ||
    input.complianceStatus === 'hold_for_manual_review'
  ) {
    return {
      bucket: 'manual_review',
      recommendedAction: 'manual_review',
      visibilityMode: 'private',
      route: 'manual_review',
      explanationSummary:
        'Strong candidate signals may exist, but compliance posture requires human review before exposure or outreach.',
    };
  }

  if (input.route === 'agent_routed') {
    return {
      bucket: input.score >= 85 ? 'priority_invite' : 'strong_fit',
      recommendedAction: 'send_to_agent',
      visibilityMode: 'hybrid',
      route: 'agent_routed',
      explanationSummary:
        'This candidate looks strong enough for concierge-style outreach through representation.',
    };
  }

  if (input.score >= 90 || input.route === 'private_invite') {
    return {
      bucket: 'priority_invite',
      recommendedAction: 'invite_now',
      visibilityMode: 'private',
      route: 'private_invite',
      explanationSummary:
        'High match strength and clean compliance posture make this candidate ready for direct outreach now.',
    };
  }

  if (input.score >= 75) {
    return {
      bucket: 'strong_fit',
      recommendedAction: 'shortlist',
      visibilityMode: 'hybrid',
      route: 'public_feed',
      explanationSummary:
        'This candidate is a strong fit and should be shortlisted or invited depending on roster depth and urgency.',
    };
  }

  if (input.score >= 55) {
    return {
      bucket: 'discovery_fit',
      recommendedAction: 'keep_public',
      visibilityMode: 'public',
      route: 'public_feed',
      explanationSummary:
        'This candidate belongs in the discovery pool and can still convert through inbound interest or later promotion.',
    };
  }

  return {
    bucket: 'watchlist',
    recommendedAction: 'watch',
    visibilityMode: 'public',
    route: 'public_feed',
    explanationSummary:
      'Not a lead recommendation yet, but worth retaining as depth if campaign constraints widen.',
  };
}

export function getDemoChoreographyHints(mode: CampaignMode): DemoChoreographyHint[] {
  switch (mode) {
    case 'public_marketplace':
      return [
        {
          label: 'Show discovery breadth',
          narrative:
            'Open the marketplace view first, then pivot into ranked candidates to prove the platform is not just a static listing board.',
          recommendedScreens: ['Campaigns', 'CampaignDetail', 'Discover'],
        },
      ];
    case 'private_invite':
      return [
        {
          label: 'Show concierge control',
          narrative:
            'Lead with the ranked shortlist and invite workspace to tell a premium, stealth, operator-led story.',
          recommendedScreens: ['CampaignDetail', 'CandidateCompare', 'InviteWorkspace'],
        },
      ];
    case 'agent_routed':
      return [
        {
          label: 'Show representation-aware routing',
          narrative:
            'Demonstrate that outreach can go through agents first without breaking the workflow into a manual side channel.',
          recommendedScreens: ['CampaignDetail', 'InviteWorkspace', 'DealWorkroom'],
        },
      ];
    case 'hybrid_shortlist':
    default:
      return [
        {
          label: 'Show both market and concierge motions',
          narrative:
            'Use hybrid campaigns to compare inbound discovery with direct invites and explain why the top candidates were prioritized.',
          recommendedScreens: ['CampaignDetail', 'CandidateCompare', 'MatchExplain'],
        },
      ];
  }
}
