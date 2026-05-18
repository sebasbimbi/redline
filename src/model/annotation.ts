/** The annotation data model. */

import type { Point, Rect, ViewportPercent } from './geometry';

/** Tool identifiers. Each tool belongs to one of two annotation classes. */
export type ToolId =
  | 'rectangle'
  | 'ellipse'
  | 'arrow'
  | 'freehand'
  | 'highlight'
  | 'measure'
  | 'callout'
  | 'text';

export type AnnotationClass = 'visual-emphasis' | 'change-request';

/** Everything the editor can route pointer input to: the 7 tools plus Select. */
export type EditorTool = ToolId | 'select';

/**
 * Which class each tool produces. Change-request annotations are numbered,
 * labeled, element-anchored, and appear in the exported changelog. Visual-
 * emphasis annotations are drawn onto the screenshot only.
 */
export const TOOL_CLASS: Record<ToolId, AnnotationClass> = {
  rectangle: 'visual-emphasis',
  ellipse: 'visual-emphasis',
  arrow: 'visual-emphasis',
  freehand: 'visual-emphasis',
  highlight: 'visual-emphasis',
  measure: 'visual-emphasis',
  callout: 'change-request',
  text: 'change-request',
};

/** Stroke styling shared by the shape tools. */
export interface StrokeStyle {
  color: string;
  width: number;
}

/** A freehand sample point. `pressure` is 0..1 (0.5 when unavailable). */
export interface PressurePoint extends Point {
  pressure: number;
}

// --- Per-tool geometry (discriminated union on `kind`) ---------------------

export interface RectangleShape {
  kind: 'rectangle';
  rect: Rect;
  style: StrokeStyle;
}
export interface EllipseShape {
  kind: 'ellipse';
  rect: Rect;
  style: StrokeStyle;
}
export interface ArrowShape {
  kind: 'arrow';
  from: Point;
  to: Point;
  style: StrokeStyle;
}
export interface FreehandShape {
  kind: 'freehand';
  points: PressurePoint[];
  style: StrokeStyle;
}
export interface HighlightShape {
  kind: 'highlight';
  rect: Rect;
  color: string;
}
export interface MeasureShape {
  kind: 'measure';
  from: Point;
  to: Point;
  style: StrokeStyle;
}
export interface CalloutShape {
  kind: 'callout';
  /** The point the numbered marker pins to, in page coordinates. */
  anchor: Point;
  color: string;
}
export interface TextShape {
  kind: 'text';
  origin: Point;
  fontSize: number;
  color: string;
}

export type Geometry =
  | RectangleShape
  | EllipseShape
  | ArrowShape
  | FreehandShape
  | HighlightShape
  | MeasureShape
  | CalloutShape
  | TextShape;

// --- Rich element metadata -------------------------------------------------

/**
 * A snapshot of the DOM element a change-request annotation points at,
 * captured once at draw time. Never a live element reference (a live
 * reference would break on SPA re-render). The redundant fields give an AI
 * coding assistant several independent ways to relocate the element.
 */
export interface ElementMetadata {
  /** Primary unique selector (from @medv/finder). */
  selector: string;
  /** Readable ancestry, e.g. "main > div.card > h2". Not guaranteed unique. */
  selectorPath: string;
  /** XPath fallback locator. */
  xpath: string;
  /**
   * True when the element is inside a shadow root. The locators above then
   * point at the outermost shadow host, since a shadow-scoped element has no
   * document-resolvable selector.
   */
  inShadowDom: boolean;
  tag: string;
  id: string | null;
  classList: string[];
  /** ARIA role (explicit, or a best-effort implicit role). */
  role: string | null;
  /** Accessible name (aria-label, aria-labelledby, title, or img alt). */
  ariaLabel: string | null;
  /** Trimmed textContent, capped at ~120 characters. */
  textSnippet: string | null;
  /** Every data-* attribute on the element. */
  dataAttributes: Record<string, string>;
  /** Bounding box at capture time, in page coordinates. */
  boundingBox: Rect;
  /** Bounding box as a percentage of the viewport. */
  viewportPercent: ViewportPercent;
  /** Text describing the nearest landmark region. */
  nearbyLandmark: string | null;
  /** Parent element summary, for disambiguation. */
  parentContext: string | null;
}

// --- The annotation --------------------------------------------------------

interface AnnotationBase {
  id: string;
  createdAt: string; // ISO 8601
  geometry: Geometry;
}

export interface VisualEmphasisAnnotation extends AnnotationBase {
  annotationClass: 'visual-emphasis';
  geometry:
    | RectangleShape
    | EllipseShape
    | ArrowShape
    | FreehandShape
    | HighlightShape
    | MeasureShape;
}

export interface ChangeRequestAnnotation extends AnnotationBase {
  annotationClass: 'change-request';
  geometry: CalloutShape | TextShape;
  /** 1-based; resequenced on every add/delete so numbers stay contiguous. */
  number: number;
  /** The requested change. Empty until the user types a label. */
  label: string;
  /** Snapshot of the anchored element, or null if drawn over empty space. */
  element: ElementMetadata | null;
}

export type Annotation = VisualEmphasisAnnotation | ChangeRequestAnnotation;

/** Type guard: is this annotation a numbered, labeled change request? */
export function isChangeRequest(a: Annotation): a is ChangeRequestAnnotation {
  return a.annotationClass === 'change-request';
}
