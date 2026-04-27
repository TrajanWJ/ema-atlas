import { api } from '../sdk';
import { useAsync } from '../useAsync';

export function Queue() {
  const state = useAsync(() => api.admin.queue.list({ pageSize: 50 }), []);

  return (
    <section className="view" aria-labelledby="queue-title">
      <h1 id="queue-title">Review queue</h1>
      <p className="lede">
        Items pending admin action. Pulled live from the Fastify API at /admin/queue.
      </p>
      {state.status === 'loading' && <div className="card">Loading queue…</div>}
      {state.status === 'error' && (
        <div className="card error">Failed to load queue: {state.error}</div>
      )}
      {state.status === 'ok' && (
        <div className="card">
          {state.data.items.length === 0 ? (
            <p>No items awaiting review.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Kind</th>
                  <th>Who</th>
                  <th>What</th>
                  <th>Age</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {state.data.items.map((item, i) => (
                  <tr key={`${item.kind}-${item.who}-${i}`}>
                    <td>{item.kind}</td>
                    <td>{item.who}</td>
                    <td>{item.what}</td>
                    <td>{item.age}</td>
                    <td>{item.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}
