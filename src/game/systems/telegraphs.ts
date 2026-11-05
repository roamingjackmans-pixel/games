// Telegraph system: resolves impacts, pulses, continuous areas (sweeps, rings, waves, beams) and persistence.
import { DEG, turnToward } from '../../engine/math';
import { shapeHit, type Shape } from '../combat/patterns';
import { addRevive, ffVictims, hitAlly, hitEnemy, hitPlayer } from '../combat/damage';
import { runEffects } from '../effects/run';
import { spawnHazard } from './hazards';
import { attackDamage } from '../enemies/spawn';
import type { Entity, World } from '../world';

function targetsFor(w: World, t: Entity): Entity[] {
  const tg = t.tg!;
  if (tg.team === 1) {
    const owner = w.get(tg.ownerId);
    const list = w.livingPlayers();
    if (owner?.en?.def.traits?.friendlyFire) return [...list, ...w.livingEnemies().filter((e) => e.id !== owner.id)];
    return list;
  }
  // friendly fire (D115): a player's areas also catch the other standing players
  return [...w.livingEnemies(), ...ffVictims(w, w.get(tg.ownerId))];
}

function applyHit(w: World, t: Entity, target: Entity): void {
  const tg = t.tg!;
  const spec = tg.spec;
  const owner = w.get(tg.ownerId);
  const ox = owner?.x ?? t.x;
  const oy = owner?.y ?? t.y;
  // hits come "from" the attacker for melee, from the area itself otherwise (for block facing)
  const fromX = tg.area ? target.x + Math.cos(target.facing) * 10 : ox;
  const fromY = tg.area ? target.y + Math.sin(target.facing) * 10 : oy;
  if (!spec) return;
  if (target.pl && tg.team === 0) hitAlly(w, owner, target, spec, ox, oy);
  else if (target.pl) hitPlayer(w, tg.ownerId, target, spec, tg.area && tg.kind === 'pierce' ? fromX : ox, tg.area && tg.kind === 'pierce' ? fromY : oy);
  else if (target.en) {
    if (tg.team === 1) {
      if (target.en.isBoss) return;
      // enemy friendly fire (Bloated Carrier) uses the raw spec against other enemies
      const dmg = Object.values(spec.dmg).reduce((a, b) => a + (b ?? 0), 0);
      target.hp!.hp -= dmg;
      target.anim.flashUntil = w.time + 0.08;
      if (target.hp!.hp <= 0) {
        target.hp!.dead = true;
        w.emit({ t: 'death', id: target.id, x: target.x, y: target.y, isPlayer: false, defId: target.en.def.id });
        w.hooks.onEnemyKilled?.(w, target, 0);
      }
    } else hitEnemy(w, owner ?? null, target, spec, ox, oy, { light: false });
  }
}

function impactTest(w: World, t: Entity, tau: number, onceSet: Set<number> | null): void {
  const tg = t.tg!;
  for (const target of targetsFor(w, t)) {
    if (onceSet && onceSet.has(target.id)) continue;
    let hitAny = false;
    for (const s of tg.shapes) {
      if (shapeHit(s, tau, target.x, target.y, target.radius, w.room)) {
        hitAny = true;
        break;
      }
    }
    if (!hitAny) continue;
    onceSet?.add(target.id);
    applyHit(w, t, target);
  }
  // player skill areas also revive ghosts a little (spell value 0.25 is applied by the effect system)
  if (tg.team === 0 && tg.spec && tg.spec.reviveValue > 0) {
    const owner = w.get(tg.ownerId);
    for (const g of w.players) {
      if (!g.pl!.downed || !owner || g === owner) continue;
      if (onceSet?.has(g.id)) continue;
      if (tg.shapes.some((s) => shapeHit(s, tau, g.x, g.y, g.radius, w.room))) {
        onceSet?.add(g.id);
        addRevive(w, g, owner, tg.spec.isSpell ? 0.25 : tg.spec.reviveValue);
      }
    }
  }
}

function shapeCenter(s: Shape): [number, number] | null {
  switch (s.k) {
    case 'circle':
    case 'ring':
    case 'cone':
    case 'line':
    case 'sweep':
    case 'expRing':
    case 'beam':
      return [s.x, s.y];
    default:
      return null;
  }
}

