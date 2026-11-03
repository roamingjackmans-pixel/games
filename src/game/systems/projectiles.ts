// Projectiles: movement, homing, lobs, walls, hits, parry reflection, pierce, returning axes, impact effects.
import { DEG, circleHit, dist, turnToward } from '../../engine/math';
import { addRevive, emptySpec, ffVictims, hitAlly, hitEnemy, hitPlayer } from '../combat/damage';
import { runEffects } from '../effects/run';
import type { DamageSpec, Entity, World } from '../world';

function specOf(e: Entity): DamageSpec {
  const pr = e.pr!;
  const s = emptySpec(pr.kind === 'player' ? 'player' : pr.kind === 'utility' ? 'normal' : pr.kind);
  s.dmg = pr.dmg;
  if (pr.falloffFrom) {
    // full damage to 250 px, then down to 70% at 750 px and beyond (D88)
    const d = Math.hypot(e.x - pr.falloffFrom.x, e.y - pr.falloffFrom.y);
    const k = d <= 250 ? 1 : Math.max(0.7, 1 - ((d - 250) / 500) * 0.3);
    if (k < 1) s.dmg = Object.fromEntries(Object.entries(pr.dmg).map(([t, v]) => [t, (v ?? 0) * k]));
  }
  s.status = pr.status;
  s.control = pr.control;
  s.poiseDmg = pr.poiseDmg;
  s.knockback = pr.knockback;
  s.parryable = pr.parryable;
  s.isSpell = pr.isSpell;
  s.isSkill = pr.isSkill;
  s.reviveValue = pr.reviveValue;
  s.sourceTag = pr.sourceTag;
  return s;
}

function impact(w: World, e: Entity): void {
  const pr = e.pr!;
  if (pr.onImpact) {
    const owner = w.get(pr.ownerId);
    runEffects(w, [pr.onImpact], {
      sourceId: pr.ownerId,
      team: pr.team,
      x: e.x,
      y: e.y,
      aimX: e.x,
      aimY: e.y,
      targetId: 0,
      powerMult: 1,
      isSpell: pr.isSpell,
      isSkill: pr.isSkill,
      baseDamage: owner?.en ? 18 * owner.en.dmgMult : Object.values(pr.dmg).reduce((a, b) => a + (b ?? 0), 0),
      windupS: 0,
      tag: `proj:${pr.sourceTag}`,
    });
  }
  w.fx('projHit', e.x, e.y, { color: pr.color });
  w.remove(e);
}

/** Guardian Wall / decoy walls block enemy projectiles. */
function blockedByWall(w: World, e: Entity): boolean {
  if (e.pr!.team !== 1) return false;
  for (const wl of w.entities.values()) {
    if (wl.type !== 'wall' || wl.removed || !wl.wl?.blocksProjectiles) continue;
    const s = wl.wl;
    const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1) || 1;
    const t = Math.max(0, Math.min(1, ((e.x - s.x1) * (s.x2 - s.x1) + (e.y - s.y1) * (s.y2 - s.y1)) / (len * len)));
    const cx = s.x1 + (s.x2 - s.x1) * t;
    const cy = s.y1 + (s.y2 - s.y1) * t;
    if (dist(cx, cy, e.x, e.y) <= s.w / 2 + e.radius) return true;
  }
  return false;
}

/** Ice mirrors (Saint Aurelia) reflect player projectiles back. */
function reflectedByMirror(w: World, e: Entity): Entity | null {
  if (e.pr!.team !== 0) return null;
  for (const m of w.enemies) {
    if (m.hp?.dead || !m.en?.def.traits?.reflectsProjectiles) continue;
    if (circleHit(m.x, m.y, m.radius, e.x, e.y, e.radius)) return m;
  }
  return null;
}

