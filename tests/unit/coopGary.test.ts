// Gary in New Game+ and in co-op (D396): he is back each new playthrough, even after being driven off, and a co-op
// guest trades at its own cart (its own stock and Glowen) instead of being told to wait for the host.
import { describe, expect, it } from 'vitest';
import { LoopbackHub } from '../../src/game/net/loopback';
import { NetHost } from '../../src/game/net/host';
import { NetGuest } from '../../src/game/net/guest';
import { GameSession, beginNextCycle } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { emptyInput } from '../../src/engine/input/actions';
import { generateZone } from '../../src/game/procgen/zone';
import { buyFromGary, garyStock } from '../../src/game/bonfire/gary';
import type { NetEvent } from '../../src/game/net/protocol';
import type { ClassId, SaveFile } from '../../src/game/types';

function saveOf(cls: ClassId, name: string, pid: string, seed: string, cycle: number): SaveFile {
  const c = newCharacter(cls, name, pid, new Rng(pid));
  c.tutorialDone = true;
  c.cycle = cycle;
  c.glowen = 1e7;
  return newSave(1, c, seed);
}

/** A seed whose zone 2 has Gary's room in this cycle. */
function merchantSeed(cycle: number): string {
  for (let s = 0; s < 400; s++) if (generateZone(`GARY${s}`, 2, { cycle }).rooms.some((r) => r.kind === 'merchant')) return `GARY${s}`;
  throw new Error('no merchant seed');
}

const garyHere = (s: GameSession): boolean => s.w.enemies.some((e) => e.en?.def.id === 'gary' && !e.removed);

function goToGary(s: GameSession): void {
  const m = s.layout.rooms.find((r) => r.kind === 'merchant')!;
  s.enterRoom(m.id, m.doors[0]!);
  s.tick(0.2);
}

describe('Gary comes back each New Game+ (D396)', () => {
  it('is in his room in NG+1 and NG+2 even after leaving in the playthrough before', () => {
    const seed = merchantSeed(0);
    const save = saveOf('knight', 'Joe', 'p', seed, 0);
    save.world.zone = 2;
    let s = new GameSession(save);
    s.start();
    goToGary(s);
    expect(garyHere(s)).toBe(true);
    s.save.world.garyGone = true;
    for (let k = 1; k <= 2; k++) {
      beginNextCycle(save);
      expect(save.world.garyGone).toBe(false);
      // find a zone of this new world with his room
      const z = [2, 3, 4, 5, 6, 7, 8].find((zz) => generateZone(save.world.seed, zz, { cycle: k }).rooms.some((r) => r.kind === 'merchant'));
      if (!z) continue;
      save.world.zone = z;
      s = new GameSession(save);
      s.start();
      goToGary(s);
      expect(garyHere(s)).toBe(true);
    }
  });
});

describe('a co-op guest trades with Gary (D396)', () => {
  it("the host's Gary opens the guest's own cart on the guest's screen, and the purchase reaches the host's copy", () => {
    const cycle = 1;
    const seed = merchantSeed(cycle);
    const hub = new LoopbackHub({ latencyMs: 30 });
    const clock = (): number => hub.now / 1000;
    const hostSave = saveOf('knight', 'Host', 'host', seed, cycle);
    hostSave.world.zone = 2;
    const s = new GameSession(hostSave);
    let hostOpened = 0;
    s.listener.gary = () => hostOpened++;
    s.start();
    const host = new NetHost(hub.join('GARY', 'host-peer'), 'GARY', hostSave, clock);
    const guestSave = saveOf('brute', 'Robb', 'g0', 'OWN-0', cycle);
    const guest = new NetGuest(hub.join('GARY', 'guest-peer'), guestSave, clock);
    const events: NetEvent[] = [];
    guest.onEvent = (e) => events.push(e);
    const step = (sec: number): void => {
      for (let i = 0; i < Math.round(sec * 60); i++) {
        host.beforeTick();
        stepWorld(s.w);
        host.afterTick(s.w.events, 1 / 60);
        s.w.events.length = 0;
        hub.pump(1000 / 60);
        guest.frame(emptyInput(), 1 / 60);
        guest.cw.events.length = 0;
      }
    };
    hub.pump(200);
    host.start(s);
    step(0.5);
    goToGary(s);
    step(0.5);
    expect(garyHere(s)).toBe(true);
    const cart = [...s.w.entities.values()].find((e) => e.it?.kind === 'gary')!;
    const puppet = s.players.find((sp) => sp.char.playerId === 'g0')!.entity!;
    // the guest at the cart: its own cart opens on its screen, the host's does not
    s.interact(puppet, cart);
    step(0.3);
    expect(hostOpened).toBe(0);
    const ev = events.find((e) => e.t === 'gary');
    expect(ev).toEqual({ t: 'gary', zone: 2, cycle });
    // the host at the cart still gets his own
    s.interact(s.localPlayer!, cart);
    expect(hostOpened).toBe(1);
    // the guest buys from its own stock with its own Glowen; the host's copy of its character follows
    const stock = garyStock(guestSave.world, 2, cycle);
    const entry = stock.find((e) => e.kind === 'item')!;
    const before = guestSave.character.glowen;
    expect(buyFromGary(guestSave.character, entry).ok).toBe(true);
    expect(guestSave.character.glowen).toBe(before - entry.price);
    guest.syncChar();
    step(0.3);
    const hostCopy = host.guests.get('guest-peer')!.char;
    expect(hostCopy.glowen).toBe(before - entry.price);
    expect(hostCopy.bag.some((it) => it.id === entry.item!.id)).toBe(true);
  });
});
