/**
 * A tiny IndexedDB wrapper for persisting the export directory handle.
 * A FileSystemDirectoryHandle is structured-cloneable, so IndexedDB can store
 * it directly (chrome.storage cannot — it only takes JSON).
 */

const DB_NAME = 'redline';
const DB_VERSION = 1;
const STORE = 'handles';
const DIR_KEY = 'export-directory';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('IndexedDB failed to open'));
  });
}

/** Persist the chosen export directory handle. */
export async function saveDirectoryHandle(
  handle: FileSystemDirectoryHandle,
): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(handle, DIR_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error('IndexedDB write failed'));
      tx.onabort = () =>
        reject(tx.error ?? new Error('IndexedDB write aborted'));
    });
  } finally {
    db.close();
  }
}

/** Load the previously chosen export directory handle, or null if none. */
export async function loadDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDatabase();
  try {
    const result = await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const request = tx.objectStore(STORE).get(DIR_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error ?? new Error('IndexedDB read failed'));
    });
    return (result as FileSystemDirectoryHandle | undefined) ?? null;
  } finally {
    db.close();
  }
}
