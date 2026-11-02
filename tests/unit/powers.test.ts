import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { generateItem } from '../../src/game/items/generate';
import { refreshDerived } from '../../src/game/player/player';
import { emptySpec, hitEnemy, hitPlayer } from '../../src/game/combat/damage';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { ENEMIES } from '../../src/data/enemies';
import { flaskCap } from '../../src/game/combat/formulas';
import type { Item } from '../../src/game/types';

function session(): GameSession {
  const c = newCharacter('knight', 'Joe', 'p1', new Rng('pw'));
  c.tutorialDone = true;
  const s = new GameSession(newSave(1, c, 'POWERS'));
  s.start();
  return s;
}
function legendary(baseId: string, power: string): Item {
  const it = generateItem(new Rng(`${baseId}${power}`), { source: 'boss', ilvl: 5, zone: 5, rarity: 'legendary', baseId });
  it.legendaryPower = power;
  return it;
}

describe('legendary powers with no other home', () => {
  it("Joe's Lucky Socks: +1 Thermos charge, never above 5, filled by the first rest", () => {
    const s = session();
    const p = s.localPlayer!;
    const c = p.pl!.char;
    c.equipment.legs = legendary('sextons_mail_legs', 'lucky_socks');
    refreshDerived(p);
    expect(flaskCap(c)).toBe(2);
    c.flaskCur = 0;
    const b = [...s.w.entities.values()].find((e) => e.it?.kind === 'bonfire')!;
    s.interact(p, b);
    expect(c.flaskCur).toBe(2);
    c.flaskMax = 5;
    expect(flaskCap(c)).toBe(5);
  });

  it('Warden: a blocked hit heals allies within 120 px by 1% of their max HP', () => {
    const s = session();
    const p = s.localPlayer!;
    const ally = s.joinPlayer(newCharacter('cleric', 'Ally', 'p2', new Rng('a'))).entity!;
    ally.x = p.x + 60;
    ally.y = p.y;
    ally.hp!.hp = ally.hp!.max * 0.5;
    p.pl!.char.equipment.off = legendary('kite_shield', 'warden');
    p.pl!.char.twoHanded = false;
    refreshDerived(p);
    const foe = spawnEnemy(s.w, ENEMIES.shambler!, p.x - 80, p.y, { tellS: 0 });
    p.facing = Math.PI;
    p.pl!.blocking = true;
    const spec = emptySpec('normal');
    spec.dmg.physical = 10;
    const before = ally.hp!.hp;
    hitPlayer(s.w, foe.id, p, spec, foe.x, foe.y);
    expect(ally.hp!.hp).toBeCloseTo(before + ally.hp!.max * 0.01, 3);
  });

  it('Thunderclap: every 4th hit chains Lightning to 3 more enemies', () => {
    const s = session();
    const p = s.localPlayer!;
    p.pl!.char.equipment.main = legendary('longsword', 'thunderclap');
    refreshDerived(p);
    const target = spawnEnemy(s.w, ENEMIES.shambler!, 600, 300, { tellS: 0 });
    const others = [0, 1, 2].map((i) => spawnEnemy(s.w, ENEMIES.shambler!, 600 + 60 * (i + 1), 300, { tellS: 0 }));
    for (const e of [target, ...others]) e.en!.state = 'alert';
    const full = others.map((o) => o.hp!.hp);
    const spec = emptySpec('player');
    spec.dmg.physical = 5;
    for (let i = 0; i < 3; i++) hitEnemy(s.w, p, target, spec, p.x, p.y);
    expect(others.map((o) => o.hp!.hp)).toEqual(full);
    hitEnemy(s.w, p, target, spec, p.x, p.y);
    others.forEach((o, i) => expect(o.hp!.hp, `enemy ${i}`).toBeLessThan(full[i]!));
  });
});
