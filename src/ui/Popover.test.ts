// @vitest-environment jsdom

/** Unit tests for the popover open/close state machine. */

import { describe, it, expect, afterEach } from 'vitest';
import { Popover, isPopoverOpen } from './Popover';

let created: Popover[] = [];

function setup() {
  document.body.innerHTML = '';
  const host = document.createElement('div');
  document.body.appendChild(host);
  const make = () => {
    const trigger = document.createElement('button');
    const panel = document.createElement('div');
    host.appendChild(trigger);
    const popover = new Popover(host, trigger, panel);
    created.push(popover);
    return { trigger, panel, popover };
  };
  return { host, make };
}

afterEach(() => {
  for (const p of created) p.close();
  created = [];
  document.body.innerHTML = '';
});

function pointerDownOn(el: Element): void {
  el.dispatchEvent(new Event('pointerdown', { bubbles: true }));
}

describe('Popover', () => {
  it('appends the panel to the host', () => {
    const { host, make } = setup();
    const { panel } = make();
    expect(panel.parentElement).toBe(host);
  });

  it('opens and closes when the trigger is clicked', () => {
    const { make } = setup();
    const { trigger, panel, popover } = make();
    trigger.click();
    expect(popover.isOpen).toBe(true);
    expect(panel.classList.contains('is-open')).toBe(true);
    expect(trigger.classList.contains('is-open')).toBe(true);
    trigger.click();
    expect(popover.isOpen).toBe(false);
    expect(panel.classList.contains('is-open')).toBe(false);
  });

  it('reports global open state through isPopoverOpen', () => {
    const { make } = setup();
    const { trigger } = make();
    expect(isPopoverOpen()).toBe(false);
    trigger.click();
    expect(isPopoverOpen()).toBe(true);
    trigger.click();
    expect(isPopoverOpen()).toBe(false);
  });

  it('closes the other popover when a second one opens', () => {
    const { make } = setup();
    const a = make();
    const b = make();
    a.trigger.click();
    expect(a.popover.isOpen).toBe(true);
    b.trigger.click();
    expect(b.popover.isOpen).toBe(true);
    expect(a.popover.isOpen).toBe(false);
  });

  it('closes on a pointer press outside the panel and trigger', () => {
    const { make } = setup();
    const { trigger, popover } = make();
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    trigger.click();
    expect(popover.isOpen).toBe(true);
    pointerDownOn(outside);
    expect(popover.isOpen).toBe(false);
  });

  it('stays open on a pointer press inside the panel', () => {
    const { make } = setup();
    const { trigger, panel, popover } = make();
    const child = document.createElement('span');
    panel.appendChild(child);
    trigger.click();
    pointerDownOn(child);
    expect(popover.isOpen).toBe(true);
  });

  it('stays open on a pointer press on its own trigger', () => {
    const { make } = setup();
    const { trigger, popover } = make();
    trigger.click();
    pointerDownOn(trigger);
    expect(popover.isOpen).toBe(true);
  });

  it('toggles open and shut with the toggle method', () => {
    const { make } = setup();
    const { popover } = make();
    popover.toggle();
    expect(popover.isOpen).toBe(true);
    popover.toggle();
    expect(popover.isOpen).toBe(false);
  });

  it('treats close as a no-op when already closed', () => {
    const { make } = setup();
    const { popover } = make();
    expect(() => popover.close()).not.toThrow();
    expect(popover.isOpen).toBe(false);
    expect(isPopoverOpen()).toBe(false);
  });
});
