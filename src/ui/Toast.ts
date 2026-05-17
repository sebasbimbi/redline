/** Transient status messages shown at the bottom of the viewport. */

export interface ToastOptions {
  durationMs?: number;
  tone?: 'info' | 'error';
}

/** A toast that stays visible until explicitly closed. */
export class ProgressToast {
  constructor(private readonly el: HTMLElement) {}

  update(message: string): void {
    this.el.textContent = message;
  }

  close(): void {
    this.el.classList.remove('is-visible');
    window.setTimeout(() => this.el.remove(), 220);
  }
}

export class Toast {
  private readonly stack: HTMLElement;

  constructor(root: ShadowRoot) {
    this.stack = document.createElement('div');
    this.stack.className = 'redline-toast-stack';
    root.appendChild(this.stack);
  }

  show(message: string, opts: ToastOptions = {}): void {
    const toast = document.createElement('div');
    toast.className = 'redline-toast';
    if (opts.tone === 'error') toast.classList.add('is-error');
    toast.textContent = message;
    this.stack.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('is-visible'));

    const duration = opts.durationMs ?? 3200;
    window.setTimeout(() => {
      toast.classList.remove('is-visible');
      window.setTimeout(() => toast.remove(), 220);
    }, duration);
  }

  /** Show a toast that stays until the returned handle is closed. */
  beginProgress(message: string): ProgressToast {
    const toast = document.createElement('div');
    toast.className = 'redline-toast';
    toast.textContent = message;
    this.stack.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));
    return new ProgressToast(toast);
  }

  destroy(): void {
    this.stack.remove();
  }
}
