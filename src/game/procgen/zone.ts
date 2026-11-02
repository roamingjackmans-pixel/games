// Zone layout (PROCGEN §2): a 9 × 9 grid, Isaac-style growth from the centre, then specials on dead ends.
// Pure function of (seed, zone, options) — host and guests generate the same map.
import { stream, type Rng } from '../../engine/rng';
import { ROOM_TEMPLATES } from '../../data/rooms';
import { zoneDef } from '../../data/zones';
import { ENEMIES, rosterOf } from '../../data/enemies';
import { pickMix } from './mix';
import type { Side } from '../room';

export type RoomKind = 'start' | 'combat' | 'ambush' | 'treasure' | 'reliquary' | 'merchant' | 'anteroom' | 'boss' | 'tutorial' | 'trial';

export interface RoomNode {
  id: string;
  gx: number;
  gy: number;
  kind: RoomKind;
  depth: number;
  /** sides with a neighbouring room */
  doors: Side[];
  template: string;
  mirrorH: boolean;
  mirrorV: boolean;
  /** dead-end combat rooms get a small-chest bonus */
  bonusChest: boolean;
}

export interface ZoneLayout {
  zone: number;
  seed: string;
  cycle: number;
  rooms: RoomNode[];
  byId: Record<string, RoomNode>;
  startId: string;
  anteroomId: string;
  bossId: string;
  tutorialId: string | null;
  /** the Instructor's room off the Training Hall's south door (D75) */
  trialId: string | null;
  /** the zone's 4-enemy mix (PROCGEN §4) */
  mix: string[];
  /** explicit door links that do not follow the grid (the tutorial hall's exit) */
  links: Record<string, { to: string; entry: Side }>;
}

export const GRID = 9;
const DIRS: [Side, number, number][] = [
  ['n', 0, -1],
  ['s', 0, 1],
  ['e', 1, 0],
  ['w', -1, 0],
];
export const SIDE_DELTA: Record<Side, [number, number]> = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };

export interface ZoneOpts {
  cycle?: number;
  /** a new character's first zone (cycle 0) gets the tutorial hall */
  tutorial?: boolean;
  /** PROCGEN §2.5: 100% reliquary if the character knows < 2 spells by zone 3 */
  fewSpells?: boolean;
}

function key(x: number, y: number): string {
  return `${x},${y}`;
}

function tryGenerate(rng: Rng, zone: number, n: number): Map<string, { x: number; y: number }> | null {
  const cells = new Map<string, { x: number; y: number }>();
  const c = Math.floor(GRID / 2);
  cells.set(key(c, c), { x: c, y: c });
  const frontier: { x: number; y: number }[] = [{ x: c, y: c }];
  let guard = 0;
  while (cells.size < n && guard++ < 5000) {
    if (frontier.length === 0) frontier.push(...cells.values());
    const idx = rng.int(0, frontier.length - 1);
    const cur = frontier[idx]!;
    const [, dx, dy] = rng.pick(DIRS);
    const nx = cur.x + dx;
    const ny = cur.y + dy;
    if (nx < 0 || ny < 0 || nx >= GRID || ny >= GRID || cells.has(key(nx, ny))) {
      if (rng.chance(0.3)) frontier.splice(idx, 1);
      continue;
    }
    // reject 2 × 2 blocks
    let block = false;
    for (const [ox, oy] of [
      [0, 0],
      [-1, 0],
      [0, -1],
      [-1, -1],
    ] as const) {
      const sq = [key(nx + ox, ny + oy), key(nx + ox + 1, ny + oy), key(nx + ox, ny + oy + 1), key(nx + ox + 1, ny + oy + 1)];
      if (sq.filter((k) => k === key(nx, ny) || cells.has(k)).length === 4) block = true;
    }
    if (block) continue;
    let neighbours = 0;
    for (const [, ddx, ddy] of DIRS) if (cells.has(key(nx + ddx, ny + ddy))) neighbours++;
    if (neighbours >= 2 && !rng.chance(0.7)) continue;
    cells.set(key(nx, ny), { x: nx, y: ny });
    frontier.push({ x: nx, y: ny });
  }
  void zone;
  return cells.size >= n ? cells : null;
}

