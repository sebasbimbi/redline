/** The freehand tool: draw a pressure-aware pencil stroke. */

import type { Tool, ToolContext } from './Tool';
import type {
  FreehandShape,
  PressurePoint,
  StrokeStyle,
  VisualEmphasisAnnotation,
} from '../../model/annotation';
import { clientToPage } from '../../model/geometry';
import { uid } from '../../platform/ids';

interface Drag {
  annotation: VisualEmphasisAnnotation;
  shape: FreehandShape;
}

export class FreehandTool implements Tool {
  readonly id = 'freehand' as const;
  private drag: Drag | null = null;

  onPointerDown(ev: PointerEvent, ctx: ToolContext): void {
    const style: StrokeStyle = {
      color: ctx.doc.activeColor,
      width: ctx.doc.activeStrokeWidth,
    };
    const shape: FreehandShape = {
      kind: 'freehand',
      points: [toPressurePoint(ev)],
      style,
    };
    const annotation: VisualEmphasisAnnotation = {
      id: uid(),
      createdAt: new Date().toISOString(),
      annotationClass: 'visual-emphasis',
      geometry: shape,
    };
    this.drag = { annotation, shape };
    ctx.setDraft(annotation);
  }

  onPointerMove(ev: PointerEvent, ctx: ToolContext): void {
    if (!this.drag) return;
    for (const sample of coalesced(ev)) {
      this.drag.shape.points.push(toPressurePoint(sample));
    }
    ctx.render();
  }

  onPointerUp(_ev: PointerEvent, ctx: ToolContext): void {
    if (!this.drag) return;
    const { annotation, shape } = this.drag;
    this.drag = null;
    ctx.setDraft(null);
    if (shape.points.length > 2) ctx.addAnnotation(annotation);
  }

  onPointerCancel(ctx: ToolContext): void {
    this.drag = null;
    ctx.setDraft(null);
  }
}

/** Convert a pointer event to a page-space pressure point. */
function toPressurePoint(ev: PointerEvent): PressurePoint {
  const page = clientToPage(ev.clientX, ev.clientY);
  return { x: page.x, y: page.y, pressure: ev.pressure || 0.5 };
}

/** The high-frequency samples behind a pointermove, or the event itself. */
function coalesced(ev: PointerEvent): PointerEvent[] {
  const events = ev.getCoalescedEvents();
  return events.length > 0 ? events : [ev];
}
