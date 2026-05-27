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
import { pageToClient, type Rect } from '../model/geometry';
import { annotationBounds } from '../model/geometryOps';
import { AnnotationCanvas } from './AnnotationCanvas';
import { ElementPicker } from './ElementPicker';
import { ElementInspector } from './ElementInspector';
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
import { MeasureTool } from './tools/MeasureTool';
import { TextEditTool } from './tools/TextEditTool';
import { ShadowHost } from '../ui/ShadowHost';
import { Toolbar } from '../ui/Toolbar';
import type { ToolDef } from '../ui/Toolbar';
import { ElementHighlighter } from '../ui/ElementHighlighter';
import { SidePanel } from '../ui/SidePanel';
import { SessionPrompt } from '../ui/SessionPrompt';
import { LabelEditor } from '../ui/LabelEditor';
import { InlineTextEditor } from '../ui/InlineTextEditor';
import { Toast } from '../ui/Toast';
import { COLORS, STROKE_WIDTHS } from '../platform/constants';
import { loadSettings, saveToolbarPosition } from '../platform/settings';
import type { RedlineSettings } from '../platform/settings';
import { captureViewport } from '../capture/captureViewport';
import { captureFullPage } from '../capture/fullPage';
import { buildMarkdown } from '../export/markdown';
import { exportSlug } from '../export/filename';
import { copyToClipboard, dataUrlToBlob } from '../export/clipboard';
import { downloadBlob } from '../export/download';
import {
  installRedlineCommand,
  redlineCommandText,
  resolveExportDirectory,
  writeExportFiles,
} from '../export/fileSystem';
import { supportsFileSystemAccess } from '../platform/capabilities';
import { isExtensionContextValid } from '../platform/extensionContext';

export interface OverlayControllerOptions {
  /** Called whenever the overlay closes, for any reason. */
  onClosed: () => void;
}

interface ExportArtifacts {
  pngBlob: Blob;
  markdown: string;
  slug: string;
}

/** A live text edit: the page element, its original markup, and the new text. */
interface TextEditEntry {
  element: HTMLElement;
  originalHTML: string;
  newText: string;
}

/** Tools shown in the toolbar, in order, with their single-key shortcuts. */
const TOOL_DEFS: ToolDef[] = [
  { id: 'select', label: 'Select & move', icon: 'select', hotkey: 'V',
    description: 'Pick a mark to drag it, or press Delete to remove it.' },
  { id: 'callout', label: 'Callout', icon: 'callout', hotkey: 'C',
    description: 'Drop a numbered marker on an element, then describe the change.' },
  { id: 'text', label: 'Text note', icon: 'text', hotkey: 'T',
    description: 'Place an editable note anchored to an element.' },
  { id: 'textedit', label: 'Edit text', icon: 'textedit', hotkey: 'D',
    description: 'Rewrite a text element on the page; saved as old text to new text.' },
  { id: 'rectangle', label: 'Rectangle', icon: 'rectangle', hotkey: 'R',
    description: 'Draw a rectangle. Visual emphasis, not a change request.' },
  { id: 'ellipse', label: 'Ellipse', icon: 'ellipse', hotkey: 'E',
    description: 'Draw an ellipse. Visual emphasis, not a change request.' },
  { id: 'arrow', label: 'Arrow', icon: 'arrow', hotkey: 'A',
    description: 'Draw an arrow. Visual emphasis, not a change request.' },
  { id: 'freehand', label: 'Freehand', icon: 'freehand', hotkey: 'F',
    description: 'Draw a freehand stroke. Visual emphasis, not a change request.' },
  { id: 'highlight', label: 'Highlight', icon: 'highlight', hotkey: 'H',
    description: 'Brush a translucent highlight over an area.' },
  { id: 'measure', label: 'Measure', icon: 'measure', hotkey: 'M',
    description: 'Measure a distance in pixels. Visual emphasis only.' },
];

/** Single-key tool shortcuts. */
const HOTKEYS: Record<string, EditorTool> = {
  v: 'select',
  c: 'callout',
  t: 'text',
  d: 'textedit',
  r: 'rectangle',
  e: 'ellipse',
  a: 'arrow',
  f: 'freehand',
  h: 'highlight',
  m: 'measure',
};

