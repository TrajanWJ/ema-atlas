'use client';

interface MiniPreviewProps {
  type: 'window' | 'glass';
}

export function MiniPreview({ type }: MiniPreviewProps) {
  if (type === 'window') {
    return (
      <div
        style={{
          width: '60px',
          height: '40px',
          borderRadius: 'var(--place-window-radius, 8px)',
          background: 'var(--place-surface-2)',
          border: '1px solid var(--place-border-default)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Title bar chrome */}
        <div
          style={{
            height: '12px',
            background: 'var(--place-surface-3)',
            borderBottom: '1px solid var(--place-border-subtle)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '5px',
            gap: '3px',
            flexShrink: 0,
          }}
        >
          {(['#ff5f57', '#ffbd2e', '#28c841'] as const).map((color) => (
            <div
              key={color}
              style={{
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: color,
              }}
            />
          ))}
        </div>
        {/* Content area */}
        <div style={{ flex: 1, background: 'var(--place-surface-1)' }} />
      </div>
    );
  }

  // Glass preview
  return (
    <div
      style={{
        width: '60px',
        height: '40px',
        borderRadius: '6px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Colorful gradient strip behind */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, #6366f1, #ec4899, #f59e0b, #10b981)',
        }}
      />
      {/* Glass overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          background: 'rgba(255,255,255,0.15)',
          border: '1px solid rgba(255,255,255,0.25)',
          borderRadius: '6px',
        }}
      />
    </div>
  );
}
