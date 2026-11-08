// CONTENT_ENEMIES §11 Boss 8 — The Landlord (The Abyss, final, 3 phases at 66% and 33%, then a fourth on a
// second bar: D279). A black platform
// floating in void: the edges have no walls (walking off = 50% max HP and 1.5 s to climb back at the nearest
// edge point; the fall cannot be dodged). Phase 2 shrinks the platform by 25% and he grows four arms; phase 3
// shrinks it again and he becomes a stationary void face in the far third that pulls everyone in. When that bar
// runs out the face is knocked down and he rises player-sized, Unbound, on a second bar 1.2× phase 3's share.
// Damage multipliers are of the boss hit (45 at zone 1).
import type { RoomTemplate } from '../../game/procgen/templates';
import type { AttackDef, BossDef, EnemyDef, PatternDef } from '../../game/types';

// ---------------------------------------------------------------- Phase 1 — The Interview

const briefcaseSwing: AttackDef = {
  id: 'landlord_briefcase',
  name: 'Briefcase Swing',
  kind: 'normal',
  pattern: { kind: 'melee', shape: 'arc', angleDeg: 110, r: 160 },
  windupMs: 800,
  recoverMs: 800,
  dmgMult: 1.3,
  type: 'physical',
  cooldownS: 2.6,
  range: [0, 160],
  weight: 4,
  parryable: true,
};

const evictionNotices = (count: number, spreadDeg: number): AttackDef => ({
  id: 'landlord_eviction',
  name: 'Eviction Notices',
  kind: 'normal',
  pattern: { kind: 'projectile', speed: 250, r: 8, homing: 45, count, spreadDeg, range: 1300, drawId: 'e_paper' },
  windupMs: 700,
  recoverMs: 600,
  dmgMult: 0.6,
  type: 'void',
  cooldownS: 5,
  range: [120, 1300],
  weight: 3,
});

const voidCleave = (cross: boolean): AttackDef => ({
  id: 'landlord_void_cleave',
  name: 'Void Cleave',
  kind: 'red',
  // phase 2: a cross — two full lines through him (four spokes, one along the target)
  // D172: 70% of the way to the wall (was all the way)
  pattern: cross ? { kind: 'line', w: 120, l: 'room', anchor: 'self', count: 4, spokes: true, lMult: 0.7 } : { kind: 'line', w: 120, l: 'room', anchor: 'self', lMult: 0.7 },
  windupMs: 800,
  recoverMs: 1000,
  dmgMult: 2.0,
  type: 'void',
  cooldownS: 8,
  range: [0, 700],
  weight: 3,
  area: true,
  hyperArmor: true,
});

const audit = (pockets: number): AttackDef => ({
  id: 'landlord_audit',
  name: 'Audit',
  kind: 'pierce',
  pattern: { kind: 'pockets', n: pockets, pocketR: 120 },
  windupMs: 1600,
  recoverMs: 900,
  dmgMult: 1.6,
  type: 'void',
  cooldownS: 12,
  range: [0, 1400],
  weight: 3,
  area: true,
});

const lateFee: AttackDef = {
  id: 'landlord_late_fee',
  name: 'Late Fee',
  kind: 'utility',
  effects: [{ op: 'summon', enemyId: 'landlords_clerk', count: 2, max: 2 }],
  windupMs: 900,
  recoverMs: 600,
  dmgMult: 0,
  type: 'void',
  cooldownS: 22,
  range: [0, 2000],
  weight: 2,
};

// ---------------------------------------------------------------- Phase 2 — The Eviction

const fourArmFlurry: AttackDef = {
  id: 'landlord_flurry',
  name: 'Four-Arm Flurry',
  kind: 'red',
  // four rapid cones, each turned 90° from the last: a full circle around him
  pattern: { kind: 'cone', angleDeg: 90, r: 180, anchor: 'self' },
  comboMults: [0.9, 0.9, 0.9, 0.9],
  comboGapMs: 260,
  comboRotateDeg: 90,
  windupMs: 700,
  recoverMs: 900,
  dmgMult: 0.9,
  type: 'void',
  cooldownS: 9,
  range: [0, 180],
  weight: 3,
  hyperArmor: true,
};

