/** Export filename construction. */

/** Two-digit zero-padded number. */
function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Reduce a string to lowercase, hyphen-separated, filename-safe characters. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Build the export slug: `{YYYY-MM-DD}_{domain}_{path}_redline`.
 * The screenshot and changelog share this slug (`.png` / `.md`).
 *
 * The path segment keeps exports from different pages of one site distinct,
 * so a single folder can hold a whole batch without filename collisions.
 */
export function exportSlug(pageUrl: string, date: Date = new Date()): string {
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
  let domain = 'page';
  let pathPart = 'home';
  try {
    const url = new URL(pageUrl);
    domain = url.hostname.replace(/^www\./, '') || 'page';
    const path = slugify(url.pathname);
    if (path) pathPart = path.slice(0, 40).replace(/-+$/g, '');
  } catch {
    /* malformed URL: keep the defaults */
  }
  const safeDomain = domain.replace(/[^a-z0-9.-]/gi, '-').replace(/\./g, '-');
  return `${datePart}_${safeDomain}_${pathPart}_redline`;
}
