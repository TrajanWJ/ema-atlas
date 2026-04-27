import Link from 'next/link';

export default function ClientFinanceNotFound() {
  return (
    <div className="finance-lab finance-lab--not-found">
      <div className="finance-lab__frame">
        <section className="finance-lab__panel finance-lab__panel--not-found">
          <div className="finance-lab__section-label">Finance packet lab</div>
          <h1>That packet is not in this lane-local queue.</h1>
          <p className="finance-lab__aside-copy">
            The lab only exposes submitted timesheet packets staged inside Lane D11. Head back to the queue and open an
            active packet from there.
          </p>
          <Link className="finance-lab__action finance-lab__action--primary" href="/client-finance">
            Return to finance lab
          </Link>
        </section>
      </div>
    </div>
  );
}
