/** The callout tool: drop a numbered, element-anchored change request. */

import type { Tool, ToolContext } from './Tool';
import type { ChangeRequestAnnotation } from '../../model/annotation';
import { clientToPage } from '../../model/geometry';
import { resequence } from '../../model/document';
import { captureMetadata } from '../../selector/captureMetadata';
import { uid } from '../../platform/ids';

/**
 * Click anywhere to drop a numbered marker. The marker is anchored to the
 * element under the cursor (its selector and metadata are captured), and the
 * label editor opens so the user can type the requested change.
 */
export class CalloutTool implements Tool {
  readonly id = 'callout' as const;

  onPointerDown(ev: PointerEvent, ctx: ToolContext): void {
    const target = ctx.picker.pickAt(ev.clientX, ev.clientY);
    const now = new Date().toISOString();
    const annotation: ChangeRequestAnnotation = {
      id: uid(),
      createdAt: now,
      annotationClass: 'change-request',
      geometry: {
        kind: 'callout',
        anchor: clientToPage(ev.clientX, ev.clientY),
        color: ctx.doc.activeColor,
      },
      number: 0, // assigned by resequence()
      label: '',
      element: target ? captureMetadata(target) : null,
    };
    ctx.doc.annotations.push(annotation);
    ctx.doc.updatedAt = now;
    resequence(ctx.doc);
    ctx.render();
    ctx.editLabel(annotation.id);
  }
}
