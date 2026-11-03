import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { startEnemyAttack } from '../../src/game/enemies/attacks';
import { emptySpec, hitEnemy } from '../../src/game/combat/damage';
import { poiseForSize } from '../../src/game/combat/formulas';
import { ENEMIES } from '../../src/data/enemies';
import { BOSSES } from '../../src/data/bosses';
import { WEAPONS } from '../../src/data/weapons';
import type { Entity } from '../../src/game/world';

function world(): GameSession {
  const c = newCharacter('knight', 'Joe', 'p1', new Rng('poise'));
  c.tutorialDone = true;
  const s = new GameSession(newSave(1, c, 'POISE'));
  s.start();
  return s;
}

/** A fresh enemy halfway through winding up its first non-utility attack at the player. */
function attacking(s: GameSession, id: string, elite = false): Entity {
  const e = spawnEnemy(s.w, ENEMIES[id]!, 640, 300, { tellS: 0, ...(elite ? { elite: 'armored' as const } : {}) });
  e.en!.state = 'alert';
  const atk = e.en!.phaseAttacks.find((a) => a.kind !== 'utility' && !a.trigger)!;
  startEnemyAttack(s.w, e, atk, s.localPlayer!);
  return e;
}

function hitWith(s: GameSession, e: Entity, weapon: string): void {
  const spec = emptySpec('player');
  spec.dmg.physical = 1;
  spec.poiseDmg = WEAPONS[weapon]!.poiseDmg;
  const p = s.localPlayer!;
  p.pl!.derived.poiseDmgMult = 1;
  hitEnemy(s.w, p, e, spec, p.x, p.y);
}

const staggered = (e: Entity): boolean => e.en!.attack === null && e.en!.state === 'stagger';

describe('enemy poise (D78)', () => {
  it('grows with body size', () => {
    expect(poiseForSize(9)).toBeLessThan(poiseForSize(17));
    expect(poiseForSize(17)).toBeLessThan(poiseForSize(26));
    expect(poiseForSize(26)).toBeLessThan(poiseForSize(30));
    const s = world();
    const rat = spawnEnemy(s.w, ENEMIES.crypt_rat_swarm!, 300, 300, { tellS: 0 });
    const shambler = spawnEnemy(s.w, ENEMIES.shambler!, 400, 300, { tellS: 0 });
    const brute = spawnEnemy(s.w, ENEMIES.gravedigger!, 500, 300, { tellS: 0 });
    const elite = spawnEnemy(s.w, ENEMIES.shambler!, 600, 300, { tellS: 0, elite: 'armored' });
    expect(rat.hp!.poiseMax).toBeLessThan(shambler.hp!.poiseMax);
    expect(shambler.hp!.poiseMax).toBeLessThan(brute.hp!.poiseMax);
    expect(elite.hp!.poiseMax).toBeGreaterThan(shambler.hp!.poiseMax);
  });

  it('a big weapon staggers a fighter out of its attack; a small one does not, however many hits', () => {
    const s = world();
    const a = attacking(s, 'shambler');
    for (let i = 0; i < 10; i++) hitWith(s, a, 'twin_daggers');
    expect(staggered(a)).toBe(false);
    expect(a.en!.attack).not.toBeNull();
    const b = attacking(s, 'shambler');
    hitWith(s, b, 'greathammer');
    expect(staggered(b)).toBe(true);
  });

  it('bigger enemies need bigger weapons: a longsword staggers a skeleton but not a brute', () => {
    const s = world();
    const skel = attacking(s, 'shambler');
    hitWith(s, skel, 'longsword');
    expect(staggered(skel)).toBe(true);
    const brute = attacking(s, 'bellows_brute');
    hitWith(s, brute, 'longsword');
    expect(staggered(brute)).toBe(false);
    const brute2 = attacking(s, 'bellows_brute');
    hitWith(s, brute2, 'greathammer');
    expect(staggered(brute2)).toBe(true);
  });

  it('daggers still stagger the smallest things', () => {
    const s = world();
    const rat = attacking(s, 'crypt_rat_swarm');
    hitWith(s, rat, 'twin_daggers');
    expect(staggered(rat)).toBe(true);
  });

  it('bosses keep a poise pool that hits wear down', () => {
    const s = world();
    const def = BOSSES.the_caretaker!;
    const b = spawnEnemy(s.w, def, 640, 300, { tellS: 0 });
    b.en!.state = 'alert';
    const full = b.hp!.poise;
    hitWith(s, b, 'longsword');
    expect(b.hp!.poise).toBeLessThan(full);
  });
});

describe('hyper armor doubles poise mid-swing (D78)', () => {
  it('a greathammer does not stagger a gravedigger mid-swing; a charged blow twice as heavy does', () => {
    const s = world();
    const g = attacking(s, 'gravedigger');
    expect(g.en!.def.hyperArmor || g.en!.attack?.def.hyperArmor).toBeTruthy();
    hitWith(s, g, 'greathammer');
    expect(staggered(g)).toBe(false);
    const g2 = attacking(s, 'gravedigger');
    const spec = emptySpec('player');
    spec.dmg.physical = 1;
    spec.poiseDmg = WEAPONS.greathammer!.poiseDmg * 2;
    hitEnemy(s.w, s.localPlayer!, g2, spec, 640, 400);
    expect(staggered(g2)).toBe(true);
  });
});

describe('stagger grace (D103)', () => {
  it('a staggered enemy cannot be poise-staggered again until 2 s after it recovers', async () => {
    const { STAGGER_GRACE_S } = await import('../../src/game/combat/damage');
    const { startEnemyAttack: start } = await import('../../src/game/enemies/attacks');
    const s = world();
    const a = attacking(s, 'shambler');
    hitWith(s, a, 'greathammer');
    expect(staggered(a)).toBe(true);
    const graceEnds = a.en!.staggerImmuneUntil!;
    expect(graceEnds - s.w.time).toBeCloseTo(0.6 + STAGGER_GRACE_S, 5);
    // right after recovering it attacks again: the same heavy hit no longer staggers it
    const atk = a.en!.phaseAttacks.find((x) => x.kind !== 'utility' && !x.trigger)!;
    a.en!.state = 'alert';
    start(s.w, a, atk, s.localPlayer!);
    hitWith(s, a, 'greathammer');
    expect(staggered(a)).toBe(false);
    // once the grace is over, it staggers again
    s.w.time = graceEnds + 0.01;
    hitWith(s, a, 'greathammer');
    expect(staggered(a)).toBe(true);
  });
});

describe('elite poise (D105)', () => {
  it('an Elite has 50% more poise than its bigger body alone gives', async () => {
    const { ELITE_POISE_MULT } = await import('../../src/game/combat/formulas');
    const s = world();
    const plain = spawnEnemy(s.w, ENEMIES.shambler!, 300, 300, { tellS: 0 });
    const elite = spawnEnemy(s.w, ENEMIES.shambler!, 500, 300, { tellS: 0, elite: 'armored' });
    expect(ELITE_POISE_MULT).toBe(1.5);
    expect(elite.hp!.poiseMax).toBeCloseTo(poiseForSize(plain.radius * 1.3) * 1.5, 5);
  });
});
