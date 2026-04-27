import Link from "next/link";

import adminStyles from "@/components/admin/admin.module.css";

export default function AdminDisputeNotFound() {
  return (
    <div className={adminStyles.page}>
      <header className={adminStyles.pageHeader}>
        <div>
          <span className={adminStyles.eyebrow}>Case drilldown</span>
          <h2 className={adminStyles.pageTitle}>Dispute case not found</h2>
          <p className={adminStyles.pageDescription}>
            This dispute id is not part of the current admin demo dataset.
          </p>
        </div>
      </header>

      <section className={adminStyles.panel}>
        <p className={adminStyles.panelHint}>Try one of the seeded cases from the dispute desk or return to the queue.</p>
        <div className={adminStyles.headerActions}>
          <Link href="/admin/disputes" className={adminStyles.button}>
            Return to disputes
          </Link>
        </div>
      </section>
    </div>
  );
}