const gazeBeams: AttackDef = {
  id: 'landlord_gaze_beams',
  name: 'Gaze Beams',
  kind: 'pierce',
  // two beams from him, rotating opposite ways for 4 s (the half-plane behind both is always clear)
  pattern: { kind: 'beam', w: 60, l: 600, turnRateDeg: 35, durationS: 4, tickS: 0.25, anchor: 'self', count: 2, opposite: true }, // D172: 600 px (was the whole room); D204: twice as wide (was 30)
  windupMs: 1000,
  activeMs: 4000,
  recoverMs: 800,
  dmgMult: 0.8,
  type: 'void',
  cooldownS: 14,
  range: [0, 580],
  weight: 2,
  area: true,
};

const supernova = (pockets: number, pullSpeed: number): AttackDef => ({
  id: 'landlord_supernova',
  name: 'Supernova',
  kind: 'pierce',
  pattern: pullSpeed > 0 ? { kind: 'pockets', n: pockets, pocketR: 110, pullSpeed } : { kind: 'pockets', n: pockets, pocketR: 110 },
  windupMs: 1800,
  recoverMs: 1100,
  dmgMult: 2.6,
  type: 'void',
  cooldownS: 16,
  range: [0, 1400],
  weight: 2,
  area: true,
});

// ---------------------------------------------------------------- Phase 3 — The Deep Lease

/** The face pulls everyone toward it at this speed (BossPhase.passive.pull); it pauses in the last 0.2 s of a bite. */
const DEEP_PULL = 70;

const maw: AttackDef = {
  id: 'landlord_maw',
  name: 'Maw',
  kind: 'pierce',
  // escapable under the pull: (1.5 − 0.3) × (260 − 70) + 0.2 × 260 = 280 ≥ 220 + 40
  pattern: { kind: 'circle', r: 220, anchor: 'self', pullSpeed: DEEP_PULL },
  windupMs: 1500,
  recoverMs: 900,
  dmgMult: 2.5,
  type: 'void',
  cooldownS: 6,
  range: [0, 2000],
  weight: 6,
};

const foreclosure: AttackDef = {
  id: 'landlord_foreclosure',
  name: 'Foreclosure',
  kind: 'red',
  // everything within the face's gaze; the gaze turns 120° after each use (the arrow shows where next)
  pattern: { kind: 'cone', angleDeg: 60, r: 520, anchor: 'self' }, // D172: 520 px (was the whole room)
  gazeTurnDeg: 120,
  windupMs: 1200,
  recoverMs: 1000,
  dmgMult: 3.0,
  type: 'void',
  cooldownS: 9,
  range: [0, 500],
  weight: 3,
  area: true,
};

/** The platform's outer ring: everything farther than this from the arena's centre falls away. */
const collapseRing: PatternDef = { kind: 'ring', rIn: 220, rOut: 'edge', anchor: 'center', pullSpeed: DEEP_PULL };

const collapse: AttackDef = {
  id: 'landlord_collapse',
  name: 'Collapse',
  kind: 'pierce',
  // the ring is the telegraph; the fall (50% max HP) is the damage. 'ringReachable': only when every player can
  // get inside 220 px of the centre in time (worst corner of the phase-3 platform: 458 − 220 = 238)
  pattern: collapseRing,
  effects: [{ op: 'collapseFloor', pattern: collapseRing, durationS: 4 }],
  condition: 'ringReachable',
  windupMs: 1500,
  recoverMs: 800,
  dmgMult: 0,
  type: 'void',
  cooldownS: 15,
  range: [0, 2000],
  weight: 2,
  area: true,
};

// ---------------------------------------------------------------- Phase 4 — The Landlord, Unbound (D279)
// The face is knocked down and he rises player-sized in black spiked plate, wreathed in a golden-violet aura: a fast
// duelist who blinks about the platform (a flash where he stands, a mark where he lands, never on a player).

