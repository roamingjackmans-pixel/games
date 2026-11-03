// Room shapes (PROCGEN §3.1): a seeded mask carves each room's outline inward from the 40 × 22 rectangle
// (cross halls, caves, tunnels, clearings, stepped forges, naves, gears, void islands), layered over the
// interior template. Then a repair pass keeps the room fair: template obstacles that crowd the new walls are
// removed, wall slivers are closed (the gap rule: blocking things touch or leave ≥ 3 tiles), enclosed
// pockets are filled, lost spawn points and chest spots are re-placed. Doors never move; the four door
// approaches always stay open. If a shape cannot be made valid the room keeps its plain template.
import { stream, type Rng } from '../../engine/rng';
import { ROOM_H, ROOM_W, doorTiles, type Side } from '../room';
import { BLOCKING, gapViolations, validateTemplate } from './templates';

const W = ROOM_W;
const H = ROOM_H;
const CX = (W - 1) / 2; // 19.5
const CY = (H - 1) / 2; // 10.5

/** Mask cell values: what the shape puts on a tile (Keep = the template's own tile). */
const K = { Keep: 0, Wall: 1, Pit: 2, Pillar: 3, Water: 4, Floor: 5 } as const;
const MASK_CH = ['', '#', '_', 'P', '~', '.'];
type Mask = Uint8Array;

/** Shaped rooms may go down to this much walkable floor (plain templates keep ≥ 60%). */
export const SHAPED_MIN_FLOOR = 0.5;
/** Big bodies need this many tiles of clearance around a spawn point. */
const SPAWN_DOOR_TILES = 7; // 224 px from every door tile (the rule is ≥ 200 px)

const SIDES: Side[] = ['n', 's', 'e', 'w'];
/** the two tiles just inside each door */
const INSIDE: Record<Side, [number, number][]> = {
  n: [
    [19, 1],
    [20, 1],
  ],
  s: [
    [19, H - 2],
    [20, H - 2],
  ],
  w: [
    [1, 10],
    [1, 11],
  ],
  e: [
    [W - 2, 10],
    [W - 2, 11],
  ],
};

// ------------------------------------------------------------------ mask drawing helpers

function inside(x: number, y: number): boolean {
  return x >= 1 && y >= 1 && x <= W - 2 && y <= H - 2;
}

function put(m: Mask, x: number, y: number, v: number): void {
  if (inside(x, y)) m[y * W + x] = v;
}

function rect(m: Mask, x0: number, y0: number, x1: number, y1: number, v: number = K.Wall): void {
  for (let y = Math.max(1, y0); y <= Math.min(H - 2, y1); y++) for (let x = Math.max(1, x0); x <= Math.min(W - 2, x1); x++) m[y * W + x] = v;
}

/** The same rectangle in all four corners (mirrored about the room's centre lines). */
function rect4(m: Mask, x0: number, y0: number, x1: number, y1: number, v: number = K.Wall): void {
  rect(m, x0, y0, x1, y1, v);
  rect(m, W - 1 - x1, y0, W - 1 - x0, y1, v);
  rect(m, x0, H - 1 - y1, x1, H - 1 - y0, v);
  rect(m, W - 1 - x1, H - 1 - y1, W - 1 - x0, H - 1 - y0, v);
}

/** Set every interior tile for which `f` returns a mask value (0 leaves it). */
function each(m: Mask, f: (x: number, y: number) => number): void {
  for (let y = 1; y <= H - 2; y++)
    for (let x = 1; x <= W - 2; x++) {
      const v = f(x, y);
      if (v) m[y * W + x] = v;
    }
}

/** Distance (in corner-steps) of an interior tile from its nearest room corner: 0 at the corner tile itself. */
function cornerSteps(x: number, y: number): number {
  const dx = Math.min(x - 1, W - 2 - x);
  const dy = Math.min(y - 1, H - 2 - y);
  return dx + dy;
}

/** 45° chamfers of `k` tiles in all four corners. */
function chamfer4(m: Mask, k: number, v: number = K.Wall): void {
  each(m, (x, y) => (cornerSteps(x, y) < k ? v : 0));
}

/** Rounded corners of radius `r` tiles in all four corners. */
function round4(m: Mask, r: number, v: number = K.Wall): void {
  each(m, (x, y) => {
    const dx = Math.min(x - 1, W - 2 - x);
    const dy = Math.min(y - 1, H - 2 - y);
    if (dx >= r || dy >= r) return 0;
    return Math.hypot(r - 0.5 - dx, r - 0.5 - dy) > r ? v : 0;
  });
}

/** Stepped corners: `steps` stairs of `sw` × `sh` tiles in all four corners. */
function steps4(m: Mask, steps: number, sw: number, sh: number, v: number = K.Wall): void {
  for (let i = 0; i < steps; i++) rect4(m, 1, 1 + i * sh, (steps - i) * sw, (i + 1) * sh, v);
}

/** Smooth value noise in about [-1, 1]: a lattice every `cell` tiles plus a finer, offset octave (no boxy look). */
function noise(r: Rng, cell: number): (x: number, y: number) => number {
  const a = octave(r, cell);
  const b = octave(r, cell * 0.47);
  return (x, y) => a(x, y) * 0.75 + b(x, y) * 0.35;
}

