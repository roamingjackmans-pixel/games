// Build a Room (tiles + doors) and its markers from a layout node (PROCGEN §3, §8).
import { stream } from '../../engine/rng';
import { ROOM_TEMPLATES } from '../../data/rooms';
import { BOSS_ARENAS } from '../../data/rooms/bosses';
import { ROOM_ANTEROOM, ROOM_BOSS, ROOM_MERCHANT, ROOM_RELIQUARY, ROOM_START, ROOM_TREASURE, ROOM_TRIAL, ROOM_TUTORIAL } from '../../data/rooms/special';
import { zoneDef } from '../../data/zones';
import { Room, T, tileCenter, ROOM_H, ROOM_W, type Side } from '../room';
import { mirrorTemplate } from './templates';
import { shapeRoom, thinProps } from './shapes';
import type { RoomNode, ZoneLayout } from './zone';

export interface RoomMarkers {
  spawns: [number, number][];
  chests: [number, number][];
  bonfire: [number, number] | null;
  reliquary: [number, number] | null;
  merchant: [number, number] | null;
  start: [number, number] | null;
  instructor: [number, number] | null;
  exit: [number, number] | null;
  stations: { n: number; x: number; y: number }[];
  dummies: { kind: string; x: number; y: number }[];
  /** boss arenas: the boss's spot, the stairs, open graves, pools */
  boss: [number, number] | null;
  stairs: [number, number] | null;
  graves: [number, number][];
  pools: [number, number][];
}


function templateFor(layout: ZoneLayout, node: RoomNode, arenaId?: string): { rows: string[]; mirror: boolean } {
  switch (node.kind) {
    case 'start':
      return { rows: ROOM_START.rows, mirror: false };
    case 'anteroom':
      return { rows: ROOM_ANTEROOM.rows, mirror: false };
    case 'treasure':
      return { rows: ROOM_TREASURE.rows, mirror: false };
    case 'reliquary':
      return { rows: ROOM_RELIQUARY.rows, mirror: false };
    case 'merchant':
      return { rows: ROOM_MERCHANT.rows, mirror: false };
    case 'boss':
      return { rows: (arenaId && BOSS_ARENAS[arenaId]?.rows) || ROOM_BOSS.rows, mirror: false };
    case 'tutorial':
      return { rows: ROOM_TUTORIAL.rows, mirror: false };
    case 'trial':
      return { rows: ROOM_TRIAL.rows, mirror: false };
    default: {
      const list = ROOM_TEMPLATES[layout.zone]?.length ? ROOM_TEMPLATES[layout.zone]! : ROOM_TEMPLATES[1]!;
      const t = list.find((x) => x.id === node.template) ?? list[0]!;
      return { rows: t.rows, mirror: true };
    }
  }
}

/** Special rooms that wear their zone's light frame (shaped corners); boss arenas, the hall and the trial stay as drawn. */
const FRAMED = new Set<RoomNode['kind']>(['start', 'anteroom', 'treasure', 'reliquary', 'merchant']);

/** The final ASCII rows of a room: template, mirrored, shaped (PROCGEN §3.1), props thinned. Deterministic. */
export function roomRows(layout: ZoneLayout, node: RoomNode, arenaId?: string): { rows: string[]; mirror: boolean } {
  const tpl = templateFor(layout, node, arenaId);
  let rows = tpl.mirror ? mirrorTemplate(tpl.rows, node.mirrorH, node.mirrorV) : tpl.rows;
  const shapeSeed = `${layout.seed}#${layout.cycle}`;
  if (tpl.mirror && node.shape) rows = shapeRoom(rows, { zone: layout.zone, shape: node.shape, seed: shapeSeed, roomId: node.id });
  else if (FRAMED.has(node.kind)) rows = shapeRoom(rows, { zone: layout.zone, shape: 'frame', seed: shapeSeed, roomId: node.id });
  // thin props by 20% (PROCGEN §3): whole free-standing clumps, so no narrow gap ever opens
  if (tpl.mirror) rows = thinProps(rows, stream(layout.seed, `props:${layout.zone}:${node.id}`));
  return { rows, mirror: tpl.mirror };
}

export function buildRoom(layout: ZoneLayout, node: RoomNode, arenaId?: string): { room: Room; markers: RoomMarkers } {
  const { rows } = roomRows(layout, node, arenaId);
  const room = Room.fromAscii(rows);
  room.id = `${layout.seed}|${node.id}`;
  room.hazardKind = zoneDef(layout.zone).hazardKind;
  // a boss arena may carry a rotating floor ring (copied: phase changes reverse it in place)
  const rf = node.kind === 'boss' && arenaId ? BOSS_ARENAS[arenaId]?.rotFloor : undefined;
  if (rf) room.rotFloor = { ...rf };
  const m: RoomMarkers = { spawns: [], chests: [], bonfire: null, reliquary: null, merchant: null, start: null, instructor: null, exit: null, stations: [], dummies: [], boss: null, stairs: null, graves: [], pools: [] };
  for (let y = 0; y < ROOM_H; y++) {
    for (let x = 0; x < ROOM_W; x++) {
      const ch = rows[y]?.[x] ?? '#';
      const c = tileCenter(x, y);
      if (ch === 'S') m.spawns.push(c);
      else if (ch === 'C') m.chests.push(c);
      else if (ch === 'B') m.bonfire = c;
      else if (ch === 'R') m.reliquary = c;
      else if (ch === 'M') m.merchant = c;
      else if (ch === 'X') m.start = c;
      else if (ch === 'I') m.instructor = c;
      else if (ch === 'E') m.exit = c;
      else if (ch >= '1' && ch <= '9') m.stations.push({ n: Number(ch), x: c[0], y: c[1] });
      else if ('abcdf'.includes(ch)) m.dummies.push({ kind: ch, x: c[0], y: c[1] });
      else if (ch === 'K') m.boss = c;
      else if (ch === 'H') m.stairs = c;
      // arena marks take the floor they sit on (water arenas stay wet)
      if ('KHw'.includes(ch) && rows[y]?.[x - 1] === '~') room.set(x, y, T.Hazard);
      else if (ch === 'g') m.graves.push(c);
      else if (ch === 'w') m.pools.push(c);
    }
  }
  // trees ('t'): props a charge can break, one charge per clump (Vexthorn's clearing)
  for (let y = 0; y < ROOM_H; y++) for (let x = 0; x < ROOM_W; x++) if (rows[y]?.[x] === 't' && room.get(x, y) === T.Prop) room.trees.set(y * ROOM_W + x, 1);
  for (const s of ['n', 's', 'e', 'w'] as Side[]) {
    room.doors[s].exists = node.doors.includes(s);
    room.doors[s].open = room.doors[s].exists;
  }
  // rooms with fewer than 4 spawn points (special rooms) get spots in the corners
  if (m.spawns.length < 4) {
    for (const [tx, ty] of [
      [6, 4],
      [33, 4],
      [6, 17],
      [33, 17],
    ] as const)
      if (!room.blocksMove(tx, ty)) m.spawns.push(tileCenter(tx, ty));
  }
  return { room, markers: m };
}
