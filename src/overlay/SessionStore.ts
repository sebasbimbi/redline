/**
 * Per-page persistence of the annotation document. The document is JSON-
 * serializable, so it lives in extension storage keyed by the page's origin
 * and pathname, and is offered back when Redline reopens on the same page.
 */

import { browser } from 'wxt/browser';
import type { RedlineDocument } from '../model/document';

const DOC_PREFIX = 'redline:doc:';
/** Saved documents older than this are dropped on the next load. */
const TTL_MS = 14 * 24 * 60 * 60 * 1000;
const SAVE_DEBOUNCE_MS = 500;

export class SessionStore {
  private readonly key = DOC_PREFIX + location.origin + location.pathname;
  private saveTimer = 0;

  /** The saved document for this page, or null if there is none (or it expired). */
  async load(): Promise<RedlineDocument | null> {
    try {
      const stored = await browser.storage.local.get(this.key);
      const doc = stored[this.key] as RedlineDocument | undefined;
      void this.pruneExpired();
      return doc && isFresh(doc) ? doc : null;
    } catch {
      return null;
    }
  }

  /** Persist the document after a short debounce. An empty document is removed. */
  save(doc: RedlineDocument): void {
    clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(
      () => void this.write(doc),
      SAVE_DEBOUNCE_MS,
    );
  }

  /** Persist immediately, cancelling any pending debounced save (used on close). */
  flush(doc: RedlineDocument): void {
    clearTimeout(this.saveTimer);
    void this.write(doc);
  }

  private async write(doc: RedlineDocument): Promise<void> {
    try {
      if (doc.annotations.length === 0) {
        await browser.storage.local.remove(this.key);
      } else {
        await browser.storage.local.set({ [this.key]: doc });
      }
    } catch {
      /* storage may be unavailable; a lost session is acceptable */
    }
  }

  /** Drop every saved document past its time-to-live. */
  private async pruneExpired(): Promise<void> {
    try {
      const all = await browser.storage.local.get(null);
      const stale = Object.keys(all).filter(
        (k) =>
          k.startsWith(DOC_PREFIX) &&
          !isFresh(all[k] as RedlineDocument | undefined),
      );
      if (stale.length > 0) await browser.storage.local.remove(stale);
    } catch {
      /* ignore */
    }
  }
}

/** Whether a stored document exists and is within its time-to-live. */
function isFresh(doc: RedlineDocument | undefined): boolean {
  if (!doc || typeof doc.updatedAt !== 'string') return false;
  const updated = Date.parse(doc.updatedAt);
  return Number.isFinite(updated) && Date.now() - updated < TTL_MS;
}
