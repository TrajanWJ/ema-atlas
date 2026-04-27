import * as React from "react";
import { Section } from "@react-email/components";
import {
  CTA,
  Divider,
  Heading,
  KeyValue,
  Layout,
  Muted,
  Paragraph,
} from "./_components/Layout.js";

export interface TimesheetSubmittedProps {
  clientFirstName: string;
  talentName: string;
  engagementTitle: string;
  weekEnding: string; // ISO date
  hours: number;
  amount: number;
  currency: string;
  reviewUrl: string;
}

export const subject = "Talent submitted hours for your review";

export const sampleProps: TimesheetSubmittedProps = {
  clientFirstName: "Mira",
  talentName: "Dana Okafor",
  engagementTitle: "Senior Ops Lead — Q3 readiness",
  weekEnding: "2026-04-19",
  hours: 22.5,
  amount: 4162.5,
  currency: "USD",
  reviewUrl: "https://autharis.com/client/timesheets/TS-9142",
};

export default function TimesheetSubmitted(props: TimesheetSubmittedProps = sampleProps) {
  const { clientFirstName, talentName, engagementTitle, weekEnding, hours, amount, currency, reviewUrl } =
    props;
  return (
    <Layout preview={`${talentName} submitted ${hours}h for week ending ${weekEnding}`}>
      <Heading>Hours ready for review</Heading>
      <Paragraph>Hi {clientFirstName},</Paragraph>
      <Paragraph>
        <strong>{talentName}</strong> submitted a timesheet for <strong>{engagementTitle}</strong>.
        Review and approve within 72 hours to stay on your standard payout schedule.
      </Paragraph>
      <Divider />
      <Section>
        <KeyValue label="Week ending" value={weekEnding} />
        <KeyValue label="Hours" value={`${hours.toFixed(1)} h`} />
        <KeyValue label="Amount" value={`${currency} ${amount.toFixed(2)}`} />
      </Section>
      <Divider />
      <CTA href={reviewUrl} label="Review timesheet" />
      <Muted>Auto-approves in 72 hours if no action is taken.</Muted>
    </Layout>
  );
}