/** A quick three-cut combo at arm's length (parryable). */
const unboundCuts: AttackDef = {
  id: 'landlord_unbound_cuts',
  name: 'Final Notice',
  kind: 'normal',
  pattern: { kind: 'melee', shape: 'arc', angleDeg: 130, r: 72 },
  comboMults: [0.7, 0.7, 1.0],
  comboGapMs: 210,
  windupMs: 380,
  recoverMs: 450,
  dmgMult: 0.8,
  type: 'void',
  cooldownS: 1.8,
  range: [0, 80],
  weight: 5,
  parryable: true,
};

/** One dash of Repossession: a short straight charge, re-aimed at the target each time (three in a row). */
function unboundDash(n: number, last: number, windupMs: number): AttackDef {
  return {
    id: n === 1 ? 'landlord_repossession' : `landlord_repossession_${n}`,
    name: 'Repossession',
    kind: 'red',
    pattern: { kind: 'line', w: 56, l: 300, anchor: 'self' },
    move: { kind: 'charge', distance: 300, speed: 1100 },
    windupMs,
    recoverMs: n < last ? 0 : 700,
    dmgMult: 1.3,
    type: 'void',
    cooldownS: 7,
    range: [90, 520],
    weight: 3,
    hyperArmor: true,
    ...(n < last ? { chain: unboundDash(n + 1, last, 420) } : {}),
  };
}

/** Two crossing cuts through him, out to 60% of the room (an X when he faces a diagonal). */
const hostileTakeover: AttackDef = {
  id: 'landlord_hostile_takeover',
  name: 'Hostile Takeover',
  kind: 'red',
  pattern: { kind: 'line', w: 90, l: 'room', anchor: 'self', count: 4, spokes: true, lMult: 0.6 },
  windupMs: 700,
  recoverMs: 600,
  dmgMult: 1.8,
  type: 'void',
  cooldownS: 8,
  range: [0, 500],
  weight: 2,
  area: true,
  hyperArmor: true,
};

/** Void circles rain round the target (blue: no dodging, walk out). */
const unboundDecree: AttackDef = {
  id: 'landlord_unbound_decree',
  name: 'Eminent Domain',
  kind: 'pierce',
  pattern: { kind: 'randomCircles', n: 7, r: 80, within: 340, anchor: 'target' },
  windupMs: 1000,
  recoverMs: 500,
  dmgMult: 1.5,
  type: 'void',
  cooldownS: 9,
  range: [0, 1400],
  weight: 2,
  area: true,
};

/** A burst all round him (blue): 170 px, a second to get out. */
const totalEviction: AttackDef = {
  id: 'landlord_total_eviction',
  name: 'Total Eviction',
  kind: 'pierce',
  pattern: { kind: 'circle', r: 170, anchor: 'self' },
  windupMs: 1000,
  recoverMs: 700,
  dmgMult: 2.2,
  type: 'void',
  cooldownS: 10,
  range: [0, 200],
  weight: 2,
  area: true,
};

/** The transformation (4.5 s, invulnerable): knocked down, he rises, the power gathers, he screams, the armour forms. */
const UNBOUND_TRANSITION_S = 4.5;

