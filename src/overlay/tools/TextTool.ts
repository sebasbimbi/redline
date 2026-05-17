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

  onPointerDown(ev: PointerEvent, ctx: ToolContext): void {
    const target = ctx.picker.pickAt(ev.clientX, ev.clientY);
    const annotation: ChangeRequestAnnotation = {
      id: uid(),
      createdAt: new Date().toISOString(),
      annotationClass: 'change-request',
      geometry: {
        kind: 'text',
        origin: clientToPage(ev.clientX, ev.clientY),
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
