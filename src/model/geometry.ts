/** Geometry primitives. Coordinates are in PAGE space unless noted otherwise. */

/** A point in page coordinates (viewport coordinates + scroll offset). */
export interface Point {
  x: number;
  y: number;
}

/** A rectangle in page coordinates. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Position and size expressed as percentages of the viewport. */
export interface ViewportPercent {
  top: number;
  left: number;
  width: number;
  height: number;
}

/** Convert viewport (client) coordinates to page coordinates. */
export function clientToPage(clientX: number, clientY: number): Point {
  return { x: clientX + window.scrollX, y: clientY + window.scrollY };
}

/** Convert page coordinates to viewport (client) coordinates. */
export function pageToClient(p: Point): Point {
  return { x: p.x - window.scrollX, y: p.y - window.scrollY };
}

/** Euclidean distance between two points. */
export function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
