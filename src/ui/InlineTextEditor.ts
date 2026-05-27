/** In-place editing of a page element's text, for the text-edit tool. */

export interface InlineTextEditorOptions {
  /** The user finished the edit (Cmd/Ctrl+Enter, or a press anywhere else). */
  onCommit: () => void;
  /** The user abandoned the edit (Escape). */
  onCancel: () => void;
  /**
   * A node that bounds the editor's surrounding UI (e.g., a toolbar's shadow
   * host). Pointer presses whose composed path includes this node do NOT
   * auto-commit the edit, so the caller can react to a toolbar click without
   * the editor silently committing first. The edit still commits on
   * Cmd/Ctrl+Enter, cancels on Escape, and commits on a press anywhere else
   * outside the edited element.
   */
  ownUiRoot?: Node;
}

/**
 * Makes one page element `contenteditable` so the user can rewrite its text
 * directly on the page. Plain text only. Commits on Cmd/Ctrl+Enter or a press
 * away from the element (and outside any `ownUiRoot` the caller supplies);
 * cancels on Escape.
 *
 * This class owns only the editing mechanics. It does not read, normalize, or
 * restore the element's content. The caller snapshots the element before
 * `open`, reads the result on commit, and restores it on cancel.
 */
export class InlineTextEditor {
  private element: HTMLElement | null = null;
  private opts: InlineTextEditorOptions | null = null;
  private done = false;
  /** The element's `contenteditable` attribute before editing, for restore. */
  private prevContentEditable: string | null = null;
  /** The element's inline `style` attribute before editing, for restore. */
  private prevStyle: string | null = null;

  get isOpen(): boolean {
    return this.element !== null;
  }

  /** Make `element` editable and focus it. */
  open(element: HTMLElement, opts: InlineTextEditorOptions): void {
    this.close();
    this.element = element;
    this.opts = opts;
    this.done = false;

    this.prevContentEditable = element.getAttribute('contenteditable');
    this.prevStyle = element.getAttribute('style');
    // 'plaintext-only' editing keeps the result free of nested markup and
    // strips formatting from pasted content, with no extra handling.
    element.setAttribute('contenteditable', 'plaintext-only');
    element.style.outline = '2px solid #0091ff';
    element.style.outlineOffset = '2px';
    element.style.cursor = 'text';

    element.addEventListener('keydown', this.onKeyDown, true);
    document.addEventListener('pointerdown', this.onDocPointerDown, true);

    element.focus();
    selectAllText(element);
  }

  /**
   * Stop editing and restore the element's `contenteditable` and `style`
   * attributes. Does not fire either callback; `finish` does that.
   */
  close(): void {
    const el = this.element;
    if (!el) return;
    el.removeEventListener('keydown', this.onKeyDown, true);
    document.removeEventListener('pointerdown', this.onDocPointerDown, true);
    if (this.prevContentEditable === null) {
      el.removeAttribute('contenteditable');
    } else {
      el.setAttribute('contenteditable', this.prevContentEditable);
    }
    if (this.prevStyle === null) el.removeAttribute('style');
    else el.setAttribute('style', this.prevStyle);
    el.blur();
    this.element = null;
    this.opts = null;
  }

  private finish(commit: boolean): void {
    if (this.done) return;
    this.done = true;
    const opts = this.opts;
    this.close();
    if (!opts) return;
    if (commit) opts.onCommit();
    else opts.onCancel();
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    // keep editing keystrokes away from the page's own shortcut handlers
    e.stopPropagation();
    if (e.key === 'Escape') {
      e.preventDefault();
      this.finish(false);
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      this.finish(true);
    }
  };

  private readonly onDocPointerDown = (e: Event): void => {
    const el = this.element;
    if (!el) return;
    const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
    if (path.includes(el)) return; // a press inside the edited element
    const ownUi = this.opts?.ownUiRoot;
    if (ownUi && path.includes(ownUi)) return; // a press inside the editor's own UI
    this.finish(true); // a press anywhere else commits the edit
  };
}

/** Select all of an element's text, so the user can type to replace it. */
function selectAllText(el: HTMLElement): void {
  try {
    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  } catch {
    /* selection APIs are best-effort; editing still works without them */
  }
}
