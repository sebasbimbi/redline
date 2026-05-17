/** Detect whether the extension context behind this content script is alive. */

import { browser } from 'wxt/browser';

/**
 * After the extension is reloaded or updated, an already-injected content
 * script is orphaned: calls into `browser.runtime` throw "context
 * invalidated". `runtime.id` goes undefined first, so it is a cheap probe.
 */
export function isExtensionContextValid(): boolean {
  try {
    return typeof browser.runtime?.id === 'string';
  } catch {
    return false;
  }
}
