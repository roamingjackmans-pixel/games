// CONTENT_SPELLS_CLASSES §1–2: 14 Brain (staff) and 14 Prayer (talisman) spells. `base` numbers are
// spellBase; the caster's power factor (Brain/Prayer curve × casting tool) multiplies them.
import type { DamageType, EffectDef, PatternDef, SpellDef } from '../game/types';

const dmg = (pattern: PatternDef, base: number, type: DamageType, extra: Partial<Extract<EffectDef, { op: 'damage' }>> = {}): EffectDef => ({ op: 'damage', pattern, base, type, ...extra });
const proj = (speed: number, r: number, extra: Partial<Extract<PatternDef, { kind: 'projectile' }>> = {}): PatternDef => ({ kind: 'projectile', speed, r, drawId: 'p_magic', ...extra });

const B = (id: string, name: string, req: number, castS: number, cooldownS: number, stamina: number, effect: EffectDef[], description: string, element?: DamageType): SpellDef => ({
  id,
  name,
  school: 'brain',
  req,
  castS,
  cooldownS,
  stamina,
  effect,
  description,
  aimed: true,
  ...(element ? { element } : {}),
});
const P = (id: string, name: string, req: number, castS: number, cooldownS: number, stamina: number, effect: EffectDef[], description: string, element?: DamageType): SpellDef => ({
  id,
  name,
  school: 'prayer',
  req,
  castS,
  cooldownS,
  stamina,
  effect,
  description,
  ...(element ? { element } : {}),
});