export function updateProjectiles(w: World, dt: number): void {
  const now = w.time;
  for (const e of w.entities.values()) {
    if (e.type !== 'projectile' || e.removed) continue;
    const pr = e.pr!;
    if (w.frozen(e)) continue;
    if (pr.lob) {
      const l = pr.lob;
      l.t += dt;
      const k = Math.min(1, l.t / l.dur);
      e.x = l.fromX + (l.toX - l.fromX) * k;
      e.y = l.fromY + (l.toY - l.fromY) * k;
      e.anim.scale = 1 + Math.sin(k * Math.PI) * 0.8;
      if (k >= 1) {
        // lobbed projectiles land: hit whatever is under them (unless an impact blast does it), then the blast
        if (pr.onImpact) {
          /* the blast below deals the damage */
        } else if (pr.team === 1) {
          for (const p of w.livingPlayers()) if (circleHit(e.x, e.y, e.radius + 14, p.x, p.y, p.radius)) hitPlayer(w, pr.ownerId, p, specOf(e), e.x, e.y);
        } else {
          const owner = w.get(pr.ownerId) ?? null;
          for (const en of w.livingEnemies()) if (circleHit(e.x, e.y, e.radius + 14, en.x, en.y, en.radius)) hitEnemy(w, owner, en, specOf(e), e.x, e.y);
          for (const a of ffVictims(w, owner)) if (circleHit(e.x, e.y, e.radius + 14, a.x, a.y, a.radius)) hitAlly(w, owner, a, specOf(e), e.x, e.y);
        }
        impact(w, e);
      }
      continue;
    }
    // homing toward the target
    if (pr.homing > 0) {
      const t = w.get(pr.targetId);
      if (t && !t.removed && !(t.pl?.downed)) {
        const a = Math.atan2(e.vy, e.vx);
        const want = Math.atan2(t.y - e.y, t.x - e.x);
        const na = turnToward(a, want, pr.homing * dt);
        const sp = Math.hypot(e.vx, e.vy);
        e.vx = Math.cos(na) * sp;
        e.vy = Math.sin(na) * sp;
      }
    }
    if (pr.curve) {
      const a = Math.atan2(e.vy, e.vx) + pr.curve * dt;
      const sp = Math.hypot(e.vx, e.vy);
      e.vx = Math.cos(a) * sp;
      e.vy = Math.sin(a) * sp;
    }
    if (pr.returning) {
      const o = w.get(pr.ownerId);
      if (!o) {
        w.remove(e);
        continue;
      }
      const a = Math.atan2(o.y - e.y, o.x - e.x);
      const sp = Math.hypot(e.vx, e.vy);
      e.vx = Math.cos(a) * sp;
      e.vy = Math.sin(a) * sp;
      if (dist(o.x, o.y, e.x, e.y) < 24) {
        w.remove(e);
        continue;
      }
    }
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.facing = Math.atan2(e.vy, e.vx);
    if (now >= pr.until) {
      if (pr.returns && !pr.returning) {
        pr.returning = true;
        pr.hit.clear();
        pr.until = now + 3;
      } else {
        impact(w, e);
        continue;
      }
    }
    if (!pr.returning && w.room.blocksProjectile(Math.floor(e.x / 32), Math.floor((e.y - 16) / 32))) {
      if (pr.returns) {
        pr.returning = true;
        pr.hit.clear();
        continue;
      }
      impact(w, e);
      continue;
    }
    if (blockedByWall(w, e)) {
      w.fx('block', e.x, e.y);
      w.remove(e);
      continue;
    }
    const mirror = reflectedByMirror(w, e);
    if (mirror) {
      e.vx = -e.vx;
      e.vy = -e.vy;
      pr.team = 1;
      pr.kind = 'normal';
      pr.ownerId = mirror.id;
      pr.hit.clear();
      w.sfx('parry', e.x, 0.5);
      continue;
    }
    if (pr.team === 1) {
      for (const p of w.livingPlayers()) {
        if (pr.hit.has(p.id)) continue;
        if (!circleHit(e.x, e.y, e.radius, p.x, p.y, p.radius)) continue;
        pr.hit.add(p.id);
        // a projectile with an impact blast deals its damage through the blast only
        if (pr.onImpact) {
          impact(w, e);
          break;
        }
        const res = hitPlayer(w, pr.ownerId, p, specOf(e), e.x - e.vx * 0.05, e.y - e.vy * 0.05, e);
        if (res === 'parried') break; // reflected: keeps flying as a player projectile
        if (res === 'dodged') continue;
        impact(w, e);
        break;
      }
      // decoys absorb projectiles
      for (const d of w.entities.values()) {
        if (d.type !== 'decoy' || d.removed) continue;
        if (circleHit(e.x, e.y, e.radius, d.x, d.y, d.radius)) {
          w.remove(d);
          impact(w, e);
          break;
        }
      }
    } else {
      const owner = w.get(pr.ownerId) ?? null;
      for (const en of w.enemies) {
        if (en.hp?.dead || pr.hit.has(en.id) || en.en?.state === 'ceiling') continue;
        if (!circleHit(e.x, e.y, e.radius, en.x, en.y, en.radius)) continue;
        pr.hit.add(en.id);
        if (pr.onImpact) {
          impact(w, e);
          break;
        }
        hitEnemy(w, owner, en, specOf(e), e.x - e.vx * 0.05, e.y - e.vy * 0.05, { light: !pr.isSpell && !pr.isSkill });
        if (pr.pierce > 0) {
          pr.pierce--;
          continue;
        }
        if (!pr.returns) {
          impact(w, e);
          break;
        }
      }
      // friendly fire (D114): a player's shot hits standing allies in its path like it hits enemies
      if (!e.removed && owner) {
        for (const a of ffVictims(w, owner)) {
          if (pr.hit.has(a.id)) continue;
          if (!circleHit(e.x, e.y, e.radius, a.x, a.y, a.radius)) continue;
          pr.hit.add(a.id);
          if (pr.onImpact) {
            impact(w, e);
            break;
          }
          const res = hitAlly(w, owner, a, specOf(e), e.x - e.vx * 0.05, e.y - e.vy * 0.05, e);
          if (res === 'dodged' || res === 'none') continue;
          if (pr.pierce > 0) {
            pr.pierce--;
            continue;
          }
          if (!pr.returns) {
            impact(w, e);
            break;
          }
        }
      }
      if (!e.removed && owner) {
        for (const g of w.players) {
          if (g === owner || !g.pl!.downed || pr.hit.has(g.id)) continue;
          if (!circleHit(e.x, e.y, e.radius, g.x, g.y, g.radius)) continue;
          pr.hit.add(g.id);
          addRevive(w, g, owner, pr.reviveValue);
          impact(w, e);
          break;
        }
      }
    }
  }
}

export { DEG };
