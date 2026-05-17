/** Wires the overlay together: document, canvas, tools, undo, UI, export. */

import type {
  Annotation,
  ChangeRequestAnnotation,
  EditorTool,
  Geometry,
} from '../model/annotation';
import { isChangeRequest } from '../model/annotation';
import type { RedlineDocument } from '../model/document';
import { createDocument, resequence } from '../model/document';
import { pageToClient } from '../model/geometry';
import { annotationBounds } from '../model/geometryOps';
import { AnnotationCanvas } from './AnnotationCanvas';
import { ElementPicker } from './ElementPicker';
import { DrawingEngine } from './DrawingEngine';
import { UndoStack } from './UndoStack';
import { SessionStore } from './SessionStore';
import {
  AddAnnotationCommand,
  ClearAllCommand,
  DeleteAnnotationCommand,
  EditLabelCommand,
  MoveAnnotationCommand,
} from './commands';
import { ToolRegistry } from './tools/ToolRegistry';
import type { ToolContext } from './tools/Tool';
import { SelectTool } from './tools/SelectTool';
import { CalloutTool } from './tools/CalloutTool';
import { TextTool } from './tools/TextTool';
import { RectangleTool } from './tools/RectangleTool';
import { EllipseTool } from './tools/EllipseTool';
import { ArrowTool } from './tools/ArrowTool';
import { FreehandTool } from './tools/FreehandTool';
import { HighlightTool } from './tools/HighlightTool';
import { ShadowHost } from '../ui/ShadowHost';
import { Toolbar } from '../ui/Toolbar';
import type { ToolDef } from '../ui/Toolbar';
import { SidePanel } from '../ui/SidePanel';
import { SessionPrompt } from '../ui/SessionPrompt';
import { LabelEditor } from '../ui/LabelEditor';
import { Toast } from '../ui/Toast';
import { COLORS, STROKE_WIDTHS } from '../platform/constants';
import { loadSettings } from '../platform/settings';
import type { RedlineSettings } from '../platform/settings';
import { captureViewport } from '../capture/captureViewport';
import { captureFullPage } from '../capture/fullPage';
import { buildMarkdown } from '../export/markdown';
import { exportSlug } from '../export/filename';
import { copyToClipboard, dataUrlToBlob } from '../export/clipboard';
import { resolveExportDirectory, writeExportFiles } from '../export/fileSystem';
import { supportsFileSystemAccess } from '../platform/capabilities';

export interface OverlayControllerOptions {
  /** Called whenever the overlay closes, for any reason. */
  onClosed: () => void;
}

interface ExportArtifacts {
  pngBlob: Blob;
  markdown: string;
  slug: string;
}

/** Tools shown in the toolbar, in order, with their single-key shortcuts. */
const TOOL_DEFS: ToolDef[] = [
  { id: 'select', label: 'Select & move', icon: 'select', hotkey: 'V' },
  { id: 'callout', label: 'Callout', icon: 'callout', hotkey: 'C' },
  { id: 'text', label: 'Text note', icon: 'text', hotkey: 'T' },
  { id: 'rectangle', label: 'Rectangle', icon: 'rectangle', hotkey: 'R' },
  { id: 'ellipse', label: 'Ellipse', icon: 'ellipse', hotkey: 'E' },
  { id: 'arrow', label: 'Arrow', icon: 'arrow', hotkey: 'A' },
  { id: 'freehand', label: 'Freehand', icon: 'freehand', hotkey: 'F' },
  { id: 'highlight', label: 'Highlight', icon: 'highlight', hotkey: 'H' },
];

/** Single-key tool shortcuts. */
const HOTKEYS: Record<string, EditorTool> = {
  v: 'select',
  c: 'callout',
  t: 'text',
  r: 'rectangle',
  e: 'ellipse',
  a: 'arrow',
  f: 'freehand',
  h: 'highlight',
};

