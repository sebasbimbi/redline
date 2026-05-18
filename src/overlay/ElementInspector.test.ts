// @vitest-environment jsdom

/** Unit tests for DOM-tree traversal in the element inspector. */

import { describe, it, expect, vi } from 'vitest';
import { ElementInspector } from './ElementInspector';
import { ElementPicker } from './ElementPicker';
import { ElementHighlighter } from '../ui/ElementHighlighter';

function setup() {
  document.body.innerHTML =
    '<div id="root"><section id="hero"><h1 id="title">Hi</h1></section>' +
    '<p id="other">Bye</p></div>';
  const picker = new ElementPicker(() => false);
  const pickAt = vi.spyOn(picker, 'pickAt');
  const host = document.createElement('div');
  document.body.append(host);
  const highlighter = new ElementHighlighter(
    host.attachShadow({ mode: 'open' }),
  );
  const inspector = new ElementInspector(picker, highlighter);
  const byId = (id: string): Element => {
    const el = document.getElementById(id);
    if (!el) throw new Error(`missing #${id}`);
    return el;
  };
  return {
    inspector,
    pickAt,
    root: byId('root'),
    hero: byId('hero'),
    title: byId('title'),
    other: byId('other'),
  };
}

describe('ElementInspector', () => {
  it('ignores pointer moves while disabled', () => {
    const { inspector, pickAt, title } = setup();
    pickAt.mockReturnValue(title);
    inspector.moveTo(5, 5);
    expect(inspector.hasTarget()).toBe(false);
    expect(inspector.current()).toBeNull();
  });

  it('targets the element under the cursor once enabled', () => {
    const { inspector, pickAt, title } = setup();
    pickAt.mockReturnValue(title);
    inspector.setEnabled(true);
    inspector.moveTo(5, 5);
    expect(inspector.hasTarget()).toBe(true);
    expect(inspector.current()).toBe(title);
  });

  it('walks up the tree to a parent and back down to the child', () => {
    const { inspector, pickAt, title, hero, root } = setup();
    pickAt.mockReturnValue(title);
    inspector.setEnabled(true);
    inspector.moveTo(5, 5);

    inspector.traverse(true);
    expect(inspector.current()).toBe(hero);
    inspector.traverse(true);
    expect(inspector.current()).toBe(root);

    inspector.traverse(false);
    expect(inspector.current()).toBe(hero);
    inspector.traverse(false);
    expect(inspector.current()).toBe(title);
  });

  it('clamps at the document root when walking up past it', () => {
    const { inspector, pickAt, title } = setup();
    pickAt.mockReturnValue(title);
    inspector.setEnabled(true);
    inspector.moveTo(5, 5);
    for (let i = 0; i < 25; i += 1) inspector.traverse(true);
    expect(inspector.current()).toBe(document.documentElement);
  });

  it('clamps at the cursor element when walking down past it', () => {
    const { inspector, pickAt, title } = setup();
    pickAt.mockReturnValue(title);
    inspector.setEnabled(true);
    inspector.moveTo(5, 5);
    for (let i = 0; i < 5; i += 1) inspector.traverse(false);
    expect(inspector.current()).toBe(title);
  });

  it('keeps the traversal depth while the cursor stays on one element', () => {
    const { inspector, pickAt, title, root } = setup();
    pickAt.mockReturnValue(title);
    inspector.setEnabled(true);
    inspector.moveTo(5, 5);
    inspector.traverse(true);
    inspector.traverse(true);
    expect(inspector.current()).toBe(root);

    inspector.moveTo(6, 6);
    expect(inspector.current()).toBe(root);
  });

  it('resets the traversal depth when the cursor moves to a new element', () => {
    const { inspector, pickAt, title, other } = setup();
    pickAt.mockReturnValue(title);
    inspector.setEnabled(true);
    inspector.moveTo(5, 5);
    inspector.traverse(true);
    inspector.traverse(true);

    pickAt.mockReturnValue(other);
    inspector.moveTo(50, 50);
    expect(inspector.current()).toBe(other);
  });

  it('clears the target when disabled', () => {
    const { inspector, pickAt, title } = setup();
    pickAt.mockReturnValue(title);
    inspector.setEnabled(true);
    inspector.moveTo(5, 5);
    expect(inspector.current()).toBe(title);

    inspector.setEnabled(false);
    expect(inspector.hasTarget()).toBe(false);
    expect(inspector.current()).toBeNull();
  });
});
