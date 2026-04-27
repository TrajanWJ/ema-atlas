import { api } from '../sdk';
import { useAsync } from '../useAsync';

export function Reports() {
  const invoices = useAsync(() => api.invoices.list({ pageSize: 100 }), []);
  const timesheets = useAsync(() => api.timesheets.list({ pageSize: 100 }), []);

  const loading = invoices.status === 'loading' || timesheets.status === 'loading';
  const error =
    (invoices.status === 'error' && invoices.error) ||
    (timesheets.status === 'error' && timesheets.error) ||
    null;

  const invoiceTotal =
    invoices.status === 'ok'
      ? invoices.data.items.reduce((sum, inv) => sum + inv.total, 0)
      : 0;
  const approvedHours =
    timesheets.status === 'ok'
      ? timesheets.data.items
          .filter((t) => t.status === 'Approved')
          .reduce((sum, t) => sum + t.hours, 0)
      : 0;

  return (
    <section className="view" aria-labelledby="reports-title">
      <h1 id="reports-title">Reports</h1>
      <p className="lede">Treasury and throughput snapshot.</p>
      {loading && <div className="card">Loading reports…</div>}
      {error && <div className="card error">Failed to load reports: {error}</div>}
      {invoices.status === 'ok' && timesheets.status === 'ok' && (
        <>
          <div className="card">
            <strong>Invoices:</strong> {invoices.data.items.length} on this page of{' '}
            {invoices.data.total} · billed total{' '}
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
              invoiceTotal,
            )}
          </div>
          <div className="card">
            <strong>Timesheets:</strong> {timesheets.data.items.length} on this page of{' '}
            {timesheets.data.total} · {approvedHours.toFixed(1)} approved hrs
          </div>
        </>
      )}
    </section>
  );
}
