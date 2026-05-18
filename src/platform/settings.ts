/** User settings, shared between the popup and the overlay via extension storage. */

import { browser } from 'wxt/browser';
import { DEFAULT_COLOR, DEFAULT_STROKE_WIDTH } from './constants';

/** A pinned on-screen position for the floating toolbar, in CSS pixels. */
export interface ToolbarPosition {
  x: number;
  y: number;
}

/** Defaults a new annotation document starts from. */
export interface RedlineSettings {
  defaultColor: string;
  defaultStrokeWidth: number;
  /** Where the user last dragged the toolbar, or null for the default spot. */
  toolbarPosition: ToolbarPosition | null;
}

const SETTINGS_KEY = 'redline:settings';

const FALLBACK: RedlineSettings = {
  defaultColor: DEFAULT_COLOR,
  defaultStrokeWidth: DEFAULT_STROKE_WIDTH,
  toolbarPosition: null,
};

/** Narrow an unknown stored value to a ToolbarPosition, or null. */
function asPosition(value: unknown): ToolbarPosition | null {
  if (!value || typeof value !== 'object') return null;
  const { x, y } = value as Record<string, unknown>;
  return typeof x === 'number' && typeof y === 'number' ? { x, y } : null;
}

/** Load settings from extension storage, falling back to the built-in defaults. */
export async function loadSettings(): Promise<RedlineSettings> {
  try {
    const stored = await browser.storage.local.get(SETTINGS_KEY);
    const value = stored[SETTINGS_KEY] as Partial<RedlineSettings> | undefined;
    return {
      defaultColor:
        typeof value?.defaultColor === 'string'
          ? value.defaultColor
          : FALLBACK.defaultColor,
      defaultStrokeWidth:
        typeof value?.defaultStrokeWidth === 'number'
          ? value.defaultStrokeWidth
          : FALLBACK.defaultStrokeWidth,
      toolbarPosition: asPosition(value?.toolbarPosition),
    };
  } catch {
    return { ...FALLBACK };
  }
}

/** Persist settings to extension storage. */
export async function saveSettings(settings: RedlineSettings): Promise<void> {
  await browser.storage.local.set({ [SETTINGS_KEY]: settings });
}

/** Persist just the toolbar position, leaving the other settings intact. */
export async function saveToolbarPosition(
  position: ToolbarPosition,
): Promise<void> {
  const current = await loadSettings();
  await saveSettings({ ...current, toolbarPosition: position });
}
