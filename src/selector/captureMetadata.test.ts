// @vitest-environment jsdom

/** Tests for element-metadata capture, focused on locator robustness. */

import { describe, it, expect, afterEach } from 'vitest';
import { captureMetadata } from './captureMetadata';

/** Render HTML into the live document and return its container. */
function mount(html: string): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('captureMetadata', () => {
  it('parentContext skips a hashed parent class for a stable one', () => {
    const c = mount(
      '<section class="css-1a2b3c hero-section"><h2>Title</h2></section>',
    );
    const meta = captureMetadata(c.querySelector('h2')!);
    expect(meta.parentContext).toBe('section.hero-section');
  });

  it('parentContext falls back to the tag when no class is stable', () => {
    const c = mount('<section class="css-1a2b3c"><h2>Title</h2></section>');
    const meta = captureMetadata(c.querySelector('h2')!);
    expect(meta.parentContext).toBe('section');
  });

  it('records the full class list, hashes included', () => {
    const c = mount('<button class="css-1a2b3c btn">Buy</button>');
    const meta = captureMetadata(c.querySelector('button')!);
    expect(meta.classList).toEqual(['css-1a2b3c', 'btn']);
  });

  it('keeps hashed classes out of the generated selector', () => {
    const c = mount('<nav><a class="css-9z9z9z">Home</a></nav>');
    const meta = captureMetadata(c.querySelector('a')!);
    expect(meta.selector).not.toMatch(/css-/);
  });

  it('captures tag, implicit role, and data attributes', () => {
    const c = mount('<button data-action="save">Save</button>');
    const meta = captureMetadata(c.querySelector('button')!);
    expect(meta.tag).toBe('button');
    expect(meta.role).toBe('button');
    expect(meta.dataAttributes).toEqual({ 'data-action': 'save' });
  });
});
