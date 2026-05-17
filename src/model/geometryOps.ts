/** Operations on annotation geometry: build, clone, translate, bound, hit-test. */

import type { Annotation, Geometry } from './annotation';
import type { Point, Rect } from './geometry';
import { distance } from './geometry';

/** Radius (page px) used to bound and hit-test a callout marker. */
const CALLOUT_RADIUS = 16;
/** Pointer slop (page px) for hitting thin shapes such as arrows and strokes. */
const HIT_SLOP = 8;

/** A normalized rectangle spanning two corner points, whatever the drag order. */
export function rectFromPoints(a: Point, b: Point): Rect {
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}

/** Deep-copy a geometry so undo snapshots stay independent of live edits. */
export function cloneGeometry(geometry: Geometry): Geometry {
  return structuredClone(geometry);
}

/** Translate a geometry in place by (dx, dy) page pixels. */
export function translateGeometry(
  geometry: Geometry,
  dx: number,
  dy: number,
): void {
  switch (geometry.kind) {
    case 'rectangle':
    case 'ellipse':
    case 'highlight':
      geometry.rect.x += dx;
      geometry.rect.y += dy;
      return;
    case 'arrow':
      geometry.from.x += dx;
      geometry.from.y += dy;
      geometry.to.x += dx;
      geometry.to.y += dy;
      return;
    case 'freehand':
      for (const p of geometry.points) {
        p.x += dx;
        p.y += dy;
      }
      return;
    case 'callout':
      geometry.anchor.x += dx;
      geometry.anchor.y += dy;
      return;
    case 'text':
      geometry.origin.x += dx;
      geometry.origin.y += dy;
      return;
  }
}

/** Approximate the page-space box a text annotation occupies. */
function textBounds(origin: Point, fontSize: number, label: string): Rect {
  const lines = label.length > 0 ? label.split('\n') : [''];
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 1);
  return {
    x: origin.x,
    y: origin.y,
    w: Math.max(44, longest * fontSize * 0.6),
    h: lines.length * fontSize * 1.3,
  };
}

/** The page-space bounding box of an annotation. */
export function annotationBounds(annotation: Annotation): Rect {
  const g = annotation.geometry;
  switch (g.kind) {
    case 'rectangle':
    case 'ellipse':
    case 'highlight':
      return { x: g.rect.x, y: g.rect.y, w: g.rect.w, h: g.rect.h };
    case 'arrow':
      return rectFromPoints(g.from, g.to);
    case 'freehand': {
      if (g.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const p of g.points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    case 'callout':
      return {
        x: g.anchor.x - CALLOUT_RADIUS,
        y: g.anchor.y - CALLOUT_RADIUS,
        w: CALLOUT_RADIUS * 2,
        h: CALLOUT_RADIUS * 2,
      };
    case 'text': {
      const label =
        annotation.annotationClass === 'change-request' ? annotation.label : '';
      return textBounds(g.origin, g.fontSize, label);
    }
  }
}

/** Distance from point p to the line segment ab, in page pixels. */
function pointToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return distance(p, a);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}

/** Whether a page-space point lies within a rectangle, with padding. */
function inRect(p: Point, r: Rect, pad: number): boolean {
  return (
    p.x >= r.x - pad &&
    p.x <= r.x + r.w + pad &&
    p.y >= r.y - pad &&
    p.y <= r.y + r.h + pad
  );
}

/** Whether the page-space point hits the annotation. */
export function hitTestAnnotation(annotation: Annotation, p: Point): boolean {
  const g = annotation.geometry;
  switch (g.kind) {
    case 'rectangle':
    case 'ellipse':
    case 'highlight':
      return inRect(p, g.rect, 5);
    case 'arrow':
      return pointToSegment(p, g.from, g.to) <= HIT_SLOP;
    case 'freehand': {
      const pts = g.points;
      if (pts.length === 1) return distance(p, pts[0]!) <= HIT_SLOP;
      for (let i = 1; i < pts.length; i++) {
        if (pointToSegment(p, pts[i - 1]!, pts[i]!) <= HIT_SLOP) return true;
      }
      return false;
    }
    case 'callout':
      return distance(p, g.anchor) <= CALLOUT_RADIUS;
    case 'text':
      return inRect(p, annotationBounds(annotation), 5);
  }
}

/** The topmost (most recently drawn) annotation hit by the point, or null. */
export function hitTestTopmost(
  annotations: Annotation[],
  p: Point,
): Annotation | null {
  for (let i = annotations.length - 1; i >= 0; i--) {
    if (hitTestAnnotation(annotations[i]!, p)) return annotations[i]!;
  }
  return null;
}
