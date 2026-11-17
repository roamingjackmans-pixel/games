// Projectiles: movement, homing, lobs, walls, hits, parry reflection, pierce, returning axes, impact effects.
import { PLAYER_DOT_DY, PLAYER_DOT_R } from '../player/player';
import { T } from '../room';
import { DEG, circleHit, dist, turnToward } from '../../engine/math';
import { addRevive, emptySpec, ffVictims, hitAlly, hitEnemy, hitPlayer } from '../combat/damage';
import { runEffects } from '../effects/run';
import type { DamageSpec, Entity, World } from '../world';
import type { HitArea } from '../net/acts';

/** Where a shot is when it lands, for the guest who decides a hit on its own body (D338). */
function circleArea(x: number, y: number, r: number): HitArea {
  return { s: { k: 'circle', x, y, r }, tau: 0 };
}

function specOf(e: Entity): DamageSpec {
  const pr = e.pr!;
  const s = emptySpec(pr.kind === 'player' ? 'player' : pr.kind === 'utility' ? 'normal' : pr.kind);
  s.dmg = pr.dmg;
  if (pr.falloffFrom) {
    // full damage to 250 px, then down to 70% at 750 px and beyond (D88)
    const d = Math.hypot(e.x - pr.falloffFrom.x, e.y - pr.falloffFrom.y);
    const k = pr.longShot ? (d > 250 ? 1.2 : 1) : d <= 250 ? 1 : Math.max(0.7, 1 - ((d - 250) / 500) * 0.3);
    if (k !== 1) s.dmg = Object.fromEntries(Object.entries(pr.dmg).map(([t, v]) => [t, (v ?? 0) * k]));
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
  if (pr.attackId !== undefined) s.attackId = pr.attackId;
  if (pr.lifestealScale !== undefined) s.lifestealScale = pr.lifestealScale;
  if (pr.lifestealPct !== undefined) s.lifestealPct = pr.lifestealPct;
  if (pr.label) s.label = pr.label;
  if (pr.volleyOnce) s.volleyOnce = true;
  return s;
}

/**
 * A ball of lightning that just hit something flies on (D375): to the nearest enemy within its jump range it has not hit
 * yet, else the nearest other standing player (enemies come first); straight at where that body is now, no homing, so a
 * player who steps aside lets it pass. Returns false when there is nothing left to jump to (the ball bursts).
 */
function chainOn(w: World, e: Entity, owner: Entity | null): boolean {
  const pr = e.pr!;
  const ch = pr.chain;
  if (!ch || ch.left <= 0) return false;
  const nearest = (list: Entity[]): Entity | null => {
    let best: Entity | null = null;
    let bd = ch.r;
    for (const t of list) {
      if (pr.hit.has(t.id) || t.removed || t.hp?.dead || t.en?.state === 'ceiling') continue;
      const d = dist(t.x, t.y, e.x, e.y);
      if (d < bd) {
        bd = d;
        best = t;
      }
    }
    return best;
  };
  const next = nearest(w.livingEnemies()) ?? nearest(ffVictims(w, owner));
  if (!next) return false;
  ch.left--;
  const k = 1 - ch.falloff;
  pr.dmg = Object.fromEntries(Object.entries(pr.dmg).map(([t, v]) => [t, (v ?? 0) * k]));
  const a = Math.atan2(next.y - e.y, next.x - e.x);
  e.vx = Math.cos(a) * pr.speed;
  e.vy = Math.sin(a) * pr.speed;
  e.facing = a;
  // long enough to reach it and a little past, then it fizzles
  pr.until = w.time + (dist(next.x, next.y, e.x, e.y) + 80) / pr.speed;
  w.fx('projHit', e.x, e.y, { color: pr.color });
  w.sfx('shock', e.x, 0.5);
  return true;
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
      powerMult: pr.impactCtx?.powerMult ?? 1,
      ...(pr.impactCtx?.school ? { school: pr.impactCtx.school } : {}),
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
          for (const p of w.livingPlayers()) if (circleHit(e.x, e.y, e.radius + 14, p.x, p.y + PLAYER_DOT_DY, PLAYER_DOT_R)) hitPlayer(w, pr.ownerId, p, specOf(e), e.x, e.y, undefined, circleArea(e.x, e.y, e.radius + 14));
        } else {
          const owner = w.get(pr.ownerId) ?? null;
          for (const en of w.livingEnemies()) if (circleHit(e.x, e.y, e.radius + 14, en.x, en.y, en.radius)) hitEnemy(w, owner, en, specOf(e), e.x, e.y);
          for (const a of ffVictims(w, owner)) if (circleHit(e.x, e.y, e.radius + 14, a.x, a.y + PLAYER_DOT_DY, PLAYER_DOT_R)) hitAlly(w, owner, a, specOf(e), e.x, e.y, undefined, circleArea(e.x, e.y, e.radius + 14));
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
    // a player's shot is tested at its front edge (D424), so a big spell orb stops as it meets the wall, not once
    // its middle is inside it
    const lead = pr.team === 0 ? Math.min(e.radius * 0.5, 16) / (Math.hypot(e.vx, e.vy) || 1) : 0;
    const tx = Math.floor((e.x + e.vx * lead) / 32);
    const ty = Math.floor((e.y + e.vy * lead - 16) / 32);
    // walls and pillars stop every shot; obstacles (props, crates, vases, trees) stop every shot but a player's that
    // was loosed piercing (D180, D424)
    if (!pr.returning && (w.room.blocksProjectile(tx, ty) || (w.room.get(tx, ty) === T.Prop && !(pr.team === 0 && pr.throughProps)))) {
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
        // D384: a player's hitbox is the circle at its feet
        if (!circleHit(e.x, e.y, e.radius, p.x, p.y + PLAYER_DOT_DY, PLAYER_DOT_R)) continue;
        pr.hit.add(p.id);
        // a projectile with an impact blast deals its damage through the blast only
        if (pr.onImpact) {
          impact(w, e);
          break;
        }
        const res = hitPlayer(w, pr.ownerId, p, specOf(e), e.x - e.vx * 0.05, e.y - e.vy * 0.05, e, circleArea(e.x, e.y, e.radius));
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
        // another arrow of this volley already struck it (D264): this one breaks on it (or flies through) for nothing
        if (pr.volleyHit?.has(en.id)) {
          if (pr.pierce > 0) continue;
          impact(w, e);
          break;
        }
        pr.volleyHit?.add(en.id);
        hitEnemy(w, owner, en, specOf(e), e.x - e.vx * 0.05, e.y - e.vy * 0.05, { light: !pr.isSpell && !pr.isSkill });
        if (pr.chain) {
          if (!chainOn(w, e, owner)) impact(w, e);
          break;
        }
        if (pr.pierce > 0) {
          pr.pierce--;
          continue;
        }
        if (!pr.returns) {
          impact(w, e);
          break;
        }
      }
      // friendly fire (D115): a player's shot hits standing allies in its path like it hits enemies. A spell's shot
      // stops on any standing ally as it stops on an enemy (D397), hurting them only as friendly fire does
      if (!e.removed && owner) {
        const allies = pr.isSpell && owner.pl ? w.livingPlayers().filter((p) => p !== owner) : ffVictims(w, owner);
        for (const a of allies) {
          if (pr.hit.has(a.id)) continue;
          if (!circleHit(e.x, e.y, e.radius, a.x, a.y + PLAYER_DOT_DY, PLAYER_DOT_R)) continue;
          pr.hit.add(a.id);
          if (pr.onImpact) {
            impact(w, e);
            break;
          }
          if (pr.volleyHit?.has(a.id)) {
            if (pr.pierce > 0) continue;
            impact(w, e);
            break;
          }
          const res = hitAlly(w, owner, a, specOf(e), e.x - e.vx * 0.05, e.y - e.vy * 0.05, e, circleArea(e.x, e.y, e.radius));
          // a co-op guest's body decides the hit on its own screen (D338): the shot stops unless it is mid-dodge here
          const puppetTook = res === 'dodged' && a.pl?.net === 'puppet' && a.pl.state !== 'dodge';
          if (res === 'dodged' && !puppetTook) continue;
          if (res === 'none' && !pr.isSpell) continue;
          if (pr.chain) {
            if (!chainOn(w, e, owner)) impact(w, e);
            break;
          }
          pr.volleyHit?.add(a.id);
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
