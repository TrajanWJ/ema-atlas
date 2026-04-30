"use client";

import { THEME_PRESETS, applyTheme, getPresetById } from "@ema/design-system";

import { PresetSwatch } from "./preset-swatch";

/**
 * Grid of 10 PresetSwatch components. Click a swatch → apply the theme
 * (writing inline `--place-*` token props on `<html>`) and persist the
 * choice via the supplied `onPick` callback.
 */
export interface ThemePickerProps {
  readonly activeId: string;
  readonly onPick: (id: string) => void;
}

export function ThemePicker({ activeId, onPick }: ThemePickerProps) {
  function handleSelect(id: string) {
    const preset = getPresetById(id);
    if (!preset) return;
    applyTheme(preset);
    onPick(id);
  }

  return (
    <div className="ema-theme-picker" role="radiogroup" aria-label="Theme palette">
      {THEME_PRESETS.map((preset) => {
        const isActive = preset.id === activeId;
        return (
          <div key={preset.id} className="ema-theme-picker__cell">
            <PresetSwatch preset={preset} active={isActive} onSelect={handleSelect} />
            <div className="ema-theme-picker__name">{preset.name}</div>
            <div className="ema-theme-picker__desc">{preset.description}</div>
          </div>
        );
      })}
    </div>
  );
}
