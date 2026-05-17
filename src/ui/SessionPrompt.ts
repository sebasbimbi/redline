/** A small dialog offering to resume saved annotations or start fresh. */

export interface SessionPromptOptions {
  /** How many saved annotations the page has. */
  count: number;
  onResume: () => void;
  onFresh: () => void;
}

export class SessionPrompt {
  private el: HTMLElement | null = null;
  private onFresh: (() => void) | null = null;

  constructor(private readonly root: ShadowRoot) {}

  get isOpen(): boolean {
    return this.el !== null;
  }

  open(opts: SessionPromptOptions): void {
    this.close();
    this.onFresh = opts.onFresh;

    const el = document.createElement('div');
    el.className = 'redline-session-prompt';

    const title = document.createElement('div');
    title.className = 'redline-session-title';
    title.textContent = 'Saved annotations found';

    const noun = opts.count === 1 ? 'annotation' : 'annotations';
    const text = document.createElement('div');
    text.className = 'redline-session-text';
    text.textContent =
      `This page has ${opts.count} saved ${noun} from a previous ` +
      'session. Resume where you left off, or start fresh.';

    const actions = document.createElement('div');
    actions.className = 'redline-session-actions';

    const freshBtn = document.createElement('button');
    freshBtn.type = 'button';
    freshBtn.className = 'redline-btn';
    freshBtn.textContent = 'Start fresh';
    freshBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
      opts.onFresh();
    });

    const resumeBtn = document.createElement('button');
    resumeBtn.type = 'button';
    resumeBtn.className = 'redline-btn redline-btn-primary';
    resumeBtn.textContent = 'Resume';
    resumeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.close();
      opts.onResume();
    });

    actions.append(freshBtn, resumeBtn);
    el.append(title, text, actions);
    this.el = el;
    this.root.appendChild(el);
  }

  /** Dismiss the prompt as "start fresh" (used for the Escape key). */
  dismiss(): void {
    const onFresh = this.onFresh;
    this.close();
    onFresh?.();
  }

  close(): void {
    this.el?.remove();
    this.el = null;
    this.onFresh = null;
  }
}
