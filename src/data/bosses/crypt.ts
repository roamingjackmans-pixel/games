// CONTENT_ENEMIES §11 Boss 1 — The Caretaker (Mossy Crypt). Damage multipliers are of the boss hit (45 at zone 1).
import type { AttackDef, BossDef } from '../../game/types';
import { NG_BOSS_DMG_MULT } from '../roles';

const shovelSwing: AttackDef = {
  id: 'caretaker_shovel',
  name: 'Shovel Swing',
  kind: 'normal',
  pattern: { kind: 'melee', shape: 'arc', angleDeg: 120, r: 140 },
  windupMs: 900,
  recoverMs: 800,
  dmgMult: 1.2,
  type: 'physical',
  cooldownS: 2.5,
  range: [0, 140],
  weight: 4,
  parryable: true,
};

const lanternToss = (count: number): AttackDef => ({
  id: 'caretaker_lantern',
  name: 'Lantern Toss',
  kind: 'pierce',
  pattern: { kind: 'circle', r: 120, anchor: 'target', count, persist: { hazard: 'firePuddle', durationS: 4 } },
  windupMs: 1000,
  recoverMs: 700,
  dmgMult: 1.3,
  type: 'fire',
  status: { id: 'burn', buildup: 30 },
  cooldownS: 7,
  range: [100, 900],
  weight: 3,
});

const graveCall = (count: number, max: number): AttackDef => ({
  id: 'caretaker_grave_call',
  name: 'Grave Call',
  kind: 'utility',
  effects: [{ op: 'summon', enemyId: 'shambler', count, max, at: 'graves' }],
  windupMs: 900,
  recoverMs: 600,
  dmgMult: 0,
  type: 'physical',
  cooldownS: 15,
  range: [0, 2000],
  weight: 2,
});

const overheadSlam: AttackDef = {
  id: 'caretaker_slam',
  name: 'Overhead Slam',
  kind: 'red',
  pattern: { kind: 'line', w: 90, l: 200, anchor: 'self' },
  // the shockwave behind it
  effects: [{ op: 'damage', pattern: { kind: 'ring', rIn: 90, rOut: 200, anchor: 'self' }, mult: 0.6, type: 'physical', telegraphS: 0.45 }],
  windupMs: 700,
  recoverMs: 1000,
  dmgMult: 1.8,
  type: 'physical',
  cooldownS: 6,
  range: [0, 210],
  weight: 3,
  hyperArmor: true,
};

const dirtSweep: AttackDef = {
  id: 'caretaker_dirt_sweep',
  name: 'Dirt Sweep',
  kind: 'normal',
  pattern: { kind: 'sweep', angleDeg: 180, r: 320, durationS: 1.5, anchor: 'self' },
  windupMs: 900,
  activeMs: 1500,
  recoverMs: 800,
  dmgMult: 0.8,
  type: 'physical',
  control: { id: 'blind', durationS: 1 },
  cooldownS: 9,
  range: [0, 320],
  weight: 2,
  area: true,
  parryable: false,
};

const graveQuake: AttackDef = {
  id: 'caretaker_grave_quake',
  name: 'Grave Quake',
  kind: 'pierce',
  pattern: { kind: 'expandingRing', speed: 320, thickness: 40, gaps: 4, gapW: 110, anchor: 'self', centerGapDeg: 15 },
  windupMs: 1000,
  recoverMs: 900,
  dmgMult: 1.2,
  type: 'physical',
  cooldownS: 10,
  range: [0, 1400],
  weight: 3,
  area: true,
};

const handsOfTheDead: AttackDef = {
  id: 'caretaker_hands',
  name: 'Hands of the Dead',
  kind: 'pierce',
  pattern: { kind: 'randomCircles', n: 8, r: 70, within: 420, anchor: 'target' },
  windupMs: 1000,
  recoverMs: 800,
  dmgMult: 0.6,
  type: 'physical',
  control: { id: 'root', durationS: 1.5 },
  cooldownS: 11,
  range: [0, 1400],
  weight: 3,
  area: true,
};

