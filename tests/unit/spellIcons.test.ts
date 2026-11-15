// D400: spell icons with a countdown on the HUD of whoever a spell helps: buffs (D373), a spell's barrier (Spirit
// Shield, with its number on the HP bar) and the helpful zones you stand in or cast (Sanctuary, Regen Aura), on a
// co-op guest's own screen too.
import { describe, expect, it } from 'vitest';
import { inCombat } from './inCombat';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { runEffects, type EffectCtx } from '../../src/game/effects/run';
import { SPELLS } from '../../src/data/spells';
import { hudSpellIcons } from '../../src/game/combat/spellBuffs';
import { stepWorld } from '../../src/game/sim';
import { LoopbackHub } from '../../src/game/net/loopback';
import { NetHost } from '../../src/game/net/host';
import { NetGuest } from '../../src/game/net/guest';
import { emptyInput } from '../../src/engine/input/actions';
import { barrierText } from '../../src/ui/hud';
import type { Entity, World } from '../../src/game/world';

function cast(w: World, p: Entity, id: string, aimX: number, aimY: number): void {
  const ctx: EffectCtx = { sourceId: p.id, team: 0, x: p.x, y: p.y, aimX, aimY, targetId: 0, powerMult: 1, isSpell: true, isSkill: false, baseDamage: 0, windupS: 0, tag: `spell:${id}`, spellId: id, school: SPELLS[id]!.school };
  runEffects(w, SPELLS[id]!.effect, ctx);
}

const icons = (w: World, e: Entity): string[] => hudSpellIcons(w, e, w.time).map((a) => a.spell);

function party(): { s: GameSession; p: Entity; ally: Entity } {
  const ch = newCharacter('cleric', 'Joe', 'p1', new Rng('icons'));
  ch.tutorialDone = true;
  const s = new GameSession(newSave(1, ch, 'ICONS'));
  s.start();
  inCombat(s.w);
  const c2 = newCharacter('knight', 'Ally', 'p2', new Rng('a'));
  c2.tutorialDone = true;
  const ally = s.joinPlayer(c2).entity!;
  const p = s.localPlayer!;
  p.x = 400;
  p.y = 368;
  ally.x = 700;
  ally.y = 368;
  return { s, p, ally };
}

describe('spell icons and countdowns (D400)', () => {
  it("Spirit Shield on an ally shows its icon on the ally's HUD, with the time left and the shield's number", () => {
    const { s, p, ally } = party();
    cast(s.w, p, 'spirit_shield', ally.x, ally.y);
    const a = hudSpellIcons(s.w, ally, s.w.time).find((x) => x.spell === 'spirit_shield')!;
    expect(a).toBeDefined();
    expect(a.until - s.w.time).toBeGreaterThan(7);
    expect(icons(s.w, p)).not.toContain('spirit_shield');
    const max = ally.hp!.barrierMax!;
    expect(max).toBeCloseTo(ally.hp!.barrier, 6);
    expect(barrierText(ally.hp!)).toBe(`${Math.ceil(max)} / ${Math.ceil(max)}`);
    // taking a hit eats into it: the number shows what is left of what it was
    ally.hp!.barrier = max / 2;
    expect(barrierText(ally.hp!)).toBe(`${Math.ceil(max / 2)} / ${Math.ceil(max)}`);
  });

  it('Sanctuary shows to whoever stands in it and to its caster, until it ends', () => {
    const { s, p, ally } = party();
    cast(s.w, p, 'sanctuary', ally.x, ally.y);
    expect(icons(s.w, ally)).toContain('sanctuary');
    expect(icons(s.w, p)).toContain('sanctuary'); // its caster, standing outside
    const until = hudSpellIcons(s.w, ally, s.w.time).find((x) => x.spell === 'sanctuary')!.until;
    expect(until - s.w.time).toBeGreaterThan(7);
    ally.x = 1100;
    expect(icons(s.w, ally)).not.toContain('sanctuary');
    // Void Rift is no help to anyone: no icon
    cast(s.w, p, 'void_rift', 300, 600);
    expect(icons(s.w, p)).not.toContain('void_rift');
  });

  it('Regen Aura shows to its caster', () => {
    const { s, p } = party();
    cast(s.w, p, 'regen_aura', p.x, p.y);
    expect(icons(s.w, p)).toContain('regen_aura');
  });

  it("on a co-op guest's own screen: the host's Spirit Shield, Ward of Steel and Sanctuary all show", () => {
    const hub = new LoopbackHub({ latencyMs: 30 });
    const clock = (): number => hub.now / 1000;
    const hc = newCharacter('cleric', 'Host', 'host', new Rng('h'));
    hc.tutorialDone = true;
    const hostSave = newSave(1, hc, 'ICONCOOP');
    const s = new GameSession(hostSave);
    s.start();
    inCombat(s.w);
    const host = new NetHost(hub.join('IC', 'host-peer'), 'IC', hostSave, clock);
    const gc = newCharacter('knight', 'Robb', 'g0', new Rng('g'));
    gc.tutorialDone = true;
    const guest = new NetGuest(hub.join('IC', 'guest-peer'), newSave(1, gc, 'OWN'), clock);
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
    const p = s.localPlayer!;
    const puppet = s.players.find((sp) => sp.char.playerId === 'g0')!.entity!;
    p.x = 500;
    p.y = 368;
    guest.me!.x = 560;
    guest.me!.y = 368;
    step(0.3);
    cast(s.w, p, 'spirit_shield', puppet.x, puppet.y);
    cast(s.w, p, 'ward_of_steel', p.x, p.y);
    cast(s.w, p, 'sanctuary', puppet.x, puppet.y);
    step(0.5);
    const me = guest.me!;
    const got = hudSpellIcons(guest.cw, me, guest.cw.time);
    expect(got.map((a) => a.spell).sort()).toEqual(['sanctuary', 'spirit_shield', 'ward_of_steel']);
    for (const a of got) expect(a.until - guest.cw.time).toBeGreaterThan(5);
    expect(me.hp!.barrier).toBeGreaterThan(0);
    expect(me.hp!.barrierMax).toBeCloseTo(me.hp!.barrier, 3);
  });
});
