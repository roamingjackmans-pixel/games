// D299: New Game+ loot beats the playthrough before; D300: Foreclosure and Arcane Bolt cut; D301: NG+ boss HP sized
// to a fight length.
import { describe, expect, it } from 'vitest';
import { itemLevelFor, reqAtIlvl } from '../../src/game/combat/formulas';
import { NG_BOSS_HP, ngBossHpMult } from '../../src/data/roles';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { THE_CARETAKER } from '../../src/data/bosses/crypt';
import { SPELLS } from '../../src/data/spells';
import { THE_LANDLORD } from '../../src/data/bosses/abyss';

describe('New Game+ loot (D299)', () => {
  it("every zone of a playthrough drops a higher item level than the last playthrough's zone 8", () => {
    for (let c = 1; c <= 5; c++) for (let z = 1; z <= 8; z++) expect(itemLevelFor(z, c)).toBeGreaterThan(itemLevelFor(8, c - 1));
    expect(itemLevelFor(1, 1)).toBe(9);
    expect(itemLevelFor(8, 2)).toBe(24);
  });
  it('requirements climb 2 a level to level 8, then 0.5, and never past 90', () => {
    expect(reqAtIlvl(10, 1, true)).toBe(10);
    expect(reqAtIlvl(10, 8, true)).toBe(24);
    expect(reqAtIlvl(10, 16, true)).toBe(28);
    expect(reqAtIlvl(10, 24, true)).toBe(32);
    expect(reqAtIlvl(60, 400, true)).toBe(90);
    expect(reqAtIlvl(10, 24, false)).toBe(10);
  });
});

describe('Foreclosure and Arcane Bolt (D300)', () => {
  it('Foreclosure hits 30% less (2.1, was 3.0)', () => {
    const atk = THE_LANDLORD!.phases.flatMap((p) => p.attacks).find((a) => a.id === 'landlord_foreclosure');
    expect(atk?.dmgMult).toBeCloseTo(2.1, 5);
  });
  it('Arcane Bolt deals 19.2 (was 24)', () => {
    const ops = JSON.stringify(SPELLS.arcane_bolt);
    expect(ops).toContain('19.2');
  });
});

describe('New Game+ boss HP (D301)', () => {
  it('the first playthrough is untouched; NG+1 and NG+2 columns apply; later cycles use NG+2', () => {
    expect(ngBossHpMult(1, 0)).toBe(1);
    expect(ngBossHpMult(8, 1)).toBe(NG_BOSS_HP[1][8]);
    expect(ngBossHpMult(3, 2)).toBe(NG_BOSS_HP[2][3]);
    expect(ngBossHpMult(3, 5)).toBe(NG_BOSS_HP[2][3]);
  });
  it("a boss spawns with its own zone's multiplier", () => {
    const w = new World('NGHP', Room.empty());
    // the same boss in the same room, labelled as zone 3's boss: only the D301 multiplier differs
    const a = spawnEnemy(w, THE_CARETAKER, 300, 300, { zone: 1, cycle: 1, players: 1 });
    const b = spawnEnemy(w, { ...THE_CARETAKER, zone: 3 }, 300, 300, { zone: 1, cycle: 1, players: 1 });
    expect(b.hp!.max / a.hp!.max).toBeCloseTo(NG_BOSS_HP[1][3]! / NG_BOSS_HP[1][1]!, 5);
    const first = spawnEnemy(w, { ...THE_CARETAKER, zone: 3 }, 300, 300, { zone: 1, cycle: 0, players: 1 });
    const first1 = spawnEnemy(w, THE_CARETAKER, 300, 300, { zone: 1, cycle: 0, players: 1 });
    expect(first.hp!.max).toBeCloseTo(first1.hp!.max, 5);
  });
});