/** The lifetime-scoped controller for one mounted overlay session. */
export class OverlayController {
  private readonly doc = createDocument();
  private readonly canvas = new AnnotationCanvas(this.doc);
  private readonly shadowHost = new ShadowHost();
  private readonly toast = new Toast(this.shadowHost.root);
  private readonly labelEditor = new LabelEditor(this.shadowHost.root);
  private readonly sessionPrompt = new SessionPrompt(this.shadowHost.root);
  private readonly registry = new ToolRegistry();
  private readonly undo = new UndoStack();
  private readonly session = new SessionStore();
  private readonly picker: ElementPicker;
  private readonly engine: DrawingEngine;
  private readonly toolbar: Toolbar;
  private readonly panel: SidePanel;
  private mounted = false;
  private busy = false;
  private fullPageMode = false;
  private selectedId: string | null = null;

  constructor(private readonly opts: OverlayControllerOptions) {
    this.picker = new ElementPicker(
      (el) => el === this.canvas.el || el === this.shadowHost.host,
    );

    this.registry.register(new SelectTool());
    this.registry.register(new CalloutTool());
    this.registry.register(new TextTool());
    this.registry.register(new RectangleTool());
    this.registry.register(new EllipseTool());
    this.registry.register(new ArrowTool());
    this.registry.register(new FreehandTool());
    this.registry.register(new HighlightTool());

    const toolContext: ToolContext = {
      doc: this.doc,
      picker: this.picker,
      render: () => this.canvas.requestRender(),
      setDraft: (annotation) => this.setDraft(annotation),
      addAnnotation: (annotation) => this.addAnnotation(annotation),
      placeChangeRequest: (annotation) => this.placeChangeRequest(annotation),
      recordMove: (id, before, after) => this.recordMove(id, before, after),
      deleteAnnotation: (id) => this.removeAnnotation(id),
      editLabel: (id) => this.editLabel(id),
      getSelectedId: () => this.selectedId,
      setSelectedId: (id) => this.setSelection(id),
      setCursor: (cursor) => {
        this.canvas.el.style.cursor = cursor;
      },
    };
    this.engine = new DrawingEngine(this.canvas.el, this.registry, toolContext);

    this.panel = new SidePanel({
      onSelect: (id) => this.panelSelect(id),
      onEditLabel: (id) => this.editLabel(id),
      onDelete: (id) => this.removeAnnotation(id),
      onClose: () => this.togglePanel(),
    });

    this.toolbar = new Toolbar({
      tools: TOOL_DEFS,
      colors: COLORS,
      widths: STROKE_WIDTHS,
      activeTool: this.doc.activeTool,
      activeColor: this.doc.activeColor,
      activeWidth: this.doc.activeStrokeWidth,
      onSelectTool: (id) => this.activateTool(id),
      onSelectColor: (color) => {
        this.doc.activeColor = color;
        this.toolbar.setActiveColor(color);
      },
      onSelectWidth: (width) => {
        this.doc.activeStrokeWidth = width;
        this.toolbar.setActiveWidth(width);
      },
      onUndo: () => this.doUndo(),
      onRedo: () => this.doRedo(),
      onClear: () => this.doClear(),
      onTogglePanel: () => this.togglePanel(),
      onToggleFullPage: () => this.toggleFullPage(),
      onCopy: () => void this.runCopy(),
      onSave: () => void this.runSave(false),
      onSaveAs: () => void this.runSave(true),
      onClose: () => this.unmount(),
    });
  }

  mount(): void {
    if (this.mounted) return;
    this.mounted = true;
    const root = document.documentElement;
    this.canvas.mount(root);
    this.shadowHost.mount(root);
    this.shadowHost.root.appendChild(this.toolbar.el);
    this.shadowHost.root.appendChild(this.panel.el);
    this.engine.attach();
    window.addEventListener('keydown', this.onKeyDown, true);
    this.updateCursor(this.doc.activeTool);
    this.toolbar.setUndoEnabled(false);
    this.toolbar.setRedoEnabled(false);
    // stay inert until the saved-session check resolves
    this.engine.setEnabled(false);
    void this.initFromStorage();
  }

