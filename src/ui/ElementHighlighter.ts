/** A DevTools-style highlight box and info label for the element picker. */

/** Gap kept between the info label and the viewport edge, in pixels. */
const EDGE_MARGIN = 8;

/**
 * Draws a highlight box over a page element plus a small label naming it.
 * Lives in the Redline Shadow DOM, so a strict page Content-Security-Policy
 * cannot touch it, and the export step (which hides the whole UI host) keeps
 * it out of the captured screenshot.
 */
export class ElementHighlighter {
  private readonly box: HTMLElement;
  private readonly label: HTMLElement;
  private readonly nameEl: HTMLElement;
  private readonly dimsEl: HTMLElement;

  constructor(root: ShadowRoot) {
    this.box = div('redline-inspect-box');

    this.nameEl = div('redline-inspect-name');
    this.dimsEl = span('redline-inspect-dims');
    const hint = span('redline-inspect-hint');
    hint.textContent = '↑ parent / ↓ child / ↵ pick';
    const meta = div('redline-inspect-meta');
    meta.append(this.dimsEl, hint);

    this.label = div('redline-inspect-label');
    this.label.append(this.nameEl, meta);

    // appended before the toolbar and panel, so those always paint on top
    root.append(this.box, this.label);
  }

  /**
   * Highlight `rect` (in viewport coordinates) and name the element with
   * `name` and `dims`. Called on every pointer move while an element-anchored
   * tool is active, so it stays cheap: a few style writes and one measure.
   */
  show(rect: DOMRect, name: string, dims: string): void {
    this.box.style.left = `${rect.left}px`;
    this.box.style.top = `${rect.top}px`;
    this.box.style.width = `${Math.max(rect.width, 0)}px`;
    this.box.style.height = `${Math.max(rect.height, 0)}px`;
    this.box.classList.add('is-visible');

    this.nameEl.textContent = name;
    this.dimsEl.textContent = dims;
    this.label.classList.add('is-visible');

    // measuring forces a synchronous layout; place the label above the
    // element, flipping below it when there is no room above
    const labelWidth = this.label.offsetWidth;
    const labelHeight = this.label.offsetHeight;
    const above = rect.top - labelHeight - 4;
    const top = above >= EDGE_MARGIN ? above : rect.bottom + 4;
    const maxLeft = window.innerWidth - labelWidth - EDGE_MARGIN;
    const left = Math.max(EDGE_MARGIN, Math.min(rect.left, maxLeft));
    this.label.style.left = `${left}px`;
    this.label.style.top = `${top}px`;
  }

  /** Hide the highlight box and label. */
  hide(): void {
    this.box.classList.remove('is-visible');
    this.label.classList.remove('is-visible');
  }

  /** Remove the highlight elements from the DOM. */
  destroy(): void {
    this.box.remove();
    this.label.remove();
  }
}

function div(className: string): HTMLElement {
  const el = document.createElement('div');
  el.className = className;
  return el;
}

function span(className: string): HTMLElement {
  const el = document.createElement('span');
  el.className = className;
  return el;
}
