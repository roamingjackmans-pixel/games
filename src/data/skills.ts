// CONTENT_ITEMS §4.1: 3 skills per weapon class (60 with the hybrids), unlocked in order Q → E → R by item tier.
// Damage multipliers are × weapon damage (the effect system builds the weapon's damage spec).
import type { EffectDef, PatternDef, SkillDef } from '../game/types';

const circle = (r: number): PatternDef => ({ kind: 'circle', r, anchor: 'self' });
const atAim = (r: number): PatternDef => ({ kind: 'circle', r, anchor: 'aim' });
const thrust = (w: number, l: number): PatternDef => ({ kind: 'line', w, l, anchor: 'self' });
const arc = (angleDeg: number, r: number): PatternDef => ({ kind: 'cone', angleDeg, r, anchor: 'self' });
const hit = (pattern: PatternDef, mult: number, extra: Partial<Extract<EffectDef, { op: 'damage' }>> = {}): EffectDef => ({ op: 'damage', pattern, mult, type: 'physical', ...extra });

const S = (id: string, weapon: string, key: 0 | 1 | 2, name: string, cooldownS: number, stamina: number, effect: EffectDef[], description: string, extra: Partial<SkillDef> = {}): SkillDef => ({
  id,
  name,
  weapon,
  key,
  cooldownS,
  stamina,
  effect,
  description,
  ...extra,
});

