// Interactions that are world rules (not menus): the mimic that eats whoever opens it (D179).
import { dist } from '../engine/math';
import { rawDamage } from './combat/damage';
import type { Entity, World } from './world';

/** Find a dormant mimic within reach of the player. */
export function dormantMimicNear(w: World, p: Entity, r = 64): Entity | null {
  for (const e of w.enemies) {
    if (e.en?.state === 'dormant' && !e.hp?.dead && dist(e.x, e.y, p.x, p.y) <= r + e.radius) return e;
  }
  return null;
}

/** Each bite of a mimic eating someone (D179): this share of their max HP, unblockable and unmitigated. */
export const MIMIC_BITE_PCT = 0.15;
/** Seconds from the grab to the first bite, and between bites: the lid gapes, then slams shut. */
export const MIMIC_BITE_S = 0.7;

/**
 * Opening a mimic (D179): its arms come out of the chest and drag you in, and it bites, again and again, each bite
 * 15% of your max HP. Solo it always kills (nothing can hurt the mimic while it eats its only player). In co-op the
 * others can kill it to free you; if the bites take you to 0 you are downed and it climbs out to fight the rest.
 */
export function mimicBite(w: World, p: Entity, mimic: Entity): void {
  const en = mimic.en!;
  if (!p.pl || en.devour) return;
  w.sfx('mimicBite', p.x, 1);
  w.emit({ t: 'shake', amount: 14 });
  w.fx('hit', p.x, p.y, { color: '#c0304a', n: 20 });
  w.emit({ t: 'msg', text: 'It was a mimic.', color: '#ff6a5a' });
  // it is awake now (and stays so if you die): the save remembers it
  if (en.state === 'dormant') {
    en.mimicChestId = 'awake:' + (en.mimicChestId ?? '');
    w.hooks.onMimicWake?.(w, mimic);
  }
  en.state = 'held';
  en.devour = { targetId: p.id, nextBite: w.time + MIMIC_BITE_S, bites: 0 };
  mimic.anim.pose = 'devour';
  mimic.anim.poseT = 0;
  // in you go: held for as long as it lasts, inside the chest
  const pl = p.pl;
  pl.combo = null;
  pl.action = null;
  pl.blocking = false;
  pl.state = 'held';
  pl.stateUntil = w.time + 9999;
  pl.holdBy = mimic.id;
  pl.holdUntil = w.time + 9999;
  pl.holdDmg = 0;
  p.st!.controls.hold = w.time + 9999;
  en.holdingId = p.id;
  holdInside(p, mimic);
  w.emit({ t: 'stat', key: 'mimicBites', playerId: pl.playerId });
}

/** The victim sits in the chest, just behind its front so it is drawn first (D179). */
function holdInside(p: Entity, mimic: Entity): void {
  p.x = p.px = mimic.x;
  p.y = p.py = mimic.y - 2;
  p.facing = Math.PI / 2;
  p.forced = null;
}

/** A mimic eating: keep the victim inside and bite on time; stop when the victim goes down or is gone. */
export function updateDevour(w: World, mimic: Entity): void {
  const en = mimic.en!;
  const dv = en.devour!;
  const v = w.get(dv.targetId);
  if (!v?.pl || v.removed || v.hp!.dead || v.pl.downed || v.pl.deadUntilRest || v.pl.falling) {
    endDevour(w, mimic, true);
    return;
  }
  holdInside(v, mimic);
  mimic.anim.pose = 'devour';
  if (w.time < dv.nextBite) return;
  dv.bites++;
  dv.nextBite = w.time + MIMIC_BITE_S;
  mimic.anim.poseT = 0;
  w.sfx('mimicBite', mimic.x, 0.9);
  w.emit({ t: 'shake', amount: 7 });
  w.fx('hit', v.x, v.y - 10, { color: '#c0304a', n: 12 });
  const hp0 = v.hp!.hp;
  rawDamage(w, v, v.hp!.max * MIMIC_BITE_PCT, 'physical', mimic.id, true);
  // the bite that finishes a lone player is a death by mimic
  if (hp0 > 0 && v.hp!.hp <= 0 && !v.pl.downed) w.hooks.onMimicBite?.(w, v, mimic);
  if (v.pl.downed || v.hp!.dead || v.hp!.hp <= 0) endDevour(w, mimic, true);
}

/**
 * Stop eating (D179). The victim is let go just in front of the chest (a moment untouchable after a rescue). With
 * `fight` (the victim went down) the mimic climbs out to fight the others; otherwise it has just died.
 */
export function endDevour(w: World, mimic: Entity, fight: boolean): void {
  const en = mimic.en!;
  const dv = en.devour;
  if (!dv) return;
  en.devour = null;
  en.holdingId = 0;
  const v = w.get(dv.targetId);
  if (v?.pl) {
    if (v.pl.state === 'held' && v.pl.holdBy === mimic.id) {
      v.pl.state = 'idle';
      v.pl.stateUntil = 0;
    }
    v.pl.holdBy = 0;
    v.pl.holdUntil = 0;
    if (v.st) v.st.controls.hold = 0;
    // out in front of the chest, else behind or to a side: the first open spot clear of its body
    const d = mimic.radius + v.radius + 8;
    const spot = (
      [
        [0, d],
        [0, -d],
        [d, 0],
        [-d, 0],
      ] as const
    )
      .map(([dx, dy]) => [mimic.x + dx, mimic.y + dy] as const)
      .find(([x, y]) => !w.room.circleBlocked(x, y, v.radius) && !w.room.isFallAt(x, y));
    const [fx, fy] = spot ?? w.room.nearestFloor(mimic.x, mimic.y + d, v.radius);
    v.x = v.px = fx;
    v.y = v.py = fy;
    if (!fight && !v.pl.downed && v.hp) v.hp.invulnUntil = Math.max(v.hp.invulnUntil, w.time + 1);
  }
  if (fight && !mimic.hp?.dead) {
    en.state = 'alert';
    en.thinkAt = w.time + 0.4;
    mimic.anim.pose = 'windup';
    mimic.anim.poseT = 0;
    w.emit({ t: 'msg', text: 'The mimic climbs out for the rest of you!', color: '#ff9b6a' });
  } else mimic.anim.pose = 'idle';
}
