/** Overlay-side screenshot capture: ask the service worker for the viewport. */

import { browser } from 'wxt/browser';
import type { CaptureResponse, CaptureRequest } from '../platform/messages';

/**
 * Request a PNG screenshot of the visible tab from the service worker.
 * Returns a data URL. Throws if capture fails.
 */
export async function captureViewport(): Promise<string> {
  const request: CaptureRequest = { type: 'capture-viewport' };
  const response = (await browser.runtime.sendMessage(request)) as
    | CaptureResponse
    | undefined;
  if (!response?.ok || !response.dataUrl) {
    throw new Error(response?.error ?? 'Screenshot capture failed.');
  }
  return response.dataUrl;
}
