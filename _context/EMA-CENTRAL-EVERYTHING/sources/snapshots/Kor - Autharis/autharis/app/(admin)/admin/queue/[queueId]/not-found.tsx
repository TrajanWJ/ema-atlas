import Link from "next/link";

import adminStyles from "@/components/admin/admin.module.css";

export default function AdminQueueNotFound() {
  return (
    <div className={adminStyles.page}>
      <header className={adminStyles.pageHeader}>
        <div>
          <span className={adminStyles.eyebrow}>Queue drilldown</span>
          <h2 className={adminStyles.pageTitle}>Queue record not found</h2>
          <p className={adminStyles.pageDescription}>
            This queue id is not part of the current admin demo dataset.
          </p>
        </div>
      </header>

      <section className={adminStyles.panel}>
        <p className={adminStyles.panelHint}>Return to the activation queue and open one of the seeded records instead.</p>
        <div className={adminStyles.headerActions}>
          <Link href="/admin" className={adminStyles.button}>
            Return to activation queue
          </Link>
        </div>
      </section>
    </div>
  );
}