export const THE_LANDLORD: BossDef | null = {
  id: 'the_landlord',
  zone: 8,
  name: 'The Landlord',
  role: 'boss',
  // his later phases stand on the void platform (D278)
  arenaBound: true,
  // D187: 2.5× the old boss base of 1800 (the other bosses got 2×); D256: doubled again, and 50% more damage
  baseHp: 9000,
  mult: { dmg: 1.5 },
  radius: 46,
  speed: 80,
  resist: {},
  moveStyle: 'walk',
  preferredRange: 140,
  phases: [
    {
      untilHpPct: 66,
      name: 'The Interview',
      speedMult: 1,
      dmgMult: 1,
      attacks: [briefcaseSwing, evictionNotices(6, 80), voidCleave(false), audit(5), lateFee],
    },
    {
      untilHpPct: 33,
      name: 'The Eviction',
      speedMult: 1.2,
      dmgMult: 1.25,
      arena: [{ op: 'shrinkPlatform', value: 0.25 }],
      passive: { scale: 1.3 },
      attacks: [briefcaseSwing, evictionNotices(6, 80), voidCleave(true), audit(4), lateFee, fourArmFlurry, gazeBeams, supernova(4, 0)],
    },
    {
      untilHpPct: 0,
      name: 'The Deep Lease',
      speedMult: 1.2,
      dmgMult: 1.5,
      arena: [{ op: 'shrinkPlatform', value: 0.25 }],
      passive: { pull: { speed: DEEP_PULL, r: 2000 }, stationaryAt: 'farThird', scale: 1.9, projectileSpeedMult: 1.4 },
      summons: [{ enemyId: 'hollow_joe', count: 2, max: 2, everyS: 10 }],
      attacks: [evictionNotices(10, 140), gazeBeams, supernova(3, DEEP_PULL), maw, foreclosure, collapse],
    },
    {
      // D279: phase 3 "kills" him (he stops at 1 HP); a second bar 1.2× what phase 3 had (33% of the first bar)
      untilHpPct: 0,
      name: 'The Landlord, Unbound',
      barName: 'The Landlord, Unbound',
      refillHp: true,
      hpOfPrevPhase: 1.2,
      transitionS: UNBOUND_TRANSITION_S,
      transitionBeats: [
        { atS: 0.25, sfx: 'hitBone', shake: 8, fx: 'dust', n: 18 },
        { atS: 2.0, sfx: 'unboundCharge', shake: 4 },
        { atS: 3.1, sfx: 'unboundRoar', shake: 18, fx: 'burst', color: '#ffd24a', n: 40, r: 50 },
        { atS: 4.35, shake: 10, fx: 'burst', color: '#b06bff', n: 40, r: 50 },
      ],
      clearField: true,
      speedMult: 3,
      dmgMult: 1.6,
      // player-sized (46 × 0.3 ≈ 14 px, the player's radius), on the move again, blinking every 2.4 s
      passive: { scale: 0.3, formAtStart: true, preferredRange: 50, blink: { everyS: 2.4, warnS: 0.35, minD: 110, maxD: 260 } },
      attacks: [unboundCuts, unboundDash(1, 3, 550), hostileTakeover, unboundDecree, totalEviction, evictionNotices(5, 60)],
    },
  ],
  arenaId: 'abyss_arena',
  introTitle: 'THE LANDLORD',
  introSub: 'Rent is due. It has always been due. Clause nine says the rent is you.',
  music: { root: 38, tempo: 72, bright: 0.2 },
  flavor: 'Owns everything under the stairs. Every room you cleared was his. You were subletting.',
  draw: 'boss_landlord',
  palette: ['#14101c', '#b06bff', '#e8e4f0'],
  hitSound: 'hitFlesh',
};

// A black platform (34 × 16 tiles) floating in void, a two-tile bridge from every door. K boss spot, H the spot
// the stairs up appear on after the kill.
export const THE_LANDLORD_ARENA: RoomTemplate | null = {
  id: 'abyss_arena',
  rows: [
    '###################DD###################',
    '#VVVVVVVVVVVVVVVVV....VVVVVVVVVVVVVVVVV#',
    '#VVVVVVVVVVVVVVVVV....VVVVVVVVVVVVVVVVV#',
    '#VV..................................VV#',
    '#VV..................................VV#',
    '#VV..................................VV#',
    '#VV..................................VV#',
    '#VV..................................VV#',
    '#VV..................................VV#',
    '#......................................#',
    'D..................K...................D',
    'D......................................D',
    '#......................................#',
    '#VV.................H................VV#',
    '#VV..................................VV#',
    '#VV..................................VV#',
    '#VV..................................VV#',
    '#VV..................................VV#',
    '#VV..................................VV#',
    '#VVVVVVVVVVVVVVVVV....VVVVVVVVVVVVVVVVV#',
    '#VVVVVVVVVVVVVVVVV....VVVVVVVVVVVVVVVVV#',
    '###################DD###################',
  ],
};

/** Boss-only bodies and summons (special: true), merged into ENEMIES. His summons (Landlord's Clerk, Hollow Joe) are zone 8 roster enemies. */
export const THE_LANDLORD_PARTS: Record<string, EnemyDef> = {};
