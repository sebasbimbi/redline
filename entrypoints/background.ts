/**
 * The Redline service worker.
 *
 * Listens for the keyboard command and the popup's activate request, injects
 * the overlay programmatically, and relays screenshot capture for the overlay.
 */

import { defineBackground } from 'wxt/utils/define-background';
import { browser } from 'wxt/browser';
import {
  COMMAND_TOGGLE,
  OVERLAY_SCRIPT,
  isCapturableUrl,
} from '../src/platform/constants';
import type { CaptureResponse } from '../src/platform/messages';

export default defineBackground(() => {
  browser.commands.onCommand.addListener((command) => {
    if (command === COMMAND_TOGGLE) void toggleOverlay();
  });

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const type =
      message && typeof message === 'object'
        ? (message as { type?: unknown }).type
        : undefined;

    if (type === 'capture-viewport') {
      void captureActiveTab().then(sendResponse);
      return true; // response is sent asynchronously
    }
    if (type === 'activate') {
      toggleOverlay()
        .then(() => sendResponse({ ok: true }))
        .catch((err: unknown) =>
          sendResponse({ ok: false, error: errorMessage(err) }),
        );
      return true;
    }
    return undefined;
  });
});

/** Inject the overlay on the active tab. Re-injection toggles it off. */
async function toggleOverlay(): Promise<void> {
  const tab = await getActiveTab();
  if (tab?.id == null) throw new Error('No active tab.');
  if (!isCapturableUrl(tab.url)) {
    throw new Error('Redline cannot run on this page.');
  }
  await browser.scripting.executeScript({
    target: { tabId: tab.id },
    files: [OVERLAY_SCRIPT],
  });
}

/** Capture the visible area of the active tab as a PNG data URL. */
async function captureActiveTab(): Promise<CaptureResponse> {
  try {
    const tab = await getActiveTab();
    if (tab?.windowId == null) return { ok: false, error: 'No active tab.' };
    const dataUrl = await captureWithRetry(tab.windowId);
    return { ok: true, dataUrl };
  } catch (err) {
    return { ok: false, error: errorMessage(err) };
  }
}

async function getActiveTab() {
  const [tab] = await browser.tabs.query({
    active: true,
    currentWindow: true,
  });
  return tab;
}

/** captureVisibleTab is rate-limited; retry a few times with backoff. */
async function captureWithRetry(windowId: number, tries = 5): Promise<string> {
  let lastError: unknown;
  for (let attempt = 0; attempt < tries; attempt++) {
    try {
      return await browser.tabs.captureVisibleTab(windowId, { format: 'png' });
    } catch (err) {
      lastError = err;
      if (attempt < tries - 1) await delay(600);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Screenshot capture failed.');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
