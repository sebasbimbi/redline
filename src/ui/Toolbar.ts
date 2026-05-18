/** The floating Redline toolbar: tools, color, stroke width, history, export. */

import type { EditorTool } from '../model/annotation';
import type { ToolbarPosition } from '../platform/settings';
import { ICONS, type IconName } from './icons';

/** One selectable tool, as presented in the toolbar. */
export interface ToolDef {
  id: EditorTool;
  label: string;
  icon: IconName;
  hotkey: string;
  /** One line on what the tool does, shown in its hover tooltip. */
  description: string;
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
  onToggleFullPage: () => void;
  onCopy: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onClose: () => void;
  /** Persist the toolbar position after the user drags it. */
  onMove: (position: ToolbarPosition) => void;
}

const WIDTH_NAMES = ['Thin', 'Medium', 'Thick'];
const COLOR_NAMES = ['Red', 'Orange', 'Amber', 'Green', 'Blue', 'Purple'];

/** Hover delay before a tooltip appears, in milliseconds. */
const TOOLTIP_DELAY = 430;
/** Gap kept between the toolbar (or a tooltip) and the viewport edge. */
const EDGE_MARGIN = 8;

export class Toolbar {
  readonly el: HTMLElement;
  private readonly toolButtons = new Map<EditorTool, HTMLButtonElement>();
  private readonly colorButtons = new Map<string, HTMLButtonElement>();
  private readonly widthButtons = new Map<number, HTMLButtonElement>();
  private readonly undoBtn: HTMLButtonElement;
  private readonly redoBtn: HTMLButtonElement;
  private readonly panelBtn: HTMLButtonElement;
  private readonly fullPageBtn: HTMLButtonElement;
  private readonly copyBtn: HTMLButtonElement;
  private readonly saveBtn: HTMLButtonElement;
  private readonly saveAsBtn: HTMLButtonElement;
  private readonly tooltip: HTMLElement;
  private readonly onMove: (position: ToolbarPosition) => void;
  private position: ToolbarPosition | null = null;
  private dragDX = 0;
  private dragDY = 0;
  private dragging = false;
  private tipTimer = 0;

  constructor(opts: ToolbarOptions) {
    this.onMove = opts.onMove;
    this.el = document.createElement('div');
    this.el.className = 'redline-toolbar';

    const wordmark = document.createElement('span');
    wordmark.className = 'redline-wordmark';
    wordmark.textContent = 'Redline';
    wordmark.dataset.tip = 'Drag to move the toolbar anywhere on the page.';

    // Tools.
    const toolGroup = group();
    for (const tool of opts.tools) {
      const btn = iconButton(
        ICONS[tool.icon],
        `${tool.label} (${tool.hotkey}). ${tool.description}`,
      );
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
    opts.colors.forEach((color, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'redline-swatch';
      btn.style.color = color;
      setTip(btn, `Annotation color: ${COLOR_NAMES[i] ?? color}`);
      if (color === opts.activeColor) btn.classList.add('is-active');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        opts.onSelectColor(color);
      });
      this.colorButtons.set(color, btn);
      colorGroup.appendChild(btn);
    });

