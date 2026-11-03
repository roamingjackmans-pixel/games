// The offline download's icon (D133): Joe's head from public/favicon.svg, drawn here in code (no image files, no
// libraries) and packed as a Windows .ico of PNGs, so Steam and Windows can show it for the launcher.
import { deflateSync } from 'node:zlib';
import { crc32 } from './zip.mjs';

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

/** A quadratic curve as a polyline with its running length (for dashes). */
function quad(x0, y0, cx, cy, x1, y1, n = 48) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    pts.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]);
  }
  return pts;
}

/** Distance from (x, y) to a polyline, and how far along it the nearest point lies. */
function nearest(pts, x, y) {
  let best = Infinity;
  let at = 0;
  let run = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2));
    const d = Math.hypot(x - (ax + dx * t), y - (ay + dy * t));
    const len = Math.sqrt(len2);
    if (d < best) {
      best = d;
      at = run + len * t;
    }
    run += len;
  }
  return { d: best, at };
}

function inside(poly, x, y) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

const INK = hex('#1a1410');
const BG = hex('#14121a');
const SKIN = hex('#e8c9a0');
const BEARD = hex('#5a4a3a');
const HAT = hex('#6b7f66');
const beard = quad(16, 38, 32, 56, 48, 38);
const mouth = quad(26, 42, 32, 45, 38, 42);
const hatCurve = quad(14, 26, 32, 4, 50, 26);
const hatOutline = [...hatCurve, [14, 26]];

/** The favicon's colour at a point of its 64×64 box, or null where it is transparent (painted in SVG order). */
function colourAt(x, y) {
  // rounded square, rx 12
  const qx = Math.max(12 - x, x - 52, 0);
  const qy = Math.max(12 - y, y - 52, 0);
  if (x < 0 || y < 0 || x > 64 || y > 64 || Math.hypot(qx, qy) > 12) return null;
  let c = BG;
  const dHead = Math.hypot(x - 32, y - 34);
  if (dHead <= 20) c = SKIN;
  if (Math.abs(dHead - 20) <= 1.5) c = INK;
  // beard: a dashed stroke, 2 on / 3 off, butt ends
  if (x > 14 && x < 50 && y > 36 && y < 49) {
    const b = nearest(beard, x, y);
    if (b.d <= 1.5 && b.at % 5 < 2) c = BEARD;
  }
  if (Math.hypot(x - 25, y - 31) <= 3 || Math.hypot(x - 39, y - 31) <= 3) c = INK;
  if (x > 24 && x < 40 && y > 40 && y < 46 && nearest(mouth, x, y).d <= 1.25) c = INK;
  // hat: the filled curve, then its outline
  if (x > 12 && x < 52 && y > 12 && y < 28) {
    if (inside(hatOutline, x, y)) c = HAT;
    if (nearest(hatOutline, x, y).d <= 1.5) c = INK;
  }
  return c;
}

/** Draw the icon at size×size with 4×4 supersampling; returns RGBA bytes. */
export function renderIcon(size) {
  const out = Buffer.alloc(size * size * 4);
  const ss = 4;
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0;
      let g = 0;
      let bl = 0;
      let a = 0;
      for (let sy = 0; sy < ss; sy++) {
        for (let sx = 0; sx < ss; sx++) {
          const c = colourAt(((px + (sx + 0.5) / ss) * 64) / size, ((py + (sy + 0.5) / ss) * 64) / size);
          if (!c) continue;
          r += c[0];
          g += c[1];
          bl += c[2];
          a++;
        }
      }
      const o = (py * size + px) * 4;
      if (a) {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(bl / a);
        out[o + 3] = Math.round((a / (ss * ss)) * 255);
      }
    }
  }
  return out;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
}

/** RGBA bytes → a PNG file. */
export function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

/** DungeonJoe.ico: PNG-compressed images at 256, 48, 32 and 16 px (Windows Vista and later read these). */
export function iconIco(sizes = [256, 48, 32, 16]) {
  const pngs = sizes.map((s) => encodePng(s, renderIcon(s)));
  const head = Buffer.alloc(6 + 16 * sizes.length);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2); // icon
  head.writeUInt16LE(sizes.length, 4);
  let offset = head.length;
  sizes.forEach((s, i) => {
    const e = 6 + 16 * i;
    head[e] = s >= 256 ? 0 : s;
    head[e + 1] = s >= 256 ? 0 : s;
    head.writeUInt16LE(1, e + 4); // planes
    head.writeUInt16LE(32, e + 6); // bits per pixel
    head.writeUInt32LE(pngs[i].length, e + 8);
    head.writeUInt32LE(offset, e + 12);
    offset += pngs[i].length;
  });
  return Buffer.concat([head, ...pngs]);
}
