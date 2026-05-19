// @vitest-environment jsdom

/** Tests for the universal download-fallback export path. */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { downloadBlob } from './download';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('downloadBlob', () => {
  it('downloads the blob via a throwaway anchor and cleans it up', () => {
    URL.createObjectURL = vi.fn(() => 'blob:redline-test');
    URL.revokeObjectURL = vi.fn();
    let seen: { download: string; href: string } | null = null;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function (this: HTMLAnchorElement) {
        seen = { download: this.download, href: this.href };
      },
    );

    const root = document.createElement('div');
    document.body.append(root);
    downloadBlob(
      root,
      new Blob(['hello'], { type: 'text/markdown' }),
      'redline.md',
    );

    expect(seen).toEqual({ download: 'redline.md', href: 'blob:redline-test' });
    // the anchor is removed right after the click, never left in the DOM
    expect(root.querySelector('a')).toBeNull();
  });

  it('revokes the object URL after the download has started', () => {
    vi.useFakeTimers();
    URL.createObjectURL = vi.fn(() => 'blob:y');
    const revoke = vi.fn();
    URL.revokeObjectURL = revoke;
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadBlob(document.createElement('div'), new Blob(['z']), 'z.png');

    expect(revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(10_000);
    expect(revoke).toHaveBeenCalledWith('blob:y');
  });
});
