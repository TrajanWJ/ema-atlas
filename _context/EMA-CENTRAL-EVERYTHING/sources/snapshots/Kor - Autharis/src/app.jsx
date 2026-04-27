// App shell — surface switcher + routing + tweaks wiring.

const { useState: useApp1, useEffect: useApp2 } = React;

// Compute readable text color for a given bg (hex).
function readableOn(hex) {
  if (!hex) return '#FFFFFF';
  const m = hex.replace('#','').match(/^([0-9a-f]{6})$/i);
  if (!m) return '#FFFFFF';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const toLin = (c) => { c /= 255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
  const L = 0.2126*toLin(r) + 0.7152*toLin(g) + 0.0722*toLin(b);
  return L > 0.42 ? '#0A0A0B' : '#FFFFFF';
}
// Luminance 0..1
function lum(hex) {
  if (!hex) return 0;
  const m = hex.replace('#','').match(/^([0-9a-f]{6})$/i);
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const toLin = (c) => { c /= 255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
  return 0.2126*toLin(r) + 0.7152*toLin(g) + 0.0722*toLin(b);
}
// Darken/lighten hex by percent
function adjustHex(hex, pct) {
  const m = hex.replace('#','').match(/^([0-9a-f]{6})$/i);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = 1 + pct/100;
  r = Math.max(0, Math.min(255, Math.round(r * f)));
  g = Math.max(0, Math.min(255, Math.round(g * f)));
  b = Math.max(0, Math.min(255, Math.round(b * f)));
  return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
}

function App() {
  const [surface, setSurface] = useApp1(() => localStorage.getItem('autharis:surface') || 'marketing');
  const [state, setState] = useApp1({});
  const [tweaks, setTweaks] = useApp1(() => {
    // v4 migration: light-default, no warm, modern sans
    const tw = { ...window.TWEAKS };
    if (!tw.v || tw.v < 4) {
      tw.accent = '#17130C';
      tw.theme = 'light';
      tw.density = 'comfortable';
      tw.matchVariant = 'stack';
      tw.v = 4;
    }
    if (!tw.v || tw.v < 5) {
      tw.copyVariant = tw.copyVariant || 'editorial';
      tw.v = 5;
    }
    if (tw.theme === 'warm') tw.theme = 'light';
    return tw;
  });
  const [tweaksOpen, setTweaksOpen] = useApp1(false);

  // Persist surface
  useApp2(() => { localStorage.setItem('autharis:surface', surface); }, [surface]);

  // Apply tweaks to DOM
  useApp2(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', tweaks.theme || 'light');
    root.setAttribute('data-density', tweaks.density || 'comfortable');
    const a = tweaks.accent || '#17130C';
    root.style.setProperty('--accent', a);
    root.style.setProperty('--accent-ink', readableOn(a));
    // Accent-for-text: darken very-light accents so they stay readable on light bg,
    // lighten very-dark accents so they stay readable on dark bg.
    const isDark = (tweaks.theme === 'dark');
    const aLum = lum(a);
    let aText = a;
    if (!isDark && aLum > 0.55) aText = adjustHex(a, -45);   // darken for light theme
    if ( isDark && aLum < 0.15) aText = adjustHex(a,  55);   // lighten for dark theme
    root.style.setProperty('--accent-text', aText);
    window.TWEAKS = tweaks;
  }, [tweaks]);

  // Edit-mode protocol
  useApp2(() => {
    const handler = (ev) => {
      if (!ev.data || typeof ev.data !== 'object') return;
      if (ev.data.type === '__activate_edit_mode') setTweaksOpen(true);
      if (ev.data.type === '__deactivate_edit_mode') setTweaksOpen(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const surfaces = [
    { id: 'marketing', label: 'Marketing' },
    { id: 'client',    label: 'Client app' },
    { id: 'talent',    label: 'Talent app' },
    { id: 'admin',     label: 'Admin' },
  ];

  return (
    <div className="app-shell">
      <div className="surface-bar">
        <span className="surface-bar-label">Autharis · Prototype</span>
        {surfaces.map(s => (
          <div key={s.id} className="surface-tab" data-active={surface === s.id} onClick={() => setSurface(s.id)} data-screen-label={s.label}>
            <span className="surface-tab-dot"/> {s.label}
          </div>
        ))}
        <div className="surface-meta">
          <span>Apr 20, 2026</span>
          <span>·</span>
          <span>v0.1 preview</span>
        </div>
      </div>

      <div className="app-body">
        <div className="app-main">
          <div className="app-content" key={surface}>
            {surface === 'marketing' && <MarketingPage onGoToClient={() => setSurface('client')} onGoToTalent={() => setSurface('talent')} />}
            {surface === 'client'    && <ClientApp state={state} setState={setState} />}
            {surface === 'talent'    && <TalentApp state={state} setState={setState} />}
            {surface === 'admin'     && <AdminApp state={state} setState={setState} />}
          </div>
        </div>
      </div>

      {tweaksOpen && <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} />}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
