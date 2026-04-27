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

export interface TimesheetApprovedProps {
  talentFirstName: string;
  engagementTitle: string;
  weekEnding: string;
  hours: number;
  amount: number;
  currency: string;
  expectedPayoutDate: string;
  detailUrl: string;
}

export const subject = "Your hours were approved";

export const sampleProps: TimesheetApprovedProps = {
  talentFirstName: "Dana",
  engagementTitle: "Senior Ops Lead — Q3 readiness",
  weekEnding: "2026-04-19",
  hours: 22.5,
  amount: 4162.5,
  currency: "USD",
  expectedPayoutDate: "2026-04-26",
  detailUrl: "https://autharis.com/talent/earnings/TS-9142",
};

export default function TimesheetApproved(props: TimesheetApprovedProps = sampleProps) {
  const {
    talentFirstName,
    engagementTitle,
    weekEnding,
    hours,
    amount,
    currency,
    expectedPayoutDate,
    detailUrl,
  } = props;
  return (
    <Layout preview={`Approved: ${hours}h on ${engagementTitle} — paying ${expectedPayoutDate}`}>
      <Heading>Your hours were approved</Heading>
      <Paragraph>Hi {talentFirstName},</Paragraph>
      <Paragraph>
        Your client approved the week of <strong>{weekEnding}</strong> on{" "}
        <strong>{engagementTitle}</strong>. Payout will be initiated on your standard schedule.
      </Paragraph>
      <Divider />
      <Section>
        <KeyValue label="Hours" value={`${hours.toFixed(1)} h`} />
        <KeyValue label="Amount" value={`${currency} ${amount.toFixed(2)}`} />
        <KeyValue label="Expected payout" value={expectedPayoutDate} />
      </Section>
      <Divider />
      <CTA href={detailUrl} label="See earnings detail" />
      <Muted>Questions about the adjustment, if any? Reply to this email — we read every one.</Muted>
    </Layout>
  );
}
