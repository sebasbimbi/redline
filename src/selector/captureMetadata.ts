/** Capture a rich, source-locatable snapshot of a DOM element. */

import type { ElementMetadata } from '../model/annotation';
import type { Rect } from '../model/geometry';
import { generateSelector, selectorPath, isStableClass } from './generateSelector';
import { generateXPath } from './xpath';

const LANDMARK_SELECTOR =
  'nav, header, main, footer, aside, section, form, [role="navigation"], [role="banner"], [role="main"], [role="contentinfo"], [role="complementary"]';

/** Build an ElementMetadata snapshot for the given element. */
export function captureMetadata(el: Element): ElementMetadata {
  const rect = el.getBoundingClientRect();
  const boundingBox: Rect = {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    w: rect.width,
    h: rect.height,
  };
  const vw = window.innerWidth || 1;
  const vh = window.innerHeight || 1;

  // a shadow-scoped element has no document-resolvable selector, so the
  // locators are anchored to the outermost shadow host instead
  const shadowHost = outermostShadowHost(el);
  const locator = shadowHost ?? el;

  return {
    selector: generateSelector(locator),
    selectorPath: selectorPath(locator),
    xpath: generateXPath(locator),
    inShadowDom: shadowHost !== null,
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    classList: Array.from(el.classList),
    role: el.getAttribute('role') || implicitRole(el),
    ariaLabel: accessibleName(el),
    textSnippet: textSnippet(el),
    dataAttributes: dataAttributes(el),
    boundingBox,
    viewportPercent: {
      top: round((rect.top / vh) * 100),
      left: round((rect.left / vw) * 100),
      width: round((rect.width / vw) * 100),
      height: round((rect.height / vh) * 100),
    },
    nearbyLandmark: nearbyLandmark(el),
    parentContext: parentContext(el),
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function textSnippet(el: Element): string | null {
  const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
  if (!text) return null;
  return text.length > 120 ? text.slice(0, 117) + '...' : text;
}

function dataAttributes(el: Element): Record<string, string> {
  const out: Record<string, string> = {};
  for (const attr of Array.from(el.attributes)) {
    if (attr.name.startsWith('data-')) out[attr.name] = attr.value;
  }
  return out;
}

function accessibleName(el: Element): string | null {
  const label = el.getAttribute('aria-label');
  if (label?.trim()) return label.trim();

  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy) {
    const ref = document.getElementById(labelledBy);
    const refText = ref?.textContent?.replace(/\s+/g, ' ').trim();
    if (refText) return refText;
  }

  const title = el.getAttribute('title');
  if (title?.trim()) return title.trim();

  if (el.tagName === 'IMG') {
    const alt = el.getAttribute('alt');
    if (alt?.trim()) return alt.trim();
  }
  return null;
}

const IMPLICIT_ROLES: Record<string, string> = {
  A: 'link',
  BUTTON: 'button',
  NAV: 'navigation',
  HEADER: 'banner',
  FOOTER: 'contentinfo',
  MAIN: 'main',
  ASIDE: 'complementary',
  H1: 'heading',
  H2: 'heading',
  H3: 'heading',
  H4: 'heading',
  H5: 'heading',
  H6: 'heading',
  IMG: 'img',
  UL: 'list',
  OL: 'list',
  LI: 'listitem',
  SELECT: 'combobox',
  TEXTAREA: 'textbox',
};

function implicitRole(el: Element): string | null {
  return IMPLICIT_ROLES[el.tagName] ?? null;
}

function nearbyLandmark(el: Element): string | null {
  const landmark = el.closest(LANDMARK_SELECTOR);
  if (!landmark) return null;
  const tag = landmark.tagName.toLowerCase();
  const label = landmark.getAttribute('aria-label');
  if (label?.trim()) return `${tag} "${label.trim()}"`;
  const heading = landmark.querySelector('h1, h2, h3');
  const headingText = heading?.textContent?.replace(/\s+/g, ' ').trim();
  if (headingText) return `${tag} (heading: "${headingText.slice(0, 60)}")`;
  return tag;
}

function parentContext(el: Element): string | null {
  const parent = el.parentElement;
  if (!parent || parent === document.body) return null;
  const tag = parent.tagName.toLowerCase();
  if (parent.id) return `${tag}#${parent.id}`;
  const cls = Array.from(parent.classList).find(isStableClass);
  return cls ? `${tag}.${cls}` : tag;
}

/**
 * The outermost shadow host when the element lives inside one or more shadow
 * roots, or null when it is in the light DOM.
 */
function outermostShadowHost(el: Element): Element | null {
  let host: Element | null = null;
  let node: Node = el;
  for (let depth = 0; depth < 12; depth += 1) {
    const root = node.getRootNode();
    if (!(root instanceof ShadowRoot)) break;
    host = root.host;
    node = root.host;
  }
  return host;
}
