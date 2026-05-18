/** The callout tool: drop a numbered, element-anchored change request. */

import type { Tool, ToolContext } from './Tool';
import type { ChangeRequestAnnotation } from '../../model/annotation';
import { clientToPage } from '../../model/geometry';
import { changeRequestCount } from '../../model/document';
import { captureMetadata } from '../../selector/captureMetadata';
import { uid } from '../../platform/ids';

/**
 * Click anywhere to drop a numbered marker anchored to the highlighted
 * element. Moving the cursor highlights the element under it; the arrow keys
 * walk up and down the DOM tree to retarget it. The label editor then opens
 * for the requested change; the callout is kept only if a non-empty label is
 * saved.
 */
export class CalloutTool implements Tool {
  readonly id = 'callout' as const;

  onPointerMove(ev: PointerEvent, ctx: ToolContext): void {
    ctx.inspectAt(ev.clientX, ev.clientY);
  }

  onPointerDown(ev: PointerEvent, ctx: ToolContext): void {
    ctx.inspectAt(ev.clientX, ev.clientY);
    const target = ctx.pickedElement();
    const annotation: ChangeRequestAnnotation = {
      id: uid(),
      createdAt: new Date().toISOString(),
      annotationClass: 'change-request',
      geometry: {
        kind: 'callout',
        anchor: clientToPage(ev.clientX, ev.clientY),
        color: ctx.doc.activeColor,
      },
      number: changeRequestCount(ctx.doc) + 1,
      label: '',
      element: target ? captureMetadata(target) : null,
    };
    ctx.placeChangeRequest(annotation);
  }
}
