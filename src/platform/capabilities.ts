/** Runtime feature detection for browser APIs Redline depends on. */

/** Whether the async Clipboard API can write rich items (image + text). */
export function supportsClipboardWrite(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    !!navigator.clipboard &&
    typeof navigator.clipboard.write === 'function' &&
    typeof ClipboardItem !== 'undefined'
  );
}

/** Whether the File System Access API is available (used from Phase 2 on). */
export function supportsFileSystemAccess(): boolean {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}
