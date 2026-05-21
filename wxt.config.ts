import { defineConfig } from 'wxt';

// WXT configuration. The manifest below is merged with entries WXT generates
// from the entrypoints (action from entrypoints/popup, background from
// entrypoints/background.ts). The overlay is injected programmatically by the
// service worker, so it is NOT declared as a content script here.
export default defineConfig({
  // Build into `output/` rather than the default hidden `.output/`, so the
  // folder is visible in Chrome's "Load unpacked" file picker.
  outDir: 'output',
  // WXT infers host_permissions from any content-script `matches` entry,
  // even when `registration: 'runtime'` keeps the script out of
  // content_scripts. The overlay declares `<all_urls>` only so chrome.scripting
  // can target arbitrary tabs at injection time; we still want zero static
  // host_permissions in the manifest, so the install prompt does not warn
  // about reading every site. This hook strips the inferred entry.
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      delete manifest.host_permissions;
    },
  },
  manifest: {
    name: 'Redline',
    description:
      'Annotate live webpages and export structured change requests to Claude Code.',
    // Redline runs only on user gesture (keyboard shortcut or toolbar icon),
    // so `activeTab` grants the temporary access we need without the scary
    // "read and change all your data on websites you visit" install prompt
    // that broad host_permissions would add. `scripting` injects the overlay;
    // `tabs` keeps `tab.url` available for the non-capturable-page check;
    // `storage` persists user settings and per-page annotations.
    permissions: ['activeTab', 'scripting', 'storage', 'tabs'],
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
    commands: {
      'toggle-redline': {
        suggested_key: {
          default: 'Ctrl+Shift+M',
          mac: 'Command+Shift+M',
        },
        description: 'Toggle Redline on the current page',
      },
    },
  },
});
