/** The select tool: pick, drag to reposition, and re-edit existing annotations. */

import type { Tool, ToolContext } from './Tool';
import type { Annotation, Geometry } from '../../model/annotation';
import type { Point } from '../../model/geometry';
import { clientToPage } from '../../model/geometry';
import {
  cloneGeometry,
  hitTestTopmost,
  translateGeometry,
} from '../../model/geometryOps';

/** Max gap (ms) between clicks on one annotation to count as a double-click. */
const DOUBLE_CLICK_MS = 350;

interface Drag {
  id: string;
  before: Geometry;
  last: Point;
  moved: boolean;
}

export class SelectTool implements Tool {
  readonly id = 'select' as const;
  private drag: Drag | null = null;
  private lastClick: { time: number; id: string } = { time: 0, id: '' };

  onPointerDown(ev: PointerEvent, ctx: ToolContext): void {
    const point = clientToPage(ev.clientX, ev.clientY);
    const hit = hitTestTopmost(ctx.doc.annotations, point);
    ctx.setSelectedId(hit ? hit.id : null);
    if (!hit) {
      this.lastClick = { time: 0, id: '' };
      return;
    }

    const now = Date.now();
    const isDoubleClick =
      hit.annotationClass === 'change-request' &&
      hit.geometry.kind !== 'textedit' &&
      this.lastClick.id === hit.id &&
      now - this.lastClick.time < DOUBLE_CLICK_MS;
    this.lastClick = { time: now, id: hit.id };

    if (isDoubleClick) {
      ctx.editLabel(hit.id);
      return;
    }
    // a text edit is pinned to its element: selectable, but not draggable
    if (hit.geometry.kind === 'textedit') return;
    this.drag = {
      id: hit.id,
      before: cloneGeometry(hit.geometry),
      last: point,
      moved: false,
    };
  }

  onPointerMove(ev: PointerEvent, ctx: ToolContext): void {
    const point = clientToPage(ev.clientX, ev.clientY);
    if (!this.drag) {
      const over = hitTestTopmost(ctx.doc.annotations, point);
      ctx.setCursor(over ? 'move' : 'default');
      return;
    }
    const annotation = this.find(ctx, this.drag.id);
    if (!annotation) return;
    translateGeometry(
      annotation.geometry,
      point.x - this.drag.last.x,
      point.y - this.drag.last.y,
    );
    this.drag.last = point;
    this.drag.moved = true;
    ctx.render();
  }

  onPointerUp(_ev: PointerEvent, ctx: ToolContext): void {
    if (!this.drag) return;
    const drag = this.drag;
    this.drag = null;
    if (!drag.moved) return;
    const annotation = this.find(ctx, drag.id);
    if (annotation) {
      ctx.recordMove(drag.id, drag.before, cloneGeometry(annotation.geometry));
    }
  }

  onPointerCancel(ctx: ToolContext): void {
    if (!this.drag) return;
    const annotation = this.find(ctx, this.drag.id);
    if (annotation) {
      (annotation as { geometry: Geometry }).geometry = cloneGeometry(
        this.drag.before,
      );
    }
    this.drag = null;
    ctx.render();
  }

  private find(ctx: ToolContext, id: string): Annotation | undefined {
    return ctx.doc.annotations.find((a) => a.id === id);
  }
}
