/** The Redline toolbar popup: activate the overlay and edit default settings. */

import { browser } from 'wxt/browser';
import {
  COLORS,
  STROKE_WIDTHS,
  isCapturableUrl,
} from '../../src/platform/constants';
import { loadSettings, saveSettings } from '../../src/platform/settings';
import type {
  ActivateRequest,
  ActivateResponse,
} from '../../src/platform/messages';

const WIDTH_NAMES = ['Thin', 'Medium', 'Thick'];

async function init(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  app.append(
    el('div', 'title', 'Redline'),
    el('div', 'sub', 'Annotate the page, export to Claude Code.'),
  );
  app.append(await buildActivate());
  app.append(divider());
  app.append(await buildSettings());
}

/** The activate button, or an explanation if the page cannot be annotated. */
async function buildActivate(): Promise<HTMLElement> {
  const block = document.createElement('div');
  block.className = 'block';

  let tabUrl: string | undefined;
  try {
    const [tab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    tabUrl = tab?.url;
  } catch {
    tabUrl = undefined;
  }

  if (isCapturableUrl(tabUrl)) {
    const button = document.createElement('button');
    button.className = 'activate';
    button.textContent = 'Activate on this page';
    const hint = el(
      'div',
      'hint',
      'Or press Ctrl+Shift+M (Cmd+Shift+M on Mac).',
    );
    button.addEventListener('click', () => {
      void activate(button, hint);
    });
    block.append(button, hint);
  } else {
    block.append(
      el(
        'div',
        'msg',
        'Redline cannot run on this page. Open a regular web page ' +
          '(http or https) and try again.',
      ),
    );
  }
  return block;
}

/**
 * Send the activate request, then close the popup only after the service
 * worker confirms the overlay is injected.
 *
 * This is the fix for "the first click does nothing, the second works." A
 * Manifest V3 service worker sleeps when idle, so the first activate has to
 * wake it. The old code closed the popup the instant the message was sent;
 * tearing the sender down mid-wake dropped the message and the overlay
 * never mounted. The dropped attempt still woke the worker, so the next
 * click hit a warm worker and seemed to work "on the second try." Awaiting
 * the response keeps the popup, and the message channel, alive until the
 * overlay is actually mounted.
 */
async function activate(
  button: HTMLButtonElement,
  hint: HTMLElement,
): Promise<void> {
  button.disabled = true;
  button.textContent = 'Activating...';
  hint.classList.remove('error');
  try {
    const request: ActivateRequest = { type: 'activate' };
    const response = (await browser.runtime.sendMessage(request)) as
      | ActivateResponse
      | undefined;
    if (response && !response.ok) {
      throw new Error(response.error || 'Redline could not start.');
    }
    window.close();
  } catch (err) {
    button.disabled = false;
    button.textContent = 'Activate on this page';
    hint.textContent =
      err instanceof Error ? err.message : 'Redline could not start.';
    hint.classList.add('error');
  }
}

/** Default color, default stroke width, and the keyboard-shortcut link. */
async function buildSettings(): Promise<HTMLElement> {
  const block = document.createElement('div');
  block.className = 'block';
  const settings = await loadSettings();

  block.append(el('div', 'section-label', 'Default color'));
  const colorRow = document.createElement('div');
  colorRow.className = 'swatch-row';
  const colorButtons = new Map<string, HTMLButtonElement>();
  for (const color of COLORS) {
    const swatch = document.createElement('button');
    swatch.className = 'swatch';
    swatch.style.color = color;
    swatch.title = color;
    if (color === settings.defaultColor) swatch.classList.add('is-active');
    swatch.addEventListener('click', () => {
      settings.defaultColor = color;
      for (const [value, btn] of colorButtons) {
        btn.classList.toggle('is-active', value === color);
      }
      void saveSettings(settings);
    });
    colorButtons.set(color, swatch);
    colorRow.appendChild(swatch);
  }
  block.append(colorRow);

  block.append(el('div', 'section-label', 'Default stroke'));
  const widthRow = document.createElement('div');
  widthRow.className = 'width-row';
  const widthButtons = new Map<number, HTMLButtonElement>();
  STROKE_WIDTHS.forEach((width, i) => {
    const button = document.createElement('button');
    button.className = 'width';
    button.textContent = WIDTH_NAMES[i] ?? String(width);
    if (width === settings.defaultStrokeWidth) button.classList.add('is-active');
    button.addEventListener('click', () => {
      settings.defaultStrokeWidth = width;
      for (const [value, btn] of widthButtons) {
        btn.classList.toggle('is-active', value === width);
      }
      void saveSettings(settings);
    });
    widthButtons.set(width, button);
    widthRow.appendChild(button);
  });
  block.append(widthRow);

  const shortcut = document.createElement('button');
  shortcut.className = 'link';
  shortcut.textContent = 'Change keyboard shortcut';
  shortcut.addEventListener('click', () => {
    void browser.tabs.create({ url: shortcutsUrl() });
    window.close();
  });
  block.append(shortcut);

  return block;
}

/** The browser's extension-shortcuts page. */
function shortcutsUrl(): string {
  return navigator.userAgent.includes('Edg/')
    ? 'edge://extensions/shortcuts'
    : 'chrome://extensions/shortcuts';
}

function el(tag: string, className: string, text: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  node.textContent = text;
  return node;
}

function divider(): HTMLElement {
  const node = document.createElement('div');
  node.className = 'popup-divider';
  return node;
}

void init();
