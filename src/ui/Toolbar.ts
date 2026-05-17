/** The floating Redline toolbar. Phase 1: callout tool, export, close. */

export interface ToolbarOptions {
  onExport: () => void;
  onClose: () => void;
}

export class Toolbar {
  readonly el: HTMLElement;
  private readonly exportBtn: HTMLButtonElement;

  constructor(opts: ToolbarOptions) {
    this.el = document.createElement('div');
    this.el.className = 'redline-toolbar';

    const wordmark = document.createElement('span');
    wordmark.className = 'redline-wordmark';
    wordmark.textContent = 'Redline';

    const divider = document.createElement('span');
    divider.className = 'redline-divider';

    const calloutBtn = document.createElement('button');
    calloutBtn.type = 'button';
    calloutBtn.className = 'redline-btn is-active';
    calloutBtn.title = 'Callout tool';
    const dot = document.createElement('span');
    dot.className = 'redline-dot';
    calloutBtn.append(dot, document.createTextNode('Callout'));

    this.exportBtn = document.createElement('button');
    this.exportBtn.type = 'button';
    this.exportBtn.className = 'redline-btn redline-btn-primary';
    this.exportBtn.textContent = 'Export';
    this.exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onExport();
    });

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'redline-btn redline-btn-icon';
    closeBtn.textContent = '✕'; // multiplication x
    closeBtn.title = 'Close Redline (Esc)';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onClose();
    });

    this.el.append(wordmark, divider, calloutBtn, this.exportBtn, closeBtn);
  }

  /** Reflect export progress on the Export button. */
  setExporting(busy: boolean): void {
    this.exportBtn.disabled = busy;
    this.exportBtn.textContent = busy ? 'Exporting…' : 'Export';
  }
}
