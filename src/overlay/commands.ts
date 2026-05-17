/** Reversible document mutations recorded on the undo stack. */

import type { Annotation, Geometry } from '../model/annotation';
import type { RedlineDocument } from '../model/document';
import { resequence } from '../model/document';
import { cloneGeometry } from '../model/geometryOps';
import type { Command } from './UndoStack';

/** Mark the document as modified. */
function touch(doc: RedlineDocument): void {
  doc.updatedAt = new Date().toISOString();
}

/** Replace an annotation's geometry without widening its type at the call site. */
function setGeometry(annotation: Annotation, geometry: Geometry): void {
  (annotation as { geometry: Geometry }).geometry = geometry;
}

/** Add a new annotation to the document. */
export class AddAnnotationCommand implements Command {
  readonly label = 'Add annotation';
  private readonly index: number;

  constructor(
    private readonly doc: RedlineDocument,
    private readonly annotation: Annotation,
  ) {
    this.index = doc.annotations.length;
  }

  do(): void {
    if (this.doc.annotations.some((a) => a.id === this.annotation.id)) return;
    const at = Math.min(this.index, this.doc.annotations.length);
    this.doc.annotations.splice(at, 0, this.annotation);
    resequence(this.doc);
    touch(this.doc);
  }

  undo(): void {
    const i = this.doc.annotations.findIndex(
      (a) => a.id === this.annotation.id,
    );
    if (i < 0) return;
    this.doc.annotations.splice(i, 1);
    resequence(this.doc);
    touch(this.doc);
  }
}

/** Remove an annotation from the document. */
export class DeleteAnnotationCommand implements Command {
  readonly label = 'Delete annotation';
  private removed: Annotation | null = null;
  private index = -1;

  constructor(
    private readonly doc: RedlineDocument,
    private readonly id: string,
  ) {}

  do(): void {
    const i = this.doc.annotations.findIndex((a) => a.id === this.id);
    if (i < 0) return;
    this.removed = this.doc.annotations[i]!;
    this.index = i;
    this.doc.annotations.splice(i, 1);
    resequence(this.doc);
    touch(this.doc);
  }

  undo(): void {
    if (!this.removed) return;
    if (this.doc.annotations.some((a) => a.id === this.id)) return;
    const at = Math.min(this.index, this.doc.annotations.length);
    this.doc.annotations.splice(at, 0, this.removed);
    resequence(this.doc);
    touch(this.doc);
  }
}

/** Move an annotation from one geometry to another. */
export class MoveAnnotationCommand implements Command {
  readonly label = 'Move annotation';
  private readonly before: Geometry;
  private readonly after: Geometry;

  constructor(
    private readonly doc: RedlineDocument,
    private readonly id: string,
    before: Geometry,
    after: Geometry,
  ) {
    this.before = cloneGeometry(before);
    this.after = cloneGeometry(after);
  }

  do(): void {
    this.apply(this.after);
  }

  undo(): void {
    this.apply(this.before);
  }

  private apply(geometry: Geometry): void {
    const annotation = this.doc.annotations.find((a) => a.id === this.id);
    if (!annotation) return;
    setGeometry(annotation, cloneGeometry(geometry));
    touch(this.doc);
  }
}

/** Change the label text of a change-request annotation. */
export class EditLabelCommand implements Command {
  readonly label = 'Edit label';

  constructor(
    private readonly doc: RedlineDocument,
    private readonly id: string,
    private readonly before: string,
    private readonly after: string,
  ) {}

  do(): void {
    this.apply(this.after);
  }

  undo(): void {
    this.apply(this.before);
  }

  private apply(value: string): void {
    const annotation = this.doc.annotations.find((a) => a.id === this.id);
    if (annotation && annotation.annotationClass === 'change-request') {
      annotation.label = value;
      touch(this.doc);
    }
  }
}

/** Remove every annotation from the document. */
export class ClearAllCommand implements Command {
  readonly label = 'Clear all';
  private readonly removed: Annotation[];

  constructor(private readonly doc: RedlineDocument) {
    this.removed = [...doc.annotations];
  }

  do(): void {
    this.doc.annotations.length = 0;
    resequence(this.doc);
    touch(this.doc);
  }

  undo(): void {
    this.doc.annotations.length = 0;
    this.doc.annotations.push(...this.removed);
    resequence(this.doc);
    touch(this.doc);
  }
}
