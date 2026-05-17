/** A lookup of available drawing tools, keyed by tool id. */

import type { ToolId } from '../../model/annotation';
import type { Tool } from './Tool';

export class ToolRegistry {
  private readonly tools = new Map<ToolId, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.id, tool);
  }

  get(id: ToolId): Tool {
    const tool = this.tools.get(id);
    if (!tool) throw new Error(`Redline: no tool registered for "${id}"`);
    return tool;
  }

  has(id: ToolId): boolean {
    return this.tools.has(id);
  }
}
