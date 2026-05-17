/**
 * The Redline overlay content script.
 *
 * Registered at runtime (not in the manifest) and injected on demand by the
 * service worker via chrome.scripting.executeScript. Re-injecting toggles the
 * overlay: a controller stored on `window` survives across injections.
 */

import { defineContentScript } from 'wxt/utils/define-content-script';
import { OverlayController } from '../src/overlay/OverlayController';

interface RedlineWindow extends Window {
  __redlineController?: OverlayController;
}

export default defineContentScript({
  registration: 'runtime',
  matches: ['<all_urls>'],
  main() {
    const win = window as RedlineWindow;

    // Already mounted: this injection is a toggle-off.
    if (win.__redlineController) {
      win.__redlineController.unmount();
      return;
    }

    const controller = new OverlayController({
      onClosed: () => {
        delete win.__redlineController;
      },
    });
    win.__redlineController = controller;
    controller.mount();
  },
});
