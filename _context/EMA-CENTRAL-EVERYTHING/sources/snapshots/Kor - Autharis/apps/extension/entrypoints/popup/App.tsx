import React, { useEffect, useState } from 'react';
import type { NormalizedPayload } from '../../lib/normalize';

// Base64url-encode the payload for the deep link. chrome.storage is the
// transport from the background worker; the deep link is how we hand the
// payload off to the Autharis web app (which registers the autharis:// scheme).
function toBase64Url(obj: unknown): string {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

interface StoredState {
  lastPayload?: NormalizedPayload;
  lastCapturedAt?: string;
  lastSourceUrl?: string;
}

export function App() {
  const [state, setState] = useState<StoredState>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    chrome.storage?.local
      ?.get(['lastPayload', 'lastCapturedAt', 'lastSourceUrl'])
      .then((s) => setState(s as StoredState));
    chrome.runtime?.sendMessage?.({ type: 'AUTHARIS_CLEAR_BADGE' });
  }, []);

  const payload = state.lastPayload;

  const onOpen = () => {
    if (!payload) return;
    const draft = toBase64Url(payload);
    const url = `autharis://jobs/new?draft=${draft}`;
    chrome.tabs.create({ url });
  };

  const onCopy = async () => {
    if (!payload) return;
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div style={{ padding: 16 }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <strong style={{ fontSize: 14 }}>Autharis Clipper</strong>
        <span style={{ fontSize: 11, opacity: 0.6 }}>
          {state.lastCapturedAt
            ? new Date(state.lastCapturedAt).toLocaleTimeString()
            : 'idle'}
        </span>
      </header>

      {!payload ? (
        <p style={{ fontSize: 13, lineHeight: 1.4 }}>
          Highlight a job post on LinkedIn, Upwork, Lever, or Greenhouse, then
          right-click and choose <em>Send to Autharis</em>.
        </p>
      ) : (
        <div style={{ fontSize: 12, lineHeight: 1.4 }}>
          <Row label="Title" value={payload.title} />
          <Row label="Client" value={payload.client || '—'} />
          <Row label="Category" value={payload.category} />
          <Row label="Industry" value={payload.industry} />
          <Row
            label="Budget"
            value={
              payload.budget[0] || payload.budget[1]
                ? `$${payload.budget[0].toLocaleString()} – $${payload.budget[1].toLocaleString()}`
                : '—'
            }
          />
          <Row label="Hours/wk" value={String(payload.hoursPerWeek)} />
          <Row label="Duration" value={payload.duration} />
          <Row
            label="Skills"
            value={payload.skills.length ? payload.skills.join(', ') : '—'}
          />
          <details style={{ marginTop: 8 }}>
            <summary style={{ cursor: 'pointer' }}>Description</summary>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                fontSize: 11,
                maxHeight: 120,
                overflow: 'auto',
                background: 'rgba(0,0,0,0.05)',
                padding: 8,
                borderRadius: 4,
              }}
            >
              {payload.description}
            </pre>
          </details>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={onOpen} style={btnPrimary}>
              Open in Autharis
            </button>
            <button onClick={onCopy} style={btnSecondary}>
              {copied ? 'Copied!' : 'Copy JSON'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
      <span style={{ width: 72, opacity: 0.6 }}>{label}</span>
      <span style={{ flex: 1, wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}

const btnPrimary: React.CSSProperties = {
  flex: 1,
  background: '#111',
  color: '#fff',
  border: 'none',
  padding: '8px 12px',
  borderRadius: 6,
  cursor: 'pointer',
  fontSize: 12,
};
const btnSecondary: React.CSSProperties = {
  ...btnPrimary,
  background: 'transparent',
  color: 'inherit',
  border: '1px solid currentColor',
};
