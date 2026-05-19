/** Routes canvas pointer input to the active tool. */

import type { EditorTool } from '../model/annotation';
import type { Tool, ToolContext } from './tools/Tool';
import type { ToolRegistry } from './tools/ToolRegistry';

export class DrawingEngine {
  private active: Tool;
  private enabled = true;

  private readonly onPointerDown = (ev: PointerEvent): void => {
    if (!this.enabled) return;
    ev.preventDefault();
    try {
      this.canvas.setPointerCapture(ev.pointerId);
    } catch {
      /* the pointer may already be gone; ignore */
    }
    this.active.onPointerDown(ev, this.ctx);
  };

  private readonly onPointerMove = (ev: PointerEvent): void => {
    if (!this.enabled) return;
    this.active.onPointerMove?.(ev, this.ctx);
  };

  private readonly onPointerUp = (ev: PointerEvent): void => {
    try {
      this.canvas.releasePointerCapture(ev.pointerId);
    } catch {
      /* ignore */
    }
    if (!this.enabled) return;
    this.active.onPointerUp?.(ev, this.ctx);
  };

  private readonly onPointerCancel = (ev: PointerEvent): void => {
    try {
      this.canvas.releasePointerCapture(ev.pointerId);
    } catch {
      /* ignore */
    }
    this.active.onPointerCancel?.(this.ctx);
  };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly registry: ToolRegistry,
    private readonly ctx: ToolContext,
  ) {
    this.active = registry.get(ctx.doc.activeTool);
  }

  attach(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerCancel);
  }

  detach(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerCancel);
  }

  setActiveTool(id: EditorTool): void {
    this.active = this.registry.get(id);
  }

  /** Commit the active tool's inspected element, as the Enter key does. */
  confirm(): void {
    if (!this.enabled) return;
    this.active.onConfirm?.(this.ctx);
  }

  /** Suspend or resume pointer handling (e.g. while the label editor is open). */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  get activeToolId(): EditorTool {
    return this.active.id;
  }
}
