/** A Shadow DOM host that isolates the Redline UI from the page's styles. */

import { Z_UI } from '../platform/constants';
import { UI_CSS } from './ui.css';

export class ShadowHost {
  /** The light-DOM host element appended to the page. */
  readonly host: HTMLElement;
  /** The shadow root that UI components are appended into. */
  readonly root: ShadowRoot;

  constructor() {
    this.host = document.createElement('div');
    this.host.setAttribute('data-redline', 'ui-host');
    Object.assign(this.host.style, {
      position: 'fixed',
      inset: '0',
      margin: '0',
      padding: '0',
      border: '0',
      // the host itself never blocks pointers; children opt back in
      pointerEvents: 'none',
      zIndex: String(Z_UI),
    });
    this.root = this.host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = UI_CSS;
    this.root.appendChild(style);
  }

  mount(parent: Element): void {
    parent.appendChild(this.host);
  }

  unmount(): void {
    this.host.remove();
  }
}
