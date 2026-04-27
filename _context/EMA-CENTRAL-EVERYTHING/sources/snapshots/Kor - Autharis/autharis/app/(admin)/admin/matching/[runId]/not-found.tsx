import Link from "next/link";

import adminStyles from "@/components/admin/admin.module.css";

export default function AdminMatchingRunNotFound() {
  return (
    <div className={adminStyles.page}>
      <header className={adminStyles.pageHeader}>
        <div>
          <span className={adminStyles.eyebrow}>Matching dossier</span>
          <h2 className={adminStyles.pageTitle}>Matching run not found</h2>
          <p className={adminStyles.pageDescription}>
            This run id is not part of the current admin matching review dataset.
          </p>
        </div>
      </header>

      <section className={adminStyles.panel}>
        <p className={adminStyles.panelHint}>Open one of the seeded matching runs from the review desk or return to the admin console.</p>
        <div className={adminStyles.headerActions}>
          <Link href="/admin/matching" className={adminStyles.button}>
            Return to matching
          </Link>
        </div>
      </section>
    </div>
  );
}
