/** Orchestrate a full-page capture: scroll the page, capture each slice, stitch. */

import type { RedlineDocument } from '../model/document';
import { composeFullPage, type CaptureSlice } from './compose';

export interface FullPageCaptureOptions {
  doc: RedlineDocument;
  /** Captures the current viewport as a PNG data URL. */
  captureViewport: () => Promise<string>;
  /** Redline's own elements, excluded from fixed-element hiding. */
  ownElements: Element[];
  /** Capture stops early once this returns false (e.g. the overlay closed). */
  shouldContinue: () => boolean;
  /** Reports progress as each slice is captured. */
  onProgress: (done: number, total: number) => void;
}

export interface FullPageResult {
  blob: Blob;
  /** True if the page was longer than Redline captures in one pass. */
  truncated: boolean;
}

/** Delay between scrolling and capturing, for layout and lazy content. */
const SETTLE_MS = 450;
/** Minimum gap between capture calls, for the captureVisibleTab rate limit. */
const MIN_CAPTURE_INTERVAL_MS = 1100;
/** Most viewport slices Redline will stitch in one capture. */
const MAX_SLICES = 20;

interface HiddenElement {
  el: HTMLElement;
  visibility: string;
}

export async function captureFullPage(
  opts: FullPageCaptureOptions,
): Promise<FullPageResult> {
  const dpr = window.devicePixelRatio || 1;
  const viewportHeight = window.innerHeight;
  const pageHeight = fullPageHeight();
  const originalScrollY = window.scrollY;

  const fullCount = Math.max(1, Math.ceil(pageHeight / viewportHeight));
  const count = Math.min(fullCount, MAX_SLICES);
  const maxTop = Math.max(0, pageHeight - viewportHeight);
  const positions: number[] = [];
  for (let i = 0; i < count; i++) {
    positions.push(Math.min(i * viewportHeight, maxTop));
  }

  const slices: CaptureSlice[] = [];
  let hiddenFixed: HiddenElement[] = [];
  let lastCaptureStart = 0;

  try {
    for (let i = 0; i < positions.length; i++) {
      if (!opts.shouldContinue()) {
        throw new Error('Full-page capture was cancelled.');
      }
      window.scrollTo({ top: positions[i]!, left: 0, behavior: 'instant' });
      await delay(SETTLE_MS);
      const sinceLast = Date.now() - lastCaptureStart;
      if (sinceLast < MIN_CAPTURE_INTERVAL_MS) {
        await delay(MIN_CAPTURE_INTERVAL_MS - sinceLast);
      }
      lastCaptureStart = Date.now();
      const dataUrl = await opts.captureViewport();
      slices.push({ dataUrl, scrollY: positions[i]! });
      opts.onProgress(i + 1, positions.length);
      // hide fixed/sticky chrome after slice one so it is not repeated
      if (i === 0) hiddenFixed = hideFixedElements(new Set(opts.ownElements));
    }
  } finally {
    restoreElements(hiddenFixed);
    window.scrollTo({ top: originalScrollY, left: 0, behavior: 'instant' });
  }

  const blob = await composeFullPage(slices, dpr, opts.doc);
  return { blob, truncated: fullCount > MAX_SLICES };
}

/** The total scrollable height of the page, in CSS pixels. */
function fullPageHeight(): number {
  const doc = document.documentElement;
  const body = document.body;
  return Math.max(
    doc.scrollHeight,
    doc.offsetHeight,
    doc.clientHeight,
    body ? body.scrollHeight : 0,
    body ? body.offsetHeight : 0,
  );
}

/** Hide every fixed or sticky element so it is not repeated at each slice. */
function hideFixedElements(own: Set<Element>): HiddenElement[] {
  const hidden: HiddenElement[] = [];
  if (!document.body) return hidden;
  for (const el of document.body.querySelectorAll('*')) {
    if (!(el instanceof HTMLElement) || own.has(el)) continue;
    const position = getComputedStyle(el).position;
    if (position === 'fixed' || position === 'sticky') {
      hidden.push({ el, visibility: el.style.visibility });
      el.style.visibility = 'hidden';
    }
  }
  return hidden;
}

function restoreElements(hidden: HiddenElement[]): void {
  for (const entry of hidden) {
    entry.el.style.visibility = entry.visibility;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