function octave(r: Rng, cell: number): (x: number, y: number) => number {
  const ox = r.range(0, cell);
  const oy = r.range(0, cell);
  const gw = Math.ceil((W + ox) / cell) + 3;
  const gh = Math.ceil((H + oy) / cell) + 3;
  const g = new Float32Array(gw * gh);
  for (let i = 0; i < g.length; i++) g[i] = r.next() * 2 - 1;
  const s = (t: number): number => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = Math.max(0, (x + ox) / cell);
    const fy = Math.max(0, (y + oy) / cell);
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = s(fx - ix);
    const ty = s(fy - iy);
    const v = (a: number, b: number): number => g[Math.min(gh - 1, iy + b) * gw + Math.min(gw - 1, ix + a)]!;
    const top = v(0, 0) + (v(1, 0) - v(0, 0)) * tx;
    const bot = v(0, 1) + (v(1, 1) - v(0, 1)) * tx;
    return top + (bot - top) * ty;
  };
}

/** Everything outside a (noisy) ellipse becomes `v`. */
function ellipseOut(m: Mask, cx: number, cy: number, rx: number, ry: number, amp: number, n: ((x: number, y: number) => number) | null, v: number = K.Wall): void {
  each(m, (x, y) => {
    const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
    return d > 1 + (n ? amp * n(x, y) : 0) ? v : 0;
  });
}

/** Fill a (noisy) blob of radius r. */
function blob(m: Mask, cx: number, cy: number, r: number, n: ((x: number, y: number) => number) | null, v: number = K.Wall, amp = 0.3): void {
  each(m, (x, y) => (Math.hypot(x - cx, y - cy) <= r * (1 + (n ? amp * n(x, y) : 0)) ? v : 0));
}

/** Union of several open ellipses: tiles outside all of them become `v`. */
function ellipsesOut(m: Mask, es: { cx: number; cy: number; rx: number; ry: number }[], amp: number, n: ((x: number, y: number) => number) | null, v: number = K.Wall): void {
  each(m, (x, y) => {
    const t = 1 + (n ? amp * n(x, y) : 0);
    for (const e of es) if (Math.hypot((x - e.cx) / e.rx, (y - e.cy) / e.ry) <= t) return 0;
    return v;
  });
}

/** Rounded rectangle: tiles inside it become `v` (r = corner radius). */
function roundRect(m: Mask, x0: number, y0: number, x1: number, y1: number, r: number, v: number): void {
  // written directly (not through each()): v may be Keep (0), carving a platform out of a void fill
  for (let y = Math.max(1, y0); y <= Math.min(H - 2, y1); y++)
    for (let x = Math.max(1, x0); x <= Math.min(W - 2, x1); x++) {
      const dx = Math.min(x - x0, x1 - x);
      const dy = Math.min(y - y0, y1 - y);
      if (dx >= r || dy >= r || Math.hypot(r - 0.5 - dx, r - 0.5 - dy) <= r) m[y * W + x] = v;
    }
}

/** Teeth (wall stubs `tw` wide, `depth` deep) along the top and bottom walls, symmetric about the middle, every `period` tiles from `start`. */
function teethTB(m: Mask, start: number, period: number, tw: number, depth: number, top = 1, bottom = H - 2): void {
  for (let x = start; x + tw - 1 < 17; x += period) {
    rect(m, x, top, x + tw - 1, top + depth - 1);
    rect(m, W - x - tw, top, W - 1 - x, top + depth - 1);
    rect(m, x, bottom - depth + 1, x + tw - 1, bottom);
    rect(m, W - x - tw, bottom - depth + 1, W - 1 - x, bottom);
  }
}

/** Teeth along the left and right walls at the given rows (each `th` tall, `depth` deep), mirrored top/bottom. */
function teethLR(m: Mask, rows: number[], th: number, depth: number, left = 1, right = W - 2): void {
  for (const y of rows) {
    rect(m, left, y, left + depth - 1, y + th - 1);
    rect(m, right - depth + 1, y, right, y + th - 1);
    rect(m, left, H - y - th, left + depth - 1, H - 1 - y);
    rect(m, right - depth + 1, H - y - th, right, H - 1 - y);
  }
}

// ------------------------------------------------------------------ the shape families, per zone

export interface ShapeFamily {
  id: string;
  draw(m: Mask, r: Rng): void;
}

const fam = (id: string, draw: (m: Mask, r: Rng) => void): ShapeFamily => ({ id, draw });

/**
 * Organic outlines (caves, tree lines, crumbling void): two passes of the cave rule over the mask's walls and
 * pits (≥ 5 solid neighbours → solid, ≤ 3 → open) so the outline has no slivers or one-tile notches.
 */
function smoothMask(m: Mask): void {
  for (let pass = 0; pass < 2; pass++) {
    const src = m.slice();
    for (let y = 1; y <= H - 2; y++)
      for (let x = 1; x <= W - 2; x++) {
        let n = 0;
        let pits = 0;
        let walls = 0;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (!inside(nx, ny)) {
              n++; // the outer wall counts as solid
              continue;
            }
            const v = src[ny * W + nx]!;
            if (v === K.Wall) walls++;
            else if (v === K.Pit) pits++;
          }
        n += walls + pits;
        const i = y * W + x;
        const v = src[i]!;
        const solid = v === K.Wall || v === K.Pit;
        if (!solid && n >= 5) m[i] = pits > walls ? K.Pit : K.Wall;
        else if (solid && n <= 3) m[i] = K.Keep;
      }
  }
}

