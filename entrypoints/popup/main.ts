/** The Redline toolbar popup: activate the overlay on the current tab. */

import { browser } from 'wxt/browser';
import { isCapturableUrl } from '../../src/platform/constants';
import type { ActivateRequest } from '../../src/platform/messages';

async function init(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) return;

  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = 'Redline';

  const sub = document.createElement('div');
  sub.className = 'sub';
  sub.textContent = 'Annotate the page, export to Claude Code.';
  app.append(title, sub);

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
    app.append(button);

    const hint = document.createElement('div');
    hint.className = 'hint';
    hint.textContent = 'Or press Ctrl+Shift+M (Cmd+Shift+M on Mac).';
    app.append(hint);
  } else {
    const message = document.createElement('div');
    message.className = 'msg';
    message.textContent =
      'Redline cannot run on this page. Open a regular web page (http or https) and try again.';
    app.append(message);
  }
}

void init();