function bfs(cells: Map<string, { x: number; y: number }>, sx: number, sy: number): Map<string, number> {
  const d = new Map<string, number>();
  d.set(key(sx, sy), 0);
  const q = [{ x: sx, y: sy }];
  while (q.length) {
    const cur = q.shift()!;
    const cd = d.get(key(cur.x, cur.y))!;
    for (const [, dx, dy] of DIRS) {
      const k = key(cur.x + dx, cur.y + dy);
      if (!cells.has(k) || d.has(k)) continue;
      d.set(k, cd + 1);
      q.push({ x: cur.x + dx, y: cur.y + dy });
    }
  }
  return d;
}

function neighboursOf(cells: Map<string, { x: number; y: number }>, x: number, y: number): number {
  let n = 0;
  for (const [, dx, dy] of DIRS) if (cells.has(key(x + dx, y + dy))) n++;
  return n;
}

export function generateZone(seed: string, zone: number, o: ZoneOpts = {}): ZoneLayout {
  const cycle = o.cycle ?? 0;
  const N = 12 + Math.floor(zone / 2);
  for (let attempt = 0; attempt < 50; attempt++) {
    const rng = stream(seed, `map:${zone}:${cycle}:${attempt}`);
    const cells = tryGenerate(rng, zone, N);
    if (!cells) continue;
    const c = Math.floor(GRID / 2);
    const dist = bfs(cells, c, c);
    // dead ends sorted far → near
    const deadEnds = [...cells.values()]
      .filter((p) => !(p.x === c && p.y === c) && neighboursOf(cells, p.x, p.y) === 1)
      .sort((a, b) => dist.get(key(b.x, b.y))! - dist.get(key(a.x, a.y))!);
    let ante: { x: number; y: number } | null = null;
    let boss: { x: number; y: number } | null = null;
    for (const de of deadEnds) {
      const free = DIRS.map(([, dx, dy]) => ({ x: de.x + dx, y: de.y + dy })).filter(
        (p) => p.x >= 0 && p.y >= 0 && p.x < GRID && p.y < GRID && !cells.has(key(p.x, p.y)) && neighboursOf(cells, p.x, p.y) === 1,
      );
      if (free.length === 0) continue;
      ante = de;
      boss = rng.pick(free);
      break;
    }
    if (!ante || !boss) continue;
    // the tutorial hall hangs off the start room's south door
    const tut = o.tutorial && cycle === 0 && !cells.has(key(c, c + 1)) ? { x: c, y: c + 1 } : null;
    if (o.tutorial && cycle === 0 && !tut) continue;
    const kinds = new Map<string, RoomKind>();
    kinds.set(key(c, c), 'start');
    kinds.set(key(ante.x, ante.y), 'anteroom');
    kinds.set(key(boss.x, boss.y), 'boss');
    const restDead = deadEnds.filter((d) => d !== ante);
    const rest = [...restDead];
    const take = (): { x: number; y: number } | undefined => rest.shift();
    const t1 = take();
    if (t1) kinds.set(key(t1.x, t1.y), 'treasure');
    if (rng.chance(0.5)) {
      const t2 = take();
      if (t2) kinds.set(key(t2.x, t2.y), 'treasure');
    }
    const reliqChance = o.fewSpells && zone >= 3 ? 1 : 0.35;
    if (rng.chance(reliqChance)) {
      const r = take();
      if (r) kinds.set(key(r.x, r.y), 'reliquary');
    }
    if (zone > 1 && rng.chance(0.2)) {
      const m = take();
      if (m) kinds.set(key(m.x, m.y), 'merchant');
    }
    const bonusDead = new Set(rest.map((p) => key(p.x, p.y)));
    const templates = ROOM_TEMPLATES[zone] && ROOM_TEMPLATES[zone]!.length ? ROOM_TEMPLATES[zone]! : ROOM_TEMPLATES[1]!;
    const all = [...cells.values(), boss];
    if (tut) all.push(tut);
    const rooms: RoomNode[] = [];
    let idx = 0;
    for (const p of all) {
      const k = key(p.x, p.y);
      let kind: RoomKind = kinds.get(k) ?? 'combat';
      if (tut && p === tut) kind = 'tutorial';
      if (kind === 'combat' && rng.chance(0.1)) kind = 'ambush';
      const doors: Side[] = [];
      for (const [s, dx, dy] of DIRS) {
        const nk = key(p.x + dx, p.y + dy);
        const isBossLink = (p === boss && ante.x === p.x + dx && ante.y === p.y + dy) || (p === ante && boss.x === p.x + dx && boss.y === p.y + dy);
        if (p === boss) {
          if (isBossLink) doors.push(s);
          continue;
        }
        if (tut && p === tut) continue;
        if (cells.has(nk) || isBossLink) doors.push(s);
      }
      const id = kind === 'start' ? `z${zone}-start` : kind === 'tutorial' ? `z${zone}-tutorial` : kind === 'boss' ? `z${zone}-bossroom` : kind === 'anteroom' ? `z${zone}-boss` : `z${zone}-r${idx}`;
      idx++;
      const tpl = rng.pick(templates);
      rooms.push({
        id,
        gx: p.x,
        gy: p.y,
        kind,
        depth: kind === 'boss' ? (dist.get(key(ante.x, ante.y)) ?? 0) + 1 : (dist.get(k) ?? 0),
        doors,
        template: tpl.id,
        mirrorH: rng.chance(0.5),
        mirrorV: rng.chance(0.5),
        bonusChest: kind === 'combat' && bonusDead.has(k),
      });
    }
    // the start room's south door leads to the tutorial (one-way: the hall's exit is its east door)
    const links: ZoneLayout['links'] = {};
    let tutorialId: string | null = null;
    let trialId: string | null = null;
    if (tut) {
      const tutNode = rooms.find((r) => r.kind === 'tutorial')!;
      tutNode.doors = ['e', 's'];
      tutorialId = tutNode.id;
      const startNode = rooms.find((r) => r.kind === 'start')!;
      if (!startNode.doors.includes('s')) startNode.doors.push('s');
      links[`${tutNode.id}|e`] = { to: `z${zone}-start`, entry: 's' };
      // the Instructor's own room hangs off the hall's south door, outside the grid (D75)
      trialId = `z${zone}-trial`;
      rooms.push({ id: trialId, gx: -100, gy: -100, kind: 'trial', depth: 0, doors: ['n'], template: 'trial', mirrorH: false, mirrorV: false, bonusChest: false });
      links[`${tutNode.id}|s`] = { to: trialId, entry: 'n' };
      links[`${trialId}|n`] = { to: tutNode.id, entry: 's' };
    }
    const byId: Record<string, RoomNode> = {};
    for (const r of rooms) byId[r.id] = r;
    const roster = rosterOf(zone);
    const mixRng = stream(seed, `rooms:${zone}:${cycle}`);
    const mix = roster.length >= 4 ? pickMix(mixRng, roster).map((d) => d.id) : zoneDef(zone).enemies.filter((id) => !!ENEMIES[id]).slice(0, 4);
    return {
      zone,
      seed,
      cycle,
      rooms,
      byId,
      startId: `z${zone}-start`,
      anteroomId: `z${zone}-boss`,
      bossId: `z${zone}-bossroom`,
      tutorialId,
      trialId,
      mix,
      links,
    };
  }
  throw new Error(`Zone generation failed for ${seed} zone ${zone}`);
}

/** Room id in the given direction from a room (via grid or explicit links). */
export function neighbourId(layout: ZoneLayout, roomId: string, side: Side): { id: string; entry: Side } | null {
  const link = layout.links[`${roomId}|${side}`];
  if (link) return { id: link.to, entry: link.entry };
  const r = layout.byId[roomId];
  if (!r || !r.doors.includes(side)) return null;
  const [dx, dy] = SIDE_DELTA[side];
  const n = layout.rooms.find((x) => x.gx === r.gx + dx && x.gy === r.gy + dy);
  if (!n) return null;
  if (n.kind === 'tutorial') return null; // the hall is entered only at the start of a new character
  const back: Side = side === 'n' ? 's' : side === 's' ? 'n' : side === 'e' ? 'w' : 'e';
  return { id: n.id, entry: back };
}
