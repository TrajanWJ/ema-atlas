import { createHmac } from "node:crypto";

import type { PaymentInvoiceRecord } from "@/lib/payments/data";

export type PaymentWebhookEvent = {
  id: string;
  type: "invoice.paid";
  createdAt: string;
  livemode: false;
  data: {
    object: {
      id: string;
      autharisInvoiceId: string;
      status: "paid";
      amount_paid: number;
      currency: "usd";
      customer_email: string;
      metadata: {
        client: string;
        engagementId: string;
        talentName: string;
      };
    };
  };
};

const WEBHOOK_SECRET = "whsec_autharis_demo";

export const paymentProvider = {
  name: "Autharis Stripe Stub",
  webhookSecret: WEBHOOK_SECRET,
  buildInvoicePaidEvent(invoice: PaymentInvoiceRecord): PaymentWebhookEvent {
    return {
      id: `evt_${invoice.id.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      type: "invoice.paid",
      createdAt: new Date().toISOString(),
      livemode: false,
      data: {
        object: {
          id: invoice.providerInvoiceId,
          autharisInvoiceId: invoice.id,
          status: "paid",
          amount_paid: Math.round(invoice.totalDue * 100),
          currency: "usd",
          customer_email: invoice.remittanceEmail,
          metadata: {
            client: invoice.client,
            engagementId: invoice.engagementId,
            talentName: invoice.talentName,
          },
        },
      },
    };
  },
  signPayload(payload: string) {
    return createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
  },
  verifySignature(payload: string, signature: string) {
    return this.signPayload(payload) === signature;
  },
};
