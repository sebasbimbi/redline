/** Identifies the page element under a pointer, ignoring Redline's own UI. */
export class ElementPicker {
  constructor(private readonly isOwnElement: (el: Element) => boolean) {}

  /**
   * The topmost page element at the given viewport coordinates. Descends
   * through open shadow roots to reach the real target; a closed shadow root
   * or a cross-origin iframe cannot be pierced, so the host element (or the
   * `<iframe>`) is returned and its tag is recorded in the metadata. Redline's
   * own canvas and UI are skipped.
   */
  pickAt(clientX: number, clientY: number): Element | null {
    let root: DocumentOrShadowRoot = document;
    let found: Element | null = null;
    // bounded so a pathological shadow nesting cannot loop forever
    for (let depth = 0; depth < 12; depth += 1) {
      const hit = this.topElement(root, clientX, clientY);
      if (!hit) break;
      found = hit;
      if (!hit.shadowRoot) break; // closed root, iframe, or no root: stop here
      root = hit.shadowRoot;
    }
    return found;
  }

  /** The topmost element at the point within one document or shadow root. */
  private topElement(
    root: DocumentOrShadowRoot,
    clientX: number,
    clientY: number,
  ): Element | null {
    for (const el of root.elementsFromPoint(clientX, clientY)) {
      if (!this.isOwnElement(el)) return el;
    }
    return null;
  }
}
