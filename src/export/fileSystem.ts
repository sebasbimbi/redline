/** Folder-save export via the File System Access API. */

import { loadDirectoryHandle, saveDirectoryHandle } from '../platform/idb';
import redlineCommandSource from '../../claude-command/redline.md?raw';

export type DirectoryResult =
  | { status: 'ok'; dir: FileSystemDirectoryHandle }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

export interface WriteResult {
  ok: boolean;
  error?: string;
}

/** Outcome of installing the /redline command into a project. */
export type InstallResult =
  | { status: 'ok'; projectName: string }
  | { status: 'cancelled' }
  | { status: 'error'; message: string };

/**
 * Resolve the export directory: reuse the remembered folder when permission is
 * still granted, otherwise show the directory picker. Pass `forcePicker` to
 * always show the picker (so the user can choose a different folder).
 *
 * Call this directly from a user-gesture handler: the picker and the
 * permission prompt both require transient user activation.
 */
export async function resolveExportDirectory(
  forcePicker = false,
): Promise<DirectoryResult> {
  if (!forcePicker) {
    let remembered: FileSystemDirectoryHandle | null = null;
    try {
      remembered = await loadDirectoryHandle();
    } catch {
      remembered = null;
    }

    if (remembered) {
      try {
        if (await ensureWritePermission(remembered)) {
          return { status: 'ok', dir: remembered };
        }
      } catch {
        /* fall through to the picker */
      }
    }
  }

  try {
    const picked = await window.showDirectoryPicker({ mode: 'readwrite' });
    try {
      await saveDirectoryHandle(picked);
    } catch {
      /* remembering the folder is best-effort */
    }
    return { status: 'ok', dir: picked };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { status: 'cancelled' };
    }
    return { status: 'error', message: errorText(err) };
  }
}

/** Write the screenshot and changelog into the directory. */
export async function writeExportFiles(
  dir: FileSystemDirectoryHandle,
  png: Blob,
  markdown: string,
  slug: string,
): Promise<WriteResult> {
  try {
    await writeFile(dir, `${slug}.png`, png);
    await writeFile(
      dir,
      `${slug}.md`,
      new Blob([markdown], { type: 'text/markdown' }),
    );
    return { ok: true };
  } catch (err) {
    return { ok: false, error: errorText(err) };
  }
}

/**
 * Install the /redline slash command into a project. Prompts for the project
 * folder, then writes the command into its `.claude/commands/` directory,
 * creating `.claude/commands/` if it does not exist.
 */
export async function installRedlineCommand(): Promise<InstallResult> {
  let root: FileSystemDirectoryHandle;
  try {
    root = await window.showDirectoryPicker({ mode: 'readwrite' });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { status: 'cancelled' };
    }
    return { status: 'error', message: errorText(err) };
  }
  try {
    const claude = await root.getDirectoryHandle('.claude', { create: true });
    const commands = await claude.getDirectoryHandle('commands', {
      create: true,
    });
    await writeFile(
      commands,
      'redline.md',
      new Blob([redlineCommandSource], { type: 'text/markdown' }),
    );
    return { status: 'ok', projectName: root.name };
  } catch (err) {
    return { status: 'error', message: errorText(err) };
  }
}

async function ensureWritePermission(
  handle: FileSystemDirectoryHandle,
): Promise<boolean> {
  const descriptor = { mode: 'readwrite' as const };
  if ((await handle.queryPermission(descriptor)) === 'granted') return true;
  return (await handle.requestPermission(descriptor)) === 'granted';
}

async function writeFile(
  dir: FileSystemDirectoryHandle,
  name: string,
  data: Blob,
): Promise<void> {
  const fileHandle = await dir.getFileHandle(name, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
}

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
