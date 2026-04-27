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

export interface PayoutSentProps {
  talentFirstName: string;
  amount: number;
  currency: string;
  destinationLast4: string;
  expectedArrival: string;
  engagementTitle: string;
  ledgerUrl: string;
}

export const subject = "Payout is on its way";

export const sampleProps: PayoutSentProps = {
  talentFirstName: "Dana",
  amount: 4162.5,
  currency: "USD",
  destinationLast4: "8841",
  expectedArrival: "2026-04-24",
  engagementTitle: "Senior Ops Lead — Q3 readiness",
  ledgerUrl: "https://autharis.com/talent/earnings",
};

export default function PayoutSent(props: PayoutSentProps = sampleProps) {
  const { talentFirstName, amount, currency, destinationLast4, expectedArrival, engagementTitle, ledgerUrl } =
    props;
  return (
    <Layout preview={`Payout of ${currency} ${amount.toFixed(2)} is on its way`}>
      <Heading>
        Payout of {currency} {amount.toFixed(2)} is on its way
      </Heading>
      <Paragraph>Hi {talentFirstName},</Paragraph>
      <Paragraph>
        Your payout for <strong>{engagementTitle}</strong> has been initiated. Most banks land funds
        within 1–2 business days.
      </Paragraph>
      <Divider />
      <Section>
        <KeyValue label="Amount" value={`${currency} ${amount.toFixed(2)}`} />
        <KeyValue label="Destination" value={`•••• ${destinationLast4}`} />
        <KeyValue label="Expected arrival" value={expectedArrival} />
      </Section>
      <Divider />
      <CTA href={ledgerUrl} label="Open earnings ledger" />
      <Muted>Didn't expect this payout? Reply and we'll investigate immediately.</Muted>
    </Layout>
  );
}
