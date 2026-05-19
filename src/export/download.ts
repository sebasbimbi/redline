/** A browser file download, for export contexts where richer paths are out. */

/**
 * Trigger a browser download of `blob` as `filename`. Unlike folder-save (the
 * File System Access API) and Copy (the async Clipboard API), a download needs
 * no secure context, so it works on any page. This is Redline's universal
 * export fallback for plain http pages; the file lands in the browser's
 * downloads folder.
 *
 * The throwaway anchor is appended inside `root` (Redline's own Shadow DOM, in
 * practice), never the host page, so the page's DOM is left untouched.
 */
export function downloadBlob(
  root: ParentNode,
  blob: Blob,
  filename: string,
): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  root.append(anchor);
  anchor.click();
  anchor.remove();
  // revoke once the browser has had time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
