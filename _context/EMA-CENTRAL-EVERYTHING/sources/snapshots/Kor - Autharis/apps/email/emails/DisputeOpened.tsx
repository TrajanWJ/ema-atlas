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
  tokens,
} from "./_components/Layout.js";

export interface DisputeOpenedProps {
  recipientFirstName: string;
  engagementId: string;
  engagementTitle: string;
  openedByRole: "client" | "talent";
  reason: string;
  respondByDate: string;
  caseUrl: string;
}

export const subject = "A dispute was opened on your engagement";

export const sampleProps: DisputeOpenedProps = {
  recipientFirstName: "Mira",
  engagementId: "ENG-2026-0412",
  engagementTitle: "Senior Ops Lead — Q3 readiness",
  openedByRole: "talent",
  reason: "Scope discrepancy on week ending 2026-04-19",
  respondByDate: "2026-04-25",
  caseUrl: "https://autharis.com/disputes/ENG-2026-0412",
};

export default function DisputeOpened(props: DisputeOpenedProps = sampleProps) {
  const { recipientFirstName, engagementId, engagementTitle, openedByRole, reason, respondByDate, caseUrl } =
    props;
  return (
    <Layout preview={`A dispute was opened on engagement ${engagementId}`}>
      <Heading>A dispute was opened on engagement {engagementId}</Heading>
      <Paragraph>Hi {recipientFirstName},</Paragraph>
      <Paragraph>
        The {openedByRole} on <strong>{engagementTitle}</strong> opened a dispute. An Autharis
        mediator is already assigned; please add your side by{" "}
        <strong style={{ color: tokens.neg }}>{respondByDate}</strong> so we can resolve it quickly.
      </Paragraph>
      <Divider />
      <Section>
        <KeyValue label="Engagement" value={`${engagementTitle} · ${engagementId}`} />
        <KeyValue label="Opened by" value={openedByRole === "client" ? "Client" : "Talent"} />
        <KeyValue label="Reason" value={reason} />
        <KeyValue label="Respond by" value={respondByDate} />
      </Section>
      <Divider />
      <CTA href={caseUrl} label="Open dispute case" />
      <Muted>
        Funds for any disputed period are held in escrow until the case resolves. Approved periods
        remain on their normal payout schedule.
      </Muted>
    </Layout>
  );
}
