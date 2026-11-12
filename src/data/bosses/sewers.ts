// CONTENT_ENEMIES §11 Boss 3 — The Bloatking (Drowned Sewers). Flooded hall with 5 raised grates (safe from
// waves); everyone is 15% slower off the grates. Phase 2: the throne sinks and he swims.
import type { AttackDef, BossDef } from '../../game/types';

const scepterSwing: AttackDef = {
  id: 'bloat_scepter',
  name: 'Scepter Swing',
  kind: 'normal',
  pattern: { kind: 'melee', shape: 'arc', angleDeg: 100, r: 130 },
  windupMs: 700,
  recoverMs: 700,
  dmgMult: 1.2,
  type: 'physical',
  cooldownS: 2.4,
  range: [0, 130],
  weight: 4,
  parryable: true,
};

const wave: AttackDef = {
  id: 'bloat_wave',
  name: 'Wave',
  kind: 'pierce',
  pattern: { kind: 'wave', w: 140, speed: 340, from: 'random', safeTiles: 'G', gaps: 2 },
  windupMs: 1200,
  recoverMs: 800,
  dmgMult: 1.4,
  type: 'physical',
  cooldownS: 9,
  range: [0, 1400],
  weight: 3,
  area: true,
};

const royalDecree: AttackDef = {
  id: 'bloat_decree',
  name: 'Royal Decree',
  kind: 'red',
  pattern: { kind: 'line', w: 110, l: 400, anchor: 'self' },
  move: { kind: 'charge', distance: 400, speed: 700 },
  windupMs: 700,
  recoverMs: 900,
  dmgMult: 1.6,
  type: 'physical',
  cooldownS: 7,
  range: [80, 420],
  weight: 3,
};

const summonCourt = (physician: boolean): AttackDef => ({
  id: 'bloat_court',
  name: 'Summon Court',
  kind: 'utility',
  effects: [
    { op: 'summon', enemyId: 'drowned', count: 2, max: 3 },
    { op: 'summon', enemyId: 'green_slime', count: 1, max: 1 },
    ...(physician ? [{ op: 'summon' as const, enemyId: 'rat_physician', count: 1, max: 1 }] : []),
  ],
  windupMs: 1000,
  recoverMs: 600,
  dmgMult: 0,
  type: 'physical',
  cooldownS: 18,
  range: [0, 2000],
  weight: 2,
});

// phase 2's belch leaves acid puddles instead of a passing cloud: its own attack (D212), so phase 2 still brings two
// new ones (CONTENT_ENEMIES §13) after Drowning Grasp went
const belch = (puddles: boolean): AttackDef => ({
  id: puddles ? 'bloat_belch_acid' : 'bloat_belch',
  name: puddles ? 'Acid Belch' : 'Belch',
  kind: 'normal',
  pattern: { kind: 'cone', angleDeg: 70, r: 350, anchor: 'self', persist: { hazard: puddles ? 'acid' : 'poisonCloud', durationS: puddles ? 7 : 4 } },
  windupMs: 800,
  recoverMs: 700,
  dmgMult: 0.3,
  type: 'physical',
  status: { id: 'poison', buildup: 25 },
  cooldownS: 8,
  range: [0, 360],
  weight: 2,
  area: true,
  parryable: false,
});

const crosswave: AttackDef = {
  id: 'bloat_crosswave',
  name: 'Crosswave',
  kind: 'pierce',
  pattern: {
    kind: 'sequence',
    steps: [
      { pattern: { kind: 'wave', w: 140, speed: 340, from: 'random', safeTiles: 'G', gaps: 2 }, delayS: 0 },
      { pattern: { kind: 'wave', w: 140, speed: 340, from: 'cross', safeTiles: 'G', gaps: 2 }, delayS: 0.8 },
    ],
  },
  windupMs: 1200,
  recoverMs: 900,
  dmgMult: 1.3,
  type: 'physical',
  cooldownS: 12,
  range: [0, 1400],
  weight: 3,
  area: true,
};

