/** The floating Redline toolbar. Phase 2: callout tool, copy, save, close. */

export interface ToolbarOptions {
  onCopy: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onClose: () => void;
}

export class Toolbar {
  readonly el: HTMLElement;
  private readonly copyBtn: HTMLButtonElement;
  private readonly saveBtn: HTMLButtonElement;
  private readonly saveAsBtn: HTMLButtonElement;

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

    this.copyBtn = makeButton(
      'Copy',
      'redline-btn',
      'Copy the screenshot and changelog to the clipboard',
    );
    this.copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onCopy();
    });

    // Save is a split button: "Save" plus a caret to pick a different folder.
    this.saveBtn = makeButton(
      'Save',
      'redline-btn redline-btn-primary redline-split-main',
      'Save the export into your project folder',
    );
    this.saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onSave();
    });
    this.saveAsBtn = makeButton(
      '▾',
      'redline-btn redline-btn-primary redline-split-more',
      'Save to a different folder',
    );
    this.saveAsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onSaveAs();
    });
    const saveGroup = document.createElement('span');
    saveGroup.className = 'redline-save-group';
    saveGroup.append(this.saveBtn, this.saveAsBtn);

    const closeBtn = makeButton(
      '✕',
      'redline-btn redline-btn-icon',
      'Close Redline (Esc)',
    );
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onClose();
    });

    this.el.append(
      wordmark,
      divider,
      calloutBtn,
      this.copyBtn,
      saveGroup,
      closeBtn,
    );
  }

  /** Disable the export buttons while a copy or save is in progress. */
  setBusy(busy: boolean): void {
    this.copyBtn.disabled = busy;
    this.saveBtn.disabled = busy;
    this.saveAsBtn.disabled = busy;
  }
}

function makeButton(
  label: string,
  className: string,
  title: string,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.title = title;
  return button;
}
