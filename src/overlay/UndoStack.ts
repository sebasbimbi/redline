/** A linear undo/redo stack of reversible commands. */

export interface Command {
  /** A short human-readable label, for debugging. */
  readonly label: string;
  /** Apply the change. Must be safe to call when the change is already applied. */
  do(): void;
  /** Reverse the change. */
  undo(): void;
}

export class UndoStack {
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];

  /** Run a command and record it. Clears the redo history. */
  execute(command: Command): void {
    command.do();
    this.undoStack.push(command);
    this.redoStack.length = 0;
  }

  /** Reverse the most recent command. Returns false if there is nothing to undo. */
  undo(): boolean {
    const command = this.undoStack.pop();
    if (!command) return false;
    command.undo();
    this.redoStack.push(command);
    return true;
  }

  /** Re-apply the most recently undone command. */
  redo(): boolean {
    const command = this.redoStack.pop();
    if (!command) return false;
    command.do();
    this.undoStack.push(command);
    return true;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** Drop all history. */
  clear(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
  }
}
