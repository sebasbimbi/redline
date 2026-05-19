/** The text tool: place an editable text annotation (a change request). */

import type { Tool, ToolContext } from './Tool';
import type { ChangeRequestAnnotation } from '../../model/annotation';
import { clientToPage } from '../../model/geometry';
import { changeRequestCount } from '../../model/document';
import { captureMetadata } from '../../selector/captureMetadata';
import { uid } from '../../platform/ids';

/** Default on-canvas font size for a new text annotation. */
const TEXT_FONT_SIZE = 16;

export class TextTool implements Tool {
  readonly id = 'text' as const;

  onPointerMove(ev: PointerEvent, ctx: ToolContext): void {
    ctx.inspectAt(ev.clientX, ev.clientY);
  }

  onPointerDown(ev: PointerEvent, ctx: ToolContext): void {
    // The hover already tracked this element; only re-run the hit-test when
    // the pointer arrived with no prior move (touch). See CalloutTool.
    if (!ctx.pickedElement()) ctx.inspectAt(ev.clientX, ev.clientY);
    this.commit(ev.clientX, ev.clientY, ctx);
  }

  onConfirm(ctx: ToolContext): void {
    const point = ctx.lastInspectPoint();
    if (point) this.commit(point.x, point.y, ctx);
  }

  /** Place a text note anchored to the inspector's current element. */
  private commit(clientX: number, clientY: number, ctx: ToolContext): void {
    const target = ctx.pickedElement();
    const annotation: ChangeRequestAnnotation = {
      id: uid(),
      createdAt: new Date().toISOString(),
      annotationClass: 'change-request',
      geometry: {
        kind: 'text',
        origin: clientToPage(clientX, clientY),
        fontSize: TEXT_FONT_SIZE,
        color: ctx.doc.activeColor,
      },
      number: changeRequestCount(ctx.doc) + 1,
      label: '',
      element: target ? captureMetadata(target) : null,
    };
    ctx.placeChangeRequest(annotation);
  }
}
