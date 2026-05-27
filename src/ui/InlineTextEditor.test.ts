// @vitest-environment jsdom

/** Unit tests for in-place text editing. */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InlineTextEditor } from './InlineTextEditor';

function makeElement(text = 'Original text'): HTMLElement {
  const el = document.createElement('h1');
  el.textContent = text;
  document.body.appendChild(el);
  return el;
}

describe('InlineTextEditor', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('makes the element editable on open and reports itself open', () => {
    const editor = new InlineTextEditor();
    const el = makeElement();
    editor.open(el, { onCommit: vi.fn(), onCancel: vi.fn() });
    expect(editor.isOpen).toBe(true);
    expect(el.getAttribute('contenteditable')).toBe('plaintext-only');
    editor.close();
  });

  it('restores the contenteditable and style attributes on close', () => {
    const editor = new InlineTextEditor();
    const el = makeElement();
    el.setAttribute('style', 'color: red');
    editor.open(el, { onCommit: vi.fn(), onCancel: vi.fn() });
    editor.close();
    expect(editor.isOpen).toBe(false);
    expect(el.hasAttribute('contenteditable')).toBe(false);
    expect(el.getAttribute('style')).toBe('color: red');
  });

  it('leaves no style attribute behind when there was none', () => {
    const editor = new InlineTextEditor();
    const el = makeElement();
    editor.open(el, { onCommit: vi.fn(), onCancel: vi.fn() });
    editor.close();
    expect(el.hasAttribute('style')).toBe(false);
  });

  it('commits on Cmd/Ctrl+Enter', () => {
    const editor = new InlineTextEditor();
    const el = makeElement();
    const onCommit = vi.fn();
    const onCancel = vi.fn();
    editor.open(el, { onCommit, onCancel });
    el.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true }),
    );
    expect(onCommit).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
    expect(editor.isOpen).toBe(false);
  });

  it('cancels on Escape', () => {
    const editor = new InlineTextEditor();
    const el = makeElement();
    const onCommit = vi.fn();
    const onCancel = vi.fn();
    editor.open(el, { onCommit, onCancel });
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onCommit).not.toHaveBeenCalled();
    expect(editor.isOpen).toBe(false);
  });

  it('does not commit on a plain Enter (multi-line editing stays open)', () => {
    const editor = new InlineTextEditor();
    const el = makeElement();
    const onCommit = vi.fn();
    editor.open(el, { onCommit, onCancel: vi.fn() });
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(onCommit).not.toHaveBeenCalled();
    expect(editor.isOpen).toBe(true);
    editor.close();
  });

  it('commits when the user presses away from the element', () => {
    const editor = new InlineTextEditor();
    const el = makeElement();
    const onCommit = vi.fn();
    editor.open(el, { onCommit, onCancel: vi.fn() });
    document.dispatchEvent(new Event('pointerdown'));
    expect(onCommit).toHaveBeenCalledOnce();
  });

  it('ignores a pointer press inside the edited element', () => {
    const editor = new InlineTextEditor();
    const el = makeElement();
    const onCommit = vi.fn();
    editor.open(el, { onCommit, onCancel: vi.fn() });
    el.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onCommit).not.toHaveBeenCalled();
    editor.close();
  });

  it('ignores a pointer press inside the ownUiRoot', () => {
    const editor = new InlineTextEditor();
    const el = makeElement();
    const ownUiRoot = document.createElement('div');
    const child = document.createElement('button');
    ownUiRoot.appendChild(child);
    document.body.appendChild(ownUiRoot);
    const onCommit = vi.fn();
    editor.open(el, { onCommit, onCancel: vi.fn(), ownUiRoot });
    child.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onCommit).not.toHaveBeenCalled();
    editor.close();
  });

  it('still commits on a press outside both the element and ownUiRoot', () => {
    const editor = new InlineTextEditor();
    const el = makeElement();
    const ownUiRoot = document.createElement('div');
    document.body.appendChild(ownUiRoot);
    const stranger = document.createElement('p');
    document.body.appendChild(stranger);
    const onCommit = vi.fn();
    editor.open(el, { onCommit, onCancel: vi.fn(), ownUiRoot });
    stranger.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onCommit).toHaveBeenCalledOnce();
  });

  it('fires its callback only once even if events repeat', () => {
    const editor = new InlineTextEditor();
    const el = makeElement();
    const onCancel = vi.fn();
    editor.open(el, { onCommit: vi.fn(), onCancel });
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
