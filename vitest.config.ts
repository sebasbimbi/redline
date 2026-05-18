/** Vitest configuration. Unit tests cover Redline's pure logic. */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Node by default. The DOM-coupled test files (geometry, ElementInspector)
    // opt into jsdom with their own `// @vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
