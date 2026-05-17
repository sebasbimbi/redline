/** Wires the overlay together: document, canvas, UI, drawing engine, export. */

import { createDocument, resequence } from '../model/document';
import { isChangeRequest } from '../model/annotation';
import { AnnotationCanvas } from './AnnotationCanvas';
import { ElementPicker } from './ElementPicker';
import { DrawingEngine } from './DrawingEngine';
import { ToolRegistry } from './tools/ToolRegistry';
import { CalloutTool } from './tools/CalloutTool';
import type { ToolContext } from './tools/Tool';
import { ShadowHost } from '../ui/ShadowHost';
import { Toolbar } from '../ui/Toolbar';
import { LabelEditor } from '../ui/LabelEditor';
import { Toast } from '../ui/Toast';
import { captureViewport } from '../capture/captureViewport';
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

/** The lifetime-scoped controller for one mounted overlay session. */
export class OverlayController {
  private readonly doc = createDocument();
  private readonly canvas = new AnnotationCanvas(this.doc);
  private readonly shadowHost = new ShadowHost();
  private readonly toast = new Toast(this.shadowHost.root);
  private readonly labelEditor = new LabelEditor(this.shadowHost.root);
  private readonly registry = new ToolRegistry();
  private readonly picker: ElementPicker;
  private readonly engine: DrawingEngine;
  private readonly toolbar: Toolbar;
  private mounted = false;
  private busy = false;

  constructor(private readonly opts: OverlayControllerOptions) {
    this.picker = new ElementPicker(
      (el) => el === this.canvas.el || el === this.shadowHost.host,
    );
    this.registry.register(new CalloutTool());

    const toolContext: ToolContext = {
      doc: this.doc,
      picker: this.picker,
      render: () => this.canvas.requestRender(),
      editLabel: (id) => this.openLabelEditor(id),
    };
    this.engine = new DrawingEngine(this.canvas.el, this.registry, toolContext);

    this.toolbar = new Toolbar({
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
    this.engine.attach();
    window.addEventListener('keydown', this.onKeyDown, true);
    this.toast.show('Redline is on. Click an element to add a callout.');
  }

  unmount(): void {
    if (!this.mounted) return;
    this.mounted = false;
    window.removeEventListener('keydown', this.onKeyDown, true);
    this.labelEditor.close();
    this.engine.detach();
    this.toast.destroy();
    this.canvas.unmount();
    this.shadowHost.unmount();
    this.opts.onClosed();
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    // Escape closes the overlay — unless the label editor has it (it handles
    // its own Escape and stops propagation; this guard covers event ordering).
    if (e.key === 'Escape' && !this.labelEditor.isOpen) {
      e.preventDefault();
      this.unmount();
    }
  };

  /** Open the label editor for a freshly placed (or existing) callout. */
  private openLabelEditor(annotationId: string): void {
    const annotation = this.doc.annotations.find((a) => a.id === annotationId);
    if (!annotation || !isChangeRequest(annotation)) return;
    if (annotation.geometry.kind !== 'callout') return;

    this.engine.setEnabled(false);
    this.labelEditor.open({
      clientX: annotation.geometry.anchor.x - window.scrollX,
      clientY: annotation.geometry.anchor.y - window.scrollY,
      numberLabel: String(annotation.number),
      initialValue: annotation.label,
      onCommit: (label) => {
        if (label) annotation.label = label;
        else this.removeAnnotation(annotationId);
        this.engine.setEnabled(true);
        this.canvas.requestRender();
      },
      onCancel: () => {
        // a brand-new callout left without a label is discarded
        if (!annotation.label) this.removeAnnotation(annotationId);
        this.engine.setEnabled(true);
        this.canvas.requestRender();
      },
    });
  }

  private removeAnnotation(id: string): void {
    const index = this.doc.annotations.findIndex((a) => a.id === id);
    if (index >= 0) {
      this.doc.annotations.splice(index, 1);
      resequence(this.doc);
    }
  }

  private hasCallouts(): boolean {
    return this.doc.annotations.some(isChangeRequest);
  }

  /** Copy the screenshot + changelog to the clipboard. */
  private async runCopy(): Promise<void> {
    if (this.busy) return;
    if (!this.hasCallouts()) {
      this.toast.show('Add at least one callout before exporting.', {
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
    if (!supportsFileSystemAccess()) {
      this.toast.show(
        'Saving to a folder needs a secure (https) page. Use Copy here instead.',
        { tone: 'error' },
      );
      return;
    }
    if (!this.hasCallouts()) {
      this.toast.show('Add at least one callout before exporting.', {
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
   * Hide the UI, screenshot the page, and build the export artifacts.
   * Returns null on failure (a toast is shown). The caller owns `busy`.
   */
  private async capture(): Promise<ExportArtifacts | null> {
    try {
      // hide our UI so it stays out of the screenshot; the canvas stays visible
      this.shadowHost.host.style.visibility = 'hidden';
      await nextFrame();
      let dataUrl: string;
      try {
        dataUrl = await captureViewport();
      } finally {
        this.shadowHost.host.style.visibility = '';
      }
      this.doc.updatedAt = new Date().toISOString();
      const slug = exportSlug(this.doc.pageUrl);
      return {
        pngBlob: dataUrlToBlob(dataUrl),
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
}

/** Resolve after two animation frames, so a style change has painted. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}
