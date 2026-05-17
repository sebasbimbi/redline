/** A docked panel listing every annotation, with select, edit, and delete. */

import type { Annotation } from '../model/annotation';
import { isChangeRequest } from '../model/annotation';
import type { RedlineDocument } from '../model/document';
import { annotationColor } from '../model/geometryOps';
import { ICONS } from './icons';

export interface SidePanelOptions {
  onSelect: (id: string) => void;
  onEditLabel: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

/** Display names for the visual-emphasis shapes. */
const SHAPE_NAMES: Record<string, string> = {
  rectangle: 'Rectangle',
  ellipse: 'Ellipse',
  arrow: 'Arrow',
  freehand: 'Freehand',
  highlight: 'Highlight',
};

export class SidePanel {
  readonly el: HTMLElement;
  private readonly countEl: HTMLElement;
  private readonly listEl: HTMLElement;
  private open = false;

  constructor(private readonly opts: SidePanelOptions) {
    this.el = document.createElement('div');
    this.el.className = 'redline-panel';

    const header = document.createElement('div');
    header.className = 'redline-panel-header';
    const titleWrap = document.createElement('span');
    titleWrap.append(document.createTextNode('Annotations '));
    this.countEl = document.createElement('span');
    this.countEl.className = 'redline-panel-count';
    this.countEl.textContent = '0';
    titleWrap.appendChild(this.countEl);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'redline-panel-close';
    closeBtn.title = 'Hide the panel';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.opts.onClose();
    });
    header.append(titleWrap, closeBtn);

    this.listEl = document.createElement('div');
    this.listEl.className = 'redline-panel-list';

    this.el.append(header, this.listEl);
  }

  get isOpen(): boolean {
    return this.open;
  }

  setOpen(open: boolean): void {
    this.open = open;
    this.el.classList.toggle('is-open', open);
  }

  /** Rebuild the annotation list from the document. */
  render(doc: RedlineDocument, selectedId: string | null): void {
    this.countEl.textContent = String(doc.annotations.length);
    this.listEl.replaceChildren();

    if (doc.annotations.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'redline-panel-empty';
      empty.textContent = 'No annotations yet. Pick a tool and mark the page.';
      this.listEl.appendChild(empty);
      return;
    }

    for (const annotation of doc.annotations) {
      this.listEl.appendChild(this.buildRow(annotation, selectedId));
    }
  }

  private buildRow(
    annotation: Annotation,
    selectedId: string | null,
  ): HTMLElement {
    const row = document.createElement('div');
    row.className = 'redline-panel-row';
    if (annotation.id === selectedId) row.classList.add('is-selected');
    row.addEventListener('click', () => this.opts.onSelect(annotation.id));

    const color = annotationColor(annotation);
    const label = document.createElement('span');
    label.className = 'redline-panel-label';

    if (isChangeRequest(annotation)) {
      const badge = document.createElement('span');
      badge.className = 'redline-panel-num';
      badge.style.background = color;
      badge.textContent = String(annotation.number);
      const text = annotation.label.trim();
      label.textContent = text || '(no label)';
      if (!text) label.classList.add('is-muted');
      row.append(badge, label);

      const editBtn = this.actionButton('Edit label');
      editBtn.innerHTML = ICONS.pencil;
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.opts.onEditLabel(annotation.id);
      });
      row.appendChild(editBtn);
    } else {
      const chip = document.createElement('span');
      chip.className = 'redline-panel-chip';
      chip.style.background = color;
      label.textContent = SHAPE_NAMES[annotation.geometry.kind] ?? 'Shape';
      label.classList.add('is-muted');
      row.append(chip, label);
    }

    const deleteBtn = this.actionButton('Delete');
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.opts.onDelete(annotation.id);
    });
    row.appendChild(deleteBtn);

    return row;
  }

  private actionButton(title: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'redline-panel-act';
    button.title = title;
    return button;
  }
}
