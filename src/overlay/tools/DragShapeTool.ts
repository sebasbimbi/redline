/** Base class for two-point drag tools: rectangle, ellipse, arrow, highlight. */

import type { Tool, ToolContext } from './Tool';
import type {
  EditorTool,
  StrokeStyle,
  VisualEmphasisAnnotation,
} from '../../model/annotation';
import type { Point } from '../../model/geometry';
import { clientToPage, distance } from '../../model/geometry';
import { uid } from '../../platform/ids';

/** Below this drag distance (page px) a drag is treated as a stray click. */
const MIN_DRAG = 6;

interface Drag {
  start: Point;
  style: StrokeStyle;
  annotation: VisualEmphasisAnnotation;
}

export abstract class DragShapeTool implements Tool {
  abstract readonly id: EditorTool;
  private drag: Drag | null = null;

  /** Build the tool-specific geometry for the current drag endpoints. */
  protected abstract buildGeometry(
    start: Point,
    end: Point,
    style: StrokeStyle,
  ): VisualEmphasisAnnotation['geometry'];

  onPointerDown(ev: PointerEvent, ctx: ToolContext): void {
    const start = clientToPage(ev.clientX, ev.clientY);
    const style: StrokeStyle = {
      color: ctx.doc.activeColor,
      width: ctx.doc.activeStrokeWidth,
    };
    const annotation: VisualEmphasisAnnotation = {
      id: uid(),
      createdAt: new Date().toISOString(),
      annotationClass: 'visual-emphasis',
      geometry: this.buildGeometry(start, start, style),
    };
    this.drag = { start, style, annotation };
    ctx.setDraft(annotation);
  }

  onPointerMove(ev: PointerEvent, ctx: ToolContext): void {
    if (!this.drag) return;
    const end = clientToPage(ev.clientX, ev.clientY);
    this.drag.annotation.geometry = this.buildGeometry(
      this.drag.start,
      end,
      this.drag.style,
    );
    ctx.render();
  }

  onPointerUp(ev: PointerEvent, ctx: ToolContext): void {
    if (!this.drag) return;
    const { start, annotation } = this.drag;
    const end = clientToPage(ev.clientX, ev.clientY);
    this.drag = null;
    ctx.setDraft(null);
    if (distance(start, end) > MIN_DRAG) ctx.addAnnotation(annotation);
  }

  onPointerCancel(ctx: ToolContext): void {
    this.drag = null;
    ctx.setDraft(null);
  }
}