/** 1 Mossy Crypt: built stone — cross halls, chamfered octagons, side chapels, burial-niche buttresses. */
const CRYPT: ShapeFamily[] = [
  fam('crypt-cross', (m, r) => {
    const a = r.int(8, 12);
    const b = r.int(4, 6);
    rect4(m, 1, 1, a, b);
    if (r.chance(0.6)) {
      // the arms' inner corners step back
      const s = r.int(2, 3);
      rect4(m, a + 1, 1, a + s, b - s);
      rect4(m, 1, b + 1, a - s, b + s);
    }
  }),
  fam('crypt-octagon', (m, r) => {
    chamfer4(m, r.int(5, 8));
    if (r.chance(0.7)) {
      // a thick wall with niches along the long sides
      rect(m, 1, 1, W - 2, 2);
      rect(m, 1, H - 3, W - 2, H - 2);
      const nx = r.int(6, 10);
      rect4(m, nx, 1, nx + 3, 2, K.Keep);
    }
  }),
  fam('crypt-chapels', (m, r) => {
    const d = r.int(3, 4);
    rect(m, 1, 1, W - 2, d);
    rect(m, 1, H - 1 - d, W - 2, H - 2);
    // two chapels a side
    const cw = r.int(4, 6);
    const c1 = r.int(5, 8);
    rect4(m, c1, 1, c1 + cw - 1, d, K.Keep);
    if (c1 + cw + 4 + cw <= 17) rect4(m, c1 + cw + 4, 1, c1 + cw + 3 + cw, d, K.Keep);
    chamfer4(m, d + r.int(1, 3));
  }),
  fam('crypt-niches', (m, r) => {
    chamfer4(m, r.int(3, 4));
    const tw = r.int(2, 3);
    const period = tw + r.int(4, 5);
    teethTB(m, r.int(4, 5), period, tw, r.int(2, 3));
    teethLR(m, [r.int(3, 4)], 2, r.int(2, 4));
  }),
];

/** 2 Fungal Caverns: lumpy cave outlines, rock outcrops, twin chambers. */
const CAVERNS: ShapeFamily[] = [
  fam('cave-blob', (m, r) => {
    const n = noise(r, 4);
    ellipseOut(m, CX, CY, r.range(19, 20.5), r.range(10, 11), 0.28, n);
    const rocks = r.int(1, 3);
    const n2 = noise(r, 2);
    for (let i = 0; i < rocks; i++) {
      const a = r.range(0, Math.PI * 2);
      const d = r.range(0.45, 0.7);
      blob(m, CX + Math.cos(a) * 17 * d, CY + Math.sin(a) * 9 * d, r.range(1.6, 2.4), n2);
    }
    smoothMask(m);
  }),
  fam('cave-twin', (m, r) => {
    const n = noise(r, 4);
    const dy = r.range(-2, 2);
    ellipsesOut(
      m,
      [
        { cx: r.range(9.5, 11.5), cy: CY + dy, rx: r.range(10.5, 12), ry: r.range(9, 10.5) },
        { cx: r.range(27.5, 29.5), cy: CY - dy, rx: r.range(10.5, 12), ry: r.range(9, 10.5) },
      ],
      0.22,
      n,
    );
    smoothMask(m);
  }),
  fam('cave-winding', (m, r) => {
    const n = noise(r, 6);
    ellipseOut(m, CX, CY, r.range(20, 22), r.range(11, 12.5), 0.42, n);
    // a big outcrop from one wall
    const n2 = noise(r, 3);
    blob(m, r.pick([8, 11, 28, 31]), r.pick([1, H - 2]), r.range(3, 4.5), n2);
    smoothMask(m);
  }),
  fam('cave-stalagmites', (m, r) => {
    const n = noise(r, 5);
    ellipseOut(m, CX, CY, r.range(21, 23), r.range(11.5, 12.5), 0.3, n);
    smoothMask(m);
    const n2 = noise(r, 2);
    const spots: [number, number][] = [];
    for (let tries = 0; tries < 40 && spots.length < 5; tries++) {
      const x = r.range(6, W - 7);
      const y = r.range(4, H - 5);
      if (Math.abs(x - CX) < 4 || Math.abs(y - CY) < 3) continue; // keep the door axes clear
      if (spots.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < 7)) continue;
      spots.push([x, y]);
      blob(m, x, y, r.range(0.9, 1.6), n2);
    }
  }),
];

/** Pit channel with water banks running from the top wall to the bottom wall at column x (2 wide), with bridges at the given row spans. */
function channel(m: Mask, x: number, bridges: [number, number][]): void {
  for (let y = 1; y <= H - 2; y++) {
    if (bridges.some(([a, b]) => y >= a && y <= b)) {
      for (let xx = x - 1; xx <= x + 2; xx++) put(m, xx, y, K.Floor);
      continue;
    }
    put(m, x - 1, y, K.Water);
    put(m, x, y, K.Pit);
    put(m, x + 1, y, K.Pit);
    put(m, x + 2, y, K.Water);
  }
}

