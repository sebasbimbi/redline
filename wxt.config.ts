import { defineConfig } from 'wxt';

// WXT configuration. The manifest below is merged with entries WXT generates
// from the entrypoints (action from entrypoints/popup, background from
// entrypoints/background.ts). The overlay is injected programmatically by the
// service worker, so it is NOT declared as a content script here.
export default defineConfig({
  // Build into `output/` rather than the default hidden `.output/`, so the
  // folder is visible in Chrome's "Load unpacked" file picker.
  outDir: 'output',
  manifest: {
    name: 'Redline',
    description:
      'Annotate live webpages and export structured change requests to Claude Code.',
    permissions: ['activeTab', 'scripting', 'storage', 'tabs'],
    host_permissions: ['http://*/*', 'https://*/*'],
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
