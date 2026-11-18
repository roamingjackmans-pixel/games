// D440: a Hardcore character, chosen in the creator for good. Its campaign's enemies hit 50% harder and have twice
// the HP (Wave Rush is unchanged); beating the final boss that way earns an achievement; its name carries a skull (checked in the browser: the unit tests have no DOM).
import { describe, expect, it } from 'vitest';
import { World, type GameEvent } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { ENEMIES } from '../../src/data/enemies';
import { BOSSES } from '../../src/data/bosses';
import { HARDCORE_DMG_MULT, HARDCORE_HP_MULT, spawnEnemy } from '../../src/game/enemies/spawn';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { AchievementTracker } from '../../src/game/achievements';
import { ACHIEVEMENT_BY_ID } from '../../src/data/achievements';
import { MemoryStore } from '../../src/engine/settings';

const pair = (hardcore: boolean, def: Parameters<typeof spawnEnemy>[1] = ENEMIES.shambler!): { hp: number; dmg: number } => {
  const w = new World('HC', Room.empty());
  w.zone = 3;
  w.hardcore = hardcore;
  const e = spawnEnemy(w, def, 400, 300, { tellS: 0 });
  return { hp: e.hp!.max, dmg: e.en!.dmgMult };
};

describe('Hardcore (D440)', () => {
  it('enemies and bosses hit 50% harder and have twice the HP', () => {
    expect(HARDCORE_DMG_MULT).toBe(1.5);
    expect(HARDCORE_HP_MULT).toBe(2);
    for (const def of [ENEMIES.shambler!, BOSSES.the_caretaker!]) {
      const n = pair(false, def);
      const hc = pair(true, def);
      expect(hc.hp / n.hp, def.id).toBeCloseTo(2, 6);
      expect(hc.dmg / n.dmg, def.id).toBeCloseTo(1.5, 6);
    }
  });

  it('a Hardcore character’s campaign is Hardcore; its Wave Rush and a normal character’s campaign are not', () => {
    const hc = newCharacter('knight', 'Joe', 'p-hc', new Rng('HC'));
    hc.tutorialDone = true;
    hc.hardcore = true;
    expect(new GameSession(newSave(1, hc, 'HC')).w.hardcore).toBe(true);
    expect(new GameSession(newSave(1, hc, 'HC'), {}, { rushCycle: 0 }).w.hardcore).toBe(false);
    const plain = newCharacter('knight', 'Joe', 'p-n', new Rng('HC'));
    plain.tutorialDone = true;
    expect(new GameSession(newSave(2, plain, 'HC')).w.hardcore).toBe(false);
  });

  it('beating The Landlord in a Hardcore campaign, as a Hardcore character, earns No Deposit Returned', () => {
    const death = (id: number, defId: string): GameEvent => ({ t: 'death', id, x: 0, y: 0, isPlayer: false, defId });
    const run = (charHc: boolean, worldHc: boolean, rush = false): boolean => {
      const t = new AchievementTracker(new MemoryStore(), () => 1);
      const w = new World('ACH');
      const c = newCharacter('knight', 'Joe', 'p1', new Rng('ACH'));
      if (charHc) c.hardcore = true;
      w.zone = 8;
      w.hardcore = worldHc;
      w.rush = rush;
      t.begin();
      w.bossId = 40;
      t.frame(w, null, c, []);
      w.bossId = 0;
      t.frame(w, null, c, [death(40, 'the_landlord')]);
      return t.unlocked('hardcore_landlord');
    };
    expect(ACHIEVEMENT_BY_ID.hardcore_landlord).toBeDefined();
    expect(run(true, true)).toBe(true);
    expect(run(false, true)).toBe(false);
    expect(run(true, false)).toBe(false);
    expect(run(true, true, true)).toBe(false);
  });
});