/** 3 Drowned Sewers: tunnels with rounded ends, cross tunnels, rooms split by drain channels, cisterns. */
const SEWERS: ShapeFamily[] = [
  fam('sewer-tunnel', (m, r) => {
    const t = r.int(3, 4);
    rect(m, 1, 1, W - 2, t);
    rect(m, 1, H - 1 - t, W - 2, H - 2);
    // rounded tunnel ends
    const rr = (H - 2 - 2 * t) / 2;
    each(m, (x, y) => {
      const ex = x < CX ? 1 + rr - x : x - (W - 2 - rr);
      if (ex <= 0) return 0;
      return Math.hypot(ex, y - CY) > rr + 0.6 ? K.Wall : 0;
    });
    if (r.chance(0.7)) {
      const c = r.int(9, 12);
      channel(m, c, [[9, 12]]);
      channel(m, W - 2 - c, [[9, 12]]);
    }
  }),
  fam('sewer-cross', (m, r) => {
    const a = r.int(10, 13);
    const b = r.int(4, 6);
    rect4(m, 1, 1, a, b);
    // rounded inner corners
    const rr = 3;
    each(m, (x, y) => {
      const dx = Math.min(x, W - 1 - x) - a - 1; // ≥ 0 right of the block
      const dy = Math.min(y, H - 1 - y) - b - 1;
      if (dx < 0 || dy < 0 || dx >= rr || dy >= rr) return 0;
      return Math.hypot(rr - 0.5 - dx, rr - 0.5 - dy) > rr ? K.Wall : 0;
    });
    // a water channel along the long arm
    if (r.chance(0.8)) rect(m, 1, 10, W - 2, 11, K.Water);
  }),
  fam('sewer-split', (m, r) => {
    round4(m, r.int(3, 5));
    const c = r.pick([11, 12, 13]);
    const top: [number, number] = r.chance(0.5) ? [3, 5] : [H - 6, H - 4];
    channel(m, c, [[9, 12], top]);
    if (r.chance(0.5)) channel(m, W - 2 - c, [[9, 12], [H - 1 - top[1], H - 1 - top[0]]]);
  }),
  fam('sewer-cistern', (m, r) => {
    round4(m, r.int(6, 8));
    // the drain in the middle, ringed with water
    const n = noise(r, 3);
    blob(m, CX, CY, r.range(3.2, 4.2), null, K.Water);
    blob(m, CX, CY, r.range(1.6, 2.2), n, K.Pit, 0.15);
  }),
];

/** 4 Hollow Forest: clearings with ragged tree lines, twin glades, a great tree in the middle. */
const FOREST: ShapeFamily[] = [
  fam('forest-clearing', (m, r) => {
    const n = noise(r, 3);
    ellipseOut(m, CX, CY, r.range(19.5, 21), r.range(10.5, 11.5), 0.3, n);
    smoothMask(m);
  }),
  fam('forest-glades', (m, r) => {
    const n = noise(r, 3);
    const dy = r.range(2, 3.5) * (r.chance(0.5) ? 1 : -1);
    ellipsesOut(
      m,
      [
        { cx: r.range(10, 12), cy: CY + dy, rx: r.range(10.5, 12), ry: r.range(8.5, 10) },
        { cx: r.range(27.5, 29.5), cy: CY - dy, rx: r.range(10.5, 12), ry: r.range(8.5, 10) },
        { cx: CX, cy: CY, rx: 9, ry: 6 },
      ],
      0.25,
      n,
    );
    smoothMask(m);
  }),
  fam('forest-great-tree', (m, r) => {
    const n = noise(r, 3);
    ellipseOut(m, CX, CY, r.range(20, 21.5), r.range(11, 12), 0.25, n);
    smoothMask(m);
    blob(m, CX + r.range(-1, 1), CY + r.range(-0.5, 0.5), r.range(2.4, 3.2), noise(r, 2), K.Wall, 0.2);
  }),
  fam('forest-treeline', (m, r) => {
    // ragged tree lines grow in from the top and bottom
    const nt = noise(r, 4);
    const nb = noise(r, 4);
    each(m, (x, y) => {
      const top = 2.5 + 2.5 * nt(x, 0);
      const bot = 2.5 + 2.5 * nb(x, 9);
      if (y - 1 < top || H - 2 - y < bot) return K.Wall;
      return 0;
    });
    chamfer4(m, r.int(3, 5));
    smoothMask(m);
  }),
];

/** 5 Ashen Forge: industrial L and T halls, stepped corners, a furnace block. */
const FORGE: ShapeFamily[] = [
  fam('forge-l', (m, r) => {
    // one quadrant is machinery (mirroring picks which)
    const x0 = r.int(23, 26);
    const y1 = r.int(6, 7);
    rect(m, x0, 1, W - 2, y1);
    // its inner corner steps back
    rect(m, x0 - 2, 1, x0 - 1, y1 - 3);
    rect(m, x0, y1 + 1, x0 + 2, y1 + 1, K.Keep);
    steps4(m, 2, 2, 2);
  }),
  fam('forge-t', (m, r) => {
    const a = r.int(10, 13);
    const b = r.int(5, 7);
    rect(m, 1, 1, a, b);
    rect(m, W - 1 - a, 1, W - 2, b);
    // stepped inner corners
    rect(m, a + 1, 1, a + 2, b - 2);
    rect(m, W - 3 - a, 1, W - 2 - a, b - 2);
    steps4(m, 2, 2, 2);
  }),
  fam('forge-stepped', (m, r) => {
    const s = r.int(3, 4);
    steps4(m, s, r.int(2, 3), 2);
  }),
  fam('forge-furnace', (m, r) => {
    rect(m, 1, 1, W - 2, 2);
    rect(m, 1, H - 3, W - 2, H - 2);
    teethTB(m, r.int(4, 6), 7, 2, 4);
    const fw = r.int(3, 4);
    const fh = r.int(2, 3);
    rect(m, Math.round(CX) - fw, Math.round(CY) - fh, Math.round(CX) + fw - 1, Math.round(CY) + fh - 1);
    steps4(m, 2, 2, 2);
  }),
];

/** Rows of columns at y and its mirror, every 4 tiles from x0 (skipping the door corridor). */
function colonnade(m: Mask, y: number, x0: number): void {
  for (let x = x0; x <= 16; x += 4) {
    put(m, x, y, K.Pillar);
    put(m, W - 1 - x, y, K.Pillar);
    put(m, x, H - 1 - y, K.Pillar);
    put(m, W - 1 - x, H - 1 - y, K.Pillar);
  }
}

