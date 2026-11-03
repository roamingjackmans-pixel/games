// CONTENT_ENEMIES §11 Boss 1 — The Caretaker (Mossy Crypt). Damage multipliers are of the boss hit (45 at zone 1).
import type { AttackDef, BossDef } from '../../game/types';

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

export const THE_CARETAKER: BossDef = {
  id: 'the_caretaker',
  zone: 1,
  name: 'The Caretaker',
  role: 'boss',
  radius: 50,
  speed: 105,
  resist: {},
  moveStyle: 'walk',
  preferredRange: 120,
  hyperArmor: false,
  phases: [
    { untilHpPct: 50, speedMult: 1, dmgMult: 1, attacks: [shovelSwing, lanternToss(1), graveCall(2, 4), overheadSlam, dirtSweep] },
    {
      untilHpPct: 0,
      name: 'The lantern breaks',
      speedMult: 1.2,
      dmgMult: 1.25,
      arena: [{ op: 'hazardFloor', hazard: 'emberMoss', value: 6 }],
      attacks: [shovelSwing, lanternToss(3), graveCall(3, 5), overheadSlam, dirtSweep, graveQuake, handsOfTheDead],
    },
  ],
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
