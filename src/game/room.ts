// Room tile grid (PROCGEN §2–3): 40 × 22 tiles of 32 px, origin (0, 16) in logical px.
import type { MovingFloorDef } from './types';

export const TILE = 32;
export const ROOM_W = 40;
export const ROOM_H = 22;
export const ROOM_Y0 = 16;
export const ROOM_PX_W = ROOM_W * TILE; // 1280
export const ROOM_PX_H = ROOM_H * TILE; // 704

export const T = {
  Floor: 0,
  Wall: 1,
  Pillar: 2,
  Prop: 3,
  Hazard: 4,
  Pit: 5,
  Grate: 6,
  Door: 7,
  Void: 8,
} as const;

/** Room.overlay values: Void (the platform shrank) and Collapsed (fallen away for a while) read as T.Void; Crumbling is still floor, about to fall. */
export const OVERLAY = { None: 0, Void: 1, Collapsed: 2, Crumbling: 3 } as const;

/**
 * Room.terrain values (hazardous terrain patches, PROCGEN §3.2): Slow (grave mud, sludge, snow…: −35% walking,
 * never the dodge) and Hurt (grave-fire, acid, frost spikes…: a small hit every 0.5 s). A layer over plain floor,
 * fixed at generation and separate from the zone's '~' hazard tiles.
 */
export const TERRAIN = { None: 0, Slow: 1, Hurt: 2 } as const;
/** walking speed multiplier on Slow terrain (−35%) */
export const TERRAIN_SLOW_MULT = 0.65;

export type Side = 'n' | 's' | 'e' | 'w';

export interface DoorInfo {
  side: Side;
  /** leads to a neighbouring room */
  exists: boolean;
  open: boolean;
  /** locked boss door (needs the boss key: always unlocked once the anteroom is reached in M8+) */
  locked: boolean;
}

/** door tile coordinates per side (2 tiles wide in the middle) */
export function doorTiles(side: Side): [number, number][] {
  switch (side) {
    case 'n':
      return [
        [19, 0],
        [20, 0],
      ];
    case 's':
      return [
        [19, ROOM_H - 1],
        [20, ROOM_H - 1],
      ];
    case 'w':
      return [
        [0, 10],
        [0, 11],
      ];
    case 'e':
      return [
        [ROOM_W - 1, 10],
        [ROOM_W - 1, 11],
      ];
  }
}

export function doorCenter(side: Side): [number, number] {
  switch (side) {
    case 'n':
      return [640, ROOM_Y0 + 16];
    case 's':
      return [640, ROOM_Y0 + ROOM_PX_H - 16];
    case 'w':
      return [16, ROOM_Y0 + 11 * TILE];
    case 'e':
      return [ROOM_PX_W - 16, ROOM_Y0 + 11 * TILE];
  }
}

/** Where a player stands after entering through `side` */
export function entryPoint(side: Side): [number, number] {
  switch (side) {
    case 'n':
      return [640, ROOM_Y0 + 80];
    case 's':
      return [640, ROOM_Y0 + ROOM_PX_H - 80];
    case 'w':
      return [80, ROOM_Y0 + 11 * TILE];
    case 'e':
      return [ROOM_PX_W - 80, ROOM_Y0 + 11 * TILE];
  }
}

export const OPPOSITE: Record<Side, Side> = { n: 's', s: 'n', e: 'w', w: 'e' };

export class Room {
  tiles: Uint8Array;
  doors: Record<Side, DoorInfo>;
  /** zone hazard for '~' tiles */
  hazardKind = 'water';
  /** extra void tiles over the template (OVERLAY: a shrunk platform, a temporary collapse, a crumbling edge) */
  overlay: Uint8Array;
  /** hazardous terrain patches over plain floor (TERRAIN), fixed at generation */
  terrain: Uint8Array;
  /** rotating floor ring (Tock): center, inner/outer radius, speed in px/s along the ring (sign = direction) */
  rotFloor: { x: number; y: number; rIn: number; rOut: number; speed: number } | null = null;
  /** moving floors a boss phase started (ArenaChange 'movingFloor', D95): rings and conveyor belts */
  movers: MovingFloorDef[] = [];
  /** destructible tree props (Vexthorn): tile index → hits left */
  trees: Map<number, number> = new Map();
  id = 'arena';
  version = 0;

