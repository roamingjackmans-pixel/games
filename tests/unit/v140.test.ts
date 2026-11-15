// The 1.4.0 batch (D371 onward): rules the owner asked for, one block each.
import { describe, expect, it } from 'vitest';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { makeItem } from '../../src/game/items/make';
import { refreshDerived } from '../../src/game/player/player';
import { emptySpec, hitPlayer } from '../../src/game/combat/damage';
import { spawnEnemy } from '../../src/game/enemies/spawn';
import { ENEMIES } from '../../src/data/enemies';
import { addBuff } from '../../src/game/combat/state';

function session(cls: Parameters<typeof newCharacter>[0] = 'knight'): GameSession {
  const c = newCharacter(cls, 'Joe', 'p1', new Rng('v140'));
  c.tutorialDone = true;
  c.stats.bonk = c.stats.slicey = 40;
  const s = new GameSession(newSave(1, c, 'V140'));
  s.start();
  return s;
}

describe('Spiked Greatshield thorns (D371)', () => {
  it('reflect half of what the enemy dealt before any reduction: a 300 hit reflects 150 though the block cut it', () => {
    const s = session();
    const p = s.localPlayer!;
    p.pl!.char.equipment.off = makeItem('spiked_greatshield', 'common');
    p.pl!.char.twoHanded = false;
    refreshDerived(p);
    const foe = spawnEnemy(s.w, ENEMIES.shambler!, p.x - 80, p.y, { tellS: 0 });
    foe.en!.state = 'alert';
    foe.en!.def = { ...foe.en!.def, resist: {}, element: 'physical' };
    foe.hp!.hp = foe.hp!.max = 5000;
    p.facing = Math.PI;
    p.pl!.blocking = true;
    p.stam!.cur = p.stam!.max = 500;
    const hpBefore = p.hp!.hp;
    const spec = emptySpec('normal');
    spec.dmg.physical = 300;
    hitPlayer(s.w, foe.id, p, spec, foe.x, foe.y);
    expect(hpBefore - p.hp!.hp).toBeLessThan(150);
    expect(5000 - foe.hp!.hp).toBeCloseTo(150, 0);
  });

  it("counts the enemy's own damage buffs, never the player's", () => {
    const s = session();
    const p = s.localPlayer!;
    p.pl!.char.equipment.off = makeItem('spiked_greatshield', 'common');
    p.pl!.char.twoHanded = false;
    refreshDerived(p);
    const foe = spawnEnemy(s.w, ENEMIES.shambler!, p.x - 80, p.y, { tellS: 0 });
    foe.en!.state = 'alert';
    foe.en!.def = { ...foe.en!.def, resist: {}, element: 'physical' };
    foe.hp!.hp = foe.hp!.max = 5000;
    addBuff(foe, s.w, { id: 'rage', stat: 'damagePct', amount: 0.5, durationS: 10, maxStacks: 1, sourceId: foe.id });
    addBuff(p, s.w, { id: 'mine', stat: 'damagePct', amount: 1, durationS: 10, maxStacks: 1, sourceId: p.id });
    p.facing = Math.PI;
    p.pl!.blocking = true;
    p.stam!.cur = p.stam!.max = 500;
    const spec = emptySpec('normal');
    spec.dmg.physical = 200;
    hitPlayer(s.w, foe.id, p, spec, foe.x, foe.y);
    expect(5000 - foe.hp!.hp).toBeCloseTo(150, 0);
  });
});

describe('weapon speed tags (D371)', () => {
  it('every class has a tag from its base speed: daggers Fast, longsword Medium, greathammer Slow', async () => {
    const { WEAPONS, speedTag, SPEED_TAG_MULT } = await import('../../src/data/weapons');
    for (const w of Object.values(WEAPONS)) expect(['fast', 'medium', 'slow']).toContain(speedTag(w));
    expect(speedTag(WEAPONS.twin_daggers!)).toBe('fast');
    expect(speedTag(WEAPONS.longsword!)).toBe('medium');
    expect(speedTag(WEAPONS.club!)).toBe('medium');
    expect(speedTag(WEAPONS.greathammer!)).toBe('slow');
    expect(SPEED_TAG_MULT).toEqual({ fast: 1, medium: 1.5, slow: 2 });
  });

  it('Bless Weapon and lifesteal: ×1 Fast, ×1.5 Medium, ×2 Slow', async () => {
    const { weaponSpec } = await import('../../src/game/player/player');
    const s = session();
    const p = s.localPlayer!;
    const c = p.pl!.char;
    c.stats.bonk = c.stats.slicey = 60;
    const blessed = (baseId: string): { holyShare: number; ls: number } => {
      c.equipment.main = makeItem(baseId, 'common');
      c.twoHanded = false;
      refreshDerived(p);
      p.pl!.derived.lifesteal = 0.01;
      p.buffs = [];
      const plain = weaponSpec(s.w, p, 1);
      addBuff(p, s.w, { id: 'bless', stat: 'holyConvertPct', amount: 0.2, durationS: 20, maxStacks: 1, sourceId: p.id });
      const b = weaponSpec(s.w, p, 1);
      const base = Object.values(plain.dmg).reduce((a, x) => a + (x ?? 0), 0);
      return { holyShare: ((b.dmg.holy ?? 0) - (plain.dmg.holy ?? 0)) / base, ls: b.lifestealPct ?? 0 };
    };
    const fast = blessed('rapier');
    const med = blessed('longsword');
    const slow = blessed('greataxe');
    expect(fast.holyShare).toBeCloseTo(0.2, 3);
    expect(med.holyShare).toBeCloseTo(0.3, 3);
    expect(slow.holyShare).toBeCloseTo(0.4, 3);
    expect(fast.ls).toBeCloseTo(0.01, 9);
    expect(med.ls).toBeCloseTo(0.015, 9);
    expect(slow.ls).toBeCloseTo(0.02, 9);
  });
});

