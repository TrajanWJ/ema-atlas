import { render } from "@react-email/render";
import * as React from "react";

import MatchFound, {
  subject as matchFoundSubject,
  sampleProps as matchFoundSample,
  type MatchFoundProps,
} from "../emails/MatchFound.js";
import TimesheetSubmitted, {
  subject as timesheetSubmittedSubject,
  sampleProps as timesheetSubmittedSample,
  type TimesheetSubmittedProps,
} from "../emails/TimesheetSubmitted.js";
import TimesheetApproved, {
  subject as timesheetApprovedSubject,
  sampleProps as timesheetApprovedSample,
  type TimesheetApprovedProps,
} from "../emails/TimesheetApproved.js";
import InvoiceIssued, {
  subject as invoiceIssuedSubject,
  sampleProps as invoiceIssuedSample,
  type InvoiceIssuedProps,
} from "../emails/InvoiceIssued.js";
import InvoicePaid, {
  subject as invoicePaidSubject,
  sampleProps as invoicePaidSample,
  type InvoicePaidProps,
} from "../emails/InvoicePaid.js";
import PayoutSent, {
  subject as payoutSentSubject,
  sampleProps as payoutSentSample,
  type PayoutSentProps,
} from "../emails/PayoutSent.js";
import DisputeOpened, {
  subject as disputeOpenedSubject,
  sampleProps as disputeOpenedSample,
  type DisputeOpenedProps,
} from "../emails/DisputeOpened.js";
import MagicLink, {
  subject as magicLinkSubject,
  sampleProps as magicLinkSample,
  type MagicLinkProps,
} from "../emails/MagicLink.js";

export interface EmailPropsMap {
  MatchFound: MatchFoundProps;
  TimesheetSubmitted: TimesheetSubmittedProps;
  TimesheetApproved: TimesheetApprovedProps;
  InvoiceIssued: InvoiceIssuedProps;
  InvoicePaid: InvoicePaidProps;
  PayoutSent: PayoutSentProps;
  DisputeOpened: DisputeOpenedProps;
  MagicLink: MagicLinkProps;
}

export type EmailName = keyof EmailPropsMap;

interface Registry {
  [K: string]: {
    component: (props: any) => React.ReactElement;
    subject: string;
    sample: unknown;
  };
}

export const templates: Registry = {
  MatchFound: { component: MatchFound, subject: matchFoundSubject, sample: matchFoundSample },
  TimesheetSubmitted: {
    component: TimesheetSubmitted,
    subject: timesheetSubmittedSubject,
    sample: timesheetSubmittedSample,
  },
  TimesheetApproved: {
    component: TimesheetApproved,
    subject: timesheetApprovedSubject,
    sample: timesheetApprovedSample,
  },
  InvoiceIssued: {
    component: InvoiceIssued,
    subject: invoiceIssuedSubject,
    sample: invoiceIssuedSample,
  },
  InvoicePaid: { component: InvoicePaid, subject: invoicePaidSubject, sample: invoicePaidSample },
  PayoutSent: { component: PayoutSent, subject: payoutSentSubject, sample: payoutSentSample },
  DisputeOpened: {
    component: DisputeOpened,
    subject: disputeOpenedSubject,
    sample: disputeOpenedSample,
  },
  MagicLink: { component: MagicLink, subject: magicLinkSubject, sample: magicLinkSample },
};

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Render a named transactional email to `{ subject, html, text }`.
 *
 * The provider adapter (SES / Postmark / Resend) is responsible for adding the
 * `from`, `to`, and messaging-service headers — this module intentionally only
 * knows about the payload body.
 */
export async function renderEmail<N extends EmailName>(
  name: N,
  props: EmailPropsMap[N],
): Promise<RenderedEmail> {
  const entry = templates[name];
  if (!entry) {
    throw new Error(`Unknown email template: ${String(name)}`);
  }
  const element = entry.component(props);
  const [html, text] = await Promise.all([
    render(element, { pretty: false }),
    render(element, { plainText: true }),
  ]);
  return { subject: entry.subject, html, text };
}

/** Convenience for preview servers and tests — renders the template's sample props. */
export async function renderSample<N extends EmailName>(name: N): Promise<RenderedEmail> {
  const entry = templates[name];
  if (!entry) throw new Error(`Unknown email template: ${String(name)}`);
  return renderEmail(name, entry.sample as EmailPropsMap[N]);
}

export const emailNames: EmailName[] = Object.keys(templates) as EmailName[];
