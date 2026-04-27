import { api } from '../sdk';
import { useAsync } from '../useAsync';

export function Disputes() {
  // The F6 API exposes disputes as an AdminQueueItem kind.
  const state = useAsync(
    () => api.admin.queue.list({ kind: 'dispute', pageSize: 50 }),
    [],
  );

  return (
    <section className="view" aria-labelledby="disputes-title">
      <h1 id="disputes-title">Disputes</h1>
      <p className="lede">Active dispute cases from the admin queue.</p>
      {state.status === 'loading' && <div className="card">Loading disputes…</div>}
      {state.status === 'error' && (
        <div className="card error">Failed to load disputes: {state.error}</div>
      )}
      {state.status === 'ok' && (
        <div className="card">
          {state.data.items.length === 0 ? (
            <p>No active disputes.</p>
          ) : (
            <ul>
              {state.data.items.map((item, i) => (
                <li key={`${item.who}-${i}`}>
                  <strong>{item.who}</strong> — {item.what} ({item.priority}, {item.age})
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
