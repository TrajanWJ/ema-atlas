import type { NextRequest } from "next/server";

import { getPaymentInvoiceById, transitionInvoiceStatus } from "@/lib/payments/data";
import { paymentProvider } from "@/lib/payments/provider";

function buildWebhookPreview(invoiceId: string) {
  const invoice = getPaymentInvoiceById(invoiceId);

  if (!invoice) {
    return null;
  }

  const event = paymentProvider.buildInvoicePaidEvent(invoice);
  const payload = JSON.stringify(event);
  const signature = paymentProvider.signPayload(payload);

  return {
    provider: paymentProvider.name,
    signature,
    verified: paymentProvider.verifySignature(payload, signature),
    event,
    updatedInvoice: transitionInvoiceStatus(invoice, "paid", event.createdAt),
  };
}

export async function GET(request: NextRequest) {
  const invoiceId = request.nextUrl.searchParams.get("invoiceId") ?? "INV-2026-0047";
  const preview = buildWebhookPreview(invoiceId);

  if (!preview) {
    return Response.json({ error: `Unknown invoice ${invoiceId}` }, { status: 404 });
  }

  return Response.json(preview);
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | {
        invoiceId?: string;
        type?: string;
        signature?: string;
      }
    | null;

  const invoiceId = body?.invoiceId ?? "INV-2026-0047";
  const invoice = getPaymentInvoiceById(invoiceId);

  if (!invoice) {
    return Response.json({ error: `Unknown invoice ${invoiceId}` }, { status: 404 });
  }

  if (body?.type && body.type !== "invoice.paid") {
    return Response.json({ error: "Only invoice.paid is supported in this stub." }, { status: 400 });
  }

  const event = paymentProvider.buildInvoicePaidEvent(invoice);
  const payload = JSON.stringify(event);
  const generatedSignature = paymentProvider.signPayload(payload);
  const signature = body?.signature ?? generatedSignature;

  if (!paymentProvider.verifySignature(payload, signature)) {
    return Response.json({ error: "Signature verification failed." }, { status: 400 });
  }

  return Response.json({
    provider: paymentProvider.name,
    verified: true,
    signature,
    generatedSignature,
    event,
    persisted: false,
    updatedInvoice: transitionInvoiceStatus(invoice, "paid", event.createdAt),
  });
}
