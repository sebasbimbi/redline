/** The floating Redline toolbar: tools, color, stroke width, history, export. */

import type { EditorTool } from '../model/annotation';
import { ICONS, type IconName } from './icons';

/** One selectable tool, as presented in the toolbar. */
export interface ToolDef {
  id: EditorTool;
  label: string;
  icon: IconName;
  hotkey: string;
}

export interface ToolbarOptions {
  tools: ToolDef[];
  colors: readonly string[];
  widths: readonly number[];
  activeTool: EditorTool;
  activeColor: string;
  activeWidth: number;
  onSelectTool: (id: EditorTool) => void;
  onSelectColor: (color: string) => void;
  onSelectWidth: (width: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onTogglePanel: () => void;
  onCopy: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onClose: () => void;
}

const WIDTH_NAMES = ['Thin', 'Medium', 'Thick'];

export class Toolbar {
  readonly el: HTMLElement;
  private readonly toolButtons = new Map<EditorTool, HTMLButtonElement>();
  private readonly colorButtons = new Map<string, HTMLButtonElement>();
  private readonly widthButtons = new Map<number, HTMLButtonElement>();
  private readonly undoBtn: HTMLButtonElement;
  private readonly redoBtn: HTMLButtonElement;
  private readonly panelBtn: HTMLButtonElement;
  private readonly copyBtn: HTMLButtonElement;
  private readonly saveBtn: HTMLButtonElement;
  private readonly saveAsBtn: HTMLButtonElement;

  constructor(opts: ToolbarOptions) {
    this.el = document.createElement('div');
    this.el.className = 'redline-toolbar';

    const wordmark = document.createElement('span');
    wordmark.className = 'redline-wordmark';
    wordmark.textContent = 'Redline';

    // Tools.
    const toolGroup = group();
    for (const tool of opts.tools) {
      const btn = iconButton(ICONS[tool.icon], `${tool.label} (${tool.hotkey})`);
      if (tool.id === opts.activeTool) btn.classList.add('is-active');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        opts.onSelectTool(tool.id);
      });
      this.toolButtons.set(tool.id, btn);
      toolGroup.appendChild(btn);
    }

    // Colors.
    const colorGroup = group();
    for (const color of opts.colors) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'redline-swatch';
      btn.style.color = color;
      btn.title = `Color ${color}`;
      if (color === opts.activeColor) btn.classList.add('is-active');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        opts.onSelectColor(color);
      });
      this.colorButtons.set(color, btn);
      colorGroup.appendChild(btn);
    }

    // Stroke widths.
    const widthGroup = group();
    opts.widths.forEach((width, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'redline-width';
      btn.title = `${WIDTH_NAMES[i] ?? 'Stroke'} stroke`;
      const dot = document.createElement('span');
      dot.className = 'redline-width-dot';
      const diameter = Math.round(4 + width * 1.4);
      dot.style.width = `${diameter}px`;
      dot.style.height = `${diameter}px`;
      btn.appendChild(dot);
      if (width === opts.activeWidth) btn.classList.add('is-active');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        opts.onSelectWidth(width);
      });
      this.widthButtons.set(width, btn);
      widthGroup.appendChild(btn);
    });

    // History and panel.
    this.undoBtn = iconButton(ICONS.undo, 'Undo (Cmd/Ctrl+Z)');
    this.undoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onUndo();
    });
    this.redoBtn = iconButton(ICONS.redo, 'Redo (Cmd/Ctrl+Shift+Z)');
    this.redoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onRedo();
    });
    const clearBtn = iconButton(ICONS.clear, 'Clear all annotations');
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onClear();
    });
    this.panelBtn = iconButton(ICONS.panel, 'Toggle the annotation panel');
    this.panelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onTogglePanel();
    });
    const historyGroup = group();
    historyGroup.append(this.undoBtn, this.redoBtn, clearBtn, this.panelBtn);

    // Export.
    this.copyBtn = textButton(
      'Copy',
      'redline-btn',
      'Copy the screenshot and changelog to the clipboard',
    );
    this.copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onCopy();
    });
    this.saveBtn = textButton(
      'Save',
      'redline-btn redline-btn-primary redline-split-main',
      'Save the export into your project folder',
    );
    this.saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onSave();
    });
    this.saveAsBtn = textButton(
      '▾',
      'redline-btn redline-btn-primary redline-split-more',
      'Save to a different folder',
    );
    this.saveAsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onSaveAs();
    });
    const saveGroup = document.createElement('span');
    saveGroup.className = 'redline-save-group';
    saveGroup.append(this.saveBtn, this.saveAsBtn);

    const closeBtn = textButton(
      '✕',
      'redline-btn redline-btn-icon',
      'Close Redline (Esc)',
    );
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onClose();
    });

    this.el.append(
      wordmark,
      divider(),
      toolGroup,
      divider(),
      colorGroup,
      widthGroup,
      divider(),
      historyGroup,
      divider(),
      this.copyBtn,
      saveGroup,
      closeBtn,
    );
  }

  /** Highlight the active tool button. */
  setActiveTool(id: EditorTool): void {
    for (const [toolId, btn] of this.toolButtons) {
      btn.classList.toggle('is-active', toolId === id);
    }
  }

  /** Highlight the active color swatch. */
  setActiveColor(color: string): void {
    for (const [value, btn] of this.colorButtons) {
      btn.classList.toggle('is-active', value === color);
    }
  }

  /** Highlight the active stroke-width button. */
  setActiveWidth(width: number): void {
    for (const [value, btn] of this.widthButtons) {
      btn.classList.toggle('is-active', value === width);
    }
  }

  setUndoEnabled(enabled: boolean): void {
    this.undoBtn.disabled = !enabled;
  }

  setRedoEnabled(enabled: boolean): void {
    this.redoBtn.disabled = !enabled;
  }

  /** Reflect whether the annotation panel is open. */
  setPanelActive(active: boolean): void {
    this.panelBtn.classList.toggle('is-active', active);
  }

  /** Disable the export buttons while a copy or save is in progress. */
  setBusy(busy: boolean): void {
    this.copyBtn.disabled = busy;
    this.saveBtn.disabled = busy;
    this.saveAsBtn.disabled = busy;
  }
}

function group(): HTMLElement {
  const el = document.createElement('span');
  el.className = 'redline-group';
  return el;
}

function divider(): HTMLElement {
  const el = document.createElement('span');
  el.className = 'redline-divider';
  return el;
}

function iconButton(icon: string, title: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'redline-btn redline-btn-icon';
  button.title = title;
  button.innerHTML = icon;
  return button;
}

function textButton(
  label: string,
  className: string,
  title: string,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.title = title;
  return button;
}
