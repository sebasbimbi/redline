/** Routes canvas pointer input to the active tool. */

import type { ToolId } from '../model/annotation';
import type { Tool, ToolContext } from './tools/Tool';
import type { ToolRegistry } from './tools/ToolRegistry';

export class DrawingEngine {
  private active: Tool;
  private enabled = true;

  private readonly onPointerDown = (ev: PointerEvent): void => {
    if (!this.enabled) return;
    ev.preventDefault();
    this.active.onPointerDown(ev, this.ctx);
  };
  private readonly onPointerMove = (ev: PointerEvent): void => {
    this.active.onPointerMove?.(ev, this.ctx);
  };
  private readonly onPointerUp = (ev: PointerEvent): void => {
    this.active.onPointerUp?.(ev, this.ctx);
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
  }

  detach(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
  }

  setActiveTool(id: ToolId): void {
    this.active = this.registry.get(id);
    this.ctx.doc.activeTool = id;
  }

  /** Suspend or resume pointer handling (e.g. while the label editor is open). */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  get activeToolId(): ToolId {
    return this.active.id;
  }
}
