import { getPaymentDashboardData, getPaymentInvoices } from "@/lib/payments/data";

export async function GET() {
  const dashboard = getPaymentDashboardData();

  return Response.json({
    generatedAt: new Date().toISOString(),
    stats: dashboard.stats,
    invoices: getPaymentInvoices(),
    stateMachine: dashboard.stateMachine,
    webhook: {
      endpoint: dashboard.webhookSample.endpoint,
      example: JSON.parse(dashboard.webhookSample.body) as { invoiceId: string; type: string },
    },
  });
}