  constructor(tiles?: Uint8Array) {
    this.tiles = tiles ?? new Uint8Array(ROOM_W * ROOM_H);
    this.overlay = new Uint8Array(ROOM_W * ROOM_H);
    this.terrain = new Uint8Array(ROOM_W * ROOM_H);
    this.doors = {
      n: { side: 'n', exists: false, open: false, locked: false },
      s: { side: 's', exists: false, open: false, locked: false },
      e: { side: 'e', exists: false, open: false, locked: false },
      w: { side: 'w', exists: false, open: false, locked: false },
    };
  }

  static empty(): Room {
    const r = new Room();
    for (let y = 0; y < ROOM_H; y++)
      for (let x = 0; x < ROOM_W; x++) if (x === 0 || y === 0 || x === ROOM_W - 1 || y === ROOM_H - 1) r.set(x, y, T.Wall);
    return r;
  }

  /** Parse a 40 × 22 ASCII template (PROCGEN §3). Doors on sides listed in `doors` are cut. */
  static fromAscii(rows: string[]): Room {
    const r = new Room();
    for (let y = 0; y < ROOM_H; y++) {
      const row = rows[y] ?? '';
      for (let x = 0; x < ROOM_W; x++) {
        const ch = row[x] ?? '#';
        r.set(x, y, charToTile(ch));
      }
    }
    return r;
  }

  get(tx: number, ty: number): number {
    if (tx < 0 || ty < 0 || tx >= ROOM_W || ty >= ROOM_H) return T.Wall;
    const o = this.overlay[ty * ROOM_W + tx]!;
    if (o === OVERLAY.Void || o === OVERLAY.Collapsed) return T.Void;
    return this.tiles[ty * ROOM_W + tx]!;
  }

  set(tx: number, ty: number, v: number): void {
    if (tx < 0 || ty < 0 || tx >= ROOM_W || ty >= ROOM_H) return;
    this.tiles[ty * ROOM_W + tx] = v;
    this.version++;
  }

  tileAt(x: number, y: number): number {
    return this.get(Math.floor(x / TILE), Math.floor((y - ROOM_Y0) / TILE));
  }

  /** Door tiles count as walls unless that door exists and is open. */
  private doorBlocks(tx: number, ty: number): boolean {
    for (const side of ['n', 's', 'e', 'w'] as Side[]) {
      for (const [dx, dy] of doorTiles(side)) {
        if (dx === tx && dy === ty) {
          const d = this.doors[side];
          return !(d.exists && d.open);
        }
      }
    }
    return true;
  }

  blocksMove(tx: number, ty: number, flying = false): boolean {
    const t = this.get(tx, ty);
    if (t === T.Door) return this.doorBlocks(tx, ty);
    if (t === T.Wall || t === T.Pillar) return true;
    if (flying) return false;
    return t === T.Prop || t === T.Pit || t === T.Void;
  }

  blocksProjectile(tx: number, ty: number): boolean {
    const t = this.get(tx, ty);
    if (t === T.Door) return this.doorBlocks(tx, ty);
    return t === T.Wall || t === T.Pillar;
  }

  /** Is a world point standing over a pit/void (fall)? */
  isFallAt(x: number, y: number): boolean {
    const t = this.tileAt(x, y);
    return t === T.Pit || t === T.Void;
  }

  isHazardAt(x: number, y: number): boolean {
    return this.tileAt(x, y) === T.Hazard;
  }

  /** The hazardous terrain (TERRAIN) under a world point (none where the floor has fallen away). */
  terrainAt(x: number, y: number): number {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor((y - ROOM_Y0) / TILE);
    if (tx < 0 || ty < 0 || tx >= ROOM_W || ty >= ROOM_H) return TERRAIN.None;
    const i = ty * ROOM_W + tx;
    const o = this.overlay[i];
    if (o === OVERLAY.Void || o === OVERLAY.Collapsed) return TERRAIN.None;
    return this.terrain[i]!;
  }

  isGrateAt(x: number, y: number): boolean {
    return this.tileAt(x, y) === T.Grate;
  }

