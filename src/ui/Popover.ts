/**
 * A dropdown panel anchored under a toolbar trigger button. At most one
 * popover is open across the whole toolbar; opening one closes any other.
 */

/** Gap kept between a popover and the viewport edge. */
const EDGE_MARGIN = 8;

/** The popover currently open, if any. At most one across all instances. */
let openPopover: Popover | null = null;

/** Whether any popover is currently open. */
export function isPopoverOpen(): boolean {
  return openPopover !== null;
}

export class Popover {
  private opened = false;

  /**
   * @param host    The toolbar element. The panel is appended here and
   *                positioned within its coordinate space.
   * @param trigger The button that opens and closes the popover.
   * @param panel   The panel element, already filled with its controls.
   */
  constructor(
    private readonly host: HTMLElement,
    private readonly trigger: HTMLButtonElement,
    private readonly panel: HTMLElement,
  ) {
    host.appendChild(panel);
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });
    // a press on the panel's own padding must not start a toolbar drag
    panel.addEventListener('pointerdown', (e) => e.stopPropagation());
  }

  get isOpen(): boolean {
    return this.opened;
  }

  toggle(): void {
    if (this.opened) this.close();
    else this.show();
  }

  show(): void {
    if (this.opened) return;
    if (openPopover && openPopover !== this) openPopover.close();
    this.opened = true;
    openPopover = this;
    // position while still hidden but laid out, so it does not flash
    this.reposition();
    this.panel.classList.add('is-open');
    this.trigger.classList.add('is-open');
    document.addEventListener('pointerdown', this.onDocPointerDown, true);
  }

  close(): void {
    if (!this.opened) return;
    this.opened = false;
    if (openPopover === this) openPopover = null;
    this.panel.classList.remove('is-open');
    this.trigger.classList.remove('is-open');
    document.removeEventListener('pointerdown', this.onDocPointerDown, true);
  }

  /** Close when a pointer press lands outside both the panel and trigger. */
  private readonly onDocPointerDown = (e: PointerEvent): void => {
    const path = e.composedPath();
    if (path.includes(this.panel) || path.includes(this.trigger)) return;
    this.close();
  };

  /**
   * Place the panel just below the trigger, flipped above it when it would
   * not fit there, and clamped so it stays within the viewport.
   */
  private reposition(): void {
    const panelW = this.panel.offsetWidth;
    const panelH = this.panel.offsetHeight;
    const triggerRect = this.trigger.getBoundingClientRect();
    const hostLeft = this.host.getBoundingClientRect().left;

    const fitsBelow =
      triggerRect.bottom + panelH + 7 <= window.innerHeight - EDGE_MARGIN;
    const top = fitsBelow
      ? this.trigger.offsetTop + this.trigger.offsetHeight + 7
      : this.trigger.offsetTop - panelH - 7;

    const centered =
      this.trigger.offsetLeft + this.trigger.offsetWidth / 2 - panelW / 2;
    const minLeft = EDGE_MARGIN - hostLeft;
    const maxLeft = window.innerWidth - EDGE_MARGIN - panelW - hostLeft;
    const left = clamp(centered, minLeft, Math.max(minLeft, maxLeft));

    this.panel.style.left = `${left}px`;
    this.panel.style.top = `${top}px`;
  }
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(Math.max(value, lo), hi);
}
