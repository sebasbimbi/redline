/** Unit tests for annotation geometry operations. */

import { describe, it, expect } from 'vitest';
import {
  rectFromPoints,
  cloneGeometry,
  translateGeometry,
  annotationBounds,
  hitTestAnnotation,
  hitTestTopmost,
  annotationColor,
} from './geometryOps';
import type { Annotation } from './annotation';

const STYLE = { color: '#ff0000', width: 3 };

function rectAnnotation(
  id: string,
  rect: { x: number; y: number; w: number; h: number },
): Annotation {
  return {
    id,
    createdAt: '2026-05-17T00:00:00.000Z',
    annotationClass: 'visual-emphasis',
    geometry: { kind: 'rectangle', rect, style: { ...STYLE } },
  };
}

function calloutAnnotation(
  id: string,
  anchor: { x: number; y: number },
): Annotation {
  return {
    id,
    createdAt: '2026-05-17T00:00:00.000Z',
    annotationClass: 'change-request',
    geometry: { kind: 'callout', anchor, color: '#0091ff' },
    number: 1,
    label: 'x',
    element: null,
  };
}

function measureAnnotation(
  id: string,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Annotation {
  return {
    id,
    createdAt: '2026-05-17T00:00:00.000Z',
    annotationClass: 'visual-emphasis',
    geometry: { kind: 'measure', from, to, style: { ...STYLE } },
  };
}

function textEditAnnotation(
  id: string,
  box: { x: number; y: number; w: number; h: number },
): Annotation {
  return {
    id,
    createdAt: '2026-05-18T00:00:00.000Z',
    annotationClass: 'change-request',
    geometry: {
      kind: 'textedit',
      box,
      color: '#0091ff',
      oldText: 'Old',
      newText: 'New',
      hasInlineMarkup: false,
    },
    number: 1,
    label: '',
    element: null,
  };
}

describe('rectFromPoints', () => {
  it('builds a rectangle from two corner points', () => {
    expect(rectFromPoints({ x: 10, y: 10 }, { x: 30, y: 40 })).toEqual({
      x: 10,
      y: 10,
      w: 20,
      h: 30,
    });
  });

  it('normalizes whatever the drag direction', () => {
    const fromTopLeft = rectFromPoints({ x: 10, y: 10 }, { x: 30, y: 40 });
    const fromBottomRight = rectFromPoints({ x: 30, y: 40 }, { x: 10, y: 10 });
    const fromMixed = rectFromPoints({ x: 30, y: 10 }, { x: 10, y: 40 });
    expect(fromBottomRight).toEqual(fromTopLeft);
    expect(fromMixed).toEqual(fromTopLeft);
  });
});

describe('cloneGeometry', () => {
  it('returns a deep copy that is independent of the original', () => {
    const original = {
      kind: 'callout' as const,
      anchor: { x: 5, y: 5 },
      color: '#000000',
    };
    const copy = cloneGeometry(original);
    expect(copy).toEqual(original);
    expect(copy).not.toBe(original);
    if (copy.kind === 'callout') copy.anchor.x = 999;
    expect(original.anchor.x).toBe(5);
  });
});

describe('translateGeometry', () => {
  it('shifts a rectangle', () => {
    const g = {
      kind: 'rectangle' as const,
      rect: { x: 0, y: 0, w: 10, h: 10 },
      style: { ...STYLE },
    };
    translateGeometry(g, 5, 7);
    expect(g.rect).toEqual({ x: 5, y: 7, w: 10, h: 10 });
  });

  it('shifts both ends of an arrow', () => {
    const g = {
      kind: 'arrow' as const,
      from: { x: 0, y: 0 },
      to: { x: 10, y: 10 },
      style: { ...STYLE },
    };
    translateGeometry(g, 1, 2);
    expect(g.from).toEqual({ x: 1, y: 2 });
    expect(g.to).toEqual({ x: 11, y: 12 });
  });

  it('shifts every freehand point', () => {
    const g = {
      kind: 'freehand' as const,
      points: [
        { x: 0, y: 0, pressure: 0.5 },
        { x: 2, y: 2, pressure: 0.5 },
      ],
      style: { ...STYLE },
    };
    translateGeometry(g, 3, 3);
    expect(g.points).toEqual([
      { x: 3, y: 3, pressure: 0.5 },
      { x: 5, y: 5, pressure: 0.5 },
    ]);
  });

  it('shifts a callout anchor and a text origin', () => {
    const callout = {
      kind: 'callout' as const,
      anchor: { x: 1, y: 1 },
      color: '#000000',
    };
    translateGeometry(callout, 4, 4);
    expect(callout.anchor).toEqual({ x: 5, y: 5 });

    const text = {
      kind: 'text' as const,
      origin: { x: 2, y: 2 },
      fontSize: 16,
      color: '#000000',
    };
    translateGeometry(text, 1, 1);
    expect(text.origin).toEqual({ x: 3, y: 3 });
  });
});

describe('annotationBounds', () => {
  it('returns the rect of a rectangle annotation', () => {
    const bounds = annotationBounds(
      rectAnnotation('r', { x: 5, y: 6, w: 20, h: 30 }),
    );
    expect(bounds).toEqual({ x: 5, y: 6, w: 20, h: 30 });
  });

  it('boxes a callout around its anchor by the marker radius', () => {
    const bounds = annotationBounds(calloutAnnotation('c', { x: 100, y: 100 }));
    expect(bounds).toEqual({ x: 84, y: 84, w: 32, h: 32 });
  });
});

describe('hitTestAnnotation', () => {
  it('hits inside a callout marker radius and misses outside it', () => {
    const callout = calloutAnnotation('c', { x: 100, y: 100 });
    expect(hitTestAnnotation(callout, { x: 100, y: 100 })).toBe(true);
    expect(hitTestAnnotation(callout, { x: 110, y: 100 })).toBe(true);
    expect(hitTestAnnotation(callout, { x: 130, y: 100 })).toBe(false);
  });

  it('hits inside a rectangle, including padding, and misses beyond it', () => {
    const rect = rectAnnotation('r', { x: 0, y: 0, w: 100, h: 50 });
    expect(hitTestAnnotation(rect, { x: 50, y: 25 })).toBe(true);
    expect(hitTestAnnotation(rect, { x: -3, y: -3 })).toBe(true);
    expect(hitTestAnnotation(rect, { x: -20, y: -20 })).toBe(false);
  });
});

describe('hitTestTopmost', () => {
  it('returns the last drawn annotation when several overlap', () => {
    const under = calloutAnnotation('under', { x: 10, y: 10 });
    const over = calloutAnnotation('over', { x: 10, y: 10 });
    expect(hitTestTopmost([under, over], { x: 10, y: 10 })?.id).toBe('over');
  });

  it('returns null when nothing is hit', () => {
    const callout = calloutAnnotation('c', { x: 10, y: 10 });
    expect(hitTestTopmost([callout], { x: 500, y: 500 })).toBeNull();
    expect(hitTestTopmost([], { x: 0, y: 0 })).toBeNull();
  });
});

describe('annotationColor', () => {
  it('reads the stroke color of a shape and the fill color of a callout', () => {
    expect(
      annotationColor(rectAnnotation('r', { x: 0, y: 0, w: 1, h: 1 })),
    ).toBe('#ff0000');
    expect(annotationColor(calloutAnnotation('c', { x: 0, y: 0 }))).toBe(
      '#0091ff',
    );
  });
});

describe('measure geometry', () => {
  it('translates both ends of a measure line', () => {
    const g = {
      kind: 'measure' as const,
      from: { x: 0, y: 0 },
      to: { x: 10, y: 10 },
      style: { ...STYLE },
    };
    translateGeometry(g, 2, 3);
    expect(g.from).toEqual({ x: 2, y: 3 });
    expect(g.to).toEqual({ x: 12, y: 13 });
  });

  it('bounds a measure line across its two endpoints', () => {
    const bounds = annotationBounds(
      measureAnnotation('m', { x: 10, y: 40 }, { x: 30, y: 10 }),
    );
    expect(bounds).toEqual({ x: 10, y: 10, w: 20, h: 30 });
  });

  it('hits near the measure line and misses far from it', () => {
    const m = measureAnnotation('m', { x: 0, y: 0 }, { x: 100, y: 0 });
    expect(hitTestAnnotation(m, { x: 50, y: 2 })).toBe(true);
    expect(hitTestAnnotation(m, { x: 50, y: 40 })).toBe(false);
  });

  it('reads the stroke color of a measure line', () => {
    expect(
      annotationColor(measureAnnotation('m', { x: 0, y: 0 }, { x: 1, y: 1 })),
    ).toBe('#ff0000');
  });
});

describe('textedit geometry', () => {
  it('translates the box of a text edit', () => {
    const g = {
      kind: 'textedit' as const,
      box: { x: 10, y: 20, w: 100, h: 30 },
      color: '#0091ff',
      oldText: 'a',
      newText: 'b',
      hasInlineMarkup: false,
    };
    translateGeometry(g, 5, 7);
    expect(g.box).toEqual({ x: 15, y: 27, w: 100, h: 30 });
  });

  it('bounds a text edit to its element box', () => {
    const bounds = annotationBounds(
      textEditAnnotation('t', { x: 4, y: 6, w: 120, h: 24 }),
    );
    expect(bounds).toEqual({ x: 4, y: 6, w: 120, h: 24 });
  });

  it('hits inside the box and at the marker corner, misses far outside', () => {
    const t = textEditAnnotation('t', { x: 100, y: 100, w: 80, h: 20 });
    expect(hitTestAnnotation(t, { x: 140, y: 110 })).toBe(true);
    expect(hitTestAnnotation(t, { x: 100, y: 100 })).toBe(true);
    expect(hitTestAnnotation(t, { x: 400, y: 400 })).toBe(false);
  });

  it('reads the color of a text edit', () => {
    expect(
      annotationColor(textEditAnnotation('t', { x: 0, y: 0, w: 1, h: 1 })),
    ).toBe('#0091ff');
  });
});