/**
 * New Game+ only (D277): the whole crypt heaves. A Red blast over every tile of the room, about 600 a hit at NG+1 (solo,
 * before defense; `mult` is per phase so both phases land near 600) and growing with every cycle after, like all
 * New Game+ damage. Red: no block, no parry, but a dodge through it at the moment it lands is safe. A long 2.2 s
 * telegraph, so there is time to see it and time the roll.
 */
const lastRites = (mult: number): AttackDef => ({
  id: 'caretaker_last_rites',
  name: 'Last Rites',
  kind: 'red',
  pattern: { kind: 'ring', rIn: 0, rOut: 'edge', anchor: 'self' },
  windupMs: 2200,
  recoverMs: 1400,
  // the owner's "about 600 at NG+1" stays: boss damage ×1.75 from NG+1 (D314) is taken back out of this one
  dmgMult: mult / NG_BOSS_DMG_MULT,
  type: 'physical',
  cooldownS: 22,
  range: [0, 2000],
  weight: 2,
  area: true,
  hyperArmor: true,
  condition: 'cycleAtLeast(1)',
});

// ---------------------------------------------------------------- New Game+ Overtime only (D309)

/** Coffin lids slam down the hall in two sets of five columns, a second apart (D261): stand in a B column while A falls. */
const coffinRows: AttackDef = {
  id: 'caretaker_coffin_rows',
  name: 'Coffin Rows',
  kind: 'pierce',
  pattern: { kind: 'lanes', n: 5, w: 64, orientation: 'vertical', alternate: true, setGapS: 1.0 },
  windupMs: 1200,
  recoverMs: 900,
  dmgMult: 1.3,
  type: 'physical',
  cooldownS: 11,
  range: [0, 1400],
  weight: 3,
  area: true,
};

/** Three shovel arcs in a row, the last the heaviest: Red, so no parry; roll through or back off. */
const gravediggersFury: AttackDef = {
  id: 'caretaker_gravediggers_fury',
  name: "Gravedigger's Fury",
  kind: 'red',
  pattern: { kind: 'melee', shape: 'arc', angleDeg: 140, r: 170 },
  comboMults: [1.0, 1.2, 1.6],
  comboGapMs: 380,
  windupMs: 700,
  recoverMs: 1100,
  dmgMult: 1.0,
  type: 'physical',
  cooldownS: 8,
  range: [0, 170],
  weight: 4,
  hyperArmor: true,
};

export const THE_CARETAKER: BossDef = {
  id: 'the_caretaker',
  zone: 1,
  // the first boss is 30% lighter the first time down (D211): 2,520 HP solo instead of 3,600
  firstCycleHpMult: 0.7,
  name: 'The Caretaker',
  role: 'boss',
  radius: 50,
  speed: 105,
  resist: {},
  moveStyle: 'walk',
  preferredRange: 120,
  hyperArmor: false,
  phases: [
    { untilHpPct: 50, speedMult: 1, dmgMult: 1, attacks: [shovelSwing, lanternToss(1), graveCall(2, 4), overheadSlam, dirtSweep, lastRites(2.6)] },
    {
      untilHpPct: 0,
      name: 'The lantern breaks',
      speedMult: 1.2,
      dmgMult: 1.25,
      arena: [{ op: 'hazardFloor', hazard: 'emberMoss', value: 6 }],
      attacks: [shovelSwing, lanternToss(3), graveCall(3, 5), overheadSlam, dirtSweep, graveQuake, handsOfTheDead, lastRites(2.1)],
    },
  ],
  // New Game+ third phase only (D309)
  overtimeAttacks: [coffinRows, gravediggersFury],
  arenaId: 'crypt_arena',
  introTitle: 'THE CARETAKER',
  introSub: 'Fixes nothing. Buries everything. Keeps your deposit.',
  music: { root: 45, tempo: 112, bright: 0.35 },
  flavor: 'Buries the dead, keeps their Glowen. Has buried everyone down here at least once.',
  draw: 'boss_caretaker',
  palette: ['#5a4a3a', '#ffb347', '#2e2a24'],
  hitSound: 'hitFlesh',
  undead: true,
};