describe('the Duelist starts with B-scaling Novice Twin Daggers (D371)', () => {
  it('only the starting pair: dropped daggers keep S', async () => {
    const { weaponOf } = await import('../../src/game/items/weaponOf');
    const { WEAPONS } = await import('../../src/data/weapons');
    const c = newCharacter('duelist', 'D', 'd', new Rng(3));
    expect(c.equipment.main!.baseId).toBe('twin_daggers');
    expect(weaponOf(c.equipment.main)!.grades.slicey).toBe('B');
    expect(c.equipment.main!.name).toMatch(/Novice Twin Daggers/);
    expect(WEAPONS.twin_daggers!.grades.slicey).toBe('S');
  });
});

describe('balance numbers (D371)', () => {
  it('Vexthorn pays three times the shards; gems drop 30% more; raising a rarity costs half', async () => {
    const { BOSSES } = await import('../../src/data/bosses');
    const { GEM_CHANCE } = await import('../../src/data/lootTables');
    const { RARITY_UPGRADE_COST, PROF_CLASSES, PROF_PERK_MULT } = await import('../../src/data/proficiency');
    expect(BOSSES.vexthorn!.mult?.shards).toBe(3);
    expect(GEM_CHANCE.enemy).toBeCloseTo(0.0169, 6);
    expect(RARITY_UPGRADE_COST).toEqual({ common: 75, uncommon: 200, rare: 500, epic: 1250 });
    expect(PROF_PERK_MULT).toBe(1.3);
    expect(PROF_CLASSES.talisman!.perks.map((k) => k.stat)).toEqual(['spellCooldown', 'spellDuration']);
    expect(PROF_CLASSES.greataxe!.perks[0]!.per).toBeCloseTo(0.013, 9);
  });

  it('Talisman proficiency makes a spell buff last longer (spell duration in place of cast speed)', async () => {
    const { runEffects } = await import('../../src/game/effects/run');
    const { SPELLS } = await import('../../src/data/spells');
    const s = session('cleric');
    const p = s.localPlayer!;
    const c = p.pl!.char;
    const ward = SPELLS.ward_of_steel!;
    const cast = (): number => {
      p.buffs = [];
      runEffects(s.w, ward.effect, { sourceId: p.id, team: 0, x: p.x, y: p.y, aimX: p.x + 50, aimY: p.y, targetId: 0, powerMult: 1, isSpell: true, isSkill: false, baseDamage: 20, windupS: 0, tag: 'ward', school: 'prayer' });
      return p.buffs!.find((b) => b.id === 'ward_self')!.until - s.w.time;
    };
    c.proficiency = {};
    refreshDerived(p);
    const plain = cast();
    c.proficiency = { talisman: 1e6 };
    refreshDerived(p);
    expect(p.pl!.derived.spellDurationPct).toBeGreaterThan(0.5);
    expect(cast()).toBeCloseTo(plain * (1 + p.pl!.derived.spellDurationPct), 3);
  });
});

describe('new statistics (D372)', () => {
  const statsOf = (s: GameSession, pid: string): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const ev of s.w.events) if (ev.t === 'stat' && ev.playerId === pid) out[ev.key] = (out[ev.key] ?? 0) + (ev.n ?? 1);
    return out;
  };

  it('a blocked hit counts the damage the block stopped and what armour took off', () => {
    const s = session();
    const p = s.localPlayer!;
    p.pl!.char.equipment.off = makeItem('kite_shield', 'common');
    p.pl!.char.twoHanded = false;
    refreshDerived(p);
    const foe = spawnEnemy(s.w, ENEMIES.shambler!, p.x - 80, p.y, { tellS: 0 });
    foe.en!.state = 'alert';
    p.facing = Math.PI;
    p.pl!.blocking = true;
    p.stam!.cur = p.stam!.max = 500;
    s.w.events.length = 0;
    const spec = emptySpec('normal');
    spec.dmg.physical = 100;
    hitPlayer(s.w, foe.id, p, spec, foe.x, foe.y);
    const st = statsOf(s, p.pl!.playerId);
    expect(st.dmgBlocked).toBeGreaterThan(50);
    p.pl!.blocking = false;
    s.w.events.length = 0;
    p.pl!.iframesUntil = 0;
    p.hp!.invulnUntil = 0;
    hitPlayer(s.w, foe.id, p, spec, foe.x, foe.y);
    expect(statsOf(s, p.pl!.playerId).dmgArmor).toBeGreaterThan(0);
  });

  it('a Heal spell on an ally counts as healing done and healing given; the Thermos never does', async () => {
    const { runEffects } = await import('../../src/game/effects/run');
    const { stepWorld } = await import('../../src/game/sim');
    const s = session('cleric');
    const p = s.localPlayer!;
    const ally = s.joinPlayer(newCharacter('knight', 'Ally', 'p2', new Rng('a'))).entity!;
    ally.x = p.x + 60;
    ally.hp!.hp = ally.hp!.max * 0.2;
    p.hp!.hp = p.hp!.max * 0.2;
    s.w.events.length = 0;
    // the Thermos: healing over time with no healer
    p.pl!.healOver.push({ perS: 200, until: s.w.time + 1, interruptible: false });
    for (let i = 0; i < 70; i++) stepWorld(s.w);
    expect(statsOf(s, p.pl!.playerId).healDone ?? 0).toBe(0);
    s.w.events.length = 0;
    runEffects(s.w, [{ op: 'heal', pct: 0.5, target: 'party', r: 400, spell: true }], { sourceId: p.id, team: 0, x: p.x, y: p.y, aimX: ally.x, aimY: ally.y, targetId: ally.id, powerMult: 1, isSpell: true, isSkill: false, baseDamage: 0, windupS: 0, tag: 'heal', school: 'prayer' });
    const st = statsOf(s, p.pl!.playerId);
    expect(st.healDone).toBeGreaterThan(0);
    expect(st.healAllies).toBeGreaterThan(0);
  });
});