  unmount(): void {
    if (!this.mounted) return;
    this.mounted = false;
    this.session.flush(this.doc);
    window.removeEventListener('keydown', this.onKeyDown, true);
    this.labelEditor.close();
    this.sessionPrompt.close();
    this.engine.detach();
    this.toast.destroy();
    this.canvas.unmount();
    this.shadowHost.unmount();
    this.opts.onClosed();
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    // the session prompt is a modal choice; only Escape (= start fresh) passes
    if (this.sessionPrompt.isOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.sessionPrompt.dismiss();
      }
      return;
    }
    if (e.key === 'Escape') {
      // the label editor handles its own Escape and stops propagation
      if (this.labelEditor.isOpen) return;
      e.preventDefault();
      this.unmount();
      return;
    }
    // while the editor is open it owns the keyboard (undo, hotkeys, etc.)
    if (this.labelEditor.isOpen) return;

    if (e.metaKey || e.ctrlKey) {
      const key = e.key.toLowerCase();
      if (key === 'z') {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) this.doRedo();
        else this.doUndo();
      } else if (key === 'y') {
        e.preventDefault();
        e.stopPropagation();
        this.doRedo();
      }
      return;
    }
    if (e.altKey) return;

    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      e.stopPropagation();
      if (this.selectedId) this.removeAnnotation(this.selectedId);
      return;
    }

    const tool = HOTKEYS[e.key.toLowerCase()];
    if (tool) {
      e.preventDefault();
      e.stopPropagation();
      this.activateTool(tool);
    }
  };

  // --- session restore ----------------------------------------------------

  /** Apply stored settings, then offer to resume any saved annotations. */
  private async initFromStorage(): Promise<void> {
    const settings = await loadSettings();
    if (!this.mounted) return;
    this.applySettings(settings);

    const saved = await this.session.load();
    if (!this.mounted) return;
    if (saved && saved.annotations.length > 0) {
      const count = saved.annotations.length;
      this.sessionPrompt.open({
        count,
        onResume: () => {
          this.adoptDocument(saved);
          this.engine.setEnabled(true);
          this.toast.show(
            `Resumed ${count} saved annotation${count === 1 ? '' : 's'}.`,
          );
        },
        onFresh: () => {
          this.engine.setEnabled(true);
          this.toast.show(
            'Started fresh. Your saved annotations are untouched.',
          );
        },
      });
    } else {
      this.engine.setEnabled(true);
      this.toast.show(
        'Redline is on. Click to drop a callout, or pick another tool.',
      );
    }
  }

  private applySettings(settings: RedlineSettings): void {
    this.doc.activeColor = settings.defaultColor;
    this.doc.activeStrokeWidth = settings.defaultStrokeWidth;
    this.toolbar.setActiveColor(settings.defaultColor);
    this.toolbar.setActiveWidth(settings.defaultStrokeWidth);
  }

  /** Replace this session's annotations with a saved document's. */
  private adoptDocument(saved: RedlineDocument): void {
    this.doc.annotations.splice(
      0,
      this.doc.annotations.length,
      ...saved.annotations,
    );
    this.doc.activeColor = saved.activeColor;
    this.doc.activeStrokeWidth = saved.activeStrokeWidth;
    resequence(this.doc);
    this.toolbar.setActiveColor(saved.activeColor);
    this.toolbar.setActiveWidth(saved.activeStrokeWidth);
    this.refreshHistory();
    this.panel.render(this.doc, this.selectedId);
    this.canvas.requestRender();
  }

  // --- tool + state -------------------------------------------------------

  private activateTool(tool: EditorTool): void {
    this.engine.setActiveTool(tool);
    this.doc.activeTool = tool;
    this.toolbar.setActiveTool(tool);
    if (tool !== 'select') this.setSelection(null);
    this.updateCursor(tool);
  }

  private updateCursor(tool: EditorTool): void {
    this.canvas.el.style.cursor =
      tool === 'select' ? 'default' : tool === 'text' ? 'text' : 'crosshair';
  }

  private setDraft(annotation: Annotation | null): void {
    this.canvas.draft = annotation;
    this.canvas.requestRender();
  }

  private setSelection(id: string | null): void {
    this.selectedId = id;
    this.canvas.selectedId = id;
    this.panel.render(this.doc, id);
    this.canvas.requestRender();
  }

  private syncSelectionToDoc(): void {
    if (
      this.selectedId &&
      !this.doc.annotations.some((a) => a.id === this.selectedId)
    ) {
      this.setSelection(null);
    }
  }

  private refreshHistory(): void {
    this.toolbar.setUndoEnabled(this.undo.canUndo());
    this.toolbar.setRedoEnabled(this.undo.canRedo());
  }

  /** Refresh history buttons, the panel, persistence, and the canvas. */
  private afterMutation(): void {
    this.refreshHistory();
    this.panel.render(this.doc, this.selectedId);
    this.session.save(this.doc);
    this.canvas.requestRender();
  }

  private togglePanel(): void {
    const open = !this.panel.isOpen;
    this.panel.setOpen(open);
    this.toolbar.setPanelActive(open);
    if (open) this.panel.render(this.doc, this.selectedId);
  }

  private toggleFullPage(): void {
    this.fullPageMode = !this.fullPageMode;
    this.toolbar.setFullPageActive(this.fullPageMode);
    this.toast.show(
      this.fullPageMode
        ? 'Full-page capture on. Copy and Save will scroll and stitch the page.'
        : 'Full-page capture off. Copy and Save use the visible area.',
    );
  }

  /** Select an annotation from the panel: switch to select mode and reveal it. */
  private panelSelect(id: string): void {
    this.activateTool('select');
    this.setSelection(id);
    const annotation = this.doc.annotations.find((a) => a.id === id);
    if (annotation) this.scrollToAnnotation(annotation);
  }

  private scrollToAnnotation(annotation: Annotation): void {
    const bounds = annotationBounds(annotation);
    const centerY = bounds.y + bounds.h / 2;
    const viewTop = window.scrollY;
    const viewBottom = viewTop + window.innerHeight;
    if (centerY < viewTop + 48 || centerY > viewBottom - 48) {
      window.scrollTo({
        top: Math.max(0, centerY - window.innerHeight / 2),
        behavior: 'smooth',
      });
    }
  }

  // --- undo-backed mutations ---------------------------------------------

  private addAnnotation(annotation: Annotation): void {
    this.undo.execute(new AddAnnotationCommand(this.doc, annotation));
    this.afterMutation();
  }

  private recordMove(id: string, before: Geometry, after: Geometry): void {
    this.undo.execute(new MoveAnnotationCommand(this.doc, id, before, after));
    this.afterMutation();
  }

  private removeAnnotation(id: string): void {
    this.undo.execute(new DeleteAnnotationCommand(this.doc, id));
    if (this.selectedId === id) {
      this.selectedId = null;
      this.canvas.selectedId = null;
    }
    this.afterMutation();
  }

  private doUndo(): void {
    if (!this.undo.undo()) return;
    this.canvas.draft = null;
    this.syncSelectionToDoc();
    this.afterMutation();
  }

  private doRedo(): void {
    if (!this.undo.redo()) return;
    this.canvas.draft = null;
    this.syncSelectionToDoc();
    this.afterMutation();
  }

  private doClear(): void {
    if (this.doc.annotations.length === 0) {
      this.toast.show('There is nothing to clear yet.');
      return;
    }
    this.undo.execute(new ClearAllCommand(this.doc));
    this.canvas.draft = null;
    this.selectedId = null;
    this.canvas.selectedId = null;
    this.afterMutation();
    this.toast.show('Cleared all annotations.');
  }

  // --- change-request labels ---------------------------------------------

  /** Stage a new callout or text note: draft it, then open the label editor. */
  private placeChangeRequest(annotation: ChangeRequestAnnotation): void {
    this.setDraft(annotation);
    this.engine.setEnabled(false);
    const anchor = this.editorAnchorOf(annotation);
    const isText = annotation.geometry.kind === 'text';
    this.labelEditor.open({
      clientX: anchor.x,
      clientY: anchor.y,
      numberLabel: String(annotation.number),
      initialValue: '',
      placeholder: isText
        ? 'Type the note to place on the page'
        : 'e.g. Make this heading larger and bold',
      onInput: isText
        ? (value) => {
            annotation.label = value;
            this.canvas.requestRender();
          }
        : undefined,
      onCommit: (label) => {
        this.engine.setEnabled(true);
        this.setDraft(null);
        if (label) {
          annotation.label = label;
          this.addAnnotation(annotation);
        }
      },
      onCancel: () => {
        this.engine.setEnabled(true);
        this.setDraft(null);
      },
    });
  }

  /** Re-open the label editor for an existing change-request annotation. */
  private editLabel(id: string): void {
    const annotation = this.doc.annotations.find((a) => a.id === id);
    if (!annotation || !isChangeRequest(annotation)) return;
    const before = annotation.label;
    const isText = annotation.geometry.kind === 'text';
    this.engine.setEnabled(false);
    const anchor = this.editorAnchorOf(annotation);
    this.labelEditor.open({
      clientX: anchor.x,
      clientY: anchor.y,
      numberLabel: String(annotation.number),
      initialValue: before,
      placeholder: isText
        ? 'Type the note to place on the page'
        : 'e.g. Make this heading larger and bold',
      onInput: isText
        ? (value) => {
            annotation.label = value;
            this.canvas.requestRender();
          }
        : undefined,
      onCommit: (label) => {
        this.engine.setEnabled(true);
        // reset any live preview edits so the command owns the change
        annotation.label = before;
        if (label === before) {
          this.canvas.requestRender();
          return;
        }
        if (label === '') {
          this.removeAnnotation(id);
        } else {
          this.undo.execute(new EditLabelCommand(this.doc, id, before, label));
          this.afterMutation();
        }
      },
      onCancel: () => {
        this.engine.setEnabled(true);
        annotation.label = before;
        this.canvas.requestRender();
      },
    });
  }

  /** Viewport coordinates to anchor the label editor to. */
  private editorAnchorOf(annotation: ChangeRequestAnnotation): {
    x: number;
    y: number;
  } {
    const g = annotation.geometry;
    return pageToClient(g.kind === 'callout' ? g.anchor : g.origin);
  }

  // --- export -------------------------------------------------------------

  private hasAnnotations(): boolean {
    return this.doc.annotations.length > 0;
  }

  /** Copy the screenshot + changelog to the clipboard. */
  private async runCopy(): Promise<void> {
    if (this.busy) return;
    if (this.labelEditor.isOpen) {
      this.toast.show('Finish the current label first, then export.', {
        tone: 'error',
      });
      return;
    }
    if (!this.hasAnnotations()) {
      this.toast.show('Add at least one annotation before exporting.', {
        tone: 'error',
      });
      return;
    }
    this.busy = true;
    this.toolbar.setBusy(true);
    try {
      const artifacts = await this.capture();
      if (!artifacts) return;
      const result = await copyToClipboard(
        artifacts.pngBlob,
        artifacts.markdown,
      );
      if (!result.ok) {
        this.toast.show(result.error ?? 'Could not copy to the clipboard.', {
          tone: 'error',
        });
      } else if (result.imageAndText) {
        this.toast.show(
          'Copied screenshot + changelog. Paste into Claude Code or any AI chat.',
        );
      } else {
        this.toast.show(
          'Copied the screenshot. This browser would not copy text alongside it.',
        );
      }
    } finally {
      this.busy = false;
      this.toolbar.setBusy(false);
    }
  }

  /**
   * Save the screenshot + changelog into a project folder. With `forcePicker`,
   * always prompt for the folder instead of reusing the last one.
   */
  private async runSave(forcePicker: boolean): Promise<void> {
    if (this.busy) return;
    if (this.labelEditor.isOpen) {
      this.toast.show('Finish the current label first, then export.', {
        tone: 'error',
      });
      return;
    }
    if (!supportsFileSystemAccess()) {
      this.toast.show(
        'Saving to a folder needs a secure (https) page. Use Copy here instead.',
        { tone: 'error' },
      );
      return;
    }
    if (!this.hasAnnotations()) {
      this.toast.show('Add at least one annotation before exporting.', {
        tone: 'error',
      });
      return;
    }
    this.busy = true;
    this.toolbar.setBusy(true);
    try {
      // Resolve the folder first, while the click's user activation is fresh.
      const directory = await resolveExportDirectory(forcePicker);
      if (directory.status === 'cancelled') return;
      if (directory.status === 'error') {
        this.toast.show(directory.message, { tone: 'error' });
        return;
      }
      const artifacts = await this.capture();
      if (!artifacts) return;
      const result = await writeExportFiles(
        directory.dir,
        artifacts.pngBlob,
        artifacts.markdown,
        artifacts.slug,
      );
      if (!result.ok) {
        this.toast.show(result.error ?? 'Could not save the files.', {
          tone: 'error',
        });
      } else {
        this.toast.show(
          `Saved ${artifacts.slug}.png and .md to ${directory.dir.name}/. ` +
            'Run /redline in Claude Code.',
        );
      }
    } finally {
      this.busy = false;
      this.toolbar.setBusy(false);
    }
  }

  /**
   * Build the export artifacts: a PNG (viewport or full-page) plus the
   * markdown changelog. Returns null on failure (a toast is shown).
   */
  private async capture(): Promise<ExportArtifacts | null> {
    try {
      const pngBlob = this.fullPageMode
        ? await this.captureFullPageBlob()
        : await this.captureViewportBlob();
      this.doc.updatedAt = new Date().toISOString();
      const slug = exportSlug(this.doc.pageUrl);
      return {
        pngBlob,
        markdown: buildMarkdown(this.doc, `${slug}.png`),
        slug,
      };
    } catch (err) {
      this.toast.show(err instanceof Error ? err.message : 'Export failed.', {
        tone: 'error',
      });
      return null;
    }
  }

  /** Screenshot just the visible viewport, annotations included. */
  private async captureViewportBlob(): Promise<Blob> {
    const previousSelection = this.canvas.selectedId;
    this.canvas.selectedId = null;
    this.shadowHost.host.style.visibility = 'hidden';
    this.canvas.render();
    await nextFrame();
    try {
      return dataUrlToBlob(await captureViewport());
    } finally {
      this.shadowHost.host.style.visibility = '';
      this.canvas.selectedId = previousSelection;
      this.canvas.render();
    }
  }

  /** Scroll-and-stitch the whole page into one tall annotated screenshot. */
  private async captureFullPageBlob(): Promise<Blob> {
    const previousSelection = this.canvas.selectedId;
    this.canvas.selectedId = null;
    // suppress the canvas (transparent, but it still blocks page clicks); the
    // annotations are composited onto the stitched image afterward
    this.canvas.suppressed = true;
    this.shadowHost.host.style.visibility = 'hidden';
    this.canvas.render();
    const progress = this.toast.beginProgress('Full-page capture in progress.');
    try {
      const result = await captureFullPage({
        doc: this.doc,
        captureViewport,
        ownElements: [this.canvas.el, this.shadowHost.host],
        shouldContinue: () => this.mounted,
        onProgress: (done, total) =>
          progress.update(`Full-page capture: slice ${done} of ${total}`),
      });
      if (result.truncated) {
        this.toast.show(
          'The page is very long. Redline captured the top portion of it.',
          { tone: 'error' },
        );
      }
      return result.blob;
    } finally {
      progress.close();
      this.shadowHost.host.style.visibility = '';
      this.canvas.suppressed = false;
      this.canvas.selectedId = previousSelection;
      this.canvas.render();
    }
  }
}

/** Resolve after two animation frames, so a style change has painted. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}
