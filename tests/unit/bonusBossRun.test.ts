// New Game+ bonus bosses over a whole playthrough (D394): a beaten one stays beaten through rests and deaths, and no
// one boss turns up in more than two zones of a playthrough.
import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { generateZone } from '../../src/game/procgen/zone';
import { BONUS_BOSS_MAX_PER_RUN, bonusBossFor, bonusBossPicks, bonusBossPool } from '../../src/game/procgen/bonusBoss';
import { checkDeath } from '../../src/game/combat/damage';

function ngSession(seed: string, zone = 1, cycle = 1): GameSession {
  const c = newCharacter('knight', 'Joe', 'p', new Rng('bb'));
  c.cycle = cycle;
  c.tutorialDone = true;
  c.level = 120;
  const save = newSave(1, c, seed);
  save.world.zone = zone;
  const s = new GameSession(save);
  s.start();
  return s;
}

function beatBonus(s: GameSession): string {
  const bb = bonusBossFor(s.layout)!;
  const node = s.layout.byId[bb.roomId]!;
  s.enterRoom(bb.roomId, node.doors[0]!);
  const me = s.w.players[0]!;
  me.x = 640;
  me.y = 368;
  s.tick(0.016);
  const boss = s.w.get(s.w.bossId)!;
  expect(boss.en!.bonusBoss).toBe(true);
  boss.hp!.hp = 0;
  checkDeath(s.w, boss, me.id);
  s.tick(0.016);
  expect(s.roomPhase).toBe('cleared');
  return bb.roomId;
}

describe('a beaten bonus boss stays beaten (D394)', () => {
  it('is not there after a rest at a bonfire', () => {
    const s = ngSession('STAYDOWN');
    const room = beatBonus(s);
    s.enterRoom(s.layout.startId, 'bonfire');
    s.rest(s.w.players[0]!, s.layout.startId);
    expect(s.save.world.roomsCleared).not.toContain(room);
    s.enterRoom(room, s.layout.byId[room]!.doors[0]!);
    expect(s.roomPhase).toBe('peace');
    s.tick(0.5);
    expect(s.w.enemies.some((e) => e.en?.bonusBoss)).toBe(false);
  });

  it('is not there after dying either, and does come back in the next playthrough', () => {
    const s = ngSession('STAYDOWN2');
    const room = beatBonus(s);
    s.respawn();
    s.enterRoom(room, s.layout.byId[room]!.doors[0]!);
    expect(s.roomPhase).toBe('peace');
    // the record is per playthrough: NG+2's bonus fight in this zone is a fight again
    const s2 = ngSession('STAYDOWN2', 1, 2);
    s2.save.world.bonusBeaten = [...(s.save.world.bonusBeaten ?? [])];
    const bb2 = bonusBossFor(s2.layout)!;
    s2.enterRoom(bb2.roomId, s2.layout.byId[bb2.roomId]!.doors[0]!);
    expect(s2.roomPhase).toBe('armed');
  });
});

describe('no bonus boss more than twice a playthrough (D394)', () => {
  it('over many seeds and cycles, each boss appears in at most two zones, and picks are the same every time', () => {
    for (let k = 0; k < 120; k++) {
      for (const cycle of [1, 2, 3]) {
        const picks = bonusBossPicks(`RUN${k}`, cycle);
        const n = new Map<string, number>();
        for (let z = 1; z <= 8; z++) {
          const id = picks[z]!;
          expect(bonusBossPool(z).map((b) => b.id)).toContain(id);
          n.set(id, (n.get(id) ?? 0) + 1);
        }
        for (const c of n.values()) expect(c).toBeLessThanOrEqual(BONUS_BOSS_MAX_PER_RUN);
        expect(bonusBossPicks(`RUN${k}`, cycle)).toEqual(picks);
      }
    }
  });

  it('the zones agree with the playthrough picks', () => {
    const picks = bonusBossPicks('AGREE', 1);
    for (let z = 1; z <= 8; z++) expect(bonusBossFor(generateZone('AGREE', z, { cycle: 1 }))!.bossId).toBe(picks[z]);
  });
});
