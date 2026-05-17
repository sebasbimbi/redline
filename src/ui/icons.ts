/** Inline SVG icons for the toolbar. 16x16, drawn with currentColor. */

const svg = (body: string): string =>
  `<svg viewBox="0 0 16 16" width="16" height="16" fill="none" ` +
  `stroke="currentColor" stroke-width="1.6" stroke-linecap="round" ` +
  `stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const ICONS = {
  select: svg(
    '<path d="M2.5 2.2L2.5 13.2 5.4 10.4 7.1 14.4 9.1 13.55 7.4 9.55 11.3 9.5Z"' +
      ' fill="currentColor" stroke="none"/>',
  ),
  callout: svg(
    '<circle cx="8" cy="8" r="5.3"/>' +
      '<circle cx="8" cy="8" r="1.7" fill="currentColor" stroke="none"/>',
  ),
  text: svg(
    '<path d="M3.6 4.3V3.4H12.4V4.3M8 3.6V12.6M6.3 12.6H9.7"/>',
  ),
  rectangle: svg('<rect x="2.8" y="4" width="10.4" height="8" rx="1"/>'),
  ellipse: svg('<ellipse cx="8" cy="8" rx="5.7" ry="4.3"/>'),
  arrow: svg('<path d="M3 13L12.5 3.5M7 3.5H12.5V9"/>'),
  freehand: svg(
    '<path d="M2.4 10.6C3.8 7.4 5 7.4 6.1 10.6 7.2 13.8 8.4 13.8 9.5 10.6' +
      ' 10.6 7.6 11.9 7 13.6 8.4"/>',
  ),
  highlight: svg(
    '<path d="M9.5 2.9L13.1 6.5 7.9 11.7 4.3 8.1Z"/>' +
      '<path d="M3.6 13.6H12.4"/>',
  ),
  undo: svg(
    '<path d="M6.3 3.6L3 6.9 6.3 10.2M3.4 6.9H10A3.6 3.6 0 0 1 10 14.1H6.4"/>',
  ),
  redo: svg(
    '<path d="M9.7 3.6L13 6.9 9.7 10.2M12.6 6.9H6A3.6 3.6 0 0 0 6 14.1H9.6"/>',
  ),
  clear: svg(
    '<path d="M3.2 4.7H12.8M6.4 4.7V3.2H9.6V4.7M4.7 4.7L5.4 13.4H10.6L11.3 4.7"/>',
  ),
  panel: svg(
    '<rect x="2.3" y="3" width="11.4" height="10" rx="1.4"/>' +
      '<path d="M9.6 3.2V12.8"/>',
  ),
  pencil: svg(
    '<path d="M10.8 2.7L13.3 5.2 5.7 12.8 2.5 13.5 3.2 10.3Z"/>' +
      '<path d="M9.2 4.3L11.7 6.8"/>',
  ),
  fullpage: svg(
    '<rect x="3.4" y="2.3" width="9.2" height="11.4" rx="1.3"/>' +
      '<path d="M8 5.2V10.8M6.2 7L8 5.2 9.8 7M6.2 9L8 10.8 9.8 9"/>',
  ),
} as const;

export type IconName = keyof typeof ICONS;
