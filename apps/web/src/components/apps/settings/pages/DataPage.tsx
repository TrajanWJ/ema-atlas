'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { getDbClient } from '@/src/db/client';
import { exportAllData, triggerJsonDownload } from '@/src/lib/data-export';
import { importData, previewImport } from '@/src/lib/data-import';
import type { ImportPreview, ImportResult } from '@/src/lib/data-import';
import { Section } from './shared';

function ActionBtn({
	onClick,
	disabled,
	variant = 'default',
	children,
}: {
	onClick: () => void;
	disabled?: boolean;
	variant?: 'default' | 'danger';
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			style={{
				padding: '0.35rem 0.75rem',
				fontSize: '0.75rem',
				borderRadius: '6px',
				border: variant === 'danger'
					? '1px solid var(--place-error, #ef4444)'
					: '1px solid var(--place-border-default)',
				background: 'transparent',
				color: variant === 'danger' ? 'var(--place-error, #ef4444)' : 'var(--place-text-primary)',
				cursor: disabled ? 'not-allowed' : 'pointer',
				opacity: disabled ? 0.5 : 1,
			}}
		>
			{children}
		</button>
	);
}

function StorageBar() {
	const [used, setUsed] = useState<number | null>(null);
	const [quota, setQuota] = useState<number | null>(null);

	useEffect(() => {
		if (typeof navigator !== 'undefined' && 'storage' in navigator) {
			navigator.storage.estimate().then((est) => {
				setUsed(est.usage ?? null);
				setQuota(est.quota ?? null);
			}).catch(() => {});
		}
	}, []);

	if (used === null || quota === null) {
		return <div style={{ fontSize: '0.7rem', color: 'var(--place-text-muted)' }}>Calculating…</div>;
	}

	const pct = Math.min((used / quota) * 100, 100);
	const usedMb = (used / 1024 / 1024).toFixed(1);
	const quotaMb = (quota / 1024 / 1024).toFixed(0);

	return (
		<div>
			<div
				style={{
					height: '6px',
					borderRadius: '3px',
					background: 'var(--place-surface-3)',
					overflow: 'hidden',
					marginBottom: '6px',
				}}
			>
				<div
					style={{
						height: '100%',
						width: `${pct}%`,
						background: 'var(--place-primary-400)',
						borderRadius: '3px',
						transition: 'width 0.3s',
					}}
				/>
			</div>
			<div style={{ fontSize: '0.65rem', color: 'var(--place-text-muted)' }}>
				{usedMb} MB used of {quotaMb} MB ({pct.toFixed(1)}%)
			</div>
		</div>
	);
}

export function DataPage() {
	const resetSettings = useSettingsStore((s) => s.resetSettings);

	// Export
	const [exporting, setExporting] = useState(false);
	const [exportStatus, setExportStatus] = useState<string | null>(null);

	const handleExport = useCallback(async () => {
		setExporting(true);
		setExportStatus(null);
		try {
			const db = getDbClient();
			const data = await exportAllData(db);
			triggerJsonDownload(data);
			setExportStatus('Export complete.');
		} catch (err) {
			setExportStatus(`Export failed: ${String(err)}`);
		} finally {
			setExporting(false);
		}
	}, []);

	// Import
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [preview, setPreview] = useState<ImportPreview | null>(null);
	const [previewError, setPreviewError] = useState<string | null>(null);
	const [jsonContent, setJsonContent] = useState<string | null>(null);
	const [importing, setImporting] = useState(false);
	const [importResult, setImportResult] = useState<ImportResult | null>(null);

	const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setPreview(null);
		setPreviewError(null);
		setImportResult(null);
		const reader = new FileReader();
		reader.onload = (ev) => {
			const text = ev.target?.result;
			if (typeof text !== 'string') return;
			setJsonContent(text);
			const parsed = previewImport(text);
			if ('error' in parsed) setPreviewError(parsed.error);
			else setPreview(parsed);
		};
		reader.readAsText(file);
	}, []);

	const handleImport = useCallback(async () => {
		if (!jsonContent) return;
		setImporting(true);
		try {
			const db = getDbClient();
			const res = await importData(db, jsonContent);
			setImportResult(res);
		} catch (err) {
			setImportResult({ imported: 0, skipped: 0, errors: [String(err)] });
		} finally {
			setImporting(false);
		}
	}, [jsonContent]);

	// Reset
	const [resetConfirm, setResetConfirm] = useState(false);

	return (
		<SettingsPage icon="💾" title="Data & Storage" description="Export, import, and manage your workspace data">
			<div style={{ padding: '1rem' }}>
				<Section title="Storage Usage">
					<StorageBar />
				</Section>

				<Section title="Export Data">
					<div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
						<ActionBtn onClick={() => { handleExport().catch(() => {}); }} disabled={exporting}>
							{exporting ? 'Exporting…' : 'Export JSON'}
						</ActionBtn>
					</div>
					{exportStatus && (
						<div style={{ marginTop: '6px', fontSize: '0.7rem', color: exportStatus.startsWith('Export failed') ? 'var(--place-error, #ef4444)' : 'var(--place-success, #22c55e)' }}>
							{exportStatus}
						</div>
					)}
				</Section>

				<Section title="Import Data">
					<input
						ref={fileInputRef}
						type="file"
						accept=".json"
						onChange={handleFileChange}
						style={{ display: 'none' }}
					/>
					<ActionBtn onClick={() => fileInputRef.current?.click()} disabled={importing}>
						Choose backup file (.json)
					</ActionBtn>
					{previewError && (
						<div style={{ marginTop: '6px', fontSize: '0.7rem', color: 'var(--place-error, #ef4444)' }}>{previewError}</div>
					)}
					{preview && !importResult && (
						<div style={{ marginTop: '8px' }}>
							<div style={{ fontSize: '0.7rem', color: 'var(--place-text-secondary)', marginBottom: '6px' }}>
								{preview.total} record{preview.total !== 1 ? 's' : ''} to merge
							</div>
							<ActionBtn onClick={() => { handleImport().catch(() => {}); }} disabled={importing}>
								{importing ? 'Importing…' : 'Import'}
							</ActionBtn>
						</div>
					)}
					{importResult && (
						<div style={{ marginTop: '6px', fontSize: '0.7rem' }}>
							<div style={{ color: 'var(--place-success, #22c55e)' }}>
								{importResult.imported} imported, {importResult.skipped} skipped
							</div>
							{importResult.errors.length > 0 && (
								<div style={{ color: 'var(--place-error, #ef4444)', marginTop: '4px' }}>
									{importResult.errors.slice(0, 3).map((e, i) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: error list display-only
										<div key={i}>{e}</div>
									))}
								</div>
							)}
						</div>
					)}
				</Section>

				<Section title="Reset">
					{!resetConfirm ? (
						<ActionBtn variant="danger" onClick={() => setResetConfirm(true)}>
							Reset all settings to defaults
						</ActionBtn>
					) : (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
							<div style={{ fontSize: '0.7rem', color: 'var(--place-error, #ef4444)' }}>
								This will reset all settings to their defaults. Are you sure?
							</div>
							<div style={{ display: 'flex', gap: '8px' }}>
								<ActionBtn variant="danger" onClick={() => { resetSettings(); setResetConfirm(false); }}>
									Confirm reset
								</ActionBtn>
								<ActionBtn onClick={() => setResetConfirm(false)}>Cancel</ActionBtn>
							</div>
						</div>
					)}
				</Section>
			</div>
		</SettingsPage>
	);
}
