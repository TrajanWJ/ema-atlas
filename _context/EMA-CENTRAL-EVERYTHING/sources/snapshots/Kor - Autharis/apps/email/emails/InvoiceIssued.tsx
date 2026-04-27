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

export interface InvoiceIssuedProps {
  clientFirstName: string;
  invoiceNumber: string;
  engagementTitle: string;
  amount: number;
  currency: string;
  dueDate: string;
  invoiceUrl: string;
  payUrl: string;
}

export const subject = "Invoice issued — due soon";

export const sampleProps: InvoiceIssuedProps = {
  clientFirstName: "Mira",
  invoiceNumber: "INV-2026-00418",
  engagementTitle: "Senior Ops Lead — Q3 readiness",
  amount: 12487.5,
  currency: "USD",
  dueDate: "2026-05-06",
  invoiceUrl: "https://autharis.com/client/invoices/INV-2026-00418",
  payUrl: "https://autharis.com/client/invoices/INV-2026-00418/pay",
};

export default function InvoiceIssued(props: InvoiceIssuedProps = sampleProps) {
  const { clientFirstName, invoiceNumber, engagementTitle, amount, currency, dueDate, invoiceUrl, payUrl } =
    props;
  return (
    <Layout preview={`Invoice ${invoiceNumber} — ${currency} ${amount.toFixed(2)} due ${dueDate}`}>
      <Heading>Invoice {invoiceNumber}. Due {dueDate}</Heading>
      <Paragraph>Hi {clientFirstName},</Paragraph>
      <Paragraph>
        A new invoice is ready for <strong>{engagementTitle}</strong>. Payment via card or ACH keeps
        the engagement uninterrupted.
      </Paragraph>
      <Divider />
      <Section>
        <KeyValue label="Invoice" value={invoiceNumber} />
        <KeyValue label="Engagement" value={engagementTitle} />
        <KeyValue label="Amount due" value={`${currency} ${amount.toFixed(2)}`} />
        <KeyValue label="Due date" value={dueDate} />
      </Section>
      <Divider />
      <CTA href={payUrl} label="Pay invoice" />
      <Muted>
        Prefer PDF? <a href={invoiceUrl}>Download invoice</a>.
      </Muted>
    </Layout>
  );
}
