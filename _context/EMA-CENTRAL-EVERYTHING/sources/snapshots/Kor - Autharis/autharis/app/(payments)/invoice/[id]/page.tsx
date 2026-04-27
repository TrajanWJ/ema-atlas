import { notFound } from "next/navigation";

import { InvoicePrintable } from "@/components/payments/invoice-printable";
import { getPaymentInvoiceById, getPaymentInvoiceParams } from "@/lib/payments/data";

export function generateStaticParams() {
  return getPaymentInvoiceParams();
}

export default async function PaymentInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = getPaymentInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  return <InvoicePrintable invoice={invoice} />;
}
