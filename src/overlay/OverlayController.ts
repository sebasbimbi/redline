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

export interface OverlayControllerOptions {
  /** Called whenever the overlay closes, for any reason. */
  onClosed: () => void;
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
  private exporting = false;

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
      onExport: () => void this.runExport(),
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
    // its own Escape and stops propagation, but this guard covers ordering).
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

  /** Capture the page and copy the screenshot + changelog to the clipboard. */
  private async runExport(): Promise<void> {
    if (this.exporting) return;
    const changeCount = this.doc.annotations.filter(isChangeRequest).length;
    if (changeCount === 0) {
      this.toast.show('Add at least one callout before exporting.', {
        tone: 'error',
      });
      return;
    }

    this.exporting = true;
    this.toolbar.setExporting(true);
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

      const slug = exportSlug(this.doc.pageUrl);
      this.doc.updatedAt = new Date().toISOString();
      const markdown = buildMarkdown(this.doc, `${slug}.png`);
      const pngBlob = dataUrlToBlob(dataUrl);

      const result = await copyToClipboard(pngBlob, markdown);
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
    } catch (err) {
      this.toast.show(err instanceof Error ? err.message : 'Export failed.', {
        tone: 'error',
      });
    } finally {
      this.exporting = false;
      this.toolbar.setExporting(false);
    }
  }
}

/** Resolve after two animation frames, so a style change has painted. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}
