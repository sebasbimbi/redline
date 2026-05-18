// @vitest-environment jsdom

/**
 * Adversarial tests for selector generation. Modern sites hash their class
 * names (emotion, styled-components, CSS-modules); a selector built on a hash
 * resolves in the live DOM but can never be located in source code. These
 * tests pin that generateSelector reaches for a stable signal, or an honest
 * structural selector, rather than a hash that looks stable but is not.
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  generateSelector,
  selectorPath,
  isHashedClass,
  isStableClass,
} from './generateSelector';

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

describe('generateSelector: stable signals', () => {
  it('uses an id when one is present', () => {
    const c = mount('<section><h2 id="pricing">Pricing</h2></section>');
    const el = c.querySelector('#pricing')!;
    const sel = generateSelector(el);
    expect(sel).toContain('#pricing');
    expect(document.querySelector(sel)).toBe(el);
  });

  it('uses a data-testid over a hashed class', () => {
    const c = mount(
      '<button data-testid="cta-buy" class="css-1a2b3c">Buy</button>',
    );
    const el = c.querySelector('button')!;
    const sel = generateSelector(el);
    expect(sel).toContain('cta-buy');
    expect(sel).not.toContain('css-1a2b3c');
    expect(document.querySelector(sel)).toBe(el);
  });

  it('uses a semantic class name', () => {
    const c = mount('<div><span class="hero-badge">New</span></div>');
    const el = c.querySelector('span')!;
    const sel = generateSelector(el);
    expect(sel).toContain('hero-badge');
    expect(document.querySelector(sel)).toBe(el);
  });

  it('picks the semantic class when hash and semantic classes are mixed', () => {
    const c = mount('<button class="css-1a2b3c btn-primary">Buy</button>');
    const el = c.querySelector('button')!;
    const sel = generateSelector(el);
    expect(sel).toContain('btn-primary');
    expect(sel).not.toContain('css-1a2b3c');
    expect(document.querySelector(sel)).toBe(el);
  });
});

describe('generateSelector: hashed-class sites', () => {
  it('does not build a selector from emotion (css-*) hashes', () => {
    const c = mount(
      '<div class="css-1a2b3c"><div class="css-4d5e6f">' +
        '<h2 class="css-7g8h9i">Plans</h2></div></div>',
    );
    const el = c.querySelector('h2')!;
    const sel = generateSelector(el);
    expect(sel).not.toMatch(/css-/);
    expect(document.querySelector(sel)).toBe(el);
  });

  it('does not build a selector from CSS-modules hashes', () => {
    const c = mount(
      '<section class="Hero_hero__1a2b3">' +
        '<h1 class="Hero_title__4d5e6">Welcome</h1></section>',
    );
    const el = c.querySelector('h1')!;
    const sel = generateSelector(el);
    expect(sel).not.toContain('1a2b3');
    expect(sel).not.toContain('4d5e6');
    expect(document.querySelector(sel)).toBe(el);
  });

  it('does not build a selector from styled-components componentIds', () => {
    const c = mount(
      '<nav class="sc-bdVaJa"><a class="sc-htpNat">Home</a></nav>',
    );
    const el = c.querySelector('a')!;
    const sel = generateSelector(el);
    expect(sel).not.toContain('sc-bdVaJa');
    expect(sel).not.toContain('sc-htpNat');
    expect(document.querySelector(sel)).toBe(el);
  });

  it('produces a resolvable structural selector for an all-hash tree', () => {
    const c = mount(
      '<main class="css-aaa111">' +
        '<section class="css-bbb222"><p class="css-ccc333">One</p></section>' +
        '<section class="css-ddd444"><p class="css-eee555">Two</p></section>' +
        '</main>',
    );
    const el = c.querySelectorAll('p')[1]!;
    const sel = generateSelector(el);
    expect(sel).not.toMatch(/css-/);
    expect(document.querySelector(sel)).toBe(el);
  });
});

describe('generateSelector: other sites', () => {
  it('produces a resolvable selector for Tailwind utility classes', () => {
    const c = mount(
      '<a class="mt-4 flex text-lg text-blue-600 font-bold">Link</a>',
    );
    const el = c.querySelector('a')!;
    expect(document.querySelector(generateSelector(el))).toBe(el);
  });

  it('produces a resolvable selector with no id or classes', () => {
    const c = mount('<ul><li>a</li><li>b</li><li>c</li></ul>');
    const el = c.querySelectorAll('li')[2]!;
    expect(document.querySelector(generateSelector(el))).toBe(el);
  });

  it('disambiguates repeated semantic classes', () => {
    const c = mount(
      '<nav><a class="nav-link">Home</a><a class="nav-link">Docs</a></nav>',
    );
    const el = c.querySelectorAll('.nav-link')[1]!;
    expect(document.querySelector(generateSelector(el))).toBe(el);
  });
});

describe('selectorPath', () => {
  it('omits hashed classes from the readable path', () => {
    const c = mount(
      '<div class="css-1a2b3c"><span class="css-4d5e6f">x</span></div>',
    );
    const el = c.querySelector('span')!;
    const path = selectorPath(el);
    expect(path).not.toMatch(/css-/);
    expect(path).toContain('span');
  });

  it('keeps semantic classes in the readable path', () => {
    const c = mount(
      '<div class="card"><span class="card__label">x</span></div>',
    );
    const el = c.querySelector('span')!;
    expect(selectorPath(el)).toContain('card__label');
  });
});

describe('isHashedClass', () => {
  const hashed = [
    'css-1a2b3c', // emotion
    'css-1lt3o7e',
    'sc-bdVaJa', // styled-components componentId
    'sc-htpNat',
    'Card_card__2x7Yk', // CSS-modules
    'Hero_title__4d5e6',
    'button_1a2b3',
    '_2x7Yk',
    'styles-9fA3b',
  ];
  const real = [
    'card',
    'hero-title',
    'hero__title', // BEM
    'nav-link',
    'btn-primary',
    'col-md-6', // Bootstrap grid
    'mt-4', // Tailwind
    'text-blue-600', // Tailwind
    'grid-cols-3', // Tailwind
    'text-2xl', // Tailwind
  ];

  it.each(hashed)('flags "%s" as a build hash', (name) => {
    expect(isHashedClass(name)).toBe(true);
  });

  it.each(real)('keeps "%s" as a real class', (name) => {
    expect(isHashedClass(name)).toBe(false);
  });
});

describe('isStableClass', () => {
  it('rejects volatile state classes', () => {
    expect(isStableClass('is-open')).toBe(false);
    expect(isStableClass('active')).toBe(false);
    expect(isStableClass('loading')).toBe(false);
  });

  it('rejects hashed classes', () => {
    expect(isStableClass('css-1a2b3c')).toBe(false);
  });

  it('accepts semantic classes', () => {
    expect(isStableClass('card')).toBe(true);
    expect(isStableClass('hero__title')).toBe(true);
  });

  it('rejects the empty string', () => {
    expect(isStableClass('')).toBe(false);
  });
});
