/** The tool interface and the services a tool may use. */

import type {
  Annotation,
  ChangeRequestAnnotation,
  EditorTool,
  Geometry,
} from '../../model/annotation';
import type { RedlineDocument } from '../../model/document';
import type { ElementPicker } from '../ElementPicker';

/** Services the drawing engine exposes to the active tool. */
export interface ToolContext {
  readonly doc: RedlineDocument;
  readonly picker: ElementPicker;
  /** Repaint the annotation canvas. */
  render(): void;
  /** Set or clear the in-progress preview annotation (a drag, before commit). */
  setDraft(annotation: Annotation | null): void;
  /** Commit a finished annotation to the document via the undo stack. */
  addAnnotation(annotation: Annotation): void;
  /**
   * Stage a change-request annotation: draw it as a draft and open the label
   * editor. It is committed only if the user saves a non-empty label.
   */
  placeChangeRequest(annotation: ChangeRequestAnnotation): void;
  /** Record a finished move (drag) on the undo stack. */
  recordMove(id: string, before: Geometry, after: Geometry): void;
  /** Delete an annotation via the undo stack. */
  deleteAnnotation(id: string): void;
  /** Open the inline label editor for an existing change-request annotation. */
  editLabel(id: string): void;
  /** The currently selected annotation id, or null. */
  getSelectedId(): string | null;
  /** Set (or clear) the selected annotation. */
  setSelectedId(id: string | null): void;
  /** Set the annotation canvas cursor. */
  setCursor(cursor: string): void;
}

/** A drawing or editing tool that consumes canvas pointer input. */
export interface Tool {
  readonly id: EditorTool;
  onPointerDown(ev: PointerEvent, ctx: ToolContext): void;
  onPointerMove?(ev: PointerEvent, ctx: ToolContext): void;
  onPointerUp?(ev: PointerEvent, ctx: ToolContext): void;
  /** Called when a drag is interrupted; the tool should discard any draft. */
  onPointerCancel?(ctx: ToolContext): void;
}
