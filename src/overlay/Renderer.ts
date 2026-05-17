/** Pure Canvas 2D drawing routines. All coordinates are viewport (client) px. */

const MARKER_RADIUS = 13;
const MARKER_FONT =
  'bold 14px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

/** Draw a numbered callout marker centered at (x, y). */
export function drawCallout(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  numberLabel: string,
): void {
  ctx.save();
  // drop shadow so the marker reads on any background
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 1;
  // white contrast ring
  ctx.beginPath();
  ctx.arc(x, y, MARKER_RADIUS + 2, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  // colored disc (no shadow on the inner fills)
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.arc(x, y, MARKER_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  // number
  ctx.fillStyle = '#ffffff';
  ctx.font = MARKER_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(numberLabel, x, y);
  ctx.restore();
}

/** Draw a dashed outline around an annotated element's bounding box. */
export function drawElementOutline(
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