    // Stroke widths.
    const widthGroup = group();
    opts.widths.forEach((width, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'redline-width';
      setTip(btn, `${WIDTH_NAMES[i] ?? 'Stroke'} stroke width`);
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
    this.undoBtn = iconButton(ICONS.undo, 'Undo the last change (Cmd/Ctrl+Z).');
    this.undoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onUndo();
    });
    this.redoBtn = iconButton(
      ICONS.redo,
      'Redo the last undone change (Cmd/Ctrl+Shift+Z).',
    );
    this.redoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onRedo();
    });
    const clearBtn = iconButton(ICONS.clear, 'Remove every annotation.');
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onClear();
    });
    this.panelBtn = iconButton(
      ICONS.panel,
      'Toggle the annotation panel: a list of every mark you placed.',
    );
    this.panelBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onTogglePanel();
    });
    const historyGroup = group();
    historyGroup.append(this.undoBtn, this.redoBtn, clearBtn, this.panelBtn);

    // Export.
    this.fullPageBtn = iconButton(
      ICONS.fullpage,
      'Full-page capture. When on, Copy and Save scroll and stitch the ' +
        'whole page instead of the visible area.',
    );
    this.fullPageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onToggleFullPage();
    });
    this.copyBtn = textButton(
      'Copy',
      'redline-btn',
      'Copy the screenshot and changelog to the clipboard.',
    );
    this.copyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onCopy();
    });
    this.saveBtn = textButton(
      'Save',
      'redline-btn redline-btn-primary redline-split-main',
      'Save the screenshot and changelog into your project folder.',
    );
    this.saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      opts.onSave();
    });
    this.saveAsBtn = textButton(
      '▾',
      'redline-btn redline-btn-primary redline-split-more',
      'Save into a different folder.',
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
      'Close Redline (Esc).',
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
      this.fullPageBtn,
      this.copyBtn,
      saveGroup,
      closeBtn,
    );

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'redline-tooltip';
    this.el.appendChild(this.tooltip);

    this.wireDrag();
    this.wireTooltips();
    window.addEventListener('resize', this.onResize);
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

  /** Reflect whether full-page capture mode is on. */
  setFullPageActive(active: boolean): void {
    this.fullPageBtn.classList.toggle('is-active', active);
  }

  /** Disable the export buttons while a copy or save is in progress. */
  setBusy(busy: boolean): void {
    this.copyBtn.disabled = busy;
    this.saveBtn.disabled = busy;
    this.saveAsBtn.disabled = busy;
  }

  /** Restore a saved position, re-clamped to the current viewport. */
  restorePosition(position: ToolbarPosition): void {
    this.moveTo(position.x, position.y);
  }

  /** Release window-level listeners and timers before the toolbar is dropped. */
  destroy(): void {
    window.removeEventListener('resize', this.onResize);
    window.clearTimeout(this.tipTimer);
  }

  // --- drag ---------------------------------------------------------------

  /** Let the user drag the toolbar by any part of it that is not a control. */
  private wireDrag(): void {
    this.el.addEventListener('pointerdown', (e) => {
      this.cancelTip();
      if (e.button !== 0) return;
      // a press on a control is a click, not the start of a drag
      if ((e.target as Element | null)?.closest('button')) return;
      this.beginDrag(e);
    });
    this.el.addEventListener('pointermove', (e) => {
      if (!this.dragging) return;
      this.moveTo(e.clientX - this.dragDX, e.clientY - this.dragDY);
    });
    this.el.addEventListener('pointerup', (e) => this.endDrag(e));
    this.el.addEventListener('pointercancel', (e) => this.endDrag(e));
  }

  private beginDrag(e: PointerEvent): void {
    const rect = this.el.getBoundingClientRect();
    this.dragDX = e.clientX - rect.left;
    this.dragDY = e.clientY - rect.top;
    this.dragging = true;
    this.el.classList.add('is-dragging');
    try {
      this.el.setPointerCapture(e.pointerId);
    } catch {
      /* pointer capture is best-effort */
    }
    e.preventDefault();
  }

  private endDrag(e: PointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.el.classList.remove('is-dragging');
    try {
      this.el.releasePointerCapture(e.pointerId);
    } catch {
      /* the pointer may already be released */
    }
    if (this.position) this.onMove(this.position);
  }

  /** Place the toolbar at a pixel position, clamped inside the viewport. */
  private moveTo(x: number, y: number): void {
    const maxX = Math.max(
      EDGE_MARGIN,
      window.innerWidth - this.el.offsetWidth - EDGE_MARGIN,
    );
    const maxY = Math.max(
      EDGE_MARGIN,
      window.innerHeight - this.el.offsetHeight - EDGE_MARGIN,
    );
    const cx = clamp(x, EDGE_MARGIN, maxX);
    const cy = clamp(y, EDGE_MARGIN, maxY);
    this.position = { x: cx, y: cy };
    this.el.style.left = `${cx}px`;
    this.el.style.top = `${cy}px`;
    this.el.style.transform = 'none';
  }

  /** Keep a pinned toolbar on screen when the window is resized. */
  private readonly onResize = (): void => {
    if (this.position) this.moveTo(this.position.x, this.position.y);
  };

  // --- tooltips -----------------------------------------------------------

  private wireTooltips(): void {
    const targets = this.el.querySelectorAll<HTMLElement>(
      'button, .redline-wordmark',
    );
    for (const target of targets) {
      target.addEventListener('pointerenter', () => this.scheduleTip(target));
      target.addEventListener('pointerleave', () => this.cancelTip());
    }
  }

  private scheduleTip(target: HTMLElement): void {
    window.clearTimeout(this.tipTimer);
    if (this.dragging) return;
    const text = target.dataset.tip;
    if (!text) return;
    this.tipTimer = window.setTimeout(
      () => this.showTip(target, text),
      TOOLTIP_DELAY,
    );
  }

  private cancelTip(): void {
    window.clearTimeout(this.tipTimer);
    this.tooltip.classList.remove('is-visible');
  }

  private showTip(target: HTMLElement, text: string): void {
    if (this.dragging) return;
    this.tooltip.textContent = text;
    // visibility:hidden keeps the box laid out, so it can be measured here
    const tipW = this.tooltip.offsetWidth;
    const tipH = this.tooltip.offsetHeight;
    const rect = target.getBoundingClientRect();

    // sit below the control, or above it when below would leave the viewport
    const below = rect.bottom + tipH + 10 <= window.innerHeight - EDGE_MARGIN;
    const top = below
      ? target.offsetTop + target.offsetHeight + 9
      : target.offsetTop - tipH - 9;

    // center on the control, then nudge to keep the tooltip on screen
    let left = target.offsetLeft + target.offsetWidth / 2;
    const centerX = this.el.getBoundingClientRect().left + left;
    const onScreenX = clamp(
      centerX,
      EDGE_MARGIN + tipW / 2,
      window.innerWidth - EDGE_MARGIN - tipW / 2,
    );
    left += onScreenX - centerX;

    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.top = `${top}px`;
    this.tooltip.classList.add('is-visible');
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

/** Give an element a hover tooltip and a matching accessible label. */
function setTip(el: HTMLElement, text: string): void {
  el.dataset.tip = text;
  el.setAttribute('aria-label', text);
}

function iconButton(icon: string, tip: string): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'redline-btn redline-btn-icon';
  button.innerHTML = icon;
  setTip(button, tip);
  return button;
}

function textButton(
  label: string,
  className: string,
  tip: string,
): HTMLButtonElement {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  setTip(button, tip);
  return button;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(Math.max(value, lo), hi);
}
