'use client';

import { useRef, useState } from 'react';

interface FileDropZoneProps {
  accept: string;
  maxSize: number;
  onUpload: (file: File) => void;
  label?: string;
}

export function FileDropZone({ accept, maxSize, onUpload, label }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (file: File): string | null => {
    const acceptedTypes = accept.split(',').map((t) => t.trim());
    const typeMatch = acceptedTypes.some((t) => {
      if (t.startsWith('.')) return file.name.endsWith(t);
      if (t.endsWith('/*')) return file.type.startsWith(t.replace('/*', '/'));
      return file.type === t;
    });
    if (!typeMatch) return `Invalid file type. Accepted: ${accept}`;
    if (file.size > maxSize) {
      const mb = (maxSize / 1024 / 1024).toFixed(1);
      return `File too large (max ${mb} MB)`;
    }
    return null;
  };

  const handleFile = (file: File) => {
    const err = validate(file);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click(); }}
        aria-label={label ?? 'Drop file or click to browse'}
        style={{
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          borderRadius: '8px',
          border: `2px dashed ${isDragOver ? 'var(--place-primary-400)' : 'var(--place-border-default)'}`,
          background: isDragOver ? 'var(--place-primary-subtle)' : 'var(--place-surface-2)',
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
          padding: '16px',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isDragOver ? 'var(--place-primary-400)' : 'var(--place-text-tertiary)'}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span style={{ fontSize: '0.7rem', color: isDragOver ? 'var(--place-primary-400)' : 'var(--place-text-secondary)' }}>
          {label ?? 'Drop image or click to browse'}
        </span>
        <span style={{ fontSize: '0.6rem', color: 'var(--place-text-tertiary)' }}>
          {accept} · max {(maxSize / 1024 / 1024).toFixed(0)} MB
        </span>
      </div>

      {error && (
        <span style={{ fontSize: '0.65rem', color: 'var(--place-error, #ef4444)' }}>
          {error}
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        style={{ display: 'none' }}
        tabIndex={-1}
      />
    </div>
  );
}
