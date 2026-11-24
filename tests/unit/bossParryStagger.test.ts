// D454: a parried boss goes into its riposte stagger every time. It took two parries within 6 s, counted on the hit log
// every landed hit trims to its last second, so a parry staggered a boss or not by chance; when it did not, the boss
// swung again at once. A staggered boss also stays put rather than blinking out of its stun.
import { describe, expect, it } from 'vitest';
import { World, type Entity } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { enemyAttackSpec } from '../../src/game/enemies/attacks';
import { emptySpec, hitEnemy, hitPlayer, PARRY_RIPOSTE_S } from '../../src/game/combat/damage';
import { tickBossPassive } from '../../src/game/boss/passive';
import { stepWorld } from '../../src/game/sim';
import { Rng } from '../../src/engine/rng';
import { BOSSES } from '../../src/data/bosses';
import type { AttackDef, BossDef } from '../../src/game/types';

function fight(bossId = 'the_caretaker'): { w: World; p: Entity; boss: Entity } {
  const w = new World('PARRY-BOSS', Room.empty());
  const p = spawnPlayer(w, newCharacter('knight', 'Joe', 'p1', new Rng('parry')), 0, true, 560, 368);
  const def = BOSSES[bossId]!;
  const boss = spawnEnemy(w, def, 680, 368, { tellS: 0, zone: def.zone });
  w.refreshLists();
  w.god = true;
  p.facing = 0;
  return { w, p, boss };
}

/** Let the boss fight until it is winding up a parryable attack; that attack. */
function untilParryableSwing(w: World, boss: Entity): AttackDef {
  for (let i = 0; i < 60 * 30; i++) {
    stepWorld(w);
    const a = boss.en!.attack;
    if (a && a.phase === 'windup' && a.def.parryable && a.def.kind === 'normal') return a.def;
    // keep the player in front of it and out of the way
    w.players[0]!.x = boss.x - 120;
    w.players[0]!.y = boss.y;
    w.players[0]!.facing = 0;
  }
  throw new Error('the boss never swung anything parryable');
}

/** Parry that swing now; then watch the boss for `sec` seconds: did it start another attack, and was it staggered? */
function parryAndWatch(w: World, p: Entity, boss: Entity, atk: AttackDef, sec: number): { result: string; attackedAt: number | null; staggered: boolean } {
  p.pl!.parryUntil = w.time + 1;
  const result = hitPlayer(w, boss.id, p, enemyAttackSpec(boss, atk), boss.x, boss.y);
  const t0 = w.time;
  const staggered = boss.hp!.staggerUntil > w.time && boss.en!.state === 'stagger';
  let attackedAt: number | null = null;
  for (let i = 0; i < Math.round(sec * 60); i++) {
    stepWorld(w);
    if (boss.en!.attack && attackedAt === null) attackedAt = w.time - t0;
  }
  return { result, attackedAt, staggered };
}

describe('parrying a boss (D454)', () => {
  it('the first parry of a fight staggers the boss, and it does not swing again until the stagger ends', () => {
    const { w, p, boss } = fight();
    const atk = untilParryableSwing(w, boss);
    const r = parryAndWatch(w, p, boss, atk, PARRY_RIPOSTE_S - 0.1);
    expect(r.result).toBe('parried');
    expect(r.staggered).toBe(true);
    expect(r.attackedAt).toBeNull();
    expect(boss.hp!.riposteUntil).toBeGreaterThan(0);
    expect(p.pl!.riposteTarget).toBe(boss.id);
  });

  it('whether the player hit it just before or not makes no difference', () => {
    for (const hitFirst of [false, true]) {
      const { w, p, boss } = fight();
      const atk = untilParryableSwing(w, boss);
      if (hitFirst) {
        const jab = { ...emptySpec('player'), dmg: { physical: 1 } };
        hitEnemy(w, p, boss, jab, p.x, p.y);
        // the jab must not have interrupted the swing (bosses have a poise pool), or there is nothing to parry
        expect(boss.en!.attack?.def.id).toBe(atk.id);
      }
      const r = parryAndWatch(w, p, boss, atk, 1);
      expect(r.staggered, `hit first: ${hitFirst}`).toBe(true);
      expect(r.attackedAt, `hit first: ${hitFirst}`).toBeNull();
    }
  });

  it('every parryable boss swing staggers, parry after parry', () => {
    const { w, p, boss } = fight();
    for (let n = 0; n < 3; n++) {
      const atk = untilParryableSwing(w, boss);
      expect(parryAndWatch(w, p, boss, atk, 0.5).staggered, `parry ${n + 1}`).toBe(true);
    }
  });

  it('a staggered boss does not blink out of its stun', () => {
    const def = Object.values(BOSSES).find((b) => (b as BossDef).phases.some((ph) => ph.passive?.blink))!;
    expect(def).toBeDefined();
    const { w, boss } = fight(def.id);
    boss.en!.phase = def.phases.findIndex((ph) => ph.passive?.blink);
    boss.en!.attack = null;
    boss.hp!.staggerUntil = w.time + 3;
    const [x0, y0] = [boss.x, boss.y];
    for (let i = 0; i < 60 * 2.5; i++) {
      tickBossPassive(w, boss, 1 / 60);
      w.time += 1 / 60;
    }
    expect(boss.en!.extrasUsed.__blinkAt ?? 0).toBe(0);
    expect([boss.x, boss.y]).toEqual([x0, y0]);
  });
});
