/** The tool interface and the services a tool may use. */

import type { ToolId } from '../../model/annotation';
import type { RedlineDocument } from '../../model/document';
import type { ElementPicker } from '../ElementPicker';

/** Services the drawing engine exposes to the active tool. */
export interface ToolContext {
  readonly doc: RedlineDocument;
  readonly picker: ElementPicker;
  /** Request a repaint of the annotation canvas. */
  render(): void;
  /** Open the inline label editor for a change-request annotation. */
  editLabel(annotationId: string): void;
}

/** A drawing tool. Phase 1 ships only the callout tool. */
export interface Tool {
  readonly id: ToolId;
  onPointerDown(ev: PointerEvent, ctx: ToolContext): void;
  onPointerMove?(ev: PointerEvent, ctx: ToolContext): void;
  onPointerUp?(ev: PointerEvent, ctx: ToolContext): void;
}
