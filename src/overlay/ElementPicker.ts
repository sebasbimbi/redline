/** Identifies the page element under a pointer, ignoring Redline's own UI. */
export class ElementPicker {
  constructor(private readonly isOwnElement: (el: Element) => boolean) {}

  /**
   * The topmost page element at the given viewport coordinates, skipping
   * Redline's canvas and UI, or null if nothing is there.
   */
  pickAt(clientX: number, clientY: number): Element | null {
    const stack = document.elementsFromPoint(clientX, clientY);
    for (const el of stack) {
      if (!this.isOwnElement(el)) return el;
    }
    return null;
  }
}
