/** An inline popover for typing a callout's change-request label. */

export interface LabelEditorOpenOptions {
  /** Viewport coordinates of the callout marker. */
  clientX: number;
  clientY: number;
  /** The callout number, shown as a badge. */
  numberLabel: string;
  /** Existing label text (empty for a new callout). */
  initialValue: string;
  /** Called with the trimmed value on Enter or blur. */
  onCommit: (label: string) => void;
  /** Called when the user presses Escape. */
  onCancel: () => void;
}

const EDITOR_WIDTH = 284;

export class LabelEditor {
  private el: HTMLElement | null = null;

  constructor(private readonly root: ShadowRoot) {}

  get isOpen(): boolean {
    return this.el !== null;
  }

  open(opts: LabelEditorOpenOptions): void {
    this.close();

    const el = document.createElement('div');
    el.className = 'redline-label-editor';

    const header = document.createElement('div');
    header.className = 'redline-row';
    const badge = document.createElement('span');
    badge.className = 'redline-badge';
    badge.textContent = opts.numberLabel;
    const headerText = document.createElement('span');
    headerText.className = 'redline-hint';
    headerText.textContent = 'Describe the change';
    header.append(badge, headerText);

    const textarea = document.createElement('textarea');
    textarea.rows = 3;
    textarea.placeholder = 'e.g. Make this heading larger and bold';
    textarea.value = opts.initialValue;

    const footer = document.createElement('div');
    footer.className = 'redline-row';
    const hint = document.createElement('span');
    hint.className = 'redline-hint';
    hint.textContent = 'Enter to save · Esc to discard';
    footer.append(hint);

    el.append(header, textarea, footer);

    let done = false;
    const finish = (commit: boolean): void => {
      if (done) return;
      done = true;
      const value = textarea.value.trim();
      this.close();
      if (commit) opts.onCommit(value);
      else opts.onCancel();
    };

    // Keep keystrokes from reaching the page (it may have its own shortcuts).
    textarea.addEventListener('keyup', (e) => e.stopPropagation());
    textarea.addEventListener('keypress', (e) => e.stopPropagation());
    textarea.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        finish(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finish(false);
      }
    });
    textarea.addEventListener('blur', () => finish(true));

    this.el = el;
    this.root.appendChild(el);
    this.position(el, opts.clientX, opts.clientY);
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }

  close(): void {
    this.el?.remove();
    this.el = null;
  }

  private position(el: HTMLElement, clientX: number, clientY: number): void {
    const margin = 12;
    const height = el.offsetHeight || 132;
    const left = clamp(
      clientX + 18,
      margin,
      window.innerWidth - EDITOR_WIDTH - margin,
    );
    const top = clamp(
      clientY + 18,
      margin,
      window.innerHeight - height - margin,
    );
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}
