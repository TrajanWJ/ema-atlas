import { PaymentsDashboard } from "@/components/payments/payments-dashboard";
import { getPaymentDashboardData } from "@/lib/payments/data";

export default function PaymentsPage() {
  return <PaymentsDashboard data={getPaymentDashboardData()} />;
}