describe('Prayer buff spells (D373)', () => {
  /** cast a spell from the cleric's Prayer slot 1 through the real cast path, and step until it fires */
  const castReal = async (s: GameSession, id: string): Promise<void> => {
    const { tryCastSpell } = await import('../../src/game/skills/use');
    const { stepWorld } = await import('../../src/game/sim');
    const p = s.localPlayer!;
    const c = p.pl!.char;
    c.stats.prayer = 60;
    if (!c.knownSpells.includes(id)) c.knownSpells.push(id);
    c.spellLoadout.prayer = [id, null, null];
    refreshDerived(p);
    p.pl!.spellReadyAt = [0, 0, 0];
    p.stam!.cur = p.stam!.max;
    expect(tryCastSpell(s.w, p, 0)).toBe(true);
    for (let i = 0; i < 120 && p.pl!.action; i++) stepWorld(s.w);
  };

  it('Ward of Steel: +30 defense to all types, so the same hit hurts less', async () => {
    const s = session('cleric');
    const p = s.localPlayer!;
    const foe = spawnEnemy(s.w, ENEMIES.shambler!, p.x - 80, p.y, { tellS: 0 });
    foe.en!.state = 'alert';
    const hitFor = (): number => {
      p.hp!.hp = p.hp!.max;
      p.hp!.invulnUntil = 0;
      p.pl!.iframesUntil = 0;
      const spec = emptySpec('normal');
      spec.dmg.physical = 80;
      hitPlayer(s.w, foe.id, p, spec, foe.x, foe.y);
      return p.hp!.max - p.hp!.hp;
    };
    const plain = hitFor();
    await castReal(s, 'ward_of_steel');
    const ward = p.buffs!.find((b) => b.id === 'ward_self')!;
    expect(ward.spell).toBe('ward_of_steel');
    expect(ward.amount).toBeGreaterThanOrEqual(30);
    expect(hitFor()).toBeLessThan(plain * 0.85);
  });

  it('Fortify Thermos: the next drink heals 50% more, and the drink uses it up', async () => {
    const { stepWorld } = await import('../../src/game/sim');
    const { ACTION_BIT, emptyInput } = await import('../../src/engine/input/actions');
    const s = session('cleric');
    const p = s.localPlayer!;
    const c = p.pl!.char;
    const drink = (): number => {
      c.flaskCur = 1;
      p.hp!.max = 5000;
      p.hp!.hp = 1;
      p.pl!.state = 'idle';
      p.pl!.input = { ...emptyInput(), buttons: ACTION_BIT.flask, pressed: ACTION_BIT.flask };
      stepWorld(s.w);
      p.pl!.input = emptyInput();
      for (let i = 0; i < 150; i++) stepWorld(s.w);
      return p.hp!.hp - 1;
    };
    const plain = drink();
    await castReal(s, 'fortify_thermos');
    expect(p.buffs!.some((b) => b.stat === 'flaskBoostPct' && b.spell === 'fortify_thermos')).toBe(true);
    const boosted = drink();
    expect(boosted / plain).toBeGreaterThan(1.4);
    expect(p.buffs!.some((b) => b.stat === 'flaskBoostPct')).toBe(false);
    // (the cast raised Prayer, which the Thermos also grows with: compare with a plain drink at the same Prayer)
    expect(boosted / drink()).toBeCloseTo(1.5, 1);
  });

  it('a co-op guest drinking uses up its Fortify Thermos on the host copy too', async () => {
    const { applyBodyReport } = await import('../../src/game/net/body');
    const s = session('cleric');
    const g = s.joinPlayer(newCharacter('cleric', 'G', 'g', new Rng('g'))).entity!;
    g.pl!.net = 'puppet';
    addBuff(g, s.w, { id: 'fortify_thermos', stat: 'flaskBoostPct', amount: 0.5, durationS: 20, maxStacks: 1, sourceId: g.id, spell: 'fortify_thermos' });
    const { PLAYER_STATES } = await import('../../src/game/net/snapshot');
    const report = { epoch: 0, x: g.x, y: g.y, facing: 0, moving: 0, state: PLAYER_STATES.indexOf('flask'), flags: 0, cIdx: 0, cPhase: 0, cK: 0, pose: 0, poseT: 0, squash: 0, alpha: 1, scale: 1, hp: g.hp!.hp, barrier: 0, stam: 50, status: 0, flask: 0 };
    applyBodyReport(s.w, g, report as never, 0);
    expect(g.buffs!.some((b) => b.stat === 'flaskBoostPct')).toBe(false);
  });

  it('Stone Skin cuts physical damage taken and gives hyper armor; Haste speeds attacks', async () => {
    const { attackSpeedFor } = await import('../../src/game/skills/use');
    const s = session('cleric');
    const p = s.localPlayer!;
    const foe = spawnEnemy(s.w, ENEMIES.shambler!, p.x - 80, p.y, { tellS: 0 });
    foe.en!.state = 'alert';
    const hitFor = (): number => {
      p.hp!.hp = p.hp!.max;
      p.hp!.invulnUntil = 0;
      p.pl!.iframesUntil = 0;
      const spec = emptySpec('normal');
      spec.dmg.physical = 80;
      hitPlayer(s.w, foe.id, p, spec, foe.x, foe.y);
      return p.hp!.max - p.hp!.hp;
    };
    const plain = hitFor();
    await castReal(s, 'stone_skin');
    expect(p.buffs!.some((b) => b.stat === 'poiseThreshold' && b.spell === 'stone_skin')).toBe(true);
    expect(hitFor()).toBeLessThan(plain * 0.85);
    const before = attackSpeedFor(s.w, p);
    await castReal(s, 'haste');
    expect(attackSpeedFor(s.w, p)).toBeGreaterThan(before * 1.1);
  });

  it('one icon a spell: Haste (two buffs), Ward of Steel and Fortify Thermos show three; an ended buff shows none', async () => {
    const { spellBuffsOn, buffText } = await import('../../src/game/combat/spellBuffs');
    const s = session('cleric');
    const p = s.localPlayer!;
    await castReal(s, 'haste');
    await castReal(s, 'ward_of_steel');
    await castReal(s, 'fortify_thermos');
    const on = spellBuffsOn(p, s.w.time);
    expect(on.map((a) => a.spell).sort()).toEqual(['fortify_thermos', 'haste', 'ward_of_steel']);
    expect(on.find((a) => a.spell === 'haste')!.buffs.map(buffText).join(' ')).toMatch(/attack speed/);
    expect(spellBuffsOn(p, s.w.time + 60)).toEqual([]);
  });
});