export function updateTelegraphs(w: World, dt: number): void {
  const now = w.time;
  for (const t of w.entities.values()) {
    if (t.type !== 'telegraph' || t.removed) continue;
    const tg = t.tg!;
    const owner = w.get(tg.ownerId);
    // owner died before impact: enemy telegraphs vanish (a dead caster casts nothing); bosses' too
    if (now < tg.impact) {
      if (tg.team === 1 && (!owner || owner.hp?.dead) && tg.kind !== 'utility' && !tg.sourceTag.startsWith('death:')) {
        w.remove(t);
      }
      continue;
    }
    // follow / track during the active phase (sweeps and beams stay on their caster)
    if (tg.follow && owner && !owner.hp?.dead) {
      for (const s of tg.shapes) {
        if (s.k === 'sweep' || s.k === 'beam' || s.k === 'expRing') {
          s.x = owner.x;
          s.y = owner.y;
        }
      }
    }
    for (const s of tg.shapes) {
      if (s.k !== 'beam') continue;
      const target = w.get(tg.trackTargetId);
      if (tg.trackTargetId && target && !target.removed) {
        s.a = turnToward(s.a, Math.atan2(target.y - s.y, target.x - s.x), tg.turnRate * dt);
      } else s.a += s.turn * dt;
      if (s.l > 1500 && w.room) s.l = Math.min(1500, w.room.rayToWall(s.x, s.y, s.a) + 20);
    }
    const tau = now - tg.impact;
    if (tg.mode === 'instant') {
      if (!tg.fired) {
        tg.fired = true;
        tg.hit.clear();
        impactTest(w, t, 0, tg.hit);
        impactFx(w, t);
        if (tg.onImpact.length && owner) {
          const c = shapeCenter(tg.shapes[0]!) ?? [t.x, t.y];
          runEffects(w, tg.onImpact, {
            sourceId: owner.id,
            team: tg.team,
            x: c[0],
            y: c[1],
            aimX: c[0],
            aimY: c[1],
            targetId: owner.en?.targetId ?? 0,
            powerMult: 1,
            isSpell: !!tg.spec?.isSpell,
            isSkill: !!tg.spec?.isSkill,
            baseDamage: owner.en ? attackDamage(owner, 1) : (owner.pl?.derived.weaponPower ?? 0),
            windupS: 0,
            tag: tg.sourceTag,
          });
        }
        tg.pulsesDone++;
        if (tg.pulsesDone < tg.pulses) {
          tg.fired = false;
          tg.impact = now + tg.pulseGap;
        }
      }
    } else if (tau <= tg.end - tg.impact) {
      if (!tg.fired) {
        tg.fired = true;
        impactFx(w, t);
      }
      if (tg.mode === 'once') impactTest(w, t, tau, tg.hit);
      else if (now >= tg.nextTick) {
        tg.nextTick = now + tg.tickS;
        impactTest(w, t, tau, null);
      }
    }
    if (now >= tg.end) {
      if (tg.persist) {
        for (const s of tg.shapes) {
          if (s.k === 'circle' || s.k === 'line') spawnHazard(w, tg.persist.hazard, [s], tg.persist.durationS, tg.team, tg.ownerId);
        }
      }
      w.remove(t);
    }
  }
}

function impactFx(w: World, t: Entity): void {
  const tg = t.tg!;
  const color = tg.kind === 'red' ? '#ff3b3b' : tg.kind === 'pierce' ? '#8fd3ff' : tg.team === 0 ? '#ffd27a' : '#e8d8c0';
  let n = 0;
  if (tg.vfx) {
    // the pattern names its own animation (player skills and spells): the view draws it over the true shape
    const v = tg.vfx;
    const d = Math.max(0, tg.end - tg.impact);
    const el = tg.dmgType ?? 'physical';
    for (const s of tg.shapes) {
      if (n++ > 10) break;
      if (s.k === 'circle') w.fx('circle', s.x, s.y, { r: s.r, v, el, d });
      else if (s.k === 'ring') w.fx('circle', s.x, s.y, { r: Math.min(400, s.rOut), x2: s.rIn, v, el, d });
      else if (s.k === 'line') w.fx('line', s.x, s.y, { a: s.a, r: s.l, x2: s.w, v, el, d });
      else if (s.k === 'cone') w.fx('cone', s.x, s.y, { a: s.a, r: Math.min(500, s.r), x2: s.half, v, el, d });
    }
    if (tg.area) w.emit({ t: 'shake', amount: tg.kind === 'normal' ? 2 : 4 });
    return;
  }
  for (const s of tg.shapes) {
    if (n++ > 10) break;
    if (s.k === 'circle') w.fx('impact', s.x, s.y, { r: s.r, color });
    else if (s.k === 'ring') w.fx('impact', s.x, s.y, { r: Math.min(400, s.rOut), color });
    else if (s.k === 'line') w.fx('line', s.x, s.y, { a: s.a, r: s.l, x2: s.w, color });
    else if (s.k === 'cone') w.fx('cone', s.x, s.y, { a: s.a, r: Math.min(500, s.r), x2: s.half, color });
  }
  if (tg.area) w.emit({ t: 'shake', amount: tg.kind === 'normal' ? 2 : 4 });
  if (tg.team === 1 && tg.area) w.sfx('explosion', t.x, 0.35, 1.3);
}

export { DEG };
