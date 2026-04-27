import * as React from "react";
import { Section, Text } from "@react-email/components";
import {
  CTA,
  Divider,
  Heading,
  KeyValue,
  Layout,
  Muted,
  Paragraph,
  layoutStyles,
  tokens,
} from "./_components/Layout.js";

export interface MatchFoundProps {
  clientFirstName: string;
  jobTitle: string;
  jobId: string;
  talentName: string;
  talentHeadline: string;
  matchScore: number;
  hourlyRate: number;
  currency: string;
  reviewUrl: string;
}

export const subject = "New match for your job request";

export const sampleProps: MatchFoundProps = {
  clientFirstName: "Mira",
  jobTitle: "Senior Ops Lead — Q3 readiness",
  jobId: "JR-2841",
  talentName: "Dana Okafor",
  talentHeadline: "Ex-Stripe Ops, 8y scaling late-stage fintech",
  matchScore: 92,
  hourlyRate: 185,
  currency: "USD",
  reviewUrl: "https://autharis.com/client/matches/JR-2841",
};

export default function MatchFound(props: MatchFoundProps = sampleProps) {
  const {
    clientFirstName,
    jobTitle,
    jobId,
    talentName,
    talentHeadline,
    matchScore,
    hourlyRate,
    currency,
    reviewUrl,
  } = props;
  return (
    <Layout preview={`${talentName} matched ${matchScore}% to ${jobTitle}`}>
      <Heading>New match for your job request</Heading>
      <Paragraph>Hi {clientFirstName},</Paragraph>
      <Paragraph>
        We found a strong match for <strong>{jobTitle}</strong> ({jobId}). Review the profile and
        send a first message — most engagements kick off within 48 hours of a reply.
      </Paragraph>
      <Divider />
      <Section>
        <KeyValue label="Talent" value={talentName} />
        <KeyValue label="Headline" value={talentHeadline} />
        <KeyValue label="Match score" value={`${matchScore}%`} />
        <KeyValue label="Rate" value={`${currency} ${hourlyRate}/hr`} />
      </Section>
      <Divider />
      <CTA href={reviewUrl} label="Review match" />
      <Muted>
        Not a fit? <a href={reviewUrl} style={{ color: tokens.ink3 }}>Decline this match</a> and
        we'll keep searching.
      </Muted>
      <Text style={layoutStyles.muted}>— The Autharis team</Text>
    </Layout>
  );
}
