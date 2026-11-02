// Memory check (BUILD_BRIEF M15): 30 simulated minutes of room transitions with fights in between. Entity
// counts, scheduled callbacks and the heap must stay flat.
import { expect, it } from 'vitest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { newBot, botInput } from './bot';

it('30 minutes of room transitions do not leak', () => {
  const c = newCharacter('knight', 'Leak', 'leak', new Rng('leak'));
  c.tutorialDone = true;
  const s = new GameSession(newSave(1, c, 'LEAKSEED'));
  s.start();
  s.w.god = true;
  const bot = newBot('melee');
  const samples: { t: number; ents: number; sched: number; heap: number }[] = [];
  let i = 0;
  const heap = (): number => process.memoryUsage().heapUsed / 1e6;
  while (s.w.time < 1800) {
    const rooms = s.layout.rooms.filter((r) => r.kind !== 'tutorial');
    const node = rooms[i++ % rooms.length]!;
    s.enterRoom(node.id, node.doors[0] ?? 's');
    const p = s.localPlayer!;
    p.x = 640;
    p.y = 368;
    for (let k = 0; k < 10 * 60; k++) {
      p.pl!.input = botInput(s.w, p, bot);
      stepWorld(s.w);
      s.w.events.length = 0;
    }
    if (i % 4 === 0) {
      s.w.sweep();
      samples.push({ t: s.w.time, ents: s.w.entities.size, sched: s.w.scheduled.length, heap: heap() });
    }
    // every 5 minutes a zone change, as a run would
    if (i % 30 === 0) s.gotoZone((Math.floor(i / 30) % 8) + 1);
  }
  const maxEnts = Math.max(...samples.map((x) => x.ents));
  const maxSched = Math.max(...samples.map((x) => x.sched));
  const early = samples.slice(2, 8).reduce((a, x) => a + x.heap, 0) / 6;
  const late = samples.slice(-6).reduce((a, x) => a + x.heap, 0) / 6;
  expect(maxEnts).toBeLessThan(400);
  expect(maxSched).toBeLessThan(200);
  // generous: GC timing varies; a leak of one room's worth per transition would be hundreds of MB
  expect(late - early).toBeLessThan(80);
});