describe('lifesteal gems in a staff or talisman heal on spells, in either hand (D369, D374)', () => {
  const setup = async (where: 'main' | 'off' | 'weapon') => {
    const { makeGem } = await import('../../src/data/gems');
    const s = session('scholar');
    const p = s.localPlayer!;
    const c = p.pl!.char;
    c.stats.brain = 40;
    const staff = makeItem('apprentice_staff', 'rare');
    const leech = makeGem('leech', { level: 30, q: 0 });
    if (where === 'weapon') {
      c.equipment.main = makeItem('rapier', 'rare');
      c.equipment.main.sockets = [leech];
      c.equipment.off = staff;
      staff.sockets = [null];
    } else {
      staff.sockets = [leech];
      if (where === 'main') {
        c.equipment.main = staff;
        c.equipment.off = null;
      } else {
        c.equipment.main = makeItem('rapier', 'rare');
        c.equipment.off = staff;
      }
    }
    c.twoHanded = false;
    refreshDerived(p);
    const foe = spawnEnemy(s.w, ENEMIES.shambler!, p.x + 120, p.y, { tellS: 0 });
    foe.en!.state = 'alert';
    foe.en!.def = { ...foe.en!.def, resist: {} };
    foe.hp!.hp = foe.hp!.max = 1e6;
    p.hp!.hp = p.hp!.max * 0.3;
    return { s, p, foe };
  };
  const castBolt = async (s: GameSession, p: { id: number; x: number; y: number }, foe: { x: number; y: number }, zone = false): Promise<void> => {
    const { runEffects } = await import('../../src/game/effects/run');
    const effects = zone
      ? [{ op: 'zone' as const, pattern: { kind: 'circle' as const, r: 80, anchor: 'aim' as const }, durationS: 1.2, tickS: 0.5, hazard: 'consecrate' as const, tick: [{ op: 'damage' as const, pattern: { kind: 'circle' as const, r: 10, anchor: 'target' as const }, type: 'magic' as const, base: 20 }] }]
      : [{ op: 'damage' as const, pattern: { kind: 'circle' as const, r: 60, anchor: 'aim' as const }, type: 'magic' as const, base: 40 }];
    runEffects(s.w, effects as never, { sourceId: p.id, team: 0, x: p.x, y: p.y, aimX: foe.x, aimY: foe.y, targetId: 0, powerMult: 1, isSpell: true, isSkill: false, baseDamage: 20, windupS: 0, tag: 'spell:0', school: 'brain' });
    const { stepWorld } = await import('../../src/game/sim');
    for (let i = 0; i < 6; i++) stepWorld(s.w);
  };

  it('a Leech gem in an off-hand staff heals on its spell hits', async () => {
    const { s, p, foe } = await setup('off');
    expect(p.pl!.derived.off.lifesteal).toBeGreaterThan(0);
    const hp0 = p.hp!.hp;
    await castBolt(s, p, foe);
    expect(foe.hp!.hp).toBeLessThan(1e6);
    expect(p.hp!.hp).toBeGreaterThan(hp0);
  });

  it('a Leech gem in a weapon-hand staff heals on its spell hits', async () => {
    const { s, p, foe } = await setup('main');
    expect(p.pl!.derived.lifesteal).toBeGreaterThan(0);
    const hp0 = p.hp!.hp;
    await castBolt(s, p, foe);
    expect(p.hp!.hp).toBeGreaterThan(hp0);
  });

  it("a Leech gem in the sword does not heal on the off-hand staff's spells", async () => {
    const { s, p, foe } = await setup('weapon');
    const hp0 = p.hp!.hp;
    await castBolt(s, p, foe);
    expect(foe.hp!.hp).toBeLessThan(1e6);
    expect(p.hp!.hp).toBe(hp0);
  });

  it("a spell zone's ticks heal by the casting hand's lifesteal too", async () => {
    const { stepWorld } = await import('../../src/game/sim');
    const { s, p, foe } = await setup('off');
    // the shambler hits back meanwhile: keep the player untouchable so only healing moves its HP
    p.hp!.invulnUntil = 1e9;
    const hp0 = p.hp!.hp;
    await castBolt(s, p, foe, true);
    for (let i = 0; i < 60; i++) {
      stepWorld(s.w);
      foe.vx = foe.vy = 0;
    }
    expect(foe.hp!.hp).toBeLessThan(1e6);
    expect(p.hp!.hp).toBeGreaterThan(hp0);
  });
});

