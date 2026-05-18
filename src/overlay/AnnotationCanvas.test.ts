// @vitest-environment jsdom

/** Unit tests for the annotation canvas paint logic. */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AnnotationCanvas } from './AnnotationCanvas';
import { renderAnnotation, drawSelectionBox } from './Renderer';
import type { Annotation } from '../model/annotation';
import type { RedlineDocument } from '../model/document';

vi.mock('./Renderer', () => ({
  renderAnnotation: vi.fn(),
  drawSelectionBox: vi.fn(),
}));

const ctx2d = {
  clearRect: vi.fn(),
  setTransform: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    ctx2d as unknown as CanvasRenderingContext2D,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

function emphasis(id: string): Annotation {
  return {
    id,
    createdAt: '2026-05-17T00:00:00.000Z',
    annotationClass: 'visual-emphasis',
    geometry: {
      kind: 'rectangle',
      rect: { x: 0, y: 0, w: 10, h: 10 },
      style: { color: '#000000', width: 2 },
    },
  };
}

function makeDoc(annotations: Annotation[]): RedlineDocument {
  return {
    schemaVersion: 1,
    documentId: 'doc',
    pageUrl: 'https://example.com',
    pageTitle: 'Example',
    viewport: { width: 800, height: 600, devicePixelRatio: 1 },
    scroll: { x: 0, y: 0 },
    annotations,
    activeTool: 'select',
    activeColor: '#000000',
    activeStrokeWidth: 2,
    createdAt: '2026-05-17T00:00:00.000Z',
    updatedAt: '2026-05-17T00:00:00.000Z',
  };
}

describe('AnnotationCanvas', () => {
  it('clears the canvas on render', () => {
    const canvas = new AnnotationCanvas(makeDoc([]));
    canvas.render();
    expect(ctx2d.clearRect).toHaveBeenCalled();
  });

  it('renders every annotation in the document', () => {
    const canvas = new AnnotationCanvas(makeDoc([emphasis('a'), emphasis('b')]));
    canvas.render();
    expect(renderAnnotation).toHaveBeenCalledTimes(2);
  });

  it('paints nothing but the clear when suppressed', () => {
    const canvas = new AnnotationCanvas(makeDoc([emphasis('a')]));
    canvas.suppressed = true;
    canvas.render();
    expect(ctx2d.clearRect).toHaveBeenCalled();
    expect(renderAnnotation).not.toHaveBeenCalled();
  });

  it('renders the in-progress draft annotation', () => {
    const canvas = new AnnotationCanvas(makeDoc([]));
    canvas.draft = emphasis('draft');
    canvas.render();
    expect(renderAnnotation).toHaveBeenCalledTimes(1);
  });

  it('draws a selection box for the selected annotation', () => {
    const canvas = new AnnotationCanvas(makeDoc([emphasis('a')]));
    canvas.selectedId = 'a';
    canvas.render();
    expect(drawSelectionBox).toHaveBeenCalledTimes(1);
  });

  it('draws no selection box when nothing is selected', () => {
    const canvas = new AnnotationCanvas(makeDoc([emphasis('a')]));
    canvas.render();
    expect(drawSelectionBox).not.toHaveBeenCalled();
  });

  it('mounts and unmounts its canvas element', () => {
    const canvas = new AnnotationCanvas(makeDoc([]));
    canvas.mount(document.body);
    expect(document.body.contains(canvas.el)).toBe(true);
    canvas.unmount();
    expect(document.body.contains(canvas.el)).toBe(false);
  });
});
