/** The Redline toolbar popup: activate the overlay and edit default settings. */

import { browser } from 'wxt/browser';
import {
  COLORS,
  STROKE_WIDTHS,
  isCapturableUrl,
} from '../../src/platform/constants';
import { loadSettings, saveSettings } from '../../src/platform/settings';
import type { ActivateRequest } from '../../src/platform/messages';

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
    button.addEventListener('click', () => {
      const request: ActivateRequest = { type: 'activate' };
      void browser.runtime.sendMessage(request);
      window.close();
    });
    block.append(
      button,
      el('div', 'hint', 'Or press Ctrl+Shift+M (Cmd+Shift+M on Mac).'),
    );
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
