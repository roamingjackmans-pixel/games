// Leftovers on guests' screens (D393): a party of three (a host and two guests) on the in-process loopback, with
// Trystero's habit of sending a message over 16 KiB a couple of trips late (LoopbackOpts.bigLate). Every 2 s a full
// snapshot (all players' gear, every enemy, every telegraph) is that big, so newer small snapshots overtake it; the
// guests used to apply the late one as if it were new and bring back everything removed meanwhile, for good.
import { describe, expect, it } from 'vitest';
import { LoopbackHub } from '../../src/game/net/loopback';
import { NetHost } from '../../src/game/net/host';
import { NetGuest } from '../../src/game/net/guest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { emptyInput } from '../../src/engine/input/actions';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { ENEMIES } from '../../src/data/enemies';
import { LOCAL_ID_BASE, type Entity } from '../../src/game/world';
import type { ClassId, SaveFile } from '../../src/game/types';

function saveOf(cls: ClassId, name: string, pid: string, seed = 'LEFT-SEED'): SaveFile {
  const c = newCharacter(cls, name, pid, new Rng(pid));
  c.tutorialDone = true;
  return newSave(1, c, seed);
}

interface Trio {
  hub: LoopbackHub;
  host: NetHost;
  s: GameSession;
  guests: NetGuest[];
  step(sec: number): void;
}

function trio(): Trio {
  const hub = new LoopbackHub({ latencyMs: 45, jitterMs: 8, bigLate: true });
  const clock = (): number => hub.now / 1000;
  const hostSave = saveOf('knight', 'Host Joe', 'host');
  const s = new GameSession(hostSave);
  s.start();
  const host = new NetHost(hub.join('LEFT', 'host-peer'), 'LEFT', hostSave, clock);
  const guests = [new NetGuest(hub.join('LEFT', 'guest-a'), saveOf('brute', 'Robb', 'ga', 'OWN-A'), clock), new NetGuest(hub.join('LEFT', 'guest-b'), saveOf('cleric', 'Jae', 'gb', 'OWN-B'), clock)];
  const t: Trio = {
    hub,
    host,
    s,
    guests,
    step(sec: number) {
      for (let i = 0; i < Math.round(sec * 60); i++) {
        host.beforeTick();
        stepWorld(s.w);
        host.afterTick(s.w.events, 1 / 60);
        s.w.events.length = 0;
        hub.pump(1000 / 60);
        for (const g of guests) {
          g.frame(emptyInput(), 1 / 60);
          g.cw.events.length = 0;
        }
      }
    },
  };
  hub.pump(300);
  host.start(s);
  t.step(0.8);
  return t;
}

const SHOWN = new Set(['enemy', 'telegraph', 'projectile', 'hazard', 'decoy', 'wall']);

/** What a guest draws (host ids only) that the host's world no longer has. */
function leftovers(t: Trio, g: NetGuest): Entity[] {
  return [...g.cw.entities.values()].filter((e) => e.id < LOCAL_ID_BASE && SHOWN.has(e.type) && !t.s.w.entities.get(e.id));
}

/** A fight that makes and ends lots of things: enemies attacking, their telegraphs and shots, some dying. */
function brawl(t: Trio, sec: number): void {
  const w = t.s.w;
  w.god = true;
  const ids = Object.values(ENEMIES).filter((d) => !d.special && !('boss' in d)).map((d) => d.id).slice(0, 30);
  const rng = new Rng('brawl');
  for (let i = 0; i < 24; i++) {
    const def = ENEMIES[ids[i % ids.length]!]!;
    const e = spawnEnemy(w, def, 200 + rng.range(0, 880), 160 + rng.range(0, 400), { tellS: 0 });
    e.en!.state = 'alert';
  }
  for (let k = 0; k < sec * 10; k++) {
    t.step(0.1);
    // every so often one falls, and the room spits out short-lived things (shots, telegraphs, puddles)
    const live = w.enemies.filter((e) => !e.hp?.dead && !e.removed);
    if (k % 4 === 0 && live.length > 8) w.remove(live[0]!);
    for (let n = 0; n < 3; n++) {
      w.spawn('decoy', 200 + rng.range(0, 800), 200 + rng.range(0, 300), { radius: 6, dc: { until: w.time + 0.3, tauntR: 0, ownerId: 0, illusion: false } });
    }
    for (const e of [...w.entities.values()]) if (e.type === 'decoy' && w.time - e.born > 0.3) w.remove(e);
  }
}

describe('co-op leftovers with three players (D393)', () => {
  it('nothing the host has removed stays on either guest’s screen, even when full snapshots arrive late', () => {
    const t = trio();
    brawl(t, 6);
    // the room is cleared: every enemy and everything they left goes on the host
    const w = t.s.w;
    for (const e of [...w.entities.values()]) if (e.type !== 'player' && e.type !== 'interact' && e.type !== 'pickup') w.remove(e);
    t.step(2.5);
    for (const g of t.guests) expect(leftovers(t, g).map((e) => `${e.type}:${e.id}`)).toEqual([]);
  });

  it('after a room change sent late, both guests show the new room and exactly what the host has in it', () => {
    const t = trio();
    brawl(t, 2.5);
    const w = t.s.w;
    const next = t.s.layout.rooms.find((n) => n.id !== t.s.node.id && n.kind === 'combat')!;
    t.s.enterRoom(next.id, 's');
    t.step(2.5);
    const hostIds = [...w.entities.values()].filter((e) => SHOWN.has(e.type) || e.type === 'interact').map((e) => e.id).sort((a, b) => a - b);
    for (const g of t.guests) {
      expect(g.cw.room.id).toBe(String(w.room.id));
      expect(leftovers(t, g)).toEqual([]);
      const mine = [...g.cw.entities.values()].filter((e) => e.id < LOCAL_ID_BASE && (SHOWN.has(e.type) || e.type === 'interact')).map((e) => e.id).sort((a, b) => a - b);
      expect(mine).toEqual(hostIds);
    }
  });

  it('a full snapshot really is over 16 KiB in such a room (so Trystero sends it late)', () => {
    const t = trio();
    let biggest = 0;
    const ch = (t.host as unknown as { ch: { snap: { send: (b: ArrayBuffer, to: string) => void } } }).ch.snap;
    const send = ch.send.bind(ch);
    ch.send = (b: ArrayBuffer, to: string) => {
      biggest = Math.max(biggest, b.byteLength);
      send(b, to);
    };
    brawl(t, 2.5);
    expect(biggest).toBeGreaterThan(16384);
  });
});
