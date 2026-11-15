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
