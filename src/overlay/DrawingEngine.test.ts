// @vitest-environment jsdom

/** Unit tests for pointer-event routing in the drawing engine. */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { DrawingEngine } from './DrawingEngine';
import { ToolRegistry } from './tools/ToolRegistry';
import type { Tool, ToolContext } from './tools/Tool';
import type { EditorTool } from '../model/annotation';
import type { RedlineDocument } from '../model/document';

function makeDoc(activeTool: EditorTool): RedlineDocument {
  return {
    schemaVersion: 1,
    documentId: 'doc',
    pageUrl: 'https://example.com',
    pageTitle: 'Example',
    viewport: { width: 800, height: 600, devicePixelRatio: 1 },
    scroll: { x: 0, y: 0 },
    annotations: [],
    activeTool,
    activeColor: '#000000',
    activeStrokeWidth: 2,
    createdAt: '2026-05-17T00:00:00.000Z',
    updatedAt: '2026-05-17T00:00:00.000Z',
  };
}

function makeContext(doc: RedlineDocument): ToolContext {
  return {
    doc,
    inspectAt: () => {},
    pickedElement: () => null,
    render: () => {},
    setDraft: () => {},
    addAnnotation: () => {},
    placeChangeRequest: () => {},
    recordMove: () => {},
    deleteAnnotation: () => {},
    editLabel: () => {},
    getSelectedId: () => null,
    setSelectedId: () => {},
    setCursor: () => {},
  };
}

function makeTool(id: EditorTool) {
  const handlers = {
    onPointerDown: vi.fn(),
    onPointerMove: vi.fn(),
    onPointerUp: vi.fn(),
    onPointerCancel: vi.fn(),
  };
  const tool: Tool = { id, ...handlers };
  return { tool, handlers };
}

function setup(activeTool: EditorTool = 'select') {
  const registry = new ToolRegistry();
  const primary = makeTool(activeTool);
  registry.register(primary.tool);
  const doc = makeDoc(activeTool);
  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);
  const engine = new DrawingEngine(canvas, registry, makeContext(doc));
  engine.attach();
  return { engine, canvas, registry, handlers: primary.handlers };
}

afterEach(() => {
  document.body.innerHTML = '';
});

function fire(canvas: HTMLCanvasElement, type: string): void {
  canvas.dispatchEvent(new Event(type));
}

describe('DrawingEngine', () => {
  it('starts on the document active tool', () => {
    const { engine } = setup('callout');
    expect(engine.activeToolId).toBe('callout');
  });

  it('routes pointer down, move, and up to the active tool', () => {
    const { canvas, handlers } = setup();
    fire(canvas, 'pointerdown');
    fire(canvas, 'pointermove');
    fire(canvas, 'pointerup');
    expect(handlers.onPointerDown).toHaveBeenCalledTimes(1);
    expect(handlers.onPointerMove).toHaveBeenCalledTimes(1);
    expect(handlers.onPointerUp).toHaveBeenCalledTimes(1);
  });

  it('routes pointer cancel to the active tool', () => {
    const { canvas, handlers } = setup();
    fire(canvas, 'pointercancel');
    expect(handlers.onPointerCancel).toHaveBeenCalledTimes(1);
  });

  it('ignores pointer down and move while disabled', () => {
    const { engine, canvas, handlers } = setup();
    engine.setEnabled(false);
    fire(canvas, 'pointerdown');
    fire(canvas, 'pointermove');
    expect(handlers.onPointerDown).not.toHaveBeenCalled();
    expect(handlers.onPointerMove).not.toHaveBeenCalled();
  });

  it('switches which tool receives input with setActiveTool', () => {
    const { engine, canvas, registry, handlers } = setup('select');
    const callout = makeTool('callout');
    registry.register(callout.tool);
    engine.setActiveTool('callout');
    expect(engine.activeToolId).toBe('callout');
    fire(canvas, 'pointerdown');
    expect(callout.handlers.onPointerDown).toHaveBeenCalledTimes(1);
    expect(handlers.onPointerDown).not.toHaveBeenCalled();
  });

  it('stops routing input after detach', () => {
    const { engine, canvas, handlers } = setup();
    engine.detach();
    fire(canvas, 'pointerdown');
    expect(handlers.onPointerDown).not.toHaveBeenCalled();
  });
});