/** 6 Frozen Reliquary: a nave with columned aisles and an apse, a cruciform church, a rotunda. */
const RELIQUARY: ShapeFamily[] = [
  fam('rel-nave', (m, r) => {
    rect(m, 1, 1, W - 2, 2);
    rect(m, 1, H - 3, W - 2, H - 2);
    colonnade(m, 6, r.pick([4, 5]));
    // the apse at the east end (mirroring flips it west)
    const ar = r.range(8.5, 9.5);
    each(m, (x, y) => (x > W - 2 - ar && Math.hypot(x - (W - 2 - ar), (y - CY) * 1.05) > ar ? K.Wall : 0));
  }),
  fam('rel-cruciform', (m, r) => {
    const a = r.int(10, 12);
    const b = r.int(4, 5);
    rect4(m, 1, 1, a, b);
    round4(m, r.int(6, 8));
    // columns at the crossing
    const px = a + 3;
    const py = b + 3;
    if (r.chance(0.7)) for (const [x, y] of [[px, py], [W - 1 - px, py], [px, H - 1 - py], [W - 1 - px, H - 1 - py]] as const) put(m, x, y, K.Pillar);
  }),
  fam('rel-rotunda', (m, r) => {
    ellipseOut(m, CX, CY, r.range(18, 19.5), r.range(10.2, 10.8), 0, null);
    // a ring of eight columns
    const rx = r.range(10.5, 12);
    const ry = r.range(5.5, 6.5);
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 8 + (i * Math.PI) / 4;
      put(m, Math.round(CX + Math.cos(a) * rx), Math.round(CY + Math.sin(a) * ry), K.Pillar);
    }
  }),
  fam('rel-aisles', (m, r) => {
    chamfer4(m, r.int(4, 5));
    colonnade(m, r.int(4, 5), 4);
    // side chapels behind the west and east walls
    teethLR(m, [1], 6, 2);
  }),
];

/** 7 Clockwork Citadel: octagons with gear teeth, a gear-toothed round chamber, a machine core. */
const CITADEL: ShapeFamily[] = [
  fam('cit-octagon', (m, r) => {
    chamfer4(m, r.int(7, 9));
    teethTB(m, r.int(9, 11), 5, 2, 2);
  }),
  fam('cit-gear', (m, r) => {
    const teeth = r.pick([12, 14, 16]);
    const rx = r.range(17.5, 18.5);
    const ry = r.range(9.8, 10.3);
    const phase = r.chance(0.5) ? 0 : Math.PI / teeth;
    each(m, (x, y) => {
      const ax = (x - CX) / rx;
      const ay = (y - CY) / ry;
      const d = Math.hypot(ax, ay);
      // teeth spaced by arc length, so the narrow ends get as many as the long sides
      const a = Math.atan2(ay * ry, ax * rx);
      const tooth = Math.cos(teeth * a + phase) > 0.2;
      return d > (tooth ? 0.8 : 1) ? K.Wall : 0;
    });
  }),
  fam('cit-core', (m, r) => {
    chamfer4(m, r.int(5, 7));
    // the machine core: an octagonal block with stubs
    const hw = r.int(3, 4);
    const hh = r.int(2, 3);
    each(m, (x, y) => {
      const dx = Math.abs(x - CX) - 0.5;
      const dy = Math.abs(y - CY) - 0.5;
      return dx < hw && dy < hh && dx + dy < hw + hh - 2 ? K.Wall : 0;
    });
  }),
  fam('cit-ward', (m, r) => {
    // a square ward of four octagonal bays
    const a = r.int(6, 8);
    const b = r.int(3, 4);
    rect4(m, 1, 1, a, b);
    rect4(m, 1, 1, b, a - 2);
    chamfer4(m, a + b - 1);
    teethTB(m, a + 3, 5, 2, 2);
  }),
];

/** 8 The Abyss: platforms adrift over the void (pits), joined by causeways. */
const ABYSS: ShapeFamily[] = [
  fam('aby-platform', (m, r) => {
    m.fill(K.Pit);
    const mx = r.int(3, 5);
    const my = r.int(2, 3);
    roundRect(m, mx, my, W - 1 - mx, H - 1 - my, r.int(3, 5), K.Keep);
  }),
  fam('aby-archipelago', (m, r) => {
    m.fill(K.Pit);
    const iw = r.int(8, 10);
    const ih = r.int(5, 7);
    roundRect(m, 2, Math.round(CY) - ih, 1 + iw, Math.round(CY) + ih - 1, 3, K.Keep);
    roundRect(m, W - 2 - iw, Math.round(CY) - ih, W - 3, Math.round(CY) + ih - 1, 3, K.Keep);
    roundRect(m, 14, 3, 25, H - 4, 4, K.Keep);
    // causeways
    rect(m, 1, 9, W - 2, 12, K.Keep);
  }),
  fam('aby-ring', (m, r) => {
    m.fill(K.Pit);
    roundRect(m, 2, 2, W - 3, H - 3, 4, K.Keep);
    const hx = r.int(7, 9);
    const hy = r.int(4, 5);
    roundRect(m, 10 + (9 - hx), 6 + (5 - hy), 29 - (9 - hx), 15 - (5 - hy), 3, K.Pit);
    // causeways across the hole, so every door reaches every other whatever the interior holds
    rect(m, 18, 2, 21, H - 3, K.Keep);
    rect(m, 2, 9, W - 3, 12, K.Keep);
  }),
  fam('aby-crumble', (m, r) => {
    const n = noise(r, 4);
    ellipseOut(m, CX, CY, r.range(19.5, 21), r.range(10.5, 11.5), 0.3, n, K.Pit);
    smoothMask(m);
  }),
];

