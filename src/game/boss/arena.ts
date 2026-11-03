// Boss arena changes (DATA_MODEL ArenaChange): applied when a boss phase starts. Each op is generic; the
// boss data says which ones it uses and with what value.
import { dist } from '../../engine/math';
import { emptySpec } from '../combat/damage';
import type { Shape } from '../combat/patterns';
import { attackDamage } from '../enemies/spawn';
import { ROOM_H, ROOM_W, ROOM_Y0, T, TILE, tileCenter } from '../room';
import { spawnHazard } from '../systems/hazards';
import { shrinkPlatform } from './platform';
import type { ArenaChange, BossDef } from '../types';
import type { DamageSpec, Entity, World } from '../world';

const FOREVER = 1e6;

/** A hazard hit worth `mult` of the boss's own hit in its current phase (thorn walls that deal ×0.5 on touch). */
function bossHitSpec(boss: Entity, mult: number): DamageSpec {
  const spec = emptySpec('normal');
  spec.parryable = false;
  const phase = (boss.en!.def as unknown as BossDef).phases?.[boss.en!.phase];
  spec.dmg.physical = attackDamage(boss, mult) * (phase?.dmgMult ?? 1);
  return spec;
}

function floorSpots(w: World): [number, number][] {
  const out: [number, number][] = [];
  for (let y = 2; y < ROOM_H - 2; y++)
    for (let x = 2; x < ROOM_W - 2; x++) {
      const t = w.room.get(x, y);
      if (t === T.Floor || t === T.Hazard || t === T.Grate) out.push(tileCenter(x, y));
    }
  return out;
}

/** Random floor spots at least `clear` px from every player and the boss. */
function pickSpots(w: World, n: number, clear: number, boss: Entity | null): [number, number][] {
  const all = floorSpots(w);
  const out: [number, number][] = [];
  for (let tries = 0; tries < 400 && out.length < n; tries++) {
    const s = all[w.combat.int(0, all.length - 1)];
    if (!s) break;
    if (w.livingPlayers().some((p) => dist(p.x, p.y, s[0], s[1]) < clear)) continue;
    if (boss && dist(boss.x, boss.y, s[0], s[1]) < clear) continue;
    if (out.some((o) => dist(o[0], o[1], s[0], s[1]) < 150)) continue;
    out.push(s);
  }
  return out;
}

export function applyArenaChanges(w: World, changes: ArenaChange[], boss: Entity | null): void {
  for (const c of changes) applyArenaChange(w, c, boss);
  w.room.version++;
}

