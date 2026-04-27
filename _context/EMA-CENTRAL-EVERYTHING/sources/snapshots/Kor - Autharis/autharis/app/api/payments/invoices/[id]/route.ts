import type { NextRequest } from "next/server";

import {
  getAllowedTransitions,
  getPaymentInvoiceById,
  isPaymentInvoiceStatus,
  transitionInvoiceStatus,
} from "@/lib/payments/data";

type InvoiceRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: InvoiceRouteContext) {
  const { id } = await params;
  const invoice = getPaymentInvoiceById(id);

  if (!invoice) {
    return Response.json({ error: `Unknown invoice ${id}` }, { status: 404 });
  }

  return Response.json({
    invoice,
    allowedTransitions: getAllowedTransitions(invoice.status),
  });
}

export async function POST(request: NextRequest, { params }: InvoiceRouteContext) {
  const { id } = await params;
  const invoice = getPaymentInvoiceById(id);

  if (!invoice) {
    return Response.json({ error: `Unknown invoice ${id}` }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        nextStatus?: string;
        stamp?: string;
      }
    | null;

  if (!body?.nextStatus || !isPaymentInvoiceStatus(body.nextStatus)) {
    return Response.json(
      {
        error: "Body must include a valid nextStatus.",
        allowedTransitions: getAllowedTransitions(invoice.status),
      },
      { status: 400 },
    );
  }

  try {
    const preview = transitionInvoiceStatus(invoice, body.nextStatus, body.stamp ?? "Preview transition");

    return Response.json({
      persisted: false,
      preview,
      allowedTransitions: getAllowedTransitions(invoice.status),
    });
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unable to preview invoice transition.",
        allowedTransitions: getAllowedTransitions(invoice.status),
      },
      { status: 400 },
    );
  }
}
