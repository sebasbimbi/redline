/** Unit tests for the Claude-Code-optimized markdown changelog builder. */

import { describe, it, expect } from 'vitest';
import { buildMarkdown } from './markdown';
import type { RedlineDocument } from '../model/document';
import type {
  Annotation,
  ChangeRequestAnnotation,
  ElementMetadata,
  VisualEmphasisAnnotation,
} from '../model/annotation';

function makeDoc(annotations: Annotation[] = []): RedlineDocument {
  return {
    schemaVersion: 1,
    documentId: 'doc-1',
    pageUrl: 'https://example.com/pricing',
    pageTitle: 'Pricing',
    viewport: { width: 1280, height: 800, devicePixelRatio: 2 },
    scroll: { x: 0, y: 0 },
    annotations,
    activeTool: 'callout',
    activeColor: '#ff0000',
    activeStrokeWidth: 2,
    createdAt: '2026-05-17T10:00:00.000Z',
    updatedAt: '2026-05-17T10:30:00.000Z',
  };
}

function makeMetadata(over: Partial<ElementMetadata> = {}): ElementMetadata {
  return {
    selector: 'main > h1',
    selectorPath: 'main > h1',
    xpath: '/html/body/main/h1',
    inShadowDom: false,
    tag: 'h1',
    id: null,
    classList: [],
    role: null,
    ariaLabel: null,
    textSnippet: null,
    dataAttributes: {},
    boundingBox: { x: 0, y: 0, w: 100, h: 40 },
    viewportPercent: { top: 5, left: 10, width: 50, height: 6 },
    nearbyLandmark: null,
    parentContext: null,
    ...over,
  };
}

function makeCallout(
  number: number,
  label: string,
  element: ElementMetadata | null,
): ChangeRequestAnnotation {
  return {
    id: `cr-${number}`,
    createdAt: '2026-05-17T10:05:00.000Z',
    annotationClass: 'change-request',
    geometry: { kind: 'callout', anchor: { x: 10, y: 20 }, color: '#ff0000' },
    number,
    label,
    element,
  };
}

function makeRectangle(): VisualEmphasisAnnotation {
  return {
    id: 've-1',
    createdAt: '2026-05-17T10:06:00.000Z',
    annotationClass: 'visual-emphasis',
    geometry: {
      kind: 'rectangle',
      rect: { x: 0, y: 0, w: 50, h: 50 },
      style: { color: '#00ff00', width: 2 },
    },
  };
}

function makeTextEdit(
  number: number,
  oldText: string,
  newText: string,
  opts: { hasInlineMarkup?: boolean; element?: ElementMetadata | null } = {},
): ChangeRequestAnnotation {
  return {
    id: `te-${number}`,
    createdAt: '2026-05-17T10:07:00.000Z',
    annotationClass: 'change-request',
    geometry: {
      kind: 'textedit',
      box: { x: 0, y: 0, w: 200, h: 40 },
      color: '#0091ff',
      oldText,
      newText,
      hasInlineMarkup: opts.hasInlineMarkup ?? false,
    },
    number,
    label: '',
    element: opts.element === undefined ? makeMetadata() : opts.element,
  };
}