function applyArenaChange(w: World, c: ArenaChange, boss: Entity | null): void {
  const ownerId = boss?.id ?? 0;
  switch (c.op) {
    case 'hazardFloor': {
      // permanent patches of a hazard (the Caretaker's burning moss)
      const n = c.value ?? 6;
      for (const [x, y] of pickSpots(w, n, 120, boss)) spawnHazard(w, c.hazard ?? 'firePuddle', [{ k: 'circle', x, y, r: 56 }], FOREVER, 1, ownerId);
      break;
    }
    case 'iceFloor': {
      const n = c.value ?? 8;
      for (const [x, y] of pickSpots(w, n, 60, null)) spawnHazard(w, 'ice', [{ k: 'circle', x, y, r: 80 }], FOREVER, 1, ownerId);
      break;
    }
    case 'darken':
      w.roomMods.dark = c.value ?? 0.5;
      break;
    case 'floodAll':
      w.roomMods.floodUntil = FOREVER;
      w.roomMods.floodSlow = c.value ?? 0.3;
      break;
    case 'thornWalls': {
      // a band of thorns along every wall
      const band = c.value ?? 48;
      const x0 = 32;
      const y0 = 16 + 32;
      const x1 = 1280 - 32;
      const y1 = 16 + 32 * (ROOM_H - 1);
      spawnHazard(
        w,
        'thorns',
        [
          { k: 'line', x: x0, y: y0 + band / 2, a: 0, w: band, l: x1 - x0 },
          { k: 'line', x: x0, y: y1 - band / 2, a: 0, w: band, l: x1 - x0 },
          { k: 'line', x: x0 + band / 2, y: y0, a: Math.PI / 2, w: band, l: y1 - y0 },
          { k: 'line', x: x1 - band / 2, y: y0, a: Math.PI / 2, w: band, l: y1 - y0 },
        ],
        FOREVER,
        1,
        ownerId,
        c.mult && boss?.en ? { spec: bossHitSpec(boss, c.mult) } : {},
      );
      break;
    }
    case 'hazardTiles': {
      // the '~' tiles become a live hazard (merged into one line per row run); re-applying replaces the last set
      const kind = c.hazard ?? 'lava';
      for (const h of w.entities.values()) if (h.type === 'hazard' && !h.removed && h.hz?.ownerId === ownerId && h.hz.hazard === kind && h.hz.until >= FOREVER) w.remove(h);
      const shapes: Shape[] = [];
      for (let y = 0; y < ROOM_H; y++)
        for (let x = 0; x < ROOM_W; x++) {
          if (w.room.get(x, y) !== T.Hazard) continue;
          let x2 = x;
          while (x2 + 1 < ROOM_W && w.room.get(x2 + 1, y) === T.Hazard) x2++;
          shapes.push({ k: 'line', x: x * TILE, y: ROOM_Y0 + y * TILE + TILE / 2, a: 0, w: TILE, l: (x2 - x + 1) * TILE });
          x = x2;
        }
      if (shapes.length) spawnHazard(w, kind, shapes, FOREVER, 1, ownerId);
      break;
    }
    case 'widenLava': {
      // every floor tile touching a hazard tile becomes hazard
      const grow: [number, number][] = [];
      for (let y = 1; y < ROOM_H - 1; y++)
        for (let x = 1; x < ROOM_W - 1; x++) {
          if (w.room.get(x, y) !== T.Floor) continue;
          if ([w.room.get(x + 1, y), w.room.get(x - 1, y), w.room.get(x, y + 1), w.room.get(x, y - 1)].includes(T.Hazard)) grow.push([x, y]);
        }
      for (const [x, y] of grow) w.room.set(x, y, T.Hazard);
      break;
    }
    case 'shrinkPlatform':
      // value < 1: that fraction of the platform's area falls away (scaled toward its centre); value ≥ 1: that
      // many outer rows/columns. The edge crumbles for 2 s first; door approaches and the boss's ground stay.
      shrinkPlatform(w, c.value ?? 0.25, boss);
      break;
    case 'reverseFloor':
      if (w.room.rotFloor) w.room.rotFloor.speed = -w.room.rotFloor.speed * (c.value ?? 1);
      for (const m of w.room.movers) m.speed = -m.speed * (c.value ?? 1);
      break;
    case 'movingFloor':
      // a ring or a conveyor belt that carries every walking body on it (D90); it stops with the boss
      if (c.floor) w.room.movers.push({ ...c.floor });
      break;
    case 'setTiles':
    case 'spawnProps':
    case 'removeProps': {
      // tiles: "x,y,ch" (ch is a template character)
      for (const t of c.tiles ?? []) {
        const [xs, ys, ch] = t.split(',');
        const x = Number(xs);
        const y = Number(ys);
        const v = c.op === 'removeProps' ? T.Floor : charTile(ch ?? '.');
        w.room.set(x, y, v);
      }
      break;
    }
  }
}

function charTile(ch: string): number {
  switch (ch) {
    case 'P':
      return T.Pillar;
    case 'o':
      return T.Prop;
    case '~':
      return T.Hazard;
    case '_':
      return T.Pit;
    case 'G':
      return T.Grate;
    case 'V':
      return T.Void;
    default:
      return T.Floor;
  }
}
