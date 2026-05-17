/** XPath generation, used as a fallback locator alongside the CSS selector. */

/** Compute an XPath for an element. Prefers an id anchor when one exists. */
export function generateXPath(el: Element): string {
  if (el.id) return `//*[@id=${xpathLiteral(el.id)}]`;
  const parts: string[] = [];
  let cur: Element | null = el;
  while (cur && cur.nodeType === 1 && cur !== document.documentElement) {
    const tag = cur.tagName.toLowerCase();
    let index = 1;
    let sib = cur.previousElementSibling;
    while (sib) {
      if (sib.tagName === cur.tagName) index += 1;
      sib = sib.previousElementSibling;
    }
    parts.unshift(`${tag}[${index}]`);
    cur = cur.parentElement;
  }
  return '/' + parts.join('/');
}

/** Quote a string for safe use inside an XPath expression. */
function xpathLiteral(value: string): string {
  if (!value.includes('"')) return `"${value}"`;
  if (!value.includes("'")) return `'${value}'`;
  return 'concat("' + value.split('"').join('", \'"\', "') + '")';
}
