'use client';

import { useSettingsStore } from '@/src/stores/settings-store';
import { SettingsPage } from '../SettingsPage';
import { THEME_PRESETS } from '@/src/lib/theme-presets';
import { Section } from './shared';

export function ThemesPage() {
	const primaryColor = useSettingsStore((s) => s.primaryColor);
	const setSetting = useSettingsStore((s) => s.setSetting);

	function applyTheme(themeId: string) {
		const theme = THEME_PRESETS.find((t) => t.id === themeId);
		if (!theme) return;

		// Apply CSS tokens to root
		const root = document.documentElement;
		for (const [token, value] of Object.entries(theme.tokens)) {
			root.style.setProperty(token, value);
		}

		// Sync primary/accent to store
		if (theme.tokens['--place-primary-400']) {
			setSetting('primaryColor', theme.tokens['--place-primary-400']);
		}
		if (theme.tokens['--place-secondary-400']) {
			setSetting('accentColor', theme.tokens['--place-secondary-400']);
		}
	}

	return (
		<SettingsPage icon="🌙" title="Themes" description="Choose a complete visual theme for your workspace">
			<div style={{ padding: '1rem' }}>
				<Section title="Theme Presets">
					<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
						{THEME_PRESETS.map((theme) => {
							const isActive = primaryColor === theme.preview.primary;
							return (
								<div
									key={theme.id}
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '12px',
										padding: '10px 12px',
										borderRadius: '8px',
										border: isActive
											? '1px solid var(--place-primary-border)'
											: '1px solid var(--place-border-default)',
										background: isActive ? 'var(--place-primary-subtle)' : 'var(--place-surface-2)',
									}}
								>
									{/* Color preview swatches */}
									<div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
										{[theme.preview.void, theme.preview.surface, theme.preview.primary, theme.preview.secondary].map((color, i) => (
											<div
												// biome-ignore lint/suspicious/noArrayIndexKey: static theme color swatches
												key={i}
												style={{
													width: '14px',
													height: '28px',
													borderRadius: i === 0 ? '3px 0 0 3px' : i === 3 ? '0 3px 3px 0' : '0',
													background: color,
												}}
											/>
										))}
									</div>

									{/* Theme info */}
									<div style={{ flex: 1, minWidth: 0 }}>
										<div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--place-text-primary)' }}>
											{theme.name}
										</div>
										<div style={{ fontSize: '0.62rem', color: 'var(--place-text-muted)', marginTop: '1px' }}>
											{theme.description}
										</div>
									</div>

									{/* Apply button */}
									<button
										type="button"
										onClick={() => applyTheme(theme.id)}
										style={{
											fontSize: '0.65rem',
											padding: '4px 10px',
											borderRadius: '5px',
											border: isActive
												? '1px solid var(--place-primary-400)'
												: '1px solid var(--place-border-default)',
											background: isActive ? 'var(--place-primary-400)' : 'transparent',
											color: isActive ? 'var(--place-void)' : 'var(--place-text-primary)',
											cursor: 'pointer',
											flexShrink: 0,
											fontWeight: isActive ? 600 : 400,
										}}
									>
										{isActive ? 'Active' : 'Apply'}
									</button>
								</div>
							);
						})}
					</div>
				</Section>
			</div>
		</SettingsPage>
	);
}
