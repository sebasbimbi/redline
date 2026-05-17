/**
 * Generate the Redline extension icons: a flat red field with a white bar,
 * the "redline" mark. Writes public/icon/{16,32,48,128}.png.
 *
 * Run with `pnpm icons`. The shapes are axis-aligned, so the PNGs are
 * pixel-exact at every size with no anti-aliasing needed.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RED = [229, 72, 77];
const WHITE = [255, 255, 255];
const SIZES = [16, 32, 48, 128];

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** A PNG chunk: length, type, data, CRC over type+data. */
function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'latin1');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

/** Encode a square RGBA icon as a PNG buffer. */
function png(size) {
  const barHeight = Math.max(2, Math.round(size / 6));
  const barTop = Math.round((size - barHeight) / 2);
  const inset = Math.round(size / 8);

  const stride = size * 4 + 1; // one filter byte per scanline
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter type: none
    for (let x = 0; x < size; x++) {
      const onBar =
        y >= barTop &&
        y < barTop + barHeight &&
        x >= inset &&
        x < size - inset;
      const [r, g, b] = onBar ? WHITE : RED;
      const offset = y * stride + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = 255;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'icon',
);
mkdirSync(outDir, { recursive: true });
for (const size of SIZES) {
  writeFileSync(join(outDir, `${size}.png`), png(size));
  console.log(`icon/${size}.png`);
}