/** Light zone frames for special rooms (start, bonfire, treasure, reliquary, merchant): the corners only. */
const FRAMES: Record<number, ShapeFamily> = {
  1: fam('frame-crypt', (m, r) => chamfer4(m, r.int(3, 5))),
  2: fam('frame-caverns', (m, r) => {
    ellipseOut(m, CX, CY, r.range(22, 23.5), r.range(12, 13), 0.3, noise(r, 4));
    smoothMask(m);
  }),
  3: fam('frame-sewers', (m, r) => round4(m, r.int(4, 5))),
  4: fam('frame-forest', (m, r) => {
    ellipseOut(m, CX, CY, r.range(22, 23.5), r.range(12, 13), 0.3, noise(r, 3));
    smoothMask(m);
  }),
  5: fam('frame-forge', (m) => steps4(m, 2, 2, 2)),
  6: fam('frame-reliquary', (m, r) => round4(m, r.int(5, 6))),
  7: fam('frame-citadel', (m, r) => chamfer4(m, r.int(4, 6))),
  8: fam('frame-abyss', (m, r) => round4(m, r.int(4, 5), K.Pit)),
};

export const SHAPES: Record<number, ShapeFamily[]> = { 1: CRYPT, 2: CAVERNS, 3: SEWERS, 4: FOREST, 5: FORGE, 6: RELIQUARY, 7: CITADEL, 8: ABYSS };

/** The shape family ids for a zone's combat rooms. */
export function shapeIds(zone: number): string[] {
  return (SHAPES[zone] ?? CRYPT).map((f) => f.id);
}

// ------------------------------------------------------------------ composing and repairing

function grid(rows: readonly string[]): string[][] {
  return rows.map((r) => r.split(''));
}

function rowsOf(g: string[][]): string[] {
  return g.map((r) => r.join(''));
}

const blocking = (ch: string): boolean => BLOCKING.has(ch);

function mirrorMask(m: Mask, h: boolean, v: boolean): Mask {
  if (!h && !v) return m;
  const o = new Uint8Array(m.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) o[y * W + x] = m[(v ? H - 1 - y : y) * W + (h ? W - 1 - x : x)]!;
  return o;
}

/** Clear the mask over each door's 4-wide approach, from the door inward until it meets open ground. */
function openDoorways(m: Mask): void {
  const solid = (x: number, y: number): boolean => {
    const v = m[y * W + x]!;
    return v === K.Wall || v === K.Pit || v === K.Pillar;
  };
  // north / south: columns 18–21
  for (const [y0, dy] of [
    [1, 1],
    [H - 2, -1],
  ] as const) {
    for (let i = 0, y = y0; y >= 1 && y <= H - 2; i++, y += dy) {
      for (let x = 18; x <= 21; x++) m[y * W + x] = K.Keep;
      const ny = y + dy;
      if (i >= 2 && ny >= 1 && ny <= H - 2 && ![18, 19, 20, 21].some((x) => solid(x, ny))) break;
    }
  }
  // west / east: rows 9–12
  for (const [x0, dx] of [
    [1, 1],
    [W - 2, -1],
  ] as const) {
    for (let i = 0, x = x0; x >= 1 && x <= W - 2; i++, x += dx) {
      for (let y = 9; y <= 12; y++) m[y * W + x] = K.Keep;
      const nx = x + dx;
      if (i >= 2 && nx >= 1 && nx <= W - 2 && ![9, 10, 11, 12].some((y) => solid(nx, y))) break;
    }
  }
}

/** 8-connected lumps of removable blocking tiles (template obstacles; not the shape's own tiles or the outer wall). */
function lumps(g: string[][], prot: Uint8Array): { id: Int32Array; size: number[]; tiles: number[][] } {
  const id = new Int32Array(W * H).fill(-1);
  const size: number[] = [];
  const tiles: number[][] = [];
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (id[i] !== -1 || prot[i] || !blocking(g[y]![x]!)) continue;
      const n = size.length;
      const list: number[] = [];
      const q = [i];
      id[i] = n;
      while (q.length) {
        const c = q.pop()!;
        list.push(c);
        const cx = c % W;
        const cy = (c - cx) / W;
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx;
            const ny = cy + dy;
            if (nx < 1 || ny < 1 || nx > W - 2 || ny > H - 2) continue;
            const j = ny * W + nx;
            if (id[j] !== -1 || prot[j] || !blocking(g[ny]![nx]!)) continue;
            id[j] = n;
            q.push(j);
          }
      }
      size.push(list.length);
      tiles.push(list);
    }
  return { id, size, tiles };
}

/** Protection levels: template tiles can be removed, the shape's columns give way to its walls, walls stay. */
const SOFT = 1;
const HARD = 2;

/**
 * Enforce the gap rule. A narrow gap involving a template obstacle removes that obstacle's whole lump (the
 * smaller one if both are); a shape column too close to a wall is dropped; a narrow gap between two of the
 * shape's own walls is closed (filled like its sides).
 */
