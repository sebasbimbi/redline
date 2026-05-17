/** Shared constants and small pure helpers. */

/** The keyboard command id declared in the manifest. */
export const COMMAND_TOGGLE = 'toggle-redline';

/** Flag set on the page `window` while the overlay is mounted. */
export const MOUNTED_FLAG = '__REDLINE_MOUNTED__';

/** Built path of the overlay content script, injected via the scripting API. */
export const OVERLAY_SCRIPT = '/content-scripts/overlay.js';

/** Stacking order for Redline layers (near the 32-bit signed integer max). */
export const Z_CANVAS = 2147483640;
export const Z_UI = 2147483646;

/** Annotation colors offered in the toolbar. */
export const COLORS = [
  '#e5484d', // red
  '#f76808', // orange
  '#ffb224', // amber
  '#30a46c', // green
  '#0091ff', // blue
  '#8e4ec6', // purple
] as const;

export const DEFAULT_COLOR: string = COLORS[0];
export const DEFAULT_STROKE_WIDTH = 3;

/** URL schemes Redline cannot annotate (no script injection, no capture). */
const NON_CAPTURABLE_SCHEMES = [
  'chrome:',
  'chrome-extension:',
  'edge:',
  'brave:',
  'arc:',
  'about:',
  'devtools:',
  'view-source:',
  'data:',
];

/** Hosts where script injection / capture is blocked even over https. */
const BLOCKED_HOSTS = ['chromewebstore.google.com', 'chrome.google.com'];

/** Whether Redline can inject into and capture the given URL. */
export function isCapturableUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  if (NON_CAPTURABLE_SCHEMES.includes(parsed.protocol)) return false;
  if (BLOCKED_HOSTS.includes(parsed.hostname)) return false;
  return true;
}
