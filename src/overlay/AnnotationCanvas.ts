/** The full-viewport canvas that renders annotations on top of the page. */

import type { Annotation } from '../model/annotation';
import type { RedlineDocument } from '../model/document';
import { Z_CANVAS } from '../platform/constants';
import { annotationBounds } from '../model/geometryOps';
import { renderAnnotation, drawSelectionBox } from './Renderer';

/**
 * A `position: fixed` canvas covering the viewport. Annotation geometry is
 * stored in page coordinates; the canvas converts to viewport coordinates on
 * each paint, so annotations track the page as it scrolls.
 */
export class AnnotationCanvas {
  readonly el: HTMLCanvasElement;
  /** An in-progress annotation, drawn as a live preview above the rest. */
  draft: Annotation | null = null;
  /** The selected annotation's id; drawn with a selection box if set. */
  selectedId: string | null = null;
  /** When true the canvas paints nothing (used during full-page capture). */
  suppressed = false;

  private readonly ctx: CanvasRenderingContext2D;
  private rafId = 0;
  private readonly onResize = (): void => this.resize();
  private readonly onScroll = (): void => this.requestRender();

  constructor(private readonly doc: RedlineDocument) {
    this.el = document.createElement('canvas');
    Object.assign(this.el.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      margin: '0',
      padding: '0',
      border: '0',
      zIndex: String(Z_CANVAS),
      pointerEvents: 'auto',
      cursor: 'crosshair',
    });
    const ctx = this.el.getContext('2d');
    if (!ctx) throw new Error('Redline: 2D canvas context unavailable');
    this.ctx = ctx;
  }

  mount(parent: Element): void {
    parent.appendChild(this.el);
    this.resize();
    window.addEventListener('resize', this.onResize, true);
    window.addEventListener('scroll', this.onScroll, true);
  }

  unmount(): void {
    window.removeEventListener('resize', this.onResize, true);
    window.removeEventListener('scroll', this.onScroll, true);
    cancelAnimationFrame(this.rafId);
    this.el.remove();
  }

  /** Schedule a repaint on the next animation frame (coalesces bursts). */
  requestRender(): void {
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(() => this.render());
  }

  /** Repaint immediately. */
  render(): void {
    const { ctx } = this;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    if (this.suppressed) return;
    const sx = window.scrollX;
    const sy = window.scrollY;
    for (const annotation of this.doc.annotations) {
      renderAnnotation(ctx, annotation, sx, sy);
    }
    if (this.draft) renderAnnotation(ctx, this.draft, sx, sy);
    if (this.selectedId) {
      const selected = this.doc.annotations.find(
        (a) => a.id === this.selectedId,
      );
      if (selected) {
        const b = annotationBounds(selected);
        drawSelectionBox(ctx, { x: b.x - sx, y: b.y - sy, w: b.w, h: b.h });
      }
    }
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    this.el.width = Math.round(vw * dpr);
    this.el.height = Math.round(vh * dpr);
    this.el.style.width = vw + 'px';
    this.el.style.height = vh + 'px';
    // draw in CSS pixels; the backing store is scaled for the display density
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.render();
  }
}
