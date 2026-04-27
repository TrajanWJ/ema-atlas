// Tweaks panel — accent, theme, density, match variant, copy variant.
// Draggable: grab the header to move.

const { useState: useTw1, useEffect: useTw2, useRef: useTw3 } = React;

const ACCENT_SWATCHES = [
  { name: 'Ink',        color: '#17130C' },
  { name: 'Terracotta', color: '#E8552B' },
  { name: 'Lime',       color: '#D4F755' },
  { name: 'Sky',        color: '#4B8FC9' },
  { name: 'Moss',       color: '#5C8F3A' },
  { name: 'Ochre',      color: '#E8B324' },
  { name: 'Magenta',    color: '#E84B8A' },
];

const COPY_VARIANTS = [
  ['editorial', 'Editorial'],
  ['punchy',    'Punchy'],
  ['serious',   'Enterprise'],
  ['warm',      'Warm'],
];

function TweaksPanel({ tweaks, setTweaks }) {
  // Position — persisted in localStorage. Default: bottom-right.
  const [pos, setPos] = useTw1(() => {
    try {
      const raw = localStorage.getItem('autharis:tweaks-pos');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { right: 20, bottom: 20 };
  });
  const dragState = useTw3(null);

  useTw2(() => {
    try { localStorage.setItem('autharis:tweaks-pos', JSON.stringify(pos)); } catch {}
  }, [pos]);

  const update = (patch) => {
    const next = { ...tweaks, ...patch };
    setTweaks(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*');
  };

  const onMouseDown = (e) => {
    // Only start drag if user clicked on the header (not on close/other buttons)
    if (e.target.closest('button')) return;
    e.preventDefault();
    const el = e.currentTarget.parentElement; // .tweaks-panel
    const rect = el.getBoundingClientRect();
    dragState.current = {
      offX: e.clientX - rect.left,
      offY: e.clientY - rect.top,
      w: rect.width,
      h: rect.height,
    };
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };
  const onMove = (e) => {
    const d = dragState.current; if (!d) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const left = Math.max(8, Math.min(vw - d.w - 8, e.clientX - d.offX));
    const top  = Math.max(8, Math.min(vh - d.h - 8, e.clientY - d.offY));
    setPos({ left, top });
  };
  const onUp = () => {
    dragState.current = null;
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };

  const style = {};
  if (pos.left != null) style.left = pos.left;
  if (pos.top != null)  style.top  = pos.top;
  if (pos.right != null)  style.right  = pos.right;
  if (pos.bottom != null) style.bottom = pos.bottom;

  return (
    <div className="tweaks-panel" style={style}>
      <div className="tweaks-panel-head" onMouseDown={onMouseDown} style={{cursor: 'grab'}}>
        <span style={{display:'inline-flex', alignItems:'center', gap:8}}>
          <span style={{display:'inline-flex', flexDirection:'column', gap:2}}>
            <span style={{display:'flex', gap:2}}>
              <span style={{width:3,height:3,background:'currentColor',borderRadius:1,opacity:0.6}}></span>
              <span style={{width:3,height:3,background:'currentColor',borderRadius:1,opacity:0.6}}></span>
            </span>
            <span style={{display:'flex', gap:2}}>
              <span style={{width:3,height:3,background:'currentColor',borderRadius:1,opacity:0.6}}></span>
              <span style={{width:3,height:3,background:'currentColor',borderRadius:1,opacity:0.6}}></span>
            </span>
            <span style={{display:'flex', gap:2}}>
              <span style={{width:3,height:3,background:'currentColor',borderRadius:1,opacity:0.6}}></span>
              <span style={{width:3,height:3,background:'currentColor',borderRadius:1,opacity:0.6}}></span>
            </span>
          </span>
          Tweaks
        </span>
        <span style={{opacity: 0.6}}>Live</span>
      </div>
      <div className="tweaks-panel-body">
        <div className="tweaks-row">
          <span className="tweaks-row-label">Accent</span>
          <div className="tweaks-swatch-row">
            {ACCENT_SWATCHES.map(s => (
              <button key={s.color} title={s.name}
                className="tweaks-swatch"
                data-active={tweaks.accent === s.color}
                style={{background: s.color}}
                onClick={() => update({ accent: s.color })}/>
            ))}
          </div>
        </div>
        <div className="tweaks-row">
          <span className="tweaks-row-label">Theme</span>
          <div className="segmented">
            {[['dark', 'Dark'], ['light', 'Light']].map(([id, label]) => (
              <button key={id} data-active={tweaks.theme === id} onClick={() => update({ theme: id })}>{label}</button>
            ))}
          </div>
        </div>
        <div className="tweaks-row">
          <span className="tweaks-row-label">Density</span>
          <div className="segmented">
            {[['comfortable', 'Comfortable'], ['compact', 'Compact']].map(([id, label]) => (
              <button key={id} data-active={tweaks.density === id} onClick={() => update({ density: id })}>{label}</button>
            ))}
          </div>
        </div>
        <div className="tweaks-row">
          <span className="tweaks-row-label">Hero copy</span>
          <div className="segmented" style={{flexWrap:'wrap'}}>
            {COPY_VARIANTS.map(([id, label]) => (
              <button key={id} data-active={(tweaks.copyVariant || 'editorial') === id} onClick={() => update({ copyVariant: id })}>{label}</button>
            ))}
          </div>
        </div>
        <div className="tweaks-row">
          <span className="tweaks-row-label">Match card</span>
          <div className="segmented">
            {[['hero', 'Editorial'], ['dossier', 'Dossier'], ['stack', 'Stack']].map(([id, label]) => (
              <button key={id} data-active={tweaks.matchVariant === id} onClick={() => update({ matchVariant: id })}>{label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.TweaksPanel = TweaksPanel;
