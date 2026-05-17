/** Export filename construction. */

/** Two-digit zero-padded number. */
function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Build the export slug: `{YYYY-MM-DD}_{domain}_redline`.
 * The screenshot and changelog share this slug (`.png` / `.md`).
 */
export function exportSlug(pageUrl: string, date: Date = new Date()): string {
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
  let domain = 'page';
  try {
    domain = new URL(pageUrl).hostname.replace(/^www\./, '') || 'page';
  } catch {
    /* malformed URL — keep the default */
  }
  const safeDomain = domain.replace(/[^a-z0-9.-]/gi, '-').replace(/\./g, '-');
  return `${datePart}_${safeDomain}_redline`;
}
