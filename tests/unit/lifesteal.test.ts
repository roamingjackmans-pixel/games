// D325: lifesteal heals a share of max HP, scaled by the hit's multiplier, once an attack however many it hits.
import { describe, expect, it } from 'vitest';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { ENEMIES } from '../../src/data/enemies';
import { stepWorld } from '../../src/game/sim';
import { emptyInput, ACTION_BIT } from '../../src/engine/input/actions';
import { Rng } from '../../src/engine/rng';
import { makeItem } from '../../src/game/items/make';
import { WEAPONS } from '../../src/data/weapons';

describe('lifesteal (D325)', () => {
  it('a spin that hits two enemies heals once, by max HP × lifesteal × the swing multiplier', () => {
    const c = newCharacter('brute', 'Joe', 'p1', new Rng(1));
    c.equipment.main = makeItem('halberd', 'common', 1);
    c.twoHanded = false;
    const w = new World('LS', Room.empty());
    const p = spawnPlayer(w, c, 0, true, 400, 368);
    const foes: [number, number][] = [[480, 368], [320, 368]];
    const en = foes.map(([x, y]) => spawnEnemy(w, ENEMIES.shambler!, x, y, { tellS: 0 }));
    for (const e of en) e.hp!.hp = e.hp!.max = 1e9;
    const idx = WEAPONS.halberd!.combo.findIndex((s) => s.move === 'spin');
    const mult = WEAPONS.halberd!.combo[idx]!.mult;
    p.pl!.derived.lifesteal = 0.01;
    p.pl!.nextComboIdx = idx;
    p.pl!.comboResetAt = w.time + 10;
    p.hp!.hp = p.hp!.max * 0.3;
    const hp0 = p.hp!.hp;
    p.pl!.input = { ...emptyInput(), aimX: 900, aimY: 368, buttons: ACTION_BIT.attack, pressed: ACTION_BIT.attack };
    for (let i = 0; i < 70; i++) {
      stepWorld(w);
      p.pl!.input = { ...p.pl!.input, pressed: 0, buttons: 0 };
      p.x = 400;
      p.y = 368;
      en.forEach((e, k) => {
        e.x = foes[k]![0];
        e.y = foes[k]![1];
        e.vx = e.vy = 0;
      });
    }
    expect(en.every((e) => e.hp!.hp < 1e9)).toBe(true);
    // enemies hit back in that time, so allow for their hits: never two heals' worth
    const one = Math.max(1, Math.ceil(p.hp!.max * 0.01 * mult)); // D337: rounded up
    const gained = p.hp!.hp - hp0;
    expect(gained).toBeLessThanOrEqual(one + 1e-6);
    expect(p.pl!.lifestealAttacks?.length).toBe(1);
  });
});

describe('lifesteal rounds up (D337)', () => {
  it('a tiny share still heals 1 HP, and a fraction rounds up', async () => {
    const { hitEnemy, emptySpec } = await import('../../src/game/combat/damage');
    const { inCombat } = await import('./inCombat');
    const c = newCharacter('knight', 'Joe', 'p1', new Rng(1));
    const w = new World('LS2', Room.empty());
    const p = spawnPlayer(w, c, 0, true, 400, 368);
    const e = spawnEnemy(w, ENEMIES.shambler!, 450, 368, { tellS: 0 });
    e.hp!.hp = e.hp!.max = 1e9;
    e.en!.state = 'idle';
    inCombat(w);
    p.pl!.derived.lifesteal = 0.00001;
    p.hp!.hp = 10;
    const spec = emptySpec('player');
    spec.dmg.physical = 5;
    hitEnemy(w, p, e, spec, p.x, p.y);
    expect(p.hp!.hp).toBe(11);
  });
});
