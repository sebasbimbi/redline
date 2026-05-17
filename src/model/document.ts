/** The per-page annotation document (session). */

import type { Annotation, EditorTool } from './annotation';
import { uid } from '../platform/ids';
import { DEFAULT_COLOR, DEFAULT_STROKE_WIDTH } from '../platform/constants';

export interface Viewport {
  width: number;
  height: number;
  devicePixelRatio: number;
}

/** A page's worth of annotations plus the editing state. */
export interface RedlineDocument {
  schemaVersion: 1;
  documentId: string;
  pageUrl: string;
  pageTitle: string;
  viewport: Viewport;
  scroll: { x: number; y: number };
  annotations: Annotation[];
  activeTool: EditorTool;
  activeColor: string;
  activeStrokeWidth: number;
  createdAt: string;
  updatedAt: string;
}

/** Create a fresh document for the current page. Runs in the page context. */
export function createDocument(): RedlineDocument {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    documentId: uid(),
    pageUrl: location.href,
    pageTitle: document.title,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio || 1,
    },
    scroll: { x: window.scrollX, y: window.scrollY },
    annotations: [],
    activeTool: 'callout',
    activeColor: DEFAULT_COLOR,
    activeStrokeWidth: DEFAULT_STROKE_WIDTH,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Renumber change-request annotations to 1..N in array order. Mutates the
 * annotations in place. Call after any add or delete.
 */
export function resequence(doc: RedlineDocument): void {
  let n = 0;
  for (const a of doc.annotations) {
    if (a.annotationClass === 'change-request') {
      n += 1;
      a.number = n;
    }
  }
}

/** Count the change-request annotations in the document. */
export function changeRequestCount(doc: RedlineDocument): number {
  return doc.annotations.filter((a) => a.annotationClass === 'change-request')
    .length;
}
