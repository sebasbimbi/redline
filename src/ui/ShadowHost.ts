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
    applyStyles(this.root);
  }

  mount(parent: Element): void {
    parent.appendChild(this.host);
  }

  unmount(): void {
    this.host.remove();
  }
}

/**
 * Attach the UI styles. A constructed stylesheet is used so that a strict page
 * Content-Security-Policy cannot block the styles the way it can block a
 * `<style>` element; the `<style>` path is a fallback for engines without
 * constructable stylesheets.
 */
function applyStyles(root: ShadowRoot): void {
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(UI_CSS);
    root.adoptedStyleSheets = [sheet];
  } catch {
    const style = document.createElement('style');
    style.textContent = UI_CSS;
    root.appendChild(style);
  }
}