const LIST: SkillDef[] = [
  // Greathammer
  S('greathammer_earthshaker', 'greathammer', 0, 'Earthshaker', 10, 30, [hit(circle(140), 2.2, { knockback: 160, guaranteedStagger: true })], 'Slam the ground: circle(140) ×2.2, knockback, guaranteed stagger.', { castMs: 450, castHyperArmor: true }),
  S('greathammer_meteor_lunge', 'greathammer', 1, 'Meteor Lunge', 14, 35, [{ op: 'dash', distance: 300, durationS: 0.5, toward: 'aim', iframes: 'redOnly', leap: true, hitOnLand: hit(circle(120), 2.5) }], 'Leap to the cursor (i-frames vs Red, not Piercing) and land circle(120) ×2.5.'),
  S('greathammer_unstoppable', 'greathammer', 2, 'Unstoppable', 24, 20, [{ op: 'hyperArmor', durationS: 6 }, { op: 'buff', stat: 'damagePct', amount: 0.2, durationS: 6, id: 'unstoppable_dmg' }, { op: 'buff', stat: 'damageTakenPct', amount: -0.3, durationS: 6, id: 'unstoppable_def' }], '6 s of hyper armor, +20% damage, −30% damage taken.'),
  // Greataxe
  S('greataxe_cleave_spin', 'greataxe', 0, 'Cleave Spin', 9, 26, [hit(circle(120), 1.6)], 'Spin: 360° ×1.6.', { castMs: 250, castHyperArmor: true }),
  S('greataxe_execute', 'greataxe', 1, 'Execute', 15, 30, [hit(thrust(60, 150), 1.5, { critVs: 'hpBelow(25)', critMult: 3.5 / 1.5, onKill: [{ op: 'resetCooldown', skill: 'this', fraction: 0.5 }] })], 'thrust(60,150) ×1.5; ×3.5 below 25% HP; a kill refunds half the cooldown.', { castMs: 300 }),
  S('greataxe_bloodlust', 'greataxe', 2, 'Bloodlust', 22, 15, [{ op: 'buff', stat: 'damagePct', amount: 0.1, durationS: 8, maxStacks: 5, stackOn: 'kill', id: 'bloodlust', onStack: [{ op: 'heal', pct: 0.03 }] }], 'For 8 s each kill grants +10% damage (max 5) and 3% HP.'),
  // Colossal Sword
  S('colossal_guillotine', 'colossal_sword', 0, 'Guillotine', 12, 32, [hit(thrust(80, 220), 2.6, { poiseDmg: 120 })], 'Overhead thrust(80,220) ×2.6, poise damage 120.', { castMs: 500, castHyperArmor: true }),
  S('colossal_stomp', 'colossal_sword', 1, 'Stomp', 10, 20, [hit({ kind: 'ring', rIn: 0, rOut: 170, anchor: 'self' }, 0.8, { guaranteedStagger: true })], 'ring(0,170) ×0.8, staggers everything that is not a boss.', { castMs: 250 }),
  S('colossal_charged_swing', 'colossal_sword', 2, 'Charged Swing', 16, 40, [{ op: 'charge', maxS: 1.5, minMult: 1.5, maxMult: 4.0, hyperArmor: true, release: hit(arc(140, 200), 1) }], 'Hold up to 1.5 s, release arc(140°,200) ×1.5 → ×4.0; hyper armor while charging.'),
  // Crossbow
  S('crossbow_piercing_bolt', 'crossbow', 0, 'Piercing Bolt', 8, 18, [hit(thrust(24, 800), 2.0)], 'line(24,800) through everything ×2.0.', { castMs: 150 }),
  S('crossbow_explosive_bolt', 'crossbow', 1, 'Explosive Bolt', 12, 22, [{ op: 'damage', pattern: { kind: 'projectile', speed: 620, r: 6, drawId: 'p_bolt', onImpact: { kind: 'circle', r: 100, anchor: 'point' } }, mult: 1.8, type: 'fire', status: { id: 'burn', buildup: 40 } }], 'A bolt that explodes: circle(100) ×1.8 Fire, Burn 40.', { castMs: 150 }),
  S('crossbow_rapid_fire', 'crossbow', 2, 'Rapid Fire', 18, 30, [{ op: 'repeat', count: 5, intervalS: 0.24, reaim: true, effect: { op: 'damage', pattern: { kind: 'projectile', speed: 620, r: 6, drawId: 'p_bolt' }, mult: 1.0, type: 'physical' } }], '5 bolts in 1.2 s ×1.0 each, no reload.'),
  // Club
  S('club_bonk', 'club', 0, 'Bonk', 8, 22, [hit(thrust(60, 100), 2.0, { guaranteedStagger: true, bossPoiseMult: 2 })], 'Overhead ×2.0, guaranteed stagger (bosses take 2× poise).', { castMs: 350, castHyperArmor: true }),
  S('club_wild_swing', 'club', 1, 'Wild Swing', 11, 26, [hit(arc(270, 110), 1.3)], 'arc(270°,110) ×1.3.', { castMs: 250 }),
  S('club_tantrum', 'club', 2, 'Tantrum', 20, 15, [{ op: 'buff', stat: 'attackSpeedPct', amount: 0.3, durationS: 6, id: 'tantrum_as' }, { op: 'buff', stat: 'poiseDamagePct', amount: 0.2, durationS: 6, id: 'tantrum_poise' }], '+30% attack speed and +20% poise damage for 6 s.'),
  // Twin Daggers
  S('daggers_shadow_step', 'twin_daggers', 0, 'Shadow Step', 9, 14, [{ op: 'dash', distance: 200, durationS: 0.22, toward: 'aim', iframes: 'all', through: true, hitOnEntry: hit(circle(55), 1.2), hitOnExit: hit(circle(60), 1.2) }], 'Dash 200 px through the aim, ×1.2 on entry and exit; ends behind the target.'),
  S('daggers_fan_of_knives', 'twin_daggers', 1, 'Fan of Knives', 10, 16, [{ op: 'damage', pattern: { kind: 'projectile', speed: 600, r: 5, count: 6, spreadDeg: 60, drawId: 'p_knife' }, mult: 0.7, type: 'physical', status: { id: 'bleed', buildup: 15 } }], '6 knives in a 60° fan ×0.7, Bleed 15 each.', { castMs: 120 }),
  S('daggers_flurry', 'twin_daggers', 2, 'Flurry', 16, 24, [{ op: 'channel', durationS: 1.2, tickS: 0.15, moveSpeedPct: 0, hyperArmor: true, followAim: true, tick: [hit(arc(100, 80), 0.6)] }], '8 hits in 1.2 s ×0.6, rooted, hyper armor.'),
  // Rapier
  S('rapier_lunge', 'rapier', 0, 'Lunge', 7, 16, [hit(thrust(30, 260), 1.8), { op: 'dash', distance: 160, durationS: 0.18, toward: 'aim', iframes: 'none' }], 'Dash-thrust(30,260) ×1.8.', { castMs: 120 }),
  S('rapier_riposte_stance', 'rapier', 1, 'Riposte Stance', 14, 12, [{ op: 'stance', durationS: 1.0, onHitTaken: 'parry', riposteMult: 2 }], '1 s stance: any non-Red hit is parried and riposted ×2 (no shield needed).'),
  S('rapier_thousand_cuts', 'rapier', 2, 'Thousand Cuts', 18, 26, [{ op: 'channel', durationS: 0.9, tickS: 0.18, moveSpeedPct: 0.3, followAim: true, tick: [hit(thrust(28, 130), 1.0, { status: { id: 'bleed', buildup: 20 } })] }], '5 thrusts in 0.9 s ×1.0, Bleed 20 each.'),
  // Katana
  S('katana_iai_slash', 'katana', 0, 'Iai Slash', 10, 20, [hit(thrust(60, 260), 2.4)], '0.5 s sheath (hyper armor), then thrust(60,260) ×2.4.', { castMs: 500, castHyperArmor: true }),
  S('katana_crescent', 'katana', 1, 'Crescent', 9, 18, [{ op: 'damage', pattern: { kind: 'projectile', speed: 500, r: 22, pierce: 99, drawId: 'p_crescent', range: 650 }, mult: 1.3, type: 'physical' }], 'A wave of steel (500 px/s) through enemies ×1.3.', { castMs: 200 }),
  S('katana_blood_moon', 'katana', 2, 'Blood Moon', 20, 15, [{ op: 'buff', stat: 'bleedBuildupPct', amount: 1.0, durationS: 8, id: 'bloodmoon_b' }, { op: 'buff', stat: 'bleedBurstPct', amount: 0.5, durationS: 8, id: 'bloodmoon_p' }], '8 s: Bleed buildup ×2, Bleed bursts +50%.'),
  // Bow
  S('bow_volley', 'bow', 0, 'Volley', 10, 18, [hit({ kind: 'randomCircles', n: 5, r: 60, within: 110, anchor: 'aim' }, 1.2, { telegraphS: 0.8 })], 'Five arrows rain around the cursor after 0.8 s ×1.2.'),
  S('bow_piercing_shot', 'bow', 1, 'Piercing Shot', 8, 16, [hit(thrust(20, 900), 2.0)], 'line(20,900) ×2.0.', { castMs: 200 }),
  S('bow_rain', 'bow', 2, 'Rain', 20, 30, [hit({ kind: 'randomCircles', n: 12, r: 40, within: 180, anchor: 'aim', overS: 3 }, 0.8, { telegraphS: 0.4 })], '12 arrows over 3 s on circle(180) at the cursor ×0.8 each.'),
  // Whip
  S('whip_lash', 'whip', 0, 'Lash', 7, 14, [hit(thrust(30, 260), 1.6, { pull: true })], 'thrust(30,260) ×1.6, pulls non-boss enemies to you.', { castMs: 200 }),
  S('whip_crack', 'whip', 1, 'Crack', 10, 18, [hit(arc(60, 250), 1.2, { guaranteedStagger: true, status: { id: 'shock', buildup: 30 } })], 'cone(60°,250) ×1.2, staggers, Shock 30.', { castMs: 200 }),
  S('whip_serpent_coil', 'whip', 2, 'Serpent Coil', 16, 24, [{ op: 'channel', durationS: 3, tickS: 0.4, moveSpeedPct: 0.6, tick: [hit(circle(180), 0.5)] }], '3 s spin: 360° r180 ×0.5 every 0.4 s, moving at 60%.'),
  // Longsword
  S('longsword_shield_breaker', 'longsword', 0, 'Shield Breaker', 8, 18, [hit(thrust(40, 160), 1.8, { ignoreFrontGuard: true, poiseDmg: 125 })], 'thrust(40,160) ×1.8, ignores front guards, +100 poise damage.', { castMs: 250 }),
  S('longsword_spin_slash', 'longsword', 1, 'Spin Slash', 11, 22, [hit(circle(110), 1.4)], '360° ×1.4.', { castMs: 200 }),
  S('longsword_battle_cry', 'longsword', 2, 'Battle Cry', 20, 10, [{ op: 'buff', stat: 'damagePct', amount: 0.15, durationS: 8, target: 'party', r: 600, id: 'battlecry_dmg' }, { op: 'buff', stat: 'poiseThreshold', amount: 20, durationS: 8, target: 'party', r: 600, id: 'battlecry_poise' }], 'Party +15% damage and +20 poise for 8 s.'),
  // Spear
  S('spear_impale', 'spear', 0, 'Impale', 8, 18, [hit(thrust(30, 220), 2.0, { root: 1 })], 'thrust(30,220) ×2.0, roots non-bosses 1 s.', { castMs: 200 }),
  S('spear_sweep', 'spear', 1, 'Sweep', 10, 20, [hit(arc(300, 150), 1.2, { knockback: 120 })], 'arc(300°,150) ×1.2, knockback 120.', { castMs: 250 }),
  S('spear_phalanx', 'spear', 2, 'Phalanx', 18, 10, [{ op: 'buff', stat: 'defenseAll', amount: 0, durationS: 4, id: 'phalanx' }], '4 s: two-hand guard blocks 80% physical / 40% elemental, and you can thrust while guarding.'),
  // Battleaxe
  S('battleaxe_cleave', 'battleaxe', 0, 'Cleave', 8, 20, [hit(arc(140, 130), 1.8)], 'arc(140°,130) ×1.8.', { castMs: 300, castHyperArmor: true }),
  S('battleaxe_hook', 'battleaxe', 1, 'Hook', 12, 18, [hit(thrust(40, 180), 1.2, { pull: true, status: { id: 'bleed', buildup: 30 } })], 'thrust(40,180) ×1.2, pulls, Bleed 30.', { castMs: 200 }),
  S('battleaxe_frenzy', 'battleaxe', 2, 'Frenzy', 20, 15, [{ op: 'buff', stat: 'attackSpeedPct', amount: 0.25, durationS: 6, id: 'frenzy_as' }, { op: 'buff', stat: 'moveSpeedPct', amount: 0.25, durationS: 6, id: 'frenzy_ms' }], '+25% attack and move speed for 6 s.'),
  // Mace
  S('mace_holy_smite', 'mace', 0, 'Holy Smite', 9, 22, [{ op: 'damage', pattern: atAim(90), mult: 2.0, type: 'holy' }], 'circle(90) ×2.0 Holy in front of you.', { castMs: 350, range: 80 }),
  S(
    'mace_consecrate',
    'mace',
    1,
    'Consecrate',
    15,
    20,
    [
      {
        op: 'zone',
        pattern: circle(160),
        durationS: 6,
        tickS: 1,
        hazard: 'consecrate',
        tick: [{ op: 'damage', pattern: { kind: 'circle', r: 12, anchor: 'target' }, mult: 0.3, type: 'holy', onlyUndead: true }],
        allyTick: [
          { op: 'heal', pct: 0.02, target: 'target' },
          { op: 'buff', stat: 'holyDamagePct', amount: 0.2, durationS: 1.2, target: 'target', id: 'consecrate_holy' },
        ],
      },
    ],
    'circle(160) for 6 s: allies inside +20% Holy damage and heal 2%/s; undead inside take ×0.3 per second.',
  ),
  S('mace_judgment', 'mace', 2, 'Judgment', 20, 30, [hit(thrust(60, 110), 1.6, { critVs: 'staggered', critMult: 3.0 / 1.6 })], 'Overhead ×1.6; ×3.0 against staggered or riposte-staggered enemies.', { castMs: 400, castHyperArmor: true }),
  // Halberd
  S('halberd_moulinet', 'halberd', 0, 'Moulinet', 9, 24, [{ op: 'sequence', steps: [{ effect: hit(circle(135), 1.3), delayS: 0 }, { effect: hit(circle(135), 1.3), delayS: 0.5 }] }], 'Two 360° sweeps ×1.3 each over 1 s.', { castMs: 200, castHyperArmor: true }),
  S('halberd_hook_pull', 'halberd', 1, 'Hook Pull', 12, 18, [hit(thrust(40, 200), 1.2, { pull: true })], 'thrust(40,200) ×1.2, pulls.', { castMs: 200 }),
  S('halberd_vault', 'halberd', 2, 'Vault', 12, 20, [{ op: 'dash', distance: 260, durationS: 0.45, toward: 'aim', iframes: 'redOnly', leap: true, hitOnLand: hit(thrust(60, 120), 1.5) }], 'Leap 260 px (i-frames vs Red, not Piercing), land thrust(60,120) ×1.5.'),
  // Twin Axes
  S('twinaxes_whirlwind', 'twin_axes', 0, 'Whirlwind', 12, 26, [{ op: 'channel', durationS: 2, tickS: 0.3, moveSpeedPct: 0.8, tick: [hit(circle(110), 0.6)] }], '2 s spin: 360° r110 ×0.6 every 0.3 s, moving at 80%.'),
  S('twinaxes_throw', 'twin_axes', 1, 'Throw', 8, 14, [{ op: 'damage', pattern: { kind: 'projectile', speed: 560, r: 10, count: 2, spreadDeg: 14, returns: true, range: 420, drawId: 'p_axe' }, mult: 1.2, type: 'physical' }], 'Two axes ×1.2 that come back (hit twice).', { castMs: 150 }),
  S('twinaxes_rampage', 'twin_axes', 2, 'Rampage', 22, 10, [{ op: 'buff', stat: 'attackSpeedPct', amount: 0.05, durationS: 10, maxStacks: 5, stackOn: 'kill', id: 'rampage', onStack: [{ op: 'resetCooldown', skill: 'twinaxes_throw' }] }], '10 s: kills reset Throw and grant +5% attack speed (max 5).'),
  // Hollow Maul (Bonk + Brain, Void)
  S(
    'hollowmaul_singularity',
    'hollow_maul',
    0,
    'Singularity',
    12,
    28,
    [{ op: 'pull', r: 200, speed: 280, durationS: 0.6, at: 'aim', bosses: 'immune' }, hit(atAim(110), 1.9, { delayS: 0.6, poiseDmg: 70 })],
    'Open a hole at the cursor: pulls foes within 200 px in for 0.6 s, then crushes circle(110) ×1.9.',
    { castMs: 300, range: 260 },
  ),
  S(
    'hollowmaul_event_horizon',
    'hollow_maul',
    1,
    'Event Horizon',
    15,
    24,
    [hit(circle(120), 1.2), { op: 'zone', pattern: circle(140), durationS: 4, tickS: 0.5, slowPct: 0.35, enemiesOnly: true, tick: [{ op: 'damage', pattern: { kind: 'circle', r: 12, anchor: 'target' }, mult: 0.3, type: 'void' }] }],
    'Slam circle(120) ×1.2 and leave a void for 4 s: foes inside are 35% slower and take ×0.3 every 0.5 s.',
    { castMs: 400, castHyperArmor: true },
  ),
  S('hollowmaul_null_shell', 'hollow_maul', 2, 'Null Shell', 22, 15, [{ op: 'barrier', pctMaxHp: 0.25, durationS: 6 }, { op: 'hyperArmor', durationS: 3 }], 'A shell of nothing: a barrier of 25% max HP for 6 s and 3 s of hyper armor.'),
  // Spellblade (Slicey + Brain, Magic)
  S('spellblade_arc_wave', 'spellblade', 0, 'Arc Wave', 8, 18, [{ op: 'damage', pattern: { kind: 'projectile', speed: 560, r: 20, pierce: 99, drawId: 'p_crescent', range: 600 }, mult: 1.4, type: 'magic' }], 'Fling the edge: a magic wave (560 px/s) through enemies ×1.4.', { castMs: 180 }),
  S('spellblade_blink_strike', 'spellblade', 1, 'Blink Strike', 11, 18, [{ op: 'teleport', distance: 220, toward: 'aim' }, hit(circle(95), 1.7)], 'Blink 220 px toward the cursor and strike circle(95) ×1.7.', { castMs: 120 }),
  S(
    'spellblade_runic_edge',
    'spellblade',
    2,
    'Runic Edge',
    20,
    15,
    [
      { op: 'buff', stat: 'damagePct', amount: 0.25, durationS: 8, id: 'runic_edge_dmg' },
      { op: 'buff', stat: 'castSpeedPct', amount: 0.25, durationS: 8, id: 'runic_edge_cast' },
    ],
    'The runes wake: +25% damage and +25% cast speed for 8 s.',
  ),
  // Censer Flail (Bonk + Prayer, Fire)
  S(
    'censer_incense',
    'censer_flail',
    0,
    'Incense',
    14,
    20,
    [
      {
        op: 'zone',
        pattern: circle(130),
        durationS: 4,
        tickS: 0.5,
        follow: true,
        enemiesOnly: true,
        tick: [{ op: 'damage', pattern: { kind: 'circle', r: 12, anchor: 'target' }, mult: 0.35, type: 'fire', status: { id: 'burn', buildup: 15 } }],
      },
    ],
    'Swing the censer: a 130 px cloud of burning incense follows you for 4 s, ×0.35 Fire and Burn 15 every 0.5 s.',
    { castMs: 250 },
  ),
  S(
    'censer_brimstone',
    'censer_flail',
    1,
    'Brimstone',
    11,
    22,
    [{ op: 'damage', pattern: { kind: 'projectile', speed: 480, r: 10, lob: true, drawId: 'p_magic', onImpact: { kind: 'circle', r: 110, anchor: 'point' } }, mult: 1.9, type: 'fire', status: { id: 'burn', buildup: 45 } }],
    'Lob a coal from the censer: it bursts circle(110) ×1.9 Fire, Burn 45.',
    { castMs: 220 },
  ),
  S(
    'censer_sanctified_flame',
    'censer_flail',
    2,
    'Sanctified Flame',
    22,
    15,
    [
      { op: 'heal', pct: 0.15, overS: 3 },
      { op: 'buff', stat: 'damagePct', amount: 0.15, durationS: 6, id: 'sanctified_flame' },
    ],
    'Breathe in the holy smoke (not recommended): heal 15% over 3 s and +15% damage for 6 s.',
  ),
  // Dawn Glaive (Slicey + Prayer, Holy)
  S('glaive_sunrise', 'dawn_glaive', 0, 'Sunrise', 9, 22, [hit(arc(180, 160), 1.8, { knockback: 120 })], 'A rising half-moon arc(180°,160) ×1.8 that knocks foes back.', { castMs: 300, castHyperArmor: true }),
  S('glaive_halo_throw', 'dawn_glaive', 1, 'Halo Throw', 10, 18, [{ op: 'damage', pattern: { kind: 'projectile', speed: 520, r: 18, pierce: 99, returns: true, range: 420, drawId: 'p_crescent' }, mult: 1.2, type: 'holy' }], 'Throw the blade like a halo: ×1.2 Holy out and ×1.2 back.', { castMs: 180 }),
  S('glaive_judgement_ray', 'dawn_glaive', 2, 'Judgement Ray', 18, 28, [hit(thrust(44, 700), 2.4, { telegraphS: 0.5 })], 'Point at the problem: after 0.5 s a ray of dawn line(44,700) ×2.4 Holy.', { castMs: 200 }),
];

export const SKILLS: Record<string, SkillDef> = Object.fromEntries(LIST.map((s) => [s.id, s]));
