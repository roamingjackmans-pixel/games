// D229: the Bestiary: kills credit every standing player, unlocks come at 1 / 15 / 40 / 200 / 500 (a boss: seen,
// 1, 4, 8), and the last two change the damage both ways.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { installRules } from '../../src/game/rules';
import { emptySpec, hitEnemy, hitPlayer, rawDamage } from '../../src/game/combat/damage';
import { ENEMIES } from '../../src/data/enemies';
import { BOSSES } from '../../src/data/bosses';
import { addBestiaryKill, addBestiarySeen, bestiaryProgress, bestiaryZones, isBestiaryEnemy } from '../../src/data/bestiary';
import { applyCharOp, cloneChar, diffChar } from '../../src/game/net/charSync';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';

describe('the Bestiary (D229)', () => {
  it('lists every zone with its roster and boss; dummies and summon-only parts are not in it', () => {
    const zs = bestiaryZones();
    expect(zs.length).toBe(8);
    expect(zs.every((z) => z.enemies.length > 0 && z.boss)).toBe(true);
    expect(isBestiaryEnemy('shambler')).toBe(true);
    expect(isBestiaryEnemy('ice_mirror')).toBe(false);
  });

  it('unlocks a regular enemy at 1, 15, 40, 200 and 500 kills, showing only the next count', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const def = ENEMIES.shambler!;
    expect(bestiaryProgress(c, def)).toMatchObject({ icon: false, next: 1 });
    addBestiaryKill(c, 'shambler');
    expect(bestiaryProgress(c, def)).toMatchObject({ icon: true, lore: false, next: 15 });
    addBestiaryKill(c, 'shambler', 14);
    expect(bestiaryProgress(c, def)).toMatchObject({ lore: true, resists: false, next: 40 });
    addBestiaryKill(c, 'shambler', 25);
    expect(bestiaryProgress(c, def)).toMatchObject({ resists: true, dealMore: false, next: 200 });
    addBestiaryKill(c, 'shambler', 160);
    expect(bestiaryProgress(c, def)).toMatchObject({ dealMore: true, takeLess: false, next: 500 });
    addBestiaryKill(c, 'shambler', 300);
    expect(bestiaryProgress(c, def)).toMatchObject({ takeLess: true, next: null });
  });

  it('a boss: its picture on first sight, then lore at 1, resists at 4, both bonuses at 8', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const def = BOSSES.the_caretaker!;
    expect(bestiaryProgress(c, def).icon).toBe(false);
    addBestiarySeen(c, def.id);
    expect(bestiaryProgress(c, def)).toMatchObject({ icon: true, lore: false, next: 1 });
    addBestiaryKill(c, def.id);
    expect(bestiaryProgress(c, def)).toMatchObject({ lore: true, next: 4 });
    addBestiaryKill(c, def.id, 3);
    expect(bestiaryProgress(c, def)).toMatchObject({ resists: true, dealMore: false, next: 8 });
    addBestiaryKill(c, def.id, 4);
    expect(bestiaryProgress(c, def)).toMatchObject({ dealMore: true, takeLess: true, next: null });
  });

  it('a kill credits every standing player; the bonuses change the damage both ways', () => {
    const w = new World('BEST', Room.empty());
    installRules(w);
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const p = spawnPlayer(w, c, 0, true, 400, 368);
    const e = spawnEnemy(w, ENEMIES.shambler!, 470, 368, { tellS: 0 });
    for (let i = 0; i < 120; i++) stepWorld(w);
    e.hp!.invulnUntil = 0;
    e.en!.state = 'idle';
    rawDamage(w, e, e.hp!.max * 10, 'physical', p.id);
    expect(c.bestiary?.kills.shambler).toBe(1);
    // +25% dealt at 200, −25% taken at 500
    const hit = (): number => {
      const t = spawnEnemy(w, ENEMIES.shambler!, 470, 368, { tellS: 0 });
      t.en!.state = 'idle';
      t.hp!.invulnUntil = 0;
      const spec = emptySpec('player');
      spec.dmg.physical = 20;
      return hitEnemy(w, p, t, spec, p.x, p.y);
    };
    const d0 = hit();
    addBestiaryKill(c, 'shambler', 199);
    expect(hit() / d0).toBeCloseTo(1.25, 2);
    const taken = (): number => {
      const atk = spawnEnemy(w, ENEMIES.shambler!, 470, 368, { tellS: 0 });
      p.hp!.hp = p.hp!.max;
      p.hp!.invulnUntil = 0;
      const spec = emptySpec('normal');
      spec.dmg.physical = 40;
      spec.parryable = false;
      hitPlayer(w, atk.id, p, spec, atk.x, atk.y);
      return p.hp!.max - p.hp!.hp;
    };
    const t0 = taken();
    addBestiaryKill(c, 'shambler', 300);
    expect(taken() / t0).toBeCloseTo(0.75, 2);
  });

  it('travels to a co-op guest as ops', () => {
    const c = newCharacter('knight', 'Joe', 'p', new Rng(1));
    const base = cloneChar(c);
    addBestiaryKill(c, 'shambler', 3);
    addBestiarySeen(c, 'the_caretaker');
    const g = cloneChar(base);
    for (const o of diffChar(base, c)) applyCharOp(g, o);
    expect(g.bestiary).toEqual({ kills: { shambler: 3 }, seen: ['the_caretaker'] });
  });
});