// Drowning Grasp (a Red circle on the target that grabbed and poisoned) was removed at the owner's request (D212)

// ---------------------------------------------------------------- New Game+ Overtime only (D309)

/** Royal Decree three times over, each re-aimed with a fresh 0.5 s bar. */
const tidalDecree: AttackDef = {
  id: 'bloat_tidal_decree',
  name: 'Tidal Decree',
  kind: 'red',
  pattern: { kind: 'line', w: 110, l: 400, anchor: 'self' },
  move: { kind: 'charge', distance: 400, speed: 760, charges: 3, chargeGapS: 0.5 },
  windupMs: 800,
  recoverMs: 1000,
  dmgMult: 1.6,
  type: 'physical',
  cooldownS: 13,
  range: [80, 700],
  weight: 3,
  hyperArmor: true,
};

/** Two rings of churning water roll out from him a second apart, dragging everyone toward him: find a gap in each. */
const undertow: AttackDef = {
  id: 'bloat_undertow',
  name: 'Undertow',
  kind: 'pierce',
  pattern: { kind: 'expandingRing', speed: 280, thickness: 40, gaps: 3, gapW: 120, anchor: 'self', centerGapDeg: 15, count: 2, spacingS: 1.0, pullSpeed: 50 },
  windupMs: 1200,
  recoverMs: 900,
  dmgMult: 1.2,
  type: 'physical',
  cooldownS: 11,
  range: [0, 1400],
  weight: 3,
  area: true,
};

export const THE_BLOATKING: BossDef = {
  id: 'bloatking',
  zone: 3,
  name: 'The Bloatking',
  role: 'boss',
  // his Wave is dodged on the sewer's grates (D278)
  arenaBound: true,
  radius: 60,
  speed: 95,
  resist: {},
  statusImmune: ['poison'],
  moveStyle: 'walk',
  preferredRange: 120,
  phases: [
    { untilHpPct: 50, speedMult: 1, dmgMult: 1, attacks: [scepterSwing, wave, royalDecree, summonCourt(false), belch(false)] },
    {
      untilHpPct: 0,
      name: 'The throne sinks',
      speedMult: 1.2,
      dmgMult: 1.25,
      // the flood swirls into a whirlpool round the middle of the hall that carries everyone 55 px/s anticlockwise
      // (D95); it stops short of the grates
      arena: [{ op: 'floodAll', value: 0.3 }, { op: 'movingFloor', floor: { kind: 'ring', x: 640, y: 368, rIn: 60, rOut: 150, speed: -55, look: 'water' } }],
      attacks: [scepterSwing, wave, royalDecree, summonCourt(true), belch(true), crosswave],
    },
  ],
  // New Game+ third phase only (D309)
  overtimeAttacks: [tidalDecree, undertow],
  // D359: teal water and gold treasure circle the king (drawn in engine/draw/bosses/zones1to3.ts)
  overtimeIntro: {
    name: 'The Drowning Crown',
    transitionS: 3.4,
    transitionBeats: [
      { atS: 0.2, sfx: 'hitSlime', shake: 6, fx: 'dust', n: 16 },
      { atS: 1.1, sfx: 'unboundCharge', shake: 3, fx: 'status', color: '#3fd6c0', n: 26 },
      { atS: 2.2, sfx: '', shake: 8, fx: 'burst', color: '#3fd6c0', n: 34, r: 65 },
      { atS: 2.9, sfx: 'bossRoar', shake: 14, fx: 'burst', color: '#ffd24a', n: 44, r: 100 },
    ],
  },
  arenaId: 'sewers_arena',
  introTitle: 'THE BLOATKING',
  introSub: 'Skims the rent. Drinks the runoff. Long may he float.',
  music: { root: 41, tempo: 88, bright: 0.3 },
  flavor: 'A drowned monarch on a floating throne of debris, fat on skimmed rent.',
  draw: 'boss_bloatking',
  palette: ['#4a6a5a', '#d6c25a', '#2a3a34'],
  hitSound: 'hitSlime',
};
