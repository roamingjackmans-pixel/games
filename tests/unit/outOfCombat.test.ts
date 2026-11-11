// D329: nothing hurts a player out of combat; a cleared room gets every downed player up; every player sees every
// downed player's countdown; big Bonk weapons need Bonk 18+; locked items and gems never sell.
import { describe, expect, it } from 'vitest';
import { inCombat } from './inCombat';
import { World } from '../../src/game/world';
import { Room } from '../../src/game/room';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { spawnPlayer } from '../../src/game/player/player';
import { Rng } from '../../src/engine/rng';
import { emptySpec, hitAlly, hitPlayer, rawDamage } from '../../src/game/combat/damage';
import { recordOf } from '../../src/game/net/snapshot';
import { makeItem } from '../../src/game/items/make';
import { makeGem } from '../../src/data/gems';
import { sellGem, sellItem } from '../../src/game/items/inventory';
import { itemRequirements, meetsRequirements } from '../../src/game/items/bases';
import { WEAPONS } from '../../src/data/weapons';
import { WEAPON_VARIANTS } from '../../src/data/weaponVariants';
import { weaponOf } from '../../src/game/items/weaponOf';
import { CLASSES } from '../../src/data/classes';

const hit = (): ReturnType<typeof emptySpec> => {
  const s = emptySpec('normal');
  s.dmg.physical = 50;
  return s;
};

describe('no damage out of combat (D329)', () => {
  it('an empty room: no hit, no tick, no friendly fire; with something to fight, all of them land', () => {
    const w = new World('OOC', Room.empty());
    const a = spawnPlayer(w, newCharacter('knight', 'A', 'a', new Rng(1)), 0, true, 400, 368);
    const b = spawnPlayer(w, newCharacter('knight', 'B', 'b', new Rng(2)), 1, false, 460, 368);
    w.friendlyFire = 1;
    const hp0 = a.hp!.hp;
    expect(hitPlayer(w, 0, a, hit(), 300, 368)).toBe('none');
    rawDamage(w, a, 40, 'fire', 0);
    expect(hitAlly(w, b, a, { ...hit(), kind: 'player' }, b.x, b.y)).toBe('none');
    expect(a.hp!.hp).toBe(hp0);
    inCombat(w);
    rawDamage(w, a, 40, 'fire', 0);
    expect(a.hp!.hp).toBe(hp0 - 40);
    expect(hitPlayer(w, 0, a, hit(), 300, 368)).not.toBe('none');
  });
});

describe('downed players (D329)', () => {
  const party = (): { s: GameSession; ally: ReturnType<GameSession['joinPlayer']>['entity'] } => {
    const ch = newCharacter('knight', 'Joe', 'p1', new Rng('d1'));
    ch.tutorialDone = true;
    const s = new GameSession(newSave(1, ch, 'DOWN-SEED'));
    s.start();
    const sp = s.joinPlayer(newCharacter('knight', 'Ann', 'p2', new Rng('d2')));
    return { s, ally: sp.entity };
  };

  it('a cleared room gets every downed player up', () => {
    const { s, ally } = party();
    s.downPlayer(ally!);
    expect(ally!.pl!.downed).toBe(true);
    s.clearRoom();
    expect(ally!.pl!.downed).toBe(false);
    expect(ally!.hp!.hp).toBeGreaterThan(0);
  });

  it("every player's snapshot carries a downed player's seconds left, and whether an ally's hit holds them", () => {
    const { s, ally } = party();
    s.downPlayer(ally!);
    const now = s.w.time;
    expect(recordOf(ally!, now).ghost).toBe(30);
    ally!.pl!.ghostPauseUntil = now + 2;
    expect(recordOf(ally!, now).ghost).toBe(30 + 128);
    expect(recordOf(s.localPlayer!, now).ghost).toBe(0);
  });
});

describe('big Bonk weapons (D329)', () => {
  it('the Greathammer, Greataxe, Colossal Sword and Hollow Maul need Bonk 18+, every scaling variant too', () => {
    for (const id of ['greathammer', 'greataxe', 'colossal_sword', 'hollow_maul']) {
      expect(WEAPONS[id]!.req.bonk, id).toBeGreaterThanOrEqual(18);
      for (const v of WEAPONS[id] ? (WEAPON_VARIANTS[id] ?? []) : []) {
        const it = makeItem(id, 'common', 1);
        it.variant = v.id;
        expect(weaponOf(it)!.req.bonk, `${id} ${v.id}`).toBeGreaterThanOrEqual(18);
      }
    }
  });

  it('the Brute must two-hand its starting Greathammer', () => {
    const r = itemRequirements(makeItem('greathammer', 'common', 1));
    const st = { bonk: CLASSES.brute.stats.bonk, slicey: 0, brain: 0, prayer: 0 };
    expect(meetsRequirements(r, st, false)).toBe(false);
    expect(meetsRequirements(r, st, true)).toBe(true);
  });
});

describe('locked things never sell (D329)', () => {
  it('a locked item, an item holding a locked gem, and a locked gem are refused', () => {
    const c = newCharacter('knight', 'Joe', 'p1', new Rng(3));
    const a = makeItem('longsword', 'rare', 1);
    a.locked = true;
    const b = makeItem('longsword', 'rare', 1, { sockets: 1, gems: [{ ...makeGem('brutal'), locked: true }] });
    c.bag.push(a, b);
    c.gems.push({ ...makeGem('tempo'), locked: true });
    const g0 = c.glowen;
    expect(sellItem(c, a.id).ok).toBe(false);
    expect(sellItem(c, b.id).ok).toBe(false);
    expect(sellGem(c, c.gems.length - 1).ok).toBe(false);
    expect(c.glowen).toBe(g0);
    delete a.locked;
    expect(sellItem(c, a.id).ok).toBe(true);
  });
});
