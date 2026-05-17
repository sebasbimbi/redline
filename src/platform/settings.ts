/** User settings, shared between the popup and the overlay via extension storage. */

import { browser } from 'wxt/browser';
import { DEFAULT_COLOR, DEFAULT_STROKE_WIDTH } from './constants';

/** Defaults a new annotation document starts from. */
export interface RedlineSettings {
  defaultColor: string;
  defaultStrokeWidth: number;
}

const SETTINGS_KEY = 'redline:settings';

const FALLBACK: RedlineSettings = {
  defaultColor: DEFAULT_COLOR,
  defaultStrokeWidth: DEFAULT_STROKE_WIDTH,
};

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
    };
  } catch {
    return { ...FALLBACK };
  }
}

/** Persist settings to extension storage. */
export async function saveSettings(settings: RedlineSettings): Promise<void> {
  await browser.storage.local.set({ [SETTINGS_KEY]: settings });
}
