/** Stitch full-page capture slices into one tall PNG with annotations drawn on. */

import type { RedlineDocument } from '../model/document';
import { renderAnnotation } from '../overlay/Renderer';

/** A captured viewport slice and the page scroll offset it was taken at. */
export interface CaptureSlice {
  dataUrl: string;
  scrollY: number;
}

/** The largest canvas dimension Redline will produce (GPU-safe across browsers). */
const MAX_CANVAS = 16384;

/**
 * Stitch the slices into one tall canvas and draw every annotation onto it at
 * page coordinates. Slices are clean page captures; the annotations are drawn
 * here, once, so they stay crisp and never split at a slice seam.
 */
export async function composeFullPage(
  slices: CaptureSlice[],
  dpr: number,
  doc: RedlineDocument,
): Promise<Blob> {
  const images = await Promise.all(slices.map((s) => decodeImage(s.dataUrl)));
  const first = images[0];
  const last = slices[slices.length - 1];
  if (!first || !last) throw new Error('Full-page capture produced no slices.');

  const sliceWidth = first.naturalWidth; // device pixels
  const pageHeightDevice = last.scrollY * dpr + first.naturalHeight;
  // shrink only if the page is taller than a canvas can be
  const scale = Math.min(
    1,
    MAX_CANVAS / pageHeightDevice,
    MAX_CANVAS / sliceWidth,
  );

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sliceWidth * scale);
  canvas.height = Math.round(pageHeightDevice * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Redline: 2D canvas context unavailable.');

  // Draw each slice, extending it to meet the next so there are no seams.
  const tops = slices.map((s) => Math.round(s.scrollY * dpr * scale));
  for (let i = 0; i < images.length; i++) {
    const top = tops[i]!;
    const bottom = i + 1 < images.length ? tops[i + 1]! + 1 : canvas.height;
    ctx.drawImage(images[i]!, 0, top, canvas.width, bottom - top);
  }

  // Draw annotations in page space, scaled to the composed canvas.
  ctx.save();
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
  for (const annotation of doc.annotations) {
    renderAnnotation(ctx, annotation, 0, 0);
  }
  ctx.restore();

  return canvasToBlob(canvas);
}

function decodeImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode a captured slice.'));
    img.src = dataUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to encode the full-page PNG.'));
    }, 'image/png');
  });
}
