/** DevTools-style element inspection for the element-anchored tools. */

import type { ElementPicker } from './ElementPicker';
import type { ElementHighlighter } from '../ui/ElementHighlighter';

/**
 * Tracks the page element under the cursor for the callout and text tools and
 * lets the user walk up and down the DOM tree with the arrow keys. This is the
 * fix for elements a click cannot land on: a container fully covered by its
 * children (a React root, a wrapping section) is unreachable by a hit-test,
 * but one or two steps up the tree from a child reaches it. Drives the
 * on-screen ElementHighlighter.
 */
export class ElementInspector {
  private enabled = false;
  /** The deepest element under the cursor; the base for tree traversal. */
  private base: Element | null = null;
  /** How many parent steps above `base` the selection has walked. */
  private depth = 0;

  constructor(
    private readonly picker: ElementPicker,
    private readonly highlighter: ElementHighlighter,
  ) {}

  /** Turn inspection on for the element-anchored tools, off for the rest. */
  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    if (!enabled) this.clear();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** Whether the cursor is currently over a page element. */
  hasTarget(): boolean {
    return this.base !== null;
  }

  /**
   * Point the inspector at viewport coordinates. The traversal depth is kept
   * while the cursor stays over the same base element (so a click does not
   * undo a walk the user just made with the arrow keys) and reset the moment
   * it moves onto a different element.
   */
  moveTo(clientX: number, clientY: number): void {
    if (!this.enabled) return;
    const base = this.picker.pickAt(clientX, clientY);
    if (base !== this.base) {
      this.base = base;
      this.depth = 0;
    }
    this.refresh();
  }

  /** Walk one step up the tree, or back down toward the cursor. */
  traverse(up: boolean): void {
    if (!this.enabled || !this.base) return;
    if (up) {
      if (this.current()?.parentElement) this.depth += 1;
    } else if (this.depth > 0) {
      this.depth -= 1;
    }
    this.refresh();
  }

  /** The element a change request would anchor to, after any traversal. */
  current(): Element | null {
    let el = this.base;
    for (let step = 0; step < this.depth && el; step += 1) {
      el = el.parentElement;
    }
    return el;
  }

  /** Hide the highlight and forget the cursor position. */
  hide(): void {
    this.clear();
  }

  /** Drop the highlight elements. Call once, when the overlay closes. */
  destroy(): void {
    this.highlighter.destroy();
  }

  private clear(): void {
    this.base = null;
    this.depth = 0;
    this.highlighter.hide();
  }

  private refresh(): void {
    const el = this.current();
    if (!el) {
      this.highlighter.hide();
      return;
    }
    const rect = el.getBoundingClientRect();
    this.highlighter.show(rect, describe(el), formatDims(rect));
  }
}

/** A short, readable descriptor of an element: tag, id, and a class or two. */
function describe(el: Element): string {
  let out = el.tagName.toLowerCase();
  if (el.id) out += `#${truncate(el.id, 24)}`;
  const classes = Array.from(el.classList);
  for (const cls of classes.slice(0, 2)) {
    out += `.${truncate(cls, 18)}`;
  }
  if (classes.length > 2) out += '…';
  return out;
}

/** The element's rendered size, e.g. "1059 × 558". */
function formatDims(rect: DOMRect): string {
  return `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