const BRAIN: SpellDef[] = [
  B('arcane_bolt', 'Arcane Bolt', 8, 0.3, 1.2, 8, [dmg(proj(700, 7), 24, 'void')], 'A bolt of arcane force: 24 (counts as Void). The bread and butter.', 'void'),
  B('scatter_shards', 'Scatter Shards', 10, 0.4, 4, 14, [dmg(proj(600, 6, { count: 5, spreadDeg: 50 }), 14, 'void')], '5 shards in a 50° fan, 14 each.', 'void'),
  B('frost_lance', 'Frost Lance', 12, 0.5, 5, 16, [dmg({ kind: 'line', w: 30, l: 420, anchor: 'self' }, 40, 'frost', { status: { id: 'chill', buildup: 50 } })], 'line(30,420) 40 Frost, Chill 50.', 'frost'),
  B('fireball', 'Fireball', 14, 0.6, 6, 18, [dmg(proj(520, 10, { onImpact: { kind: 'circle', r: 100, anchor: 'point', persist: { hazard: 'firePuddle', durationS: 2 } } }), 48, 'fire', { status: { id: 'burn', buildup: 50 } })], 'A fireball: circle(100) 48 Fire, Burn 50, a puddle for 2 s.', 'fire'),
  B('blink', 'Blink', 12, 0.1, 10, 10, [{ op: 'teleport', distance: 240, toward: 'aim' }], 'Teleport 240 px toward the cursor. Not i-frames: it escapes Piercing areas if you land outside them.'),
  B('chain_lightning', 'Chain Lightning', 16, 0.5, 7, 18, [{ op: 'chain', jumps: 4, r: 180, falloff: 0.15, hit: dmg({ kind: 'circle', r: 10, anchor: 'target' }, 36, 'lightning', { status: { id: 'shock', buildup: 40 } }) }], '36 Lightning that chains to 4 more enemies within 180 px (−15% per jump), Shock 40.', 'lightning'),
  B(
    'void_rift',
    'Void Rift',
    15,
    0.7,
    9,
    22,
    [{ op: 'zone', pattern: { kind: 'circle', r: 120, anchor: 'aim' }, durationS: 4, tickS: 0.5, hazard: 'voidRift', slowPct: 0.2, enemiesOnly: true, tick: [dmg({ kind: 'circle', r: 10, anchor: 'target' }, 12, 'void')] }],
    'circle(120) at the cursor for 4 s: 12 Void per 0.5 s, enemies inside −20% speed.',
    'void',
  ),
  B(
    'gravity_well',
    'Gravity Well',
    20,
    0.6,
    12,
    22,
    [{ op: 'zone', pattern: { kind: 'circle', r: 160, anchor: 'aim' }, durationS: 3, tickS: 0.5, hazard: 'gravityWell', enemiesOnly: true, tick: [], burst: dmg({ kind: 'circle', r: 160, anchor: 'point' }, 50, 'void') }],
    'circle(160) for 3 s pulling non-bosses to its centre (bosses −20% speed), then a 50 Void burst.',
    'void',
  ),
  B('arcane_beam', 'Arcane Beam', 22, 0.1, 11, 30, [{ op: 'channel', durationS: 2, tickS: 0.2, moveSpeedPct: 0.4, followAim: true, tick: [dmg({ kind: 'line', w: 26, l: 700, anchor: 'self' }, 18, 'void')] }], 'Channel 2 s: a line(26,700) beam that follows the cursor, 18 per 0.2 s; walk at 40%.', 'void'),
  B('mirror_images', 'Mirror Images', 24, 0.5, 18, 20, [{ op: 'decoy', count: 2, durationS: 6, tauntR: 250, illusion: true }], 'Two decoys for 6 s that pull enemies within 250 px.'),
  B(
    'time_dilation',
    'Time Dilation',
    28,
    0.6,
    20,
    26,
    [{ op: 'zone', pattern: { kind: 'circle', r: 200, anchor: 'aim' }, durationS: 5, tickS: 0.25, hazard: 'timeDilation', slowPct: 0.4, enemiesOnly: true, tick: [] }],
    'circle(200) at the cursor for 5 s: enemies inside act at 60% speed (bosses 80%).',
  ),
  B('meteor', 'Meteor', 30, 0.8, 16, 34, [dmg({ kind: 'circle', r: 170, anchor: 'aim' }, 160, 'fire', { telegraphS: 1.5, status: { id: 'burn', buildup: 100 }, knockback: 120 })], 'circle(170) at the cursor, lands after 1.5 s: 160 Fire, Burn 100, knockback.', 'fire'),
  B('overload', 'Overload', 26, 0.3, 30, 10, [{ op: 'modifyNext', count: 3, windowS: 8, mods: { powerPct: 0.5, noCooldown: true }, what: 'spell' }], 'Your next 3 spells within 8 s: +50% power and no cooldown.'),
  B('comet_barrage', 'Comet Barrage', 35, 1.0, 22, 40, [dmg({ kind: 'randomCircles', n: 8, r: 70, within: 260, anchor: 'aim', overS: 2 }, 44, 'fire', { telegraphS: 0.6, status: { id: 'burn', buildup: 30 } })], '8 comets within 260 px of the cursor over 2 s, 44 each, Burn 30.', 'fire'),
];