describe('picking up a spell says which (D374)', () => {
  it('its name and whether it is a Brain or a Prayer spell', () => {
    const s = session();
    const p = s.localPlayer!;
    s.w.events.length = 0;
    const pk = s.w.spawn('pickup', p.x, p.y, { radius: 14, pk: { kind: 'spell', spellId: 'ward_of_steel', forPlayer: p.pl!.playerId, amount: 1, until: 0, rarity: 'common', autoCollectAt: 0 } });
    s.collect(p, pk);
    const msgs = s.w.events.filter((e) => e.t === 'msg').map((e) => (e as { text: string }).text);
    expect(msgs).toContain('You learned Ward of Steel, a Prayer spell.');
    expect(p.pl!.char.knownSpells).toContain('ward_of_steel');
  });
});

describe('Chain Lightning is a ball of lightning (D375)', () => {
  const setup = () => {
    const s = session('scholar');
    const p = s.localPlayer!;
    p.x = 300;
    p.y = 368;
    const ally = s.joinPlayer(newCharacter('knight', 'Ally', 'p2', new Rng('a'))).entity!;
    const mk = (x: number, y: number) => {
      const e = spawnEnemy(s.w, ENEMIES.shambler!, x, y, { tellS: 0 });
      e.en!.state = 'dormant';
      e.hp!.hp = e.hp!.max = 1e6;
      return e;
    };
    return { s, p, ally, mk };
  };
  const cast = async (s: GameSession, p: { id: number; x: number; y: number }, ax: number, ay: number) => {
    const { runEffects } = await import('../../src/game/effects/run');
    const { SPELLS } = await import('../../src/data/spells');
    runEffects(s.w, SPELLS.chain_lightning!.effect, { sourceId: p.id, team: 0, x: p.x, y: p.y, aimX: ax, aimY: ay, targetId: 0, powerMult: 1, isSpell: true, isSkill: false, baseDamage: 20, windupS: 0, tag: 'spell:0', school: 'brain', spellId: 'chain_lightning' });
  };
  const hold = (es: { x: number; y: number; vx: number; vy: number }[], at: [number, number][]) =>
    es.forEach((e, i) => {
      e.x = at[i]![0];
      e.y = at[i]![1];
      e.vx = e.vy = 0;
    });

  it('flies from the caster where it is aimed, at medium-slow speed, with no homing', async () => {
    const { CHAIN_BALL_SPEED } = await import('../../src/data/spells');
    const { s, p, ally } = setup();
    ally.x = 100;
    await cast(s, p, 700, 200);
    const ball = [...s.w.entities.values()].find((e) => e.type === 'projectile' && e.pr?.drawId === 'p_lightning')!;
    expect(ball).toBeTruthy();
    expect(Math.hypot(ball.vx, ball.vy)).toBeCloseTo(CHAIN_BALL_SPEED, 0);
    expect(CHAIN_BALL_SPEED).toBeLessThan(520);
    expect(ball.pr!.homing).toBe(0);
    expect(Math.atan2(ball.vy, ball.vx)).toBeCloseTo(Math.atan2(200 - 368, 700 - 300), 2);
  });

  it('jumps from its first hit to the next enemy before a nearer player, then on to the player', async () => {
    const { stepWorld } = await import('../../src/game/sim');
    const { s, p, ally, mk } = setup();
    const a = mk(600, 368);
    const b = mk(600, 368 + 170);
    const spots: [number, number][] = [[600, 368], [600, 538], [700, 368], [p.x, p.y]];
    await cast(s, p, 600, 368);
    const hpA = a.hp!.hp;
    let order: string[] = [];
    for (let i = 0; i < 240; i++) {
      hold([a, b, ally, p], spots);
      const before = [a.hp!.hp, b.hp!.hp, ally.hp!.hp];
      stepWorld(s.w);
      if (a.hp!.hp < before[0]!) order.push('a');
      if (b.hp!.hp < before[1]!) order.push('b');
      if (ally.hp!.hp < before[2]!) order.push('ally');
    }
    order = order.filter((x, i) => order[i - 1] !== x);
    expect(a.hp!.hp).toBeLessThan(hpA);
    // the ally at 100 px is nearer than enemy b at 170 px, but enemies come first
    expect(order.slice(0, 3)).toEqual(['a', 'b', 'ally']);
  });

  it('a co-op player who steps sideways when it turns toward them is missed; one who stands still is hit', async () => {
    const { stepWorld } = await import('../../src/game/sim');
    const { emptyInput } = await import('../../src/engine/input/actions');
    const run = async (dodge: boolean): Promise<number> => {
      const { s, p, ally, mk } = setup();
      const a = mk(600, 368);
      ally.x = 600;
      ally.y = 368 + 175;
      await cast(s, p, 600, 368);
      const hp0 = ally.hp!.hp;
      let turnedAt = -1;
      for (let i = 0; i < 180; i++) {
        hold([a], [[600, 368]]);
        p.x = 300;
        const ball = [...s.w.entities.values()].find((e) => e.type === 'projectile' && e.pr?.drawId === 'p_lightning');
        if (turnedAt < 0 && ball && ball.vy > 0) turnedAt = s.w.time;
        // a 0.3 s reaction, then walk straight sideways
        const go = dodge && turnedAt >= 0 && s.w.time - turnedAt >= 0.3;
        ally.pl!.input = { ...emptyInput(), moveX: go ? 1 : 0, aimX: ally.x + 100, aimY: ally.y };
        stepWorld(s.w);
      }
      return hp0 - ally.hp!.hp;
    };
    expect(await run(false)).toBeGreaterThan(0);
    expect(await run(true)).toBe(0);
  });
});

