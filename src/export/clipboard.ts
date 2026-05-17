/** Clipboard export: write the screenshot and changelog for an AI assistant. */

import { supportsClipboardWrite } from '../platform/capabilities';

export interface ClipboardResult {
  ok: boolean;
  /** True when both the image and the changelog text were written. */
  imageAndText: boolean;
  error?: string;
}

/**
 * Copy the screenshot and (when the browser allows a multi-type item) the
 * changelog text to the clipboard.
 */
export async function copyToClipboard(
  pngBlob: Blob,
  markdown: string,
): Promise<ClipboardResult> {
  if (!supportsClipboardWrite()) {
    return {
      ok: false,
      imageAndText: false,
      error: 'The Clipboard API is unavailable in this browser.',
    };
  }
  const textBlob = new Blob([markdown], { type: 'text/plain' });
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': pngBlob, 'text/plain': textBlob }),
    ]);
    return { ok: true, imageAndText: true };
  } catch {
    // Some browsers reject a multi-type ClipboardItem; retry with image only.
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob }),
      ]);
      return { ok: true, imageAndText: false };
    } catch (err) {
      return {
        ok: false,
        imageAndText: false,
        error: err instanceof Error ? err.message : 'Clipboard write failed.',
      };
    }
  }
}

/** Copy plain text to the clipboard. Returns whether it succeeded. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Decode a base64 (or plain) data URL into a Blob, without using fetch. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(',');
  const header = comma >= 0 ? dataUrl.slice(0, comma) : '';
  const body = comma >= 0 ? dataUrl.slice(comma + 1) : '';
  const mime = /^data:([^;,]+)/i.exec(header)?.[1] ?? 'application/octet-stream';
  if (/;base64/i.test(header)) {
    const binary = atob(body);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }
  return new Blob([decodeURIComponent(body)], { type: mime });
}
