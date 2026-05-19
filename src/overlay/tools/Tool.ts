/** The tool interface and the services a tool may use. */

import type {
  Annotation,
  ChangeRequestAnnotation,
  EditorTool,
  Geometry,
} from '../../model/annotation';
import type { RedlineDocument } from '../../model/document';

/** Services the drawing engine exposes to the active tool. */
export interface ToolContext {
  readonly doc: RedlineDocument;
  /**
   * Point the element inspector at viewport coordinates. The element-anchored
   * tools call this on every pointer move to highlight the target element.
   */
  inspectAt(clientX: number, clientY: number): void;
  /**
   * The page element the inspector is locked onto, after any keyboard
   * tree-traversal. The element-anchored tools read this to anchor a new
   * change request. Null when nothing is under the cursor.
   */
  pickedElement(): Element | null;
  /**
   * The last cursor position the inspector tracked, in viewport coordinates,
   * or null when it has no target. Used to place a change request committed
   * by the Enter key rather than by a pointer click.
   */
  lastInspectPoint(): { x: number; y: number } | null;
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
  /**
   * Begin an in-place text edit: make the picked element editable on the page.
   * The annotation is committed only if the user actually changes the text.
   */
  beginTextEdit(annotation: ChangeRequestAnnotation, element: HTMLElement): void;
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
  /**
   * Commit the element the inspector is currently locked onto, with no pointer
   * click. Wired to the Enter key for the element-anchored tools, so a
   * keyboard tree-walk commits exactly as walked, with no hit-test re-run that
   * an animated page could resolve to a different element.
   */
  onConfirm?(ctx: ToolContext): void;
}