describe('Void Rift hurts and slows co-op allies (D375)', () => {
  it("ticks on another player inside and slows them; never the caster", async () => {
    const { runEffects } = await import('../../src/game/effects/run');
    const { SPELLS } = await import('../../src/data/spells');
    const { stepWorld } = await import('../../src/game/sim');
    const { hazardSlowOn } = await import('../../src/game/systems/hazards');
    const s = session('scholar');
    const p = s.localPlayer!;
    const ally = s.joinPlayer(newCharacter('knight', 'Ally', 'p2', new Rng('a'))).entity!;
    const { inCombat } = await import('./inCombat');
    inCombat(s.w);
    p.x = 640;
    p.y = 368;
    ally.x = 660;
    ally.y = 380;
    const hpP = p.hp!.hp;
    const hpA = ally.hp!.hp;
    runEffects(s.w, SPELLS.void_rift!.effect, { sourceId: p.id, team: 0, x: p.x, y: p.y, aimX: 650, aimY: 370, targetId: 0, powerMult: 1, isSpell: true, isSkill: false, baseDamage: 20, windupS: 0, tag: 'spell:0', school: 'brain' });
    expect(hazardSlowOn(s.w, ally)).toBeCloseTo(0.8, 6);
    expect(hazardSlowOn(s.w, p)).toBe(1);
    for (let i = 0; i < 90; i++) {
      p.x = 640;
      p.y = 368;
      ally.x = 660;
      ally.y = 380;
      stepWorld(s.w);
    }
    expect(ally.hp!.hp).toBeLessThan(hpA);
    expect(p.hp!.hp).toBe(hpP);
  });
});

describe("a player's projectile keeps its hand's lifesteal (D375, D369)", () => {
  it('an off-hand staff bolt heals by the staff\'s Leech, not the weapon hand\'s', async () => {
    const { makeGem } = await import('../../src/data/gems');
    const { runEffects } = await import('../../src/game/effects/run');
    const { SPELLS } = await import('../../src/data/spells');
    const { stepWorld } = await import('../../src/game/sim');
    const s = session('scholar');
    const p = s.localPlayer!;
    const c = p.pl!.char;
    c.equipment.main = makeItem('rapier', 'rare');
    const staff = makeItem('apprentice_staff', 'rare');
    staff.sockets = [makeGem('leech', { level: 30, q: 0 })];
    c.equipment.off = staff;
    c.twoHanded = false;
    refreshDerived(p);
    p.x = 300;
    p.y = 368;
    const foe = spawnEnemy(s.w, ENEMIES.shambler!, 600, 368, { tellS: 0 });
    foe.en!.state = 'dormant';
    foe.hp!.hp = foe.hp!.max = 1e6;
    p.hp!.hp = p.hp!.max * 0.3;
    p.hp!.invulnUntil = 1e9;
    const hp0 = p.hp!.hp;
    runEffects(s.w, SPELLS.arcane_bolt!.effect, { sourceId: p.id, team: 0, x: p.x, y: p.y, aimX: 600, aimY: 368, targetId: 0, powerMult: 1, isSpell: true, isSkill: false, baseDamage: 20, windupS: 0, tag: 'spell:0', school: 'brain' });
    for (let i = 0; i < 90; i++) {
      foe.x = 600;
      foe.y = 368;
      stepWorld(s.w);
    }
    expect(foe.hp!.hp).toBeLessThan(1e6);
    expect(p.hp!.hp).toBeGreaterThan(hp0);
  });
});

describe('ground left by attacks tests the circle at the feet (D377)', () => {
  it('a player whose circle is clear of a fire puddle is not burned; one whose circle touches it is', async () => {
    const { spawnHazard } = await import('../../src/game/systems/hazards');
    const { PLAYER_DOT_DY, PLAYER_DOT_R } = await import('../../src/game/player/player');
    const { stepWorld } = await import('../../src/game/sim');
    const { inCombat } = await import('./inCombat');
    const run = (gap: number): number => {
      const s = session();
      const p = s.localPlayer!;
      inCombat(s.w);
      p.x = 640;
      p.y = 368;
      const foe = spawnEnemy(s.w, ENEMIES.shambler!, 1100, 600, { tellS: 0 });
      foe.en!.state = 'dormant';
      // a puddle above the player: its lower edge `gap` px above the top of the circle at the feet
      const r = 40;
      const cy = p.y + PLAYER_DOT_DY - PLAYER_DOT_R - gap - r;
      spawnHazard(s.w, 'firePuddle', [{ k: 'circle', x: p.x, y: cy, r }], 3, 1, foe.id);
      const hp0 = p.hp!.hp;
      for (let i = 0; i < 90; i++) {
        p.x = 640;
        p.y = 368;
        stepWorld(s.w);
      }
      return hp0 - p.hp!.hp;
    };
    expect(run(2)).toBe(0);
    expect(run(-3)).toBeGreaterThan(0);
  });
});

describe('the Nobody starts with nothing in hand (D378)', () => {
  it('no weapon: bare fists, only the loincloth and a gem', async () => {
    const { computeDerived } = await import('../../src/game/player/derived');
    const c = newCharacter('nobody', 'N', 'n', new Rng('n'));
    expect(c.equipment.main).toBeNull();
    expect(c.equipment.off).toBeNull();
    expect(c.bag).toEqual([]);
    expect(computeDerived(c).weapon.id).toBe('fists');
  });
});

