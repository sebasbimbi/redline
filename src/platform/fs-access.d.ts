/**
 * Chromium's permission methods on File System Access handles. These are not
 * part of the standard lib.dom.d.ts, so they are declared here. This file is
 * an ambient declaration (no imports/exports) and merges with the built-in
 * `FileSystemHandle` interface.
 */

interface FileSystemHandle {
  queryPermission(descriptor?: {
    mode?: 'read' | 'readwrite';
  }): Promise<PermissionState>;
  requestPermission(descriptor?: {
    mode?: 'read' | 'readwrite';
  }): Promise<PermissionState>;
}

/** The File System Access directory picker, absent from some lib.dom versions. */
interface Window {
  showDirectoryPicker(options?: {
    id?: string;
    mode?: 'read' | 'readwrite';
  }): Promise<FileSystemDirectoryHandle>;
}
