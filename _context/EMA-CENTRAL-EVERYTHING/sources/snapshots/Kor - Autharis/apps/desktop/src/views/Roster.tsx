import { api } from '../sdk';
import { useAsync } from '../useAsync';

export function Roster() {
  const state = useAsync(() => api.talent.list({ pageSize: 100 }), []);

  return (
    <section className="view" aria-labelledby="roster-title">
      <h1 id="roster-title">Roster</h1>
      <p className="lede">Verified talent, streamed from /talent.</p>
      {state.status === 'loading' && <div className="card">Loading roster…</div>}
      {state.status === 'error' && (
        <div className="card error">Failed to load roster: {state.error}</div>
      )}
      {state.status === 'ok' && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Title</th>
                <th>City</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {state.data.items.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>{t.name}</td>
                  <td>{t.title}</td>
                  <td>{t.city}</td>
                  <td>{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