describe('buildMarkdown', () => {
  it('renders the header, metadata table, and how-to-apply section', () => {
    const md = buildMarkdown(makeDoc(), 'shot.png');
    expect(md).toContain('# Redline Change Request');
    expect(md).toContain('| Page | Pricing |');
    expect(md).toContain('| URL | https://example.com/pricing |');
    expect(md).toContain('| Viewport | 1280x800 @ 2x |');
    expect(md).toContain('| Screenshot | shot.png |');
    expect(md).toContain('## How to apply');
    expect(md).toContain('hash their class names');
  });

  it('reports no labeled changes for an empty document', () => {
    const md = buildMarkdown(makeDoc(), 'shot.png');
    expect(md).toContain('| Changes | 0 |');
    expect(md).toContain('_No labeled changes were captured._');
  });

  it('renders a numbered change with its element locators', () => {
    const md = buildMarkdown(
      makeDoc([makeCallout(1, 'Make the heading bigger', makeMetadata())]),
      'shot.png',
    );
    expect(md).toContain('| Changes | 1 |');
    expect(md).toContain('### 1. Make the heading bigger');
    expect(md).toContain('- Requested change: Make the heading bigger');
    expect(md).toContain('- Selector: `main > h1`');
    expect(md).toContain('- XPath: `/html/body/main/h1`');
    expect(md).toContain('- Element: `<h1>`');
  });

  it('describes id, classes, role, aria-label, text, and data attributes', () => {
    const md = buildMarkdown(
      makeDoc([
        makeCallout(
          1,
          'Fix it',
          makeMetadata({
            id: 'cta',
            classList: ['btn', 'btn-primary'],
            role: 'button',
            ariaLabel: 'Sign up',
            textSnippet: 'Sign up free',
            dataAttributes: { testid: 'signup' },
          }),
        ),
      ]),
      'shot.png',
    );
    expect(md).toContain(
      '- Element: `<h1 id="cta" class="btn btn-primary">` ' +
        '(role: button, aria-label: "Sign up")',
    );
    expect(md).toContain('- Current text: "Sign up free"');
    expect(md).toContain('- Data attributes: testid="signup"');
  });

  it('notes when the element is inside a shadow root', () => {
    const md = buildMarkdown(
      makeDoc([makeCallout(1, 'Fix it', makeMetadata({ inShadowDom: true }))]),
      'shot.png',
    );
    expect(md).toContain('- Shadow DOM: this element is inside a shadow root.');
  });

  it('marks a change drawn over empty space as having no element', () => {
    const md = buildMarkdown(
      makeDoc([makeCallout(1, 'Fix it', null)]),
      'shot.png',
    );
    expect(md).toContain('(no element under the marker');
  });

  it('falls back to placeholder text for an empty label', () => {
    const md = buildMarkdown(makeDoc([makeCallout(1, '   ', null)]), 'shot.png');
    expect(md).toContain('### 1. (no label)');
    expect(md).toContain('- Requested change: (none given)');
  });

  it('counts visual-emphasis marks separately from changes', () => {
    const md = buildMarkdown(
      makeDoc([makeCallout(1, 'Fix it', null), makeRectangle()]),
      'shot.png',
    );
    expect(md).toContain('| Changes | 1 |');
    expect(md).toContain('## Visual emphasis (no code change)');
    expect(md).toContain('1 non-numbered mark(s)');
  });

  it('escapes pipe characters in table cell values', () => {
    const doc = makeDoc();
    doc.pageTitle = 'Home | Acme';
    const md = buildMarkdown(doc, 'shot.png');
    expect(md).toContain('| Page | Home \\| Acme |');
  });

  it('formats a valid timestamp and passes an invalid one through', () => {
    expect(buildMarkdown(makeDoc(), 'shot.png')).toMatch(
      /\| Captured \| \d{4}-\d{2}-\d{2} \d{2}:\d{2} \|/,
    );
    const bad = makeDoc();
    bad.updatedAt = 'not-a-date';
    expect(buildMarkdown(bad, 'shot.png')).toContain(
      '| Captured | not-a-date |',
    );
  });

  it('ends with the schema footer', () => {
    const md = buildMarkdown(
      makeDoc([makeCallout(1, 'Fix it', null)]),
      'shot.png',
    );
    expect(md).toContain('*1 change(s) · Redline · schema v1*');
  });

  it('renders a text edit as a text-replacement change', () => {
    const md = buildMarkdown(
      makeDoc([makeTextEdit(1, 'Welcome to our site', 'Welcome back')]),
      'shot.png',
    );
    expect(md).toContain('| Changes | 1 |');
    expect(md).toContain('### 1. Text edit');
    expect(md).toContain('- Change type: text replacement');
    expect(md).toContain('- Old text: "Welcome to our site"');
    expect(md).toContain('- New text: "Welcome back"');
    expect(md).toContain('- Selector: `main > h1`');
  });

  it('flags a text edit that contains inline markup', () => {
    const md = buildMarkdown(
      makeDoc([
        makeTextEdit(1, 'Old copy', 'New copy', { hasInlineMarkup: true }),
      ]),
      'shot.png',
    );
    expect(md).toContain('- Contains inline markup: yes');
  });

  it('omits the inline-markup line when the element has none', () => {
    const md = buildMarkdown(
      makeDoc([makeTextEdit(1, 'Old copy', 'New copy')]),
      'shot.png',
    );
    expect(md).not.toContain('Contains inline markup');
  });

  it('numbers text edits and callouts in one shared sequence', () => {
    const md = buildMarkdown(
      makeDoc([
        makeCallout(1, 'Make it bold', makeMetadata()),
        makeTextEdit(2, 'A', 'B'),
      ]),
      'shot.png',
    );
    expect(md).toContain('### 1. Make it bold');
    expect(md).toContain('### 2. Text edit');
    expect(md).toContain('| Changes | 2 |');
  });

  it('tells the agent to search the exact old text first', () => {
    const md = buildMarkdown(makeDoc(), 'shot.png');
    expect(md).toContain('text replacement');
    expect(md).toContain('exact Old text string');
  });
});
