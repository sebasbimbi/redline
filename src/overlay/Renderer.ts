/** Pure Canvas 2D drawing. Annotation geometry is converted to viewport px here. */

import { getStroke } from 'perfect-freehand';
import type { Annotation } from '../model/annotation';
import { distance, type Point, type Rect } from '../model/geometry';

const MARKER_RADIUS = 13;
const MARKER_FONT =
  'bold 14px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const TEXT_FONT_STACK =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/**
 * Draw one annotation. Geometry is in page coordinates; (sx, sy) is the scroll
 * offset, subtracted to reach the viewport pixels the canvas paints in.
 */
export function renderAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: Annotation,
  sx: number,
  sy: number,
): void {
  const g = annotation.geometry;
  switch (g.kind) {
    case 'rectangle':
      drawRectangle(ctx, shiftRect(g.rect, sx, sy), g.style.color, g.style.width);
      break;
    case 'ellipse':
      drawEllipse(ctx, shiftRect(g.rect, sx, sy), g.style.color, g.style.width);
      break;
    case 'highlight':
      drawHighlight(ctx, shiftRect(g.rect, sx, sy), g.color);
      break;
    case 'arrow':
      drawArrow(
        ctx,
        { x: g.from.x - sx, y: g.from.y - sy },
        { x: g.to.x - sx, y: g.to.y - sy },
        g.style.color,
        g.style.width,
      );
      break;
    case 'measure':
      drawMeasure(
        ctx,
        { x: g.from.x - sx, y: g.from.y - sy },
        { x: g.to.x - sx, y: g.to.y - sy },
        g.style.color,
        g.style.width,
      );
      break;
    case 'freehand':
      drawFreehand(ctx, g.points, g.style.color, g.style.width, sx, sy);
      break;
    case 'callout': {
      if (annotation.annotationClass === 'change-request' && annotation.element) {
        const b = annotation.element.boundingBox;
        drawElementOutline(ctx, b.x - sx, b.y - sy, b.w, b.h, g.color);
      }
      const numberLabel =
        annotation.annotationClass === 'change-request'
          ? String(annotation.number)
          : '';
      drawCallout(ctx, g.anchor.x - sx, g.anchor.y - sy, g.color, numberLabel);
      break;
    }
    case 'text': {
      const label =
        annotation.annotationClass === 'change-request' ? annotation.label : '';
      drawText(
        ctx,
        { x: g.origin.x - sx, y: g.origin.y - sy },
        label,
        g.fontSize,
        g.color,
      );
      break;
    }
  }
}

/** Draw the dashed selection box around an annotation. Coords are viewport px. */
export function drawSelectionBox(
  ctx: CanvasRenderingContext2D,
  bounds: Rect,
): void {
  const pad = 4;
  const x = bounds.x - pad;
  const y = bounds.y - pad;
  const w = bounds.w + pad * 2;
  const h = bounds.h + pad * 2;
  ctx.save();
  ctx.setLineDash([5, 4]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = '#0091ff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.setLineDash([]);
  const corners: ReadonlyArray<readonly [number, number]> = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ];
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#0091ff';
    ctx.fill();
  }
  ctx.restore();
}

function shiftRect(r: Rect, sx: number, sy: number): Rect {
  return { x: r.x - sx, y: r.y - sy, w: r.w, h: r.h };
}

function drawRectangle(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  color: string,
  width: number,
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 3;
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawEllipse(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  color: string,
  width: number,
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
  ctx.shadowBlur = 3;
  ctx.beginPath();
  ctx.ellipse(
    rect.x + rect.w / 2,
    rect.y + rect.h / 2,
    Math.max(rect.w / 2, 0.5),
    Math.max(rect.h / 2, 0.5),
    0,
    0,
    Math.PI * 2,
  );
  ctx.stroke();
  ctx.restore();
}

function drawHighlight(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  color: string,
): void {
  ctx.save();
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = color;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  width: number,
): void {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const head = 9 + width * 1.8;
  const spread = 0.42;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 3;
  // shaft, stopped short of the head so the line does not poke through it
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(
    to.x - Math.cos(angle) * head * 0.85,
    to.y - Math.sin(angle) * head * 0.85,
  );
  ctx.stroke();
  // arrowhead
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(
    to.x - Math.cos(angle - spread) * head,
    to.y - Math.sin(angle - spread) * head,
  );
  ctx.lineTo(
    to.x - Math.cos(angle + spread) * head,
    to.y - Math.sin(angle + spread) * head,
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Draw a dimension line: a stroke with end ticks and a pixel-distance label. */
function drawMeasure(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  width: number,
): void {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const tick = 5 + width;
  const px = Math.cos(angle + Math.PI / 2);
  const py = Math.sin(angle + Math.PI / 2);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 3;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.moveTo(from.x - px * tick, from.y - py * tick);
  ctx.lineTo(from.x + px * tick, from.y + py * tick);
  ctx.moveTo(to.x - px * tick, to.y - py * tick);
  ctx.lineTo(to.x + px * tick, to.y + py * tick);
  ctx.stroke();
  ctx.restore();
  const label = `${Math.round(distance(from, to))} px`;
  drawMeasureLabel(ctx, (from.x + to.x) / 2, (from.y + to.y) / 2, label, color);
}

/** Draw the measurement's pixel value on a small color tag. */
function drawMeasureLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
): void {
  ctx.save();
  ctx.font = `600 12px ${TEXT_FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 12;
  const h = 18;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 4;
  ctx.fillStyle = color;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawFreehand(
  ctx: CanvasRenderingContext2D,
  points: ReadonlyArray<{ x: number; y: number; pressure: number }>,
  color: string,
  width: number,
  sx: number,
  sy: number,
): void {
  const size = 6 + width * 2.5;
  if (points.length === 1) {
    const p = points[0]!;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x - sx, p.y - sy, size / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  if (points.length < 2) return;
  const input = points.map((p) => ({
    x: p.x - sx,
    y: p.y - sy,
    pressure: p.pressure,
  }));
  const outline = getStroke(input, {
    size,
    thinning: 0.55,
    smoothing: 0.5,
    streamline: 0.45,
    simulatePressure: true,
  });
  if (outline.length < 3) return;
  ctx.save();
  ctx.fillStyle = color;
  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)';
  ctx.shadowBlur = 2;
  ctx.beginPath();
  const first = outline[0]!;
  ctx.moveTo(first[0]!, first[1]!);
  for (let i = 1; i < outline.length; i++) {
    const pt = outline[i]!;
    ctx.lineTo(pt[0]!, pt[1]!);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawText(
  ctx: CanvasRenderingContext2D,
  origin: Point,
  text: string,
  fontSize: number,
  color: string,
): void {
  if (!text) return;
  ctx.save();
  ctx.font = `600 ${fontSize}px ${TEXT_FONT_STACK}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = color;
  const lineHeight = fontSize * 1.3;
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i]!, origin.x, origin.y + i * lineHeight);
  }
  ctx.restore();
}

/** Draw a numbered callout marker centered at viewport (x, y). */
function drawCallout(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  numberLabel: string,
): void {
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;
  ctx.beginPath();
  ctx.arc(x, y, MARKER_RADIUS + 2, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.arc(x, y, MARKER_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = MARKER_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(numberLabel, x, y);
  ctx.restore();
}

/** Draw a dashed outline around an annotated element's bounding box. */
function drawElementOutline(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  if (w <= 0 || h <= 0) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 3]);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
