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

export interface InvoicePaidProps {
  clientFirstName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  paidOn: string;
  receiptUrl: string;
}

export const subject = "Invoice paid";

export const sampleProps: InvoicePaidProps = {
  clientFirstName: "Mira",
  invoiceNumber: "INV-2026-00418",
  amount: 12487.5,
  currency: "USD",
  paidOn: "2026-04-22",
  receiptUrl: "https://autharis.com/client/invoices/INV-2026-00418/receipt",
};

export default function InvoicePaid(props: InvoicePaidProps = sampleProps) {
  const { clientFirstName, invoiceNumber, amount, currency, paidOn, receiptUrl } = props;
  return (
    <Layout preview={`Invoice ${invoiceNumber} paid — ${currency} ${amount.toFixed(2)}`}>
      <Heading>Invoice paid</Heading>
      <Paragraph>Hi {clientFirstName},</Paragraph>
      <Paragraph>
        Thanks — we received payment for <strong>{invoiceNumber}</strong>. Your talent's payout is
        already scheduled.
      </Paragraph>
      <Divider />
      <Section>
        <KeyValue label="Invoice" value={invoiceNumber} />
        <KeyValue label="Amount" value={`${currency} ${amount.toFixed(2)}`} />
        <KeyValue label="Paid on" value={paidOn} />
      </Section>
      <Divider />
      <CTA href={receiptUrl} label="View receipt" />
      <Muted>This receipt is also attached in your Autharis billing history.</Muted>
    </Layout>
  );
}
