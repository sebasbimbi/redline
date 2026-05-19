// @vitest-environment jsdom

/**
 * Tests that the callout tool commits the element the inspector is locked
 * onto, not a freshly re-run hit-test. That is what keeps a keyboard
 * tree-walk intact through the commit, even on a page that animates elements
 * under a still cursor.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { CalloutTool } from './CalloutTool';
import type { ToolContext } from './Tool';
import type { ChangeRequestAnnotation } from '../../model/annotation';
import { createDocument } from '../../model/document';

interface Harness {
  ctx: ToolContext;
  inspectAt: ReturnType<typeof vi.fn>;
  placed: ChangeRequestAnnotation[];
}

/** A tool context whose inspector is fixed on `picked`. */
function harness(picked: Element | null): Harness {
  const placed: ChangeRequestAnnotation[] = [];
  const inspectAt = vi.fn();
  const ctx: ToolContext = {
    doc: createDocument(),
    inspectAt,
    pickedElement: () => picked,
    lastInspectPoint: () => ({ x: 30, y: 40 }),
    render: () => {},
    setDraft: () => {},
    addAnnotation: () => {},
    placeChangeRequest: (a) => {
      placed.push(a);
    },
    beginTextEdit: () => {},
    recordMove: () => {},
    deleteAnnotation: () => {},
    editLabel: () => {},
    getSelectedId: () => null,
    setSelectedId: () => {},
    setCursor: () => {},
  };
  return { ctx, inspectAt, placed };
}

function pointerAt(x: number, y: number): PointerEvent {
  return { clientX: x, clientY: y } as PointerEvent;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('CalloutTool', () => {
  it('commits the inspected element without re-running the hit-test', () => {
    const el = document.createElement('h1');
    document.body.append(el);
    const { ctx, inspectAt, placed } = harness(el);

    new CalloutTool().onPointerDown(pointerAt(10, 12), ctx);

    // the hover already tracked the element; re-resolving it would discard a
    // keyboard tree-walk, so the tool must not call inspectAt here
    expect(inspectAt).not.toHaveBeenCalled();
    expect(placed).toHaveLength(1);
    expect(placed[0].element).not.toBeNull();
  });

  it('falls back to a hit-test when nothing was hovered first', () => {
    const { ctx, inspectAt } = harness(null);
    new CalloutTool().onPointerDown(pointerAt(10, 12), ctx);
    expect(inspectAt).toHaveBeenCalledWith(10, 12);
  });

  it('confirms by keyboard, anchored to the inspected element', () => {
    const el = document.createElement('h1');
    document.body.append(el);
    const { ctx, inspectAt, placed } = harness(el);

    new CalloutTool().onConfirm(ctx);

    expect(inspectAt).not.toHaveBeenCalled();
    expect(placed).toHaveLength(1);
    expect(placed[0].geometry.kind).toBe('callout');
    expect(placed[0].element).not.toBeNull();
  });
});