function repairGaps(g: string[][], prot: Uint8Array): void {
  for (let iter = 0; iter < 400; iter++) {
    const v = gapViolations(rowsOf(g));
    if (!v.length) return;
    const L = lumps(g, prot);
    const gone = new Set<number>();
    const dropped = new Set<number>();
    let changed = false;
    for (const { a, b } of v) {
      const ia = a[1] * W + a[0];
      const ib = b[1] * W + b[0];
      const la = L.id[ia]!;
      const lb = L.id[ib]!;
      if (gone.has(la) || gone.has(lb) || dropped.has(ia) || dropped.has(ib)) continue;
      if (la >= 0 || lb >= 0) {
        const kill = la < 0 ? lb : lb < 0 ? la : L.size[la]! <= L.size[lb]! ? la : lb;
        for (const t of L.tiles[kill]!) g[(t - (t % W)) / W]![t % W] = '.';
        gone.add(kill);
        changed = true;
        continue;
      }
      if (prot[ia] === SOFT || prot[ib] === SOFT) {
        const t = prot[ib] === SOFT ? ib : ia;
        g[(t - (t % W)) / W]![t % W] = '.';
        prot[t] = 0;
        dropped.add(t);
        changed = true;
        continue;
      }
      const ca = g[a[1]]![a[0]]!;
      const cb = g[b[1]]![b[0]]!;
      const fill = ca === cb ? ca : '#';
      for (let y = Math.min(a[1], b[1]); y <= Math.max(a[1], b[1]); y++)
        for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x++) {
          if (!inside(x, y) || blocking(g[y]![x]!)) continue;
          g[y]![x] = fill;
          prot[y * W + x] = HARD;
        }
      changed = true;
    }
    if (!changed) return;
  }
}

/** Walkable tiles reachable from the north door's inside tiles (4-connected). */
function reach(g: string[][]): Uint8Array {
  const seen = new Uint8Array(W * H);
  const q: number[] = [];
  // from the north door (every other door must then be in the same region)
  const start = INSIDE.n.find(([x, y]) => !blocking(g[y]![x]!));
  if (start) {
    seen[start[1] * W + start[0]] = 1;
    q.push(start[1] * W + start[0]);
  }
  while (q.length) {
    const c = q.pop()!;
    const cx = c % W;
    const cy = (c - cx) / W;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx < 1 || ny < 1 || nx > W - 2 || ny > H - 2) continue;
      const j = ny * W + nx;
      if (seen[j] || blocking(g[ny]![nx]!)) continue;
      seen[j] = 1;
      q.push(j);
    }
  }
  return seen;
}

/** Fill walkable pockets the shape cut off from the doors (with the shape tile that walls them in). */
function fillPockets(g: string[][], prot: Uint8Array): void {
  const seen = reach(g);
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (seen[i] || blocking(g[y]![x]!)) continue;
      // collect the pocket
      const pocket: number[] = [];
      const q = [i];
      seen[i] = 2;
      let wall: string | null = null;
      while (q.length) {
        const c = q.pop()!;
        pocket.push(c);
        const cx = c % W;
        const cy = (c - cx) / W;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (!inside(nx, ny)) continue; // the outer wall and its doors are never part of a pocket
          const j = ny * W + nx;
          const ch = g[ny]![nx]!;
          if (blocking(ch)) {
            if (prot[j] === HARD && wall !== '#') wall = ch === 'P' ? '#' : ch;
            continue;
          }
          if (seen[j]) continue;
          seen[j] = 2;
          q.push(j);
        }
      }
      if (wall === null) continue; // a pocket of the template's own making stays as it was
      for (const c of pocket) {
        g[(c - (c % W)) / W]![c % W] = wall;
        prot[c] = HARD;
      }
    }
}

/** No blocking tile within `rad` tiles (a square): rad 2 fits an Elite brute. */
function clearAround(g: string[][], x: number, y: number, rad: number): boolean {
  for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) if (blocking(g[y + dy]?.[x + dx] ?? '#')) return false;
  return true;
}

function farFromDoors(x: number, y: number): boolean {
  for (const s of SIDES) for (const [dx, dy] of doorTiles(s)) if (Math.hypot(x - dx, y - dy) < SPAWN_DOOR_TILES) return false;
  return true;
}

/** Re-place spawn points and chest spots the shape removed (or cut off): `spawns` = how many the room should have. */
function fixMarkers(g: string[][], spawns: number, chests: [number, number][]): void {
  const seen = reach(g);
  const S: [number, number][] = [];
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      if (g[y]![x] !== 'S') continue;
      if (seen[y * W + x] && farFromDoors(x, y)) S.push([x, y]);
      else g[y]![x] = '.';
    }
  const open = (x: number, y: number, rad: number): boolean => '.~G'.includes(g[y]![x]!) && !!seen[y * W + x] && clearAround(g, x, y, rad);
  // new spawn points: in the open (room for a big body), as far as possible from the others
  for (const rad of [2, 1]) {
    while (S.length < spawns) {
      let best: [number, number] | null = null;
      let bestD = -1;
      for (let y = 2; y < H - 2; y++)
        for (let x = 2; x < W - 2; x++) {
          if (!open(x, y, rad) || !farFromDoors(x, y)) continue;
          const d = S.length ? Math.min(...S.map(([sx, sy]) => Math.hypot(sx - x, sy - y))) : Math.hypot(x - CX, y - CY);
          if (d > bestD) {
            bestD = d;
            best = [x, y];
          }
        }
      if (!best) break;
      g[best[1]]![best[0]] = 'S';
      S.push(best);
    }
  }
  // chest spots: the nearest open tile to where the template had it
  for (const [cx, cy] of chests) {
    if (g[cy]![cx] === 'C' && seen[cy * W + cx]) continue;
    if (g[cy]![cx] === 'C') g[cy]![cx] = '.';
    let best: [number, number] | null = null;
    let bestD = Infinity;
    for (let y = 2; y < H - 2; y++)
      for (let x = 2; x < W - 2; x++) {
        if (!open(x, y, 1)) continue;
        const d = Math.hypot(x - cx, y - cy);
        if (d < bestD) {
          bestD = d;
          best = [x, y];
        }
      }
    if (best) g[best[1]]![best[0]] = 'C';
  }
}