const PRAYER: SpellDef[] = [
  P('heal', 'Heal', 8, 1.0, 12, 20, [{ op: 'heal', pct: 0.25, overS: 2, interruptible: true, spell: true }], 'Heal yourself 25% of max HP over 2 s (a stagger interrupts it).'),
  P(
    'purify',
    'Purify',
    10,
    0.5,
    10,
    12,
    [
      { op: 'cleanse', what: ['statuses', 'controls'], target: 'party', r: 140 },
      dmg({ kind: 'circle', r: 140, anchor: 'self' }, 30, 'holy', { onlyUndead: true }),
    ],
    'You and allies within 140 px: clear all statuses; undead and void within 140 px take 30 Holy.',
    'holy',
  ),
  P('bless_weapon', 'Bless Weapon', 12, 0.6, 25, 14, [{ op: 'buff', stat: 'holyConvertPct', amount: 0.2, durationS: 20, id: 'bless' }], '20 s: your weapon deals +20% as Holy; undead and void take +15% more.', 'holy'),
  P('regen_aura', 'Regen Aura', 12, 0.8, 18, 18, [{ op: 'zone', pattern: { kind: 'circle', r: 180, anchor: 'self' }, durationS: 5, tickS: 1, hazard: 'regenAura', follow: true, alliesOnly: true, tick: [], allyTick: [{ op: 'heal', pct: 0.03, target: 'target', spell: true }] }], 'circle(180) around you for 5 s: allies inside heal 3% per second.'),
  P('sunray', 'Sunray', 14, 0.5, 6, 14, [dmg({ kind: 'line', w: 30, l: 450, anchor: 'self' }, 36, 'holy'), { op: 'reveal', r: 450, durationS: 4 }], 'line(30,450) 36 Holy, reveals hidden and invisible enemies for 4 s.', 'holy'),
  P(
    'ward_of_steel',
    'Ward of Steel',
    14,
    0.6,
    20,
    16,
    [
      { op: 'buff', stat: 'defenseAll', amount: 30, durationS: 10, id: 'ward_self' },
      { op: 'buff', stat: 'defenseAll', amount: 15, durationS: 10, target: 'others', r: 140, id: 'ward_party' },
    ],
    '10 s: +30 defense to all types for you; allies within 140 px get +15.',
  ),
  P('last_rites', 'Last Rites', 16, 0.8, 6, 18, [{ op: 'reviveValue', amount: 3, lanternAmount: 6, livingHealPct: 0.1 }], 'On a ghost within 120 px: 3.0 revive value (6.0 with a Ghost Lantern). On a living ally: heals 10%.'),
  P(
    'haste',
    'Haste',
    18,
    0.6,
    24,
    16,
    [
      { op: 'buff', stat: 'attackSpeedPct', amount: 0.15, durationS: 10, target: 'party', r: 140, id: 'haste_as' },
      { op: 'buff', stat: 'castSpeedPct', amount: 0.15, durationS: 10, target: 'party', r: 140, id: 'haste_cs' },
    ],
    '10 s: +15% attack and cast speed for you and allies within 140 px.',
  ),
  P('stone_skin', 'Stone Skin', 20, 0.5, 22, 18, [{ op: 'hyperArmor', durationS: 5 }, { op: 'buff', stat: 'physicalTakenPct', amount: -0.2, durationS: 5, id: 'stoneskin' }], '5 s of hyper armor and −20% physical damage taken.'),
  P('spirit_shield', 'Spirit Shield', 20, 0.6, 20, 18, [{ op: 'barrier', pctMaxHp: 0.2, durationS: 8, target: 'ally' }], 'A barrier absorbing 20% of max HP for 8 s on the ally under the cursor (or you).'),
  P('guardian_wall', 'Guardian Wall', 22, 0.7, 16, 20, [{ op: 'wall', pattern: { kind: 'line', w: 40, l: 200, anchor: 'aim' }, durationS: 6, blocks: ['projectiles', 'enemies'] }], 'A wall at the cursor for 6 s: blocks enemy projectiles and non-boss enemies; players pass.'),
  P('fortify_thermos', 'Fortify Thermos', 24, 0.5, 30, 10, [{ op: 'modifyNext', count: 1, windowS: 20, mods: { powerPct: 0.5 }, what: 'flask' }], 'Your next flask drink within 20 s heals +50% and clears statuses.'),
  P('martyrs_chain', "Martyr's Chain", 28, 0.8, 30, 22, [{ op: 'link', durationS: 12, splitPct: 0.5 }], 'Link to the ally under the cursor for 12 s: damage either of you takes is split 50/50.'),
  P(
    'sanctuary',
    'Sanctuary',
    30,
    1.2,
    40,
    36,
    [{ op: 'zone', pattern: { kind: 'circle', r: 180, anchor: 'aim' }, durationS: 8, tickS: 1, hazard: 'sanctuary', noStatusBuild: true, enemyDamagePct: 0.2, tick: [], allyTick: [{ op: 'heal', pct: 0.05, target: 'target', spell: true }] }],
    'circle(180) at the cursor for 8 s: statuses cannot build, allies heal 5%/s, enemies deal −20%.',
  ),
];

export const SPELLS: Record<string, SpellDef> = Object.fromEntries([...BRAIN, ...PRAYER].map((s) => [s.id, s]));
export const BRAIN_SPELLS = BRAIN.map((s) => s.id);
export const PRAYER_SPELLS = PRAYER.map((s) => s.id);