describe("a player's one hitbox is the silver ring at the feet (D384)", () => {
  it('an enemy shot passing over the head but clear of the ring misses; one under the body that touches the ring hits', async () => {
    const { stepWorld } = await import('../../src/game/sim');
    const { inCombat } = await import('./inCombat');
    const { PLAYER_DOT_DY, PLAYER_DOT_R, hitCircleOf } = await import('../../src/game/player/player');
    const shot = (dy: number): number => {
      const s = session();
      const p = s.localPlayer!;
      inCombat(s.w);
      p.x = 640;
      p.y = 368;
      const foe = spawnEnemy(s.w, ENEMIES.shambler!, 300, 368 + dy, { tellS: 0 });
      foe.en!.state = 'dormant';
      s.w.spawn('projectile', 400, p.y + dy, {
        radius: 4,
        team: 1,
        vx: 500,
        vy: 0,
        pr: { ownerId: foe.id, team: 1, dmg: { physical: 30 }, status: [], control: null, kind: 'normal', speed: 500, homing: 0, targetId: 0, until: s.w.time + 3, pierce: 0, hit: new Set(), poiseDmg: 0, onImpact: null, parryable: false, reflected: false, returns: false, returning: false, drawId: 'e_bolt', color: '#fff', reviveValue: 0, knockback: 0, lob: null, curve: 0, isSpell: false, isSkill: false, sourceTag: '' },
      });
      const hp0 = p.hp!.hp;
      for (let i = 0; i < 60; i++) {
        p.x = 640;
        p.y = 368;
        stepWorld(s.w);
      }
      return hp0 - p.hp!.hp;
    };
    expect(hitCircleOf({ x: 0, y: 0, radius: 14, pl: {} as never })).toEqual({ x: 0, y: PLAYER_DOT_DY, r: PLAYER_DOT_R });
    // 12 px above the centre: inside the old 14 px body circle, clear of the ring (its top is 8 px above the centre)
    expect(shot(-PLAYER_DOT_R + PLAYER_DOT_DY - 4 - 2)).toBe(0);
    // 22 px below the centre: outside the old body circle, inside the ring
    expect(shot(22)).toBeGreaterThan(0);
  });
});

describe('two-handed swings cost 30% more stamina (D385)', () => {
  it('the same longsword swing: ×1.3 two-handed; a bow (two-handed only) and a one-handed swing unchanged', async () => {
    const { stepWorld } = await import('../../src/game/sim');
    const { ACTION_BIT, emptyInput } = await import('../../src/engine/input/actions');
    const { swingStamina, TWO_HAND_SWING_STAMINA } = await import('../../src/game/player/player');
    const spent = (twoHanded: boolean): number => {
      const s = session();
      const p = s.localPlayer!;
      const c = p.pl!.char;
      c.equipment.main = makeItem('longsword', 'common');
      c.equipment.off = null;
      c.twoHanded = twoHanded;
      refreshDerived(p);
      p.stam!.max = p.stam!.cur = 500;
      p.pl!.input = { ...emptyInput(), aimX: p.x + 100, aimY: p.y, buttons: ACTION_BIT.attack, pressed: ACTION_BIT.attack };
      const before = p.stam!.cur;
      stepWorld(s.w);
      return before - p.stam!.cur;
    };
    const one = spent(false);
    const two = spent(true);
    expect(one).toBeGreaterThan(0);
    expect(two / one).toBeCloseTo(TWO_HAND_SWING_STAMINA, 2);
    const s = session();
    const p = s.localPlayer!;
    p.pl!.char.equipment.main = makeItem('bow', 'common');
    p.pl!.char.twoHanded = true;
    refreshDerived(p);
    expect(swingStamina(p)).toBe(p.pl!.derived.weapon.stamina);
  });
});

describe('a Leech gem shows what it heals in its weapon (D386)', () => {
  it('the same gem reads ×1.5 in a Medium weapon and ×2 in a Slow one; loose or in a staff as listed', async () => {
    const { makeGem, perkText } = await import('../../src/data/gems');
    const { leechMultIn } = await import('../../src/ui/tooltip');
    const g = makeGem('leech', { level: 30, q: 0 });
    const p = g.perks[0]!;
    const num = (t: string): number => parseFloat(t.replace(/[^0-9.]/g, ''));
    const fast = num(perkText(p, leechMultIn(makeItem('rapier', 'rare'))));
    const medium = num(perkText(p, leechMultIn(makeItem('longsword', 'rare'))));
    const slow = num(perkText(p, leechMultIn(makeItem('greataxe', 'rare'))));
    expect(num(perkText(p))).toBeCloseTo(fast, 6);
    expect(medium / fast).toBeCloseTo(1.5, 1);
    expect(slow / fast).toBeCloseTo(2, 1);
    expect(leechMultIn(makeItem('apprentice_staff', 'rare'))).toBe(1);
    expect(leechMultIn(null)).toBe(1);
  });
});

describe("The Fine Print's Terms and Conditions leaves room (D389)", () => {
  it('only every other lane strikes, one set, with gaps of at least twice the hit circle between', async () => {
    const { resolvePattern, ROOM_MIN_Y, ROOM_MAX_Y } = await import('../../src/game/combat/patterns');
    const { PLAYER_DOT_R } = await import('../../src/game/player/player');
    const { Room } = await import('../../src/game/room');
    const atk = ENEMIES.fine_print!.attacks.find((a) => a.id === 'terms_and_conditions')!;
    const sets = resolvePattern(atk.pattern!, { ox: 640, oy: 368, facing: 0, tx: 640, ty: 368, players: [], rng: new Rng('fp'), room: Room.empty(), telegraphS: 1 });
    expect(sets.length).toBe(1);
    const lanes = sets[0]!.shapes.map((sh) => sh as { k: string; y: number; w: number }).sort((a, b) => a.y - b.y);
    expect(lanes.length).toBe(5);
    for (let i = 1; i < lanes.length; i++) {
      const gap = lanes[i]!.y - lanes[i - 1]!.y - lanes[i]!.w;
      expect(gap).toBeGreaterThanOrEqual(PLAYER_DOT_R * 4);
    }
    expect(lanes[0]!.y - lanes[0]!.w / 2).toBeGreaterThan(ROOM_MIN_Y);
    expect(lanes[4]!.y + lanes[4]!.w / 2).toBeLessThan(ROOM_MAX_Y);
  });
});