/** The lifetime-scoped controller for one mounted overlay session. */
export class OverlayController {
  private readonly doc = createDocument();
  private readonly canvas = new AnnotationCanvas(this.doc);
  private readonly shadowHost = new ShadowHost();
  private readonly toast = new Toast(this.shadowHost.root);
  private readonly labelEditor = new LabelEditor(this.shadowHost.root);
  private readonly inlineEditor = new InlineTextEditor();
  private readonly sessionPrompt = new SessionPrompt(this.shadowHost.root);
  private readonly registry = new ToolRegistry();
  private readonly undo = new UndoStack();
  private readonly session = new SessionStore();
  private readonly picker: ElementPicker;
  private readonly inspector: ElementInspector;
  private readonly engine: DrawingEngine;
  private readonly toolbar: Toolbar;
  private readonly panel: SidePanel;
  private mounted = false;
  private busy = false;
  private fullPageMode = false;
  private selectedId: string | null = null;
  /** Live in-place text edits, keyed by annotation id. */
  private readonly textEdits = new Map<string, TextEditEntry>();
  /** An edit open in the inline editor but not yet committed. */
  private pendingEdit: { element: HTMLElement; originalHTML: string } | null =
    null;
  private contextTimer = 0;

  constructor(private readonly opts: OverlayControllerOptions) {
    this.picker = new ElementPicker(
      (el) => el === this.canvas.el || el === this.shadowHost.host,
    );
    this.inspector = new ElementInspector(
      this.picker,
      new ElementHighlighter(this.shadowHost.root),
    );

    this.registry.register(new SelectTool());
    this.registry.register(new CalloutTool());
    this.registry.register(new TextTool());
    this.registry.register(new RectangleTool());
    this.registry.register(new EllipseTool());
    this.registry.register(new ArrowTool());
    this.registry.register(new FreehandTool());
    this.registry.register(new HighlightTool());
    this.registry.register(new MeasureTool());
    this.registry.register(new TextEditTool());

    const toolContext: ToolContext = {
      doc: this.doc,
      inspectAt: (x, y) => this.inspector.moveTo(x, y),
      pickedElement: () => this.inspector.current(),
      lastInspectPoint: () =>
        this.inspector.hasTarget() ? this.inspector.lastClient() : null,
      render: () => this.canvas.requestRender(),
      setDraft: (annotation) => this.setDraft(annotation),
      addAnnotation: (annotation) => this.addAnnotation(annotation),
      placeChangeRequest: (annotation) => this.placeChangeRequest(annotation),
      beginTextEdit: (annotation, element) =>
        this.beginTextEdit(annotation, element),
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
      onInstallCommand: () => void this.runInstallCommand(),
      onClose: () => this.unmount(),
      onMove: (position) => void saveToolbarPosition(position),
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
    this.inspector.setEnabled(isAnchoredTool(this.doc.activeTool));
    this.toolbar.setUndoEnabled(false);
    this.toolbar.setRedoEnabled(false);
    // stay inert until the saved-session check resolves
    this.engine.setEnabled(false);
    // detect the extension being reloaded out from under this overlay
    this.contextTimer = window.setInterval(() => {
      if (!isExtensionContextValid()) this.handleContextLoss();
    }, 3000);
    void this.initFromStorage();
  }

  unmount(): void {
    if (!this.mounted) return;
    this.mounted = false;
    window.clearInterval(this.contextTimer);
    this.session.flush(this.doc);
    window.removeEventListener('keydown', this.onKeyDown, true);
    this.labelEditor.close();
    this.sessionPrompt.close();
    this.inlineEditor.close();
    this.revertAllTextEdits();
    this.engine.detach();
    this.toolbar.destroy();
    this.inspector.destroy();
    this.toast.destroy();
    this.canvas.unmount();
    this.shadowHost.unmount();
    this.opts.onClosed();
  }

  /**
   * The extension was reloaded or updated while the overlay was open, so its
   * APIs are dead. Tear the overlay down without touching them.
   */
  private handleContextLoss(): void {
    if (!this.mounted) return;
    this.mounted = false;
    window.clearInterval(this.contextTimer);
    window.removeEventListener('keydown', this.onKeyDown, true);
    this.labelEditor.close();
    this.sessionPrompt.close();
    this.inlineEditor.close();
    this.revertAllTextEdits();
    this.engine.detach();
    this.canvas.unmount();
    // drop the dead toolbar and panel so only the toast stays interactive
    this.toolbar.destroy();
    this.inspector.destroy();
    this.toolbar.el.remove();
    this.panel.el.remove();
    // the extension APIs are dead, so the session cannot be flushed
    this.toast.show(
      'Redline was reloaded or updated. Refresh this page to use it again.',
      { tone: 'error', durationMs: 6000 },
    );
    window.setTimeout(() => {
      this.toast.destroy();
      this.shadowHost.unmount();
    }, 6500);
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
      // a text edit in progress takes Escape to cancel itself
      if (this.inlineEditor.isOpen) return;
      // an open picker popover takes Escape before the overlay closes
      if (this.toolbar.closeOpenPopover()) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      this.unmount();
      return;
    }
    // while an editor is open it owns the keyboard (undo, hotkeys, etc.)
    if (this.labelEditor.isOpen || this.inlineEditor.isOpen) return;

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

    // arrow keys walk the DOM tree while an element-anchored tool inspects it
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (this.inspector.isEnabled() && this.inspector.hasTarget()) {
        e.preventDefault();
        e.stopPropagation();
        this.inspector.traverse(e.key === 'ArrowUp');
      }
      return;
    }

