'use client';

import { useState } from 'react';
import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { RangeSlider } from '../controls/RangeSlider';
import { SegmentedControl } from '../controls/SegmentedControl';
import { ToggleWithSub } from '../controls/ToggleWithSub';
import { FileDropZone } from '../controls/FileDropZone';
import { Section, SettingRow } from './shared';

const WALLPAPER_FIT_OPTIONS = [
	{ value: 'cover', label: 'Cover' },
	{ value: 'contain', label: 'Contain' },
	{ value: 'fill', label: 'Fill' },
	{ value: 'tile', label: 'Tile' },
];

const BUILTIN_WALLPAPERS = [
	{ id: 'default', label: 'Default', color: 'linear-gradient(135deg, #060610, #0e1017)' },
	{ id: 'aurora', label: 'Aurora', color: 'linear-gradient(135deg, #0a1628, #1a2a4a, #0d3a2e)' },
	{ id: 'ember', label: 'Ember', color: 'linear-gradient(135deg, #1a0808, #2a1010, #1a0a04)' },
	{ id: 'violet', label: 'Violet', color: 'linear-gradient(135deg, #12081a, #1e0e30, #0e0818)' },
	{ id: 'ocean', label: 'Ocean', color: 'linear-gradient(135deg, #040e1a, #071828, #05141e)' },
	{ id: 'forest', label: 'Forest', color: 'linear-gradient(135deg, #060e06, #0a180a, #060e08)' },
];

export function WallpaperPage() {
	const wallpaper = useSettingsStore((s) => s.wallpaper);
	const customWallpaperUrl = useSettingsStore((s) => s.customWallpaperUrl);
	const wallpaperOpacity = useSettingsStore((s) => s.wallpaperOpacity);
	const wallpaperFit = useSettingsStore((s) => s.wallpaperFit);
	const wallpaperTint = useSettingsStore((s) => s.wallpaperTint);
	const wallpaperTintOpacity = useSettingsStore((s) => s.wallpaperTintOpacity);
	const setSetting = useSettingsStore((s) => s.setSetting);

	const [urlInput, setUrlInput] = useState(customWallpaperUrl ?? '');

	function handleUpload(file: File) {
		const url = URL.createObjectURL(file);
		setSetting('wallpaper', 'custom');
		setSetting('customWallpaperUrl', url);
	}

	function handleUrlApply() {
		if (urlInput.trim()) {
			setSetting('wallpaper', 'custom');
			setSetting('customWallpaperUrl', urlInput.trim());
		}
	}

	return (
		<SettingsPage icon="🖼️" title="Wallpaper" description="Set and configure your desktop background">
			<div style={{ padding: '1rem' }}>
				<Section title="Gallery">
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
						{BUILTIN_WALLPAPERS.map((wp) => (
							<button
								key={wp.id}
								type="button"
								onClick={() => {
									setSetting('wallpaper', wp.id);
									setSetting('customWallpaperUrl', null);
								}}
								style={{
									height: '56px',
									borderRadius: '6px',
									background: wp.color,
									border: wallpaper === wp.id
										? '2px solid var(--place-primary-400)'
										: '2px solid var(--place-border-default)',
									cursor: 'pointer',
									position: 'relative',
									overflow: 'hidden',
								}}
							>
								<span
									style={{
										position: 'absolute',
										bottom: '4px',
										left: '50%',
										transform: 'translateX(-50%)',
										fontSize: '0.55rem',
										color: 'rgba(255,255,255,0.7)',
										whiteSpace: 'nowrap',
									}}
								>
									{wp.label}
								</span>
							</button>
						))}
					</div>
				</Section>

				<Section title="Upload">
					<FileDropZone
						accept="image/jpeg,image/png,image/webp"
						maxSize={10 * 1024 * 1024}
						onUpload={handleUpload}
						label="Drop image or click to browse"
					/>
				</Section>

				<Section title="Custom URL">
					<div style={{ display: 'flex', gap: '6px' }}>
						<input
							type="url"
							value={urlInput}
							onChange={(e) => setUrlInput(e.target.value)}
							placeholder="https://example.com/wallpaper.jpg"
							style={{
								flex: 1,
								fontSize: '0.7rem',
								padding: '5px 8px',
								borderRadius: '6px',
								border: '1px solid var(--place-border-default)',
								background: 'var(--place-surface-2)',
								color: 'var(--place-text-primary)',
								outline: 'none',
							}}
						/>
						<button
							type="button"
							onClick={handleUrlApply}
							style={{
								fontSize: '0.7rem',
								padding: '5px 10px',
								borderRadius: '6px',
								border: '1px solid var(--place-border-default)',
								background: 'var(--place-surface-3)',
								color: 'var(--place-text-primary)',
								cursor: 'pointer',
							}}
						>
							Apply
						</button>
					</div>
					{customWallpaperUrl && (
						<div
							style={{
								marginTop: '6px',
								height: '60px',
								borderRadius: '6px',
								background: `url(${customWallpaperUrl}) center/cover`,
								border: '1px solid var(--place-border-default)',
							}}
						/>
					)}
				</Section>

				<Section title="Display">
					<SettingRow label="Opacity">
						<div style={{ width: '160px' }}>
							<RangeSlider
								min={0}
								max={1}
								step={0.01}
								value={wallpaperOpacity}
								onChange={(v) => setSetting('wallpaperOpacity', v)}
								showValue
								formatValue={(v) => `${Math.round(v * 100)}%`}
							/>
						</div>
					</SettingRow>
					<SettingRow label="Fit">
						<SegmentedControl
							options={WALLPAPER_FIT_OPTIONS}
							value={wallpaperFit}
							onChange={(v) => setSetting('wallpaperFit', v as typeof wallpaperFit)}
						/>
					</SettingRow>
					<ToggleWithSub
						enabled={wallpaperTint}
						onToggle={(v) => setSetting('wallpaperTint', v)}
						label="Color tint"
						description="Overlay the wallpaper with a tinted layer"
					>
						<RangeSlider
							min={0.1}
							max={0.8}
							step={0.05}
							value={wallpaperTintOpacity}
							onChange={(v) => setSetting('wallpaperTintOpacity', v)}
							showValue
							formatValue={(v) => `${Math.round(v * 100)}%`}
							label="Tint opacity"
						/>
					</ToggleWithSub>
				</Section>
			</div>
		</SettingsPage>
	);
}
