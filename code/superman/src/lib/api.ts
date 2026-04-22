const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function api<T = any>(path: string, opts?: { method?: string; body?: unknown }): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: opts?.method || 'GET',
    headers: opts?.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    let msg: string;
    try { msg = JSON.parse(text).error; } catch { msg = text; }
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
}