    // Enter commits the inspected element directly, so a keyboard tree-walk is
    // not lost to the hit-test a click re-runs (which an animated page can
    // resolve to a different element).
    if (e.key === 'Enter') {
      if (this.inspector.isEnabled() && this.inspector.hasTarget()) {
        e.preventDefault();
        e.stopPropagation();
        this.engine.confirm();
      }
      return;
    }

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
    if (settings.toolbarPosition) {
      this.toolbar.restorePosition(settings.toolbarPosition);
    }
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
    this.applyTextEditsFromDoc();
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
    this.inspector.setEnabled(isAnchoredTool(tool));
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
    this.reconcileTextEdits();
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
    this.inspector.hide();
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
    const point =
      g.kind === 'callout'
        ? g.anchor
        : g.kind === 'text'
          ? g.origin
          : { x: g.box.x, y: g.box.y };
    return pageToClient(point);
  }

  // --- in-place text edits -----------------------------------------------

  /**
   * Begin editing a page element's text in place. The element turns editable;
   * on commit the before/after text is attached to the annotation and it is
   * added to the document. On cancel, or when the text is unchanged, the
   * element is restored and nothing is added.
   */
  private beginTextEdit(
    annotation: ChangeRequestAnnotation,
    element: HTMLElement,
  ): void {
    if (annotation.geometry.kind !== 'textedit') return;
    const geometry = annotation.geometry;
    this.inspector.hide();
    this.engine.setEnabled(false);
    this.canvas.el.style.pointerEvents = 'none';
    const originalHTML = element.innerHTML;
    const oldText = normalizeText(element.textContent);
    this.pendingEdit = { element, originalHTML };

    const stopEditing = (): void => {
      this.pendingEdit = null;
      this.engine.setEnabled(true);
      this.canvas.el.style.pointerEvents = 'auto';
    };

    this.toast.show(
      'Editing text. Cmd/Ctrl+Enter or click away to save, Esc to discard.',
    );
    this.inlineEditor.open(element, {
      // toolbar clicks (Save, Copy, tool switches) must not silently
      // auto-commit; runSave/runCopy guard on `inlineEditor.isOpen` so the
      // user gets a clear "finish the edit first" message instead of a save
      // that drops the unfinished edit on the floor.
      ownUiRoot: this.shadowHost.host,
      onCommit: () => {
        stopEditing();
        const newText = normalizeText(element.textContent);
        if (newText === oldText) {
          element.innerHTML = originalHTML;
          this.toast.show('Text unchanged. Nothing was saved.');
          return;
        }
        geometry.oldText = oldText;
        geometry.newText = newText;
        geometry.box = pageRect(element);
        this.textEdits.set(annotation.id, { element, originalHTML, newText });
        this.addAnnotation(annotation);
        this.toast.show(`Saved the text edit as change ${annotation.number}.`);
      },
      onCancel: () => {
        stopEditing();
        element.innerHTML = originalHTML;
      },
    });
  }

  /**
   * Reconcile the live page DOM to the text-edit annotations: an edit still in
   * the document shows its new text; one that was undone, deleted, or cleared
   * is restored to the element's original markup. Run after every mutation.
   */
  private reconcileTextEdits(): void {
    for (const [id, entry] of this.textEdits) {
      if (!entry.element.isConnected) continue;
      if (this.doc.annotations.some((a) => a.id === id)) {
        if (entry.element.textContent !== entry.newText) {
          entry.element.textContent = entry.newText;
        }
      } else {
        entry.element.innerHTML = entry.originalHTML;
      }
    }
  }

  /** Re-apply saved text edits to the page when a session is resumed. */
  private applyTextEditsFromDoc(): void {
    for (const annotation of this.doc.annotations) {
      if (annotation.annotationClass !== 'change-request') continue;
      const geometry = annotation.geometry;
      if (geometry.kind !== 'textedit') continue;
      if (this.textEdits.has(annotation.id)) continue;
      const element = annotation.element
        ? resolveElement(annotation.element.selector)
        : null;
      if (!element) continue;
      this.textEdits.set(annotation.id, {
        element,
        originalHTML: element.innerHTML,
        newText: geometry.newText,
      });
      element.textContent = geometry.newText;
    }
  }

  /** Restore every edited page element to its original markup. */
  private revertAllTextEdits(): void {
    if (this.pendingEdit && this.pendingEdit.element.isConnected) {
      this.pendingEdit.element.innerHTML = this.pendingEdit.originalHTML;
    }
    this.pendingEdit = null;
    for (const entry of this.textEdits.values()) {
      if (entry.element.isConnected) {
        entry.element.innerHTML = entry.originalHTML;
      }
    }
    this.textEdits.clear();
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
    if (this.inlineEditor.isOpen) {
      this.toast.show(
        'Finish the text edit first: Cmd/Ctrl+Enter to keep it, Esc to discard.',
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
    if (this.inlineEditor.isOpen) {
      this.toast.show(
        'Finish the text edit first: Cmd/Ctrl+Enter to keep it, Esc to discard.',
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
      // Folder-save needs the File System Access API, which browsers gate to
      // secure (https) pages. On a plain http page, fall back to a download so
      // the export is never a dead end.
      if (!supportsFileSystemAccess()) {
        await this.downloadExport();
        return;
      }
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
   * Export by downloading the screenshot and changelog to the browser's
   * downloads folder. The fallback for pages where folder-save is unavailable
   * (a plain http page): a download needs no secure context, so it always
   * works. The two files land in Downloads for the user to move into a project.
   */
  private async downloadExport(): Promise<void> {
    const artifacts = await this.capture();
    if (!artifacts) return;
    downloadBlob(this.shadowHost.root, artifacts.pngBlob, `${artifacts.slug}.png`);
    downloadBlob(
      this.shadowHost.root,
      new Blob([artifacts.markdown], { type: 'text/markdown' }),
      `${artifacts.slug}.md`,
    );
    this.toast.show(
      'Folder save needs an https page. Redline downloaded the screenshot ' +
        'and changelog to your Downloads folder instead. Move them into your ' +
        'project, then run /redline in Claude Code.',
    );
  }

  /** Install the /redline slash command into a project the user picks. */
  private async runInstallCommand(): Promise<void> {
    if (this.busy) return;
    // Writing into .claude/commands/ needs the File System Access API (secure
    // pages only). On a plain http page, download the command file instead.
    if (!supportsFileSystemAccess()) {
      downloadBlob(
        this.shadowHost.root,
        new Blob([redlineCommandText()], { type: 'text/markdown' }),
        'redline.md',
      );
      this.toast.show(
        'Installing into a folder needs an https page. Redline downloaded ' +
          'redline.md to your Downloads folder instead. Move it into your ' +
          "project's .claude/commands/ folder.",
      );
      return;
    }
    const result = await installRedlineCommand();
    if (result.status === 'cancelled') return;
    if (result.status === 'error') {
      this.toast.show(result.message, { tone: 'error' });
      return;
    }
    this.toast.show(
      `Installed the /redline command into ${result.projectName}/.claude/` +
        'commands/. Run /redline in Claude Code there.',
    );
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
      if (!isExtensionContextValid()) {
        this.handleContextLoss();
        return null;
      }
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

/** Whether a tool anchors its annotations to a page element. */
function isAnchoredTool(tool: EditorTool): boolean {
  return tool === 'callout' || tool === 'text' || tool === 'textedit';
}

/** Collapse runs of whitespace and trim, for a clean, greppable text value. */
function normalizeText(text: string | null): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

/** The page-coordinate bounding box of an element. */
function pageRect(element: HTMLElement): Rect {
  const r = element.getBoundingClientRect();
  return {
    x: r.left + window.scrollX,
    y: r.top + window.scrollY,
    w: r.width,
    h: r.height,
  };
}

/** Resolve a stored selector to a single page element, or null. */
function resolveElement(selector: string): HTMLElement | null {
  try {
    const el = document.querySelector(selector);
    return el instanceof HTMLElement ? el : null;
  } catch {
    return null;
  }
}

/** Resolve after two animation frames, so a style change has painted. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}
