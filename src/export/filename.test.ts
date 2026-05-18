/** Unit tests for export filename construction. */

import { describe, it, expect } from 'vitest';
import { exportSlug } from './filename';

/** A fixed local date, so the date segment is deterministic: 2026-05-18. */
const DATE = new Date(2026, 4, 18);

describe('exportSlug', () => {
  it('combines the date, domain, and path', () => {
    expect(exportSlug('https://acme.com/pricing', DATE)).toBe(
      '2026-05-18_acme-com_pricing_redline',
    );
  });

  it('names the root path "home"', () => {
    expect(exportSlug('https://acme.com/', DATE)).toBe(
      '2026-05-18_acme-com_home_redline',
    );
  });

  it('gives different pages of one site different slugs', () => {
    const pricing = exportSlug('https://acme.com/pricing', DATE);
    const docs = exportSlug('https://acme.com/docs', DATE);
    expect(pricing).not.toBe(docs);
  });

  it('joins a nested path with hyphens', () => {
    expect(exportSlug('https://acme.com/docs/getting-started', DATE)).toBe(
      '2026-05-18_acme-com_docs-getting-started_redline',
    );
  });

  it('drops a www. prefix from the domain', () => {
    expect(exportSlug('https://www.acme.com/pricing', DATE)).toBe(
      '2026-05-18_acme-com_pricing_redline',
    );
  });

  it('falls back to defaults for a malformed URL', () => {
    expect(exportSlug('not a url', DATE)).toBe('2026-05-18_page_home_redline');
  });

  it('caps a very long path', () => {
    const slug = exportSlug('https://acme.com/' + 'x'.repeat(200), DATE);
    expect(slug.length).toBeLessThan(80);
    expect(slug.endsWith('_redline')).toBe(true);
  });
});
