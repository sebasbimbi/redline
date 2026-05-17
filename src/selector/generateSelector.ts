/** CSS selector generation, wrapping @medv/finder with our own conventions. */

import { finder } from '@medv/finder';

/**
 * Class names that reflect transient UI state rather than identity. Excluded
 * from generated selectors so a selector survives normal page interaction.
 */
const VOLATILE_CLASS =
  /^(is-|has-|js-)|(^|[-_])(active|open|opened|closed|visible|hidden|hover|focus|focused|show|shown|hide|fade|slide|enter|leave|animate|animating|animated|selected|current|loading|loaded|disabled|expanded|collapsed|sticky|scrolled)([-_]|$)/i;

function isStableClass(name: string): boolean {
  return name.length > 0 && !VOLATILE_CLASS.test(name);
}

/** Generate the shortest reasonably-unique CSS selector for an element. */
export function generateSelector(el: Element): string {
  try {
    return finder(el, {
      className: isStableClass,
      attr: (name) =>
        name === 'data-testid' || name === 'data-test' || name === 'data-cy',
      timeoutMs: 1000,
    });
  } catch {
    return fallbackSelector(el);
  }
}

/** A readable (not necessarily unique) ancestry path, e.g. "main > div.card > h2". */
export function selectorPath(el: Element, maxDepth = 4): string {
  const parts: string[] = [];
  let cur: Element | null = el;
  let depth = 0;
  while (cur && depth < maxDepth && cur !== document.documentElement) {
    parts.unshift(describe(cur));
    cur = cur.parentElement;
    depth += 1;
  }
  return parts.join(' > ');
}

function describe(el: Element): string {
  const tag = el.tagName.toLowerCase();
  if (el.id) return `${tag}#${el.id}`;
  const classes = Array.from(el.classList).filter(isStableClass).slice(0, 3);
  return classes.length > 0 ? `${tag}.${classes.join('.')}` : tag;
}

/** A structural :nth-of-type selector, used when finder cannot produce one. */
function fallbackSelector(el: Element): string {
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur.nodeType === 1 && cur !== document.documentElement) {
    if (cur.id) {
      parts.unshift(`#${CSS.escape(cur.id)}`);
      break;
    }
    let part = cur.tagName.toLowerCase();
    const parent: Element | null = cur.parentElement;
    if (parent) {
      const tag = cur.tagName;
      const sameTag = Array.from(parent.children).filter(
        (c) => c.tagName === tag,
      );
      if (sameTag.length > 1) {
        part += `:nth-of-type(${sameTag.indexOf(cur) + 1})`;
      }
    }
    parts.unshift(part);
    cur = parent;
  }
  return parts.join(' > ') || el.tagName.toLowerCase();
}
