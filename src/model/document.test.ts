/** Unit tests for change-request numbering and counting. */

import { describe, it, expect } from 'vitest';
import { resequence, changeRequestCount } from './document';
import type { RedlineDocument } from './document';
import type { Annotation } from './annotation';
import { isChangeRequest } from './annotation';

function changeRequest(id: string, number: number): Annotation {
  return {
    id,
    createdAt: '2026-05-17T00:00:00.000Z',
    annotationClass: 'change-request',
    geometry: { kind: 'callout', anchor: { x: 0, y: 0 }, color: '#000000' },
    number,
    label: id,
    element: null,
  };
}

function emphasis(id: string): Annotation {
  return {
    id,
    createdAt: '2026-05-17T00:00:00.000Z',
    annotationClass: 'visual-emphasis',
    geometry: {
      kind: 'rectangle',
      rect: { x: 0, y: 0, w: 1, h: 1 },
      style: { color: '#000000', width: 1 },
    },
  };
}

function docWith(annotations: Annotation[]): RedlineDocument {
  return {
    schemaVersion: 1,
    documentId: 'doc',
    pageUrl: 'https://example.com',
    pageTitle: 'Example',
    viewport: { width: 800, height: 600, devicePixelRatio: 1 },
    scroll: { x: 0, y: 0 },
    annotations,
    activeTool: 'callout',
    activeColor: '#000000',
    activeStrokeWidth: 2,
    createdAt: '2026-05-17T00:00:00.000Z',
    updatedAt: '2026-05-17T00:00:00.000Z',
  };
}

function numbersOf(doc: RedlineDocument): number[] {
  return doc.annotations.filter(isChangeRequest).map((a) => a.number);
}

describe('resequence', () => {
  it('does nothing to an empty document', () => {
    const doc = docWith([]);
    expect(() => resequence(doc)).not.toThrow();
    expect(doc.annotations).toEqual([]);
  });

  it('renumbers change requests to 1..N in array order', () => {
    const doc = docWith([
      changeRequest('a', 9),
      changeRequest('b', 4),
      changeRequest('c', 7),
    ]);
    resequence(doc);
    expect(numbersOf(doc)).toEqual([1, 2, 3]);
  });

  it('does not let a visual-emphasis mark consume a number', () => {
    const doc = docWith([
      changeRequest('a', 0),
      emphasis('rect'),
      changeRequest('b', 0),
    ]);
    resequence(doc);
    expect(numbersOf(doc)).toEqual([1, 2]);
  });

  it('is idempotent', () => {
    const doc = docWith([changeRequest('a', 0), changeRequest('b', 0)]);
    resequence(doc);
    resequence(doc);
    expect(numbersOf(doc)).toEqual([1, 2]);
  });
});

describe('changeRequestCount', () => {
  it('counts only the change-request annotations', () => {
    expect(changeRequestCount(docWith([]))).toBe(0);
    expect(
      changeRequestCount(
        docWith([
          changeRequest('a', 1),
          emphasis('r'),
          changeRequest('b', 2),
        ]),
      ),
    ).toBe(2);
    expect(changeRequestCount(docWith([emphasis('r')]))).toBe(0);
  });
});
