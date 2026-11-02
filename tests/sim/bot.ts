// A scripted player for the balance harness (BUILD_BRIEF M15). Each tick it reads the world like a
// competent player would: dodge Red telegraphs about to land, step out of Piercing and area telegraphs
// (into a pocket when the pattern has them), drink the Thermos when low, otherwise close in and attack,
// use skills off cooldown, and cast for the caster classes. Deterministic: no randomness of its own.
import { GAME_ACTIONS, type InputFrame } from '../../src/engine/input/actions';
import { shapeHit } from '../../src/game/combat/patterns';
import { flaskCap } from '../../src/game/combat/formulas';
import type { Entity, World } from '../../src/game/world';

const bit = (a: (typeof GAME_ACTIONS)[number]): number => 1 << GAME_ACTIONS.indexOf(a);

export type BotStyle = 'melee' | 'caster';

export interface BotState {
  style: BotStyle;
  prev: number;
  t: number;
  /** reaction time: a bot only sees a telegraph after this long */
  reactS: number;
}

export function newBot(style: BotStyle, reactS = 0.25): BotState {
  return { style, prev: 0, t: 0, reactS };
}

function shapeCenter(s: { k: string; x?: number; y?: number }): [number, number] | null {
  return typeof s.x === 'number' && typeof s.y === 'number' ? [s.x, s.y] : null;
}

/** The most urgent telegraph that would hit the bot where it stands, if any. */
function threat(w: World, p: Entity, react: number): { kind: string; dx: number; dy: number; dt: number; pockets: [number, number][] } | null {
  let best: { kind: string; dx: number; dy: number; dt: number; pockets: [number, number][] } | null = null;
  for (const t of w.entities.values()) {
    const tg = t.tg;
    if (t.type !== 'telegraph' || t.removed || !tg || tg.team !== 1 || tg.fired) continue;
    if (w.time - tg.start < react) continue; // not noticed yet
    const dt = tg.impact - w.time;
    if (dt > 1.6 || dt < -0.05) continue;
    const pockets: [number, number][] = [];
    let hits = false;
    for (const s of tg.shapes) {
      if (s.k === 'pockets') {
        for (const pk of (s as unknown as { pockets: { x: number; y: number }[] }).pockets ?? []) pockets.push([pk.x, pk.y]);
        hits = true;
        continue;
      }
      if (shapeHit(s, Math.max(0, dt), p.x, p.y, p.radius + 6, w.room)) hits = true;
    }
    if (!hits) continue;
    const c = shapeCenter(tg.shapes[0] as unknown as { k: string; x?: number; y?: number }) ?? [t.x, t.y];
    let dx = p.x - c[0];
    let dy = p.y - c[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    if (!best || dt < best.dt) best = { kind: tg.kind, dx, dy, dt, pockets };
  }
  return best;
}

function nearestEnemy(w: World, p: Entity): Entity | null {
  let best: Entity | null = null;
  let bd = Infinity;
  for (const e of w.livingEnemies()) {
    if (e.en?.state === 'dormant' || e.en?.gary || e.en?.state === 'spawning') continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return best;
}

export function botInput(w: World, p: Entity, b: BotState): InputFrame {
  b.t += 1 / 60;
  const pl = p.pl!;
  let buttons = 0;
  let mx = 0;
  let my = 0;
  let aimX = p.x + Math.cos(p.facing) * 100;
  let aimY = p.y + Math.sin(p.facing) * 100;
  const target = nearestEnemy(w, p);
  if (target) {
    aimX = target.x;
    aimY = target.y;
  }
  const th = threat(w, p, b.reactS);
  const stam = p.stam?.cur ?? 0;
  const hpFrac = p.hp!.hp / Math.max(1, p.hp!.max);
  if (th) {
    if (th.pockets.length) {
      // run for the nearest safe pocket
      let px = th.pockets[0]![0];
      let py = th.pockets[0]![1];
      let pd = Infinity;
      for (const [x, y] of th.pockets) {
        const d = Math.hypot(x - p.x, y - p.y);
        if (d < pd) {
          pd = d;
          px = x;
          py = y;
        }
      }
      const d = Math.max(1, pd);
      mx = (px - p.x) / d;
      my = (py - p.y) / d;
    } else {
      mx = th.dx;
      my = th.dy;
    }
    // Red or anything about to land: dodge through it if there is stamina
    if (th.dt < 0.25 && stam > 25 && (th.kind === 'red' || th.kind === 'normal' || !th.pockets.length)) buttons |= bit('dodge');
  } else if (hpFrac < 0.4 && pl.char.flaskCur > 0 && flaskCap(pl.char) > 0 && pl.state === 'idle') {
    buttons |= bit('flask');
    if (target) {
      const d = Math.hypot(target.x - p.x, target.y - p.y) || 1;
      mx = -(target.x - p.x) / d;
      my = -(target.y - p.y) / d;
    }
  } else if (target) {
    const d = Math.hypot(target.x - p.x, target.y - p.y);
    const want = b.style === 'caster' ? 240 : 36 + target.radius;
    if (d > want + 10) {
      mx = (target.x - p.x) / d;
      my = (target.y - p.y) / d;
    } else if (b.style === 'caster' && d < want * 0.6) {
      mx = -(target.x - p.x) / d;
      my = -(target.y - p.y) / d;
    }
    const inReach = b.style === 'caster' ? d < 520 : d < want + 30;
    if (inReach && stam > 15) {
      // tap attack (combos come from repeated presses)
      if (Math.floor(b.t * 6) % 2 === 0) buttons |= bit('attack');
      const k = Math.floor(b.t * 2) % 7;
      if (k === 1) buttons |= bit('skill1');
      if (k === 3) buttons |= bit('skill2');
      if (k === 5) buttons |= bit('skill3');
      if (b.style === 'caster' || pl.char.knownSpells.length) {
        if (k === 2) buttons |= bit('spell1');
        if (k === 4) buttons |= bit('spell2');
      }
    }
  }
  const pressed = buttons & ~b.prev;
  b.prev = buttons;
  return { moveX: mx, moveY: my, aimX, aimY, aimNeutral: false, aimAssist: 0, buttons, pressed };
}