  /**
   * Move a circle by (dx, dy) with tile collision (axis-separated). Returns whether it hit a wall.
   * `ignoreFall`: true = pits and void do not block (dodges, knockbacks); 'void' = only the void does not
   * (a walking player can step off an open platform edge; pits keep their rim).
   */
  moveCircle(e: { x: number; y: number; radius: number }, dx: number, dy: number, flying = false, ignoreFall: boolean | 'void' = false): boolean {
    let hit = false;
    const r = Math.max(4, e.radius * 0.8);
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 12));
    const sx = dx / steps;
    const sy = dy / steps;
    for (let i = 0; i < steps; i++) {
      if (sx !== 0) {
        const nx = e.x + sx;
        if (this.circleBlocked(nx, e.y, r, flying, ignoreFall)) hit = true;
        else e.x = nx;
      }
      if (sy !== 0) {
        const ny = e.y + sy;
        if (this.circleBlocked(e.x, ny, r, flying, ignoreFall)) hit = true;
        else e.y = ny;
      }
    }
    return hit;
  }

  circleBlocked(x: number, y: number, r: number, flying = false, ignoreFall: boolean | 'void' = false): boolean {
    const x0 = Math.floor((x - r) / TILE);
    const x1 = Math.floor((x + r) / TILE);
    const y0 = Math.floor((y - r - ROOM_Y0) / TILE);
    const y1 = Math.floor((y + r - ROOM_Y0) / TILE);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = this.get(tx, ty);
        let blocks: boolean;
        if ((ignoreFall === true && t === T.Pit) || (ignoreFall && t === T.Void)) blocks = false;
        else blocks = this.blocksMove(tx, ty, flying);
        if (!blocks) continue;
        // circle vs tile rect
        const rx0 = tx * TILE;
        const ry0 = ROOM_Y0 + ty * TILE;
        const cx = Math.max(rx0, Math.min(x, rx0 + TILE));
        const cy = Math.max(ry0, Math.min(y, ry0 + TILE));
        if ((cx - x) * (cx - x) + (cy - y) * (cy - y) < r * r) return true;
      }
    }
    return false;
  }

  /** Straight-line visibility for projectiles (pillars and walls block). */
  lineOfSight(x0: number, y0: number, x1: number, y1: number): boolean {
    const d = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.ceil(d / 12);
    for (let i = 1; i < n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const y = y0 + ((y1 - y0) * i) / n;
      if (this.blocksProjectile(Math.floor(x / TILE), Math.floor((y - ROOM_Y0) / TILE))) return false;
    }
    return true;
  }

  /** Nearest walkable floor point to (x, y) (used after falls and for spawn placement). */
  nearestFloor(x: number, y: number, r = 14): [number, number] {
    const tx0 = Math.floor(x / TILE);
    const ty0 = Math.floor((y - ROOM_Y0) / TILE);
    for (let rad = 0; rad < 40; rad++) {
      let best: [number, number] | null = null;
      let bestD = Infinity;
      for (let ty = ty0 - rad; ty <= ty0 + rad; ty++) {
        for (let tx = tx0 - rad; tx <= tx0 + rad; tx++) {
          if (Math.max(Math.abs(tx - tx0), Math.abs(ty - ty0)) !== rad) continue;
          const cx = tx * TILE + 16;
          const cy = ROOM_Y0 + ty * TILE + 16;
          if (this.circleBlocked(cx, cy, r)) continue;
          const d = (cx - x) ** 2 + (cy - y) ** 2;
          if (d < bestD) {
            bestD = d;
            best = [cx, cy];
          }
        }
      }
      if (best) return best;
    }
    return [640, 368];
  }

  isWalkableTile(tx: number, ty: number): boolean {
    return !this.blocksMove(tx, ty);
  }

  /** Raycast to the first projectile-blocking tile from (x, y) along angle a; returns distance. */
  rayToWall(x: number, y: number, a: number, max = 2000): number {
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    for (let d = 0; d < max; d += 8) {
      const px = x + ca * d;
      const py = y + sa * d;
      if (this.blocksProjectile(Math.floor(px / TILE), Math.floor((py - ROOM_Y0) / TILE))) return d;
    }
    return max;
  }
}

export function charToTile(ch: string): number {
  switch (ch) {
    case '#':
      return T.Wall;
    case 'P':
      return T.Pillar;
    case 'o':
    case 't': // a tree (boss arenas): a prop a charge can break (room.trees)
      return T.Prop;
    case '~':
      return T.Hazard;
    case '_':
    case 'g': // an open grave (boss arenas): a pit that is also a summon spot
      return T.Pit;
    case 'G':
      return T.Grate;
    case 'D':
      return T.Door;
    case 'V':
      return T.Void;
    default:
      return T.Floor; // '.', 'S', 'C', 'B' (bonfire spot), etc.
  }
}

export function tileCenter(tx: number, ty: number): [number, number] {
  return [tx * TILE + 16, ROOM_Y0 + ty * TILE + 16];
}

export function worldToTile(x: number, y: number): [number, number] {
  return [Math.floor(x / TILE), Math.floor((y - ROOM_Y0) / TILE)];
}