describe('enemies attack only from within a projectile\'s reach (D390)', () => {
  it('a caster with a room-wide attack, far away, walks in first and attacks only within reach', async () => {
    const { World } = await import('../../src/game/world');
    const { Room } = await import('../../src/game/room');
    const { spawnPlayer } = await import('../../src/game/player/player');
    const { stepWorld } = await import('../../src/game/sim');
    const { ENEMY_PROJECTILE_RANGE } = await import('../../src/game/combat/formulas');
    const w = new World('RANGE', Room.empty());
    const c = newCharacter('knight', 'Joe', 'p1', new Rng('r'));
    const p = spawnPlayer(w, c, 0, true, 120, 368);
    w.god = true;
    const foe = spawnEnemy(w, ENEMIES.fine_print!, 1160, 368, { tellS: 0 });
    const d0 = Math.hypot(foe.x - p.x, foe.y - p.y);
    expect(d0).toBeGreaterThan(ENEMY_PROJECTILE_RANGE + 200);
    let firstAttackAt = -1;
    for (let i = 0; i < 60 * 20 && firstAttackAt < 0; i++) {
      p.x = 120;
      p.y = 368;
      stepWorld(w);
      if (foe.en!.attack) firstAttackAt = Math.hypot(foe.x - p.x, foe.y - p.y) - p.radius;
    }
    expect(firstAttackAt).toBeGreaterThan(0);
    expect(firstAttackAt).toBeLessThanOrEqual(ENEMY_PROJECTILE_RANGE + 1);
  });

  it('an enemy that cannot move closer (stationary) still attacks from where it is', async () => {
    const { canCloseIn } = await import('../../src/game/enemies/ai');
    const s = session();
    const turret = spawnEnemy(s.w, { ...ENEMIES.shambler!, moveStyle: 'stationary' }, 600, 368, { tellS: 0 });
    expect(canCloseIn(turret)).toBe(false);
    const walker = spawnEnemy(s.w, ENEMIES.shambler!, 600, 368, { tellS: 0 });
    expect(canCloseIn(walker)).toBe(true);
  });
});

describe('the death screen says what killed you, and how hard (D391)', () => {
  it('an enemy attack by name, a burn from it, friendly fire, and a fall', async () => {
    const { hurtText, rawDamage, hitAlly } = await import('../../src/game/combat/damage');
    const { enemyAttackSpec } = await import('../../src/game/enemies/attacks');
    const { inCombat } = await import('./inCombat');
    const s = session();
    const p = s.localPlayer!;
    inCombat(s.w);
    const foe = spawnEnemy(s.w, ENEMIES.shambler!, p.x - 60, p.y, { tellS: 0 });
    foe.en!.state = 'alert';
    const atk = ENEMIES.shambler!.attacks[0]!;
    p.hp!.hp = p.hp!.max = 5000;
    hitPlayer(s.w, foe.id, p, enemyAttackSpec(foe, atk), foe.x, foe.y);
    const hurt = p.pl!.lastHurt!;
    expect(hurt.by).toBe(`${ENEMIES.shambler!.name} (${atk.name})`);
    expect(hurt.amount).toBeGreaterThan(0);
    expect(hurtText(p)).toBe(`Killed by ${ENEMIES.shambler!.name} (${atk.name}): ${Math.round(hurt.amount)} damage.`);
    rawDamage(s.w, p, 12, 'fire', foe.id, true, 'Burn');
    expect(hurtText(p, 'Downed')).toBe(`Downed by Burn from ${ENEMIES.shambler!.name}: 12 damage.`);
    const ally = s.joinPlayer(newCharacter('knight', 'Ann', 'p2', new Rng('a'))).entity!;
    p.pl!.iframesUntil = 0;
    p.hp!.invulnUntil = 0;
    const spec = emptySpec('player');
    spec.dmg.physical = 40;
    hitAlly(s.w, ally, p, spec, ally.x, ally.y);
    expect(p.pl!.lastHurt!.by).toBe('Ann (friendly fire)');
    rawDamage(s.w, p, 30, 'physical', 0, true, 'a fall');
    expect(hurtText(p)).toBe('Killed by a fall: 30 damage.');
  });
});

describe("the Landlord's Clerk's papers hurt once a volley (D392)", () => {
  it('three papers of one volley landing deal what one does; a second volley hurts again', async () => {
    const { stepWorld } = await import('../../src/game/sim');
    const { inCombat } = await import('./inCombat');
    const { spawnEnemyProjectile, enemyAttackSpec } = await import('../../src/game/enemies/attacks');
    const atk = ENEMIES.landlords_clerk!.attacks.find((a) => a.id === 'eviction_notices')!;
    expect(atk.volleyOnce).toBe(true);
    const taken = (papers: number, volleys = 1): number => {
      const s = session();
      const p = s.localPlayer!;
      inCombat(s.w);
      p.hp!.hp = p.hp!.max = 5000;
      const clerk = spawnEnemy(s.w, ENEMIES.landlords_clerk!, p.x - 200, p.y, { tellS: 0 });
      clerk.en!.state = 'dormant';
      const pat = { ...(atk.pattern as Extract<NonNullable<typeof atk.pattern>, { kind: 'projectile' }>), homing: 0 };
      for (let v = 0; v < volleys; v++) {
        const spec = enemyAttackSpec(clerk, atk);
        spec.attackId = s.w.newAttackId();
        spec.volleyOnce = true;
        for (let i = 0; i < papers; i++) {
          const pr = spawnEnemyProjectile(s.w, clerk, 0, 260, pat, spec, p.id, p.x, p.y);
          pr.x = p.x - 30 - i * 3;
          pr.y = p.y + 9;
        }
        for (let i = 0; i < 40; i++) {
          p.x = 640;
          stepWorld(s.w);
          p.pl!.iframesUntil = 0;
          p.hp!.invulnUntil = 0;
        }
      }
      return 5000 - p.hp!.hp;
    };
    const one = taken(1);
    expect(one).toBeGreaterThan(0);
    expect(taken(3)).toBeCloseTo(one, 5);
    expect(taken(3, 2)).toBeCloseTo(one * 2, 5);
  });
});
