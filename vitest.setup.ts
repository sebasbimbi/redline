/**
 * Vitest setup, run before every test file.
 *
 * jsdom does not implement the CSSOM `CSS` interface, so `CSS.escape` is absent
 * in the test environment. Both @medv/finder and our own fallbackSelector call
 * `CSS.escape`; without it the selector engine throws on every call and the
 * tests silently exercise nothing. Every real browser provides it.
 *
 * This installs a polyfill (the standard CSSOM serialize-an-identifier
 * algorithm) only when no `CSS` global is already present.
 */

function escapeIdentifier(value: string): string {
  const string = String(value);
  const length = string.length;
  const firstCodeUnit = string.charCodeAt(0);
  let result = '';
  let index = -1;

  if (length === 1 && firstCodeUnit === 0x002d) {
    return '\\' + string;
  }

  while (++index < length) {
    const codeUnit = string.charCodeAt(index);
    if (codeUnit === 0x0000) {
      result += '�';
      continue;
    }
    if (
      (codeUnit >= 0x0001 && codeUnit <= 0x001f) ||
      codeUnit === 0x007f ||
      (index === 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
      (index === 1 &&
        codeUnit >= 0x0030 &&
        codeUnit <= 0x0039 &&
        firstCodeUnit === 0x002d)
    ) {
      result += '\\' + codeUnit.toString(16) + ' ';
      continue;
    }
    if (
      codeUnit >= 0x0080 ||
      codeUnit === 0x002d ||
      codeUnit === 0x005f ||
      (codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
      (codeUnit >= 0x0041 && codeUnit <= 0x005a) ||
      (codeUnit >= 0x0061 && codeUnit <= 0x007a)
    ) {
      result += string.charAt(index);
      continue;
    }
    result += '\\' + string.charAt(index);
  }
  return result;
}

const target = globalThis as unknown as {
  CSS?: { escape(value: string): string };
};
if (typeof target.CSS === 'undefined') {
  target.CSS = { escape: escapeIdentifier };
}

export {};
