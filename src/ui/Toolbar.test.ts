// @vitest-environment jsdom

/** Unit tests for the Redline toolbar. */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { Toolbar } from './Toolbar';
import type { ToolbarOptions, ToolDef } from './Toolbar';
import { COLORS, STROKE_WIDTHS } from '../platform/constants';

const TOOLS: ToolDef[] = [
  { id: 'select', label: 'Select', icon: 'select', hotkey: 'V',
    description: 'Select and move.' },
  { id: 'callout', label: 'Callout', icon: 'callout', hotkey: 'C',
    description: 'Numbered callout.' },
  { id: 'text', label: 'Text', icon: 'text', hotkey: 'T',
    description: 'Text note.' },
  { id: 'rectangle', label: 'Rectangle', icon: 'rectangle', hotkey: 'R',
    description: 'Rectangle.' },
  { id: 'ellipse', label: 'Ellipse', icon: 'ellipse', hotkey: 'E',
    description: 'Ellipse.' },
  { id: 'arrow', label: 'Arrow', icon: 'arrow', hotkey: 'A',
    description: 'Arrow.' },
  { id: 'freehand', label: 'Freehand', icon: 'freehand', hotkey: 'F',
    description: 'Freehand.' },
  { id: 'highlight', label: 'Highlight', icon: 'highlight', hotkey: 'H',
    description: 'Highlight.' },
];

let current: Toolbar | null = null;

function setup(overrides: Partial<ToolbarOptions> = {}) {
  const onSelectTool = vi.fn();
  const onSelectColor = vi.fn();
  const onSelectWidth = vi.fn();
  const onInstallCommand = vi.fn();
  const options: ToolbarOptions = {
    tools: TOOLS,
    colors: COLORS,
    widths: STROKE_WIDTHS,
    activeTool: 'callout',
    activeColor: COLORS[0],
    activeWidth: STROKE_WIDTHS[1],
    onSelectTool,
    onSelectColor,
    onSelectWidth,
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onClear: vi.fn(),
    onTogglePanel: vi.fn(),
    onToggleFullPage: vi.fn(),
    onCopy: vi.fn(),
    onSave: vi.fn(),
    onSaveAs: vi.fn(),
    onInstallCommand,
    onClose: vi.fn(),
    onMove: vi.fn(),
    ...overrides,
  };
  const toolbar = new Toolbar(options);
  current = toolbar;
  document.body.appendChild(toolbar.el);
  return {
    toolbar,
    onSelectTool,
    onSelectColor,
    onSelectWidth,
    onInstallCommand,
  };
}

afterEach(() => {
  current?.destroy();
  current = null;
  document.body.innerHTML = '';
});

/** Find a toolbar control by the start of its aria-label. */
function byLabel(toolbar: Toolbar, prefix: string): HTMLElement {
  const el = toolbar.el.querySelector<HTMLElement>(`[aria-label^="${prefix}"]`);
  if (!el) throw new Error(`no control labelled "${prefix}"`);
  return el;
}

describe('Toolbar', () => {
  it('shows select, callout, and text as their own buttons', () => {
    const { toolbar } = setup();
    expect(byLabel(toolbar, 'Select')).toBeTruthy();
    expect(byLabel(toolbar, 'Callout')).toBeTruthy();
    expect(byLabel(toolbar, 'Text')).toBeTruthy();
  });

  it('marks the active tool button', () => {
    const { toolbar } = setup({ activeTool: 'callout' });
    expect(byLabel(toolbar, 'Callout').classList.contains('is-active')).toBe(
      true,
    );
    expect(byLabel(toolbar, 'Select').classList.contains('is-active')).toBe(
      false,
    );
  });

  it('reports a tool choice through onSelectTool', () => {
    const { toolbar, onSelectTool } = setup();
    byLabel(toolbar, 'Select').click();
    expect(onSelectTool).toHaveBeenCalledWith('select');
  });

  it('selects a shape tool from the shapes popover', () => {
    const { toolbar, onSelectTool } = setup();
    byLabel(toolbar, 'Shapes').click();
    const rectangle = toolbar.el.querySelector<HTMLElement>(
      '[aria-label="Rectangle (R)"]',
    );
    expect(rectangle).toBeTruthy();
    rectangle?.click();
    expect(onSelectTool).toHaveBeenCalledWith('rectangle');
  });

  it('marks the shapes trigger active when a shape tool is active', () => {
    const { toolbar } = setup();
    const shapes = byLabel(toolbar, 'Shapes');
    expect(shapes.classList.contains('is-active')).toBe(false);
    toolbar.setActiveTool('arrow');
    expect(shapes.classList.contains('is-active')).toBe(true);
    expect(byLabel(toolbar, 'Callout').classList.contains('is-active')).toBe(
      false,
    );
  });

  it('reports a color choice from the color popover', () => {
    const { toolbar, onSelectColor } = setup();
    byLabel(toolbar, 'Annotation color').click();
    byLabel(toolbar, 'Color:').click();
    expect(onSelectColor).toHaveBeenCalledWith(COLORS[0]);
  });

  it('reports a custom color from the color input', () => {
    const { toolbar, onSelectColor } = setup();
    byLabel(toolbar, 'Annotation color').click();
    byLabel(toolbar, 'Custom color').dispatchEvent(new Event('change'));
    expect(onSelectColor).toHaveBeenCalled();
  });

  it('reports a width choice from the width popover', () => {
    const { toolbar, onSelectWidth } = setup();
    byLabel(toolbar, 'Stroke width').click();
    const widthBtn = toolbar.el.querySelector<HTMLElement>(
      '[aria-label$="stroke width"]',
    );
    expect(widthBtn).toBeTruthy();
    widthBtn?.click();
    expect(onSelectWidth).toHaveBeenCalledWith(STROKE_WIDTHS[0]);
  });

  it('reports through closeOpenPopover whether a popover was open', () => {
    const { toolbar } = setup();
    expect(toolbar.closeOpenPopover()).toBe(false);
    byLabel(toolbar, 'Shapes').click();
    expect(toolbar.closeOpenPopover()).toBe(true);
    expect(toolbar.closeOpenPopover()).toBe(false);
  });

  it('enables and disables the undo button', () => {
    const { toolbar } = setup();
    const undo = byLabel(toolbar, 'Undo') as HTMLButtonElement;
    toolbar.setUndoEnabled(false);
    expect(undo.disabled).toBe(true);
    toolbar.setUndoEnabled(true);
    expect(undo.disabled).toBe(false);
  });

  it('reports the install-command action', () => {
    const { toolbar, onInstallCommand } = setup();
    byLabel(toolbar, 'Install').click();
    expect(onInstallCommand).toHaveBeenCalled();
  });
});