function floorShare(g: string[][]): number {
  let n = 0;
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (!blocking(g[y]![x]!)) n++;
  return n / ((W - 2) * (H - 2));
}

/** Special-room markers that must survive a frame untouched (bonfire, shrine, cart, start, stations…). */
const KEEP_MARKS = /[BRMXIE1-9a-fKHw]/;

/** Check a shaped special room: gap rule, doors connected, every marker reachable. */
function specialOk(g: string[][], marks: [number, number, string][]): boolean {
  if (gapViolations(rowsOf(g)).length) return false;
  const seen = reach(g);
  for (const s of SIDES) for (const [x, y] of INSIDE[s]) if (!seen[y * W + x]) return false;
  for (const [x, y, ch] of marks) if (g[y]![x] !== ch || !seen[y * W + x]) return false;
  return floorShare(g) >= SHAPED_MIN_FLOOR;
}

export interface ShapeOpts {
  zone: number;
  /** a family id from shapeIds(zone), or 'frame' for a special room's light zone frame */
  shape: string;
  /** stream key: the layout seed and the room's id */
  seed: string;
  roomId: string;
  /** debugging: told why an attempt failed */
  debug?: (msg: string) => void;
}

/**
 * Shape a room: carve the family's mask into the template rows, repair, re-place markers, validate.
 * Returns the template rows unchanged when no attempt validates (never throws).
 */
export function shapeRoom(rows: readonly string[], o: ShapeOpts): string[] {
  const special = o.shape === 'frame';
  const family = special ? FRAMES[o.zone] : (SHAPES[o.zone] ?? []).find((f) => f.id === o.shape);
  if (!family || rows.length !== H) return [...rows];
  const r = stream(o.seed, `shape:${o.zone}:${o.roomId}`);
  const base = grid(rows);
  const marks: [number, number, string][] = [];
  const chests: [number, number][] = [];
  let spawns = 0;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) {
      const ch = base[y]![x]!;
      if (ch === 'S') spawns++;
      else if (ch === 'C') chests.push([x, y]);
      else if (KEEP_MARKS.test(ch)) marks.push([x, y, ch]);
    }
  for (let attempt = 0; attempt < 4; attempt++) {
    let m: Mask = new Uint8Array(W * H);
    family.draw(m, r);
    m = mirrorMask(m, r.chance(0.5), r.chance(0.5));
    openDoorways(m);
    // a special room's markers keep a clear ring of 3 tiles
    for (const [mx, my] of marks) for (let y = my - 3; y <= my + 3; y++) for (let x = mx - 3; x <= mx + 3; x++) if (inside(x, y)) m[y * W + x] = K.Keep;
    const g = grid(rows);
    const prot = new Uint8Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        if (!inside(x, y)) {
          prot[y * W + x] = HARD;
          continue;
        }
        const v = m[y * W + x]!;
        if (!v) continue;
        const ch = g[y]![x]!;
        // floor and water keep the template's markers; walls, pits and columns take the tile
        if ((v === K.Floor || v === K.Water) && (ch === 'S' || ch === 'C' || KEEP_MARKS.test(ch))) continue;
        if (v === K.Water && ch !== '.' && !blocking(ch)) continue; // grates and hazards stay
        g[y]![x] = MASK_CH[v]!;
        if (v === K.Wall || v === K.Pit) prot[y * W + x] = HARD;
        else if (v === K.Pillar) prot[y * W + x] = SOFT;
      }
    repairGaps(g, prot);
    fillPockets(g, prot);
    repairGaps(g, prot);
    fixMarkers(g, special ? spawns : Math.max(4, spawns), chests);
    // too little floor: drop template obstacles until there is enough
    if (floorShare(g) < SHAPED_MIN_FLOOR) {
      const L = lumps(g, prot);
      const order = r.shuffle(L.tiles.map((_, i) => i));
      for (const i of order) {
        if (floorShare(g) >= SHAPED_MIN_FLOOR) break;
        for (const t of L.tiles[i]!) g[(t - (t % W)) / W]![t % W] = '.';
      }
    }
    const out = rowsOf(g);
    if (special) {
      if (specialOk(g, marks)) return out;
      o.debug?.(`attempt ${attempt}: special room check failed\n${out.join('\n')}`);
      continue;
    }
    const issues = validateTemplate({ id: o.roomId, rows: out }, { minFloor: SHAPED_MIN_FLOOR });
    if (!issues.length) return out;
    o.debug?.(`attempt ${attempt}: ${issues.map((i) => i.msg).join('; ')}\n${out.join('\n')}`);
  }
  return [...rows];
}

/**
 * Thin props by 20% (PROCGEN §3): whole free-standing prop clumps only, so thinning never opens a narrow gap.
 */
export function thinProps(rows: readonly string[], r: Rng, p = 0.2): string[] {
  const g = grid(rows);
  const seen = new Uint8Array(W * H);
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      if (seen[y * W + x] || g[y]![x] !== 'o') continue;
      const clump: [number, number][] = [];
      let alone = true;
      const q: [number, number][] = [[x, y]];
      seen[y * W + x] = 1;
      while (q.length) {
        const [cx, cy] = q.pop()!;
        clump.push([cx, cy]);
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = cx + dx;
            const ny = cy + dy;
            const ch = g[ny]?.[nx] ?? '#';
            if (ch === 'o') {
              if (!seen[ny * W + nx]) {
                seen[ny * W + nx] = 1;
                q.push([nx, ny]);
              }
            } else if (blocking(ch)) alone = false;
          }
      }
      if (alone && r.chance(p)) for (const [cx, cy] of clump) g[cy]![cx] = '.';
    }
  return rowsOf(g);
}
