/** The text-edit tool: rewrite a page element's text in place. */

import type { Tool, ToolContext } from './Tool';
import type { ChangeRequestAnnotation } from '../../model/annotation';
import { changeRequestCount } from '../../model/document';
import { captureMetadata } from '../../selector/captureMetadata';
import { uid } from '../../platform/ids';

/** Elements whose text is not editable in place; use a callout for these. */
const FORM_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'OPTION']);

/**
 * Click a text element to rewrite it directly on the page. Moving the cursor
 * highlights the element under it; the arrow keys walk the DOM tree to
 * retarget it, exactly as for the callout tool. The picked element then turns
 * editable in place, and the before and after text become the change request.
 *
 * The tool only builds a draft annotation and hands off to the controller's
 * `beginTextEdit`; the controller owns the editing session and decides whether
 * the edit produced a real change worth keeping.
 */
export class TextEditTool implements Tool {
  readonly id = 'textedit' as const;

  onPointerMove(ev: PointerEvent, ctx: ToolContext): void {
    ctx.inspectAt(ev.clientX, ev.clientY);
  }

  onPointerDown(ev: PointerEvent, ctx: ToolContext): void {
    ctx.inspectAt(ev.clientX, ev.clientY);
    const target = ctx.pickedElement();
    if (!(target instanceof HTMLElement)) return;
    if (target === document.body || target === document.documentElement) return;
    if (FORM_TAGS.has(target.tagName)) return;

    const metadata = captureMetadata(target);
    const annotation: ChangeRequestAnnotation = {
      id: uid(),
      createdAt: new Date().toISOString(),
      annotationClass: 'change-request',
      geometry: {
        kind: 'textedit',
        box: metadata.boundingBox,
        color: ctx.doc.activeColor,
        // oldText and newText are filled in by the controller on commit
        oldText: '',
        newText: '',
        hasInlineMarkup: target.childElementCount > 0,
      },
      number: changeRequestCount(ctx.doc) + 1,
      label: '',
      element: metadata,
    };
    ctx.beginTextEdit(annotation, target);
  }
}
