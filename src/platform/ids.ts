/**
 * Generate a short unique id. `crypto.randomUUID` is only available in secure
 * contexts, so fall back to a timestamp + random id on plain http pages.
 */
export function uid(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    try {
      return c.randomUUID();
    } catch {
      /* not a secure context — fall through to the fallback */
    }
  }
  return (
    'r-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
  );
}
