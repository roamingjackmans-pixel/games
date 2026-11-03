// CONTENT_ENEMIES §11 Boss 4 — Vexthorn, the Hollow Stag (Hollow Forest). A fey stag with antlers of thorn and a
// hollow chest with a lantern-heart. Fast. Arena: a forest clearing with 5 trees ('t'): a charge that runs into one
// breaks it and leaves him staggered 2 s (AttackMove.propStaggerS). Damage multipliers are of the boss hit (45 at
// zone 1 scaling).
import type { RoomTemplate } from '../../game/procgen/templates';
import type { AttackDef, BossDef, EnemyDef } from '../../game/types';

const antlerGore: AttackDef = {
  id: 'vex_gore',
  name: 'Antler Gore',
  kind: 'normal',
  pattern: { kind: 'melee', shape: 'arc', angleDeg: 90, r: 150 },
  windupMs: 600,
  recoverMs: 700,
  dmgMult: 1.3,
  type: 'physical',
  status: { id: 'bleed', buildup: 30 },
  cooldownS: 2.4,
  range: [0, 150],
  weight: 4,
  parryable: true,
};

/** Wall to wall; a tree in the way stops him (the tree is used up, he is staggered 2 s). */
const charge: AttackDef = {
  id: 'vex_charge',
  name: 'Charge',
  kind: 'red',
  pattern: { kind: 'line', w: 100, l: 'room', anchor: 'self' },
  move: { kind: 'charge', untilWall: true, speed: 720, propStaggerS: 2 },
  windupMs: 800,
  activeMs: 2400,
  recoverMs: 700,
  dmgMult: 1.9,
  type: 'physical',
  cooldownS: 8,
  range: [120, 1400],
  weight: 3,
  area: true,
  hyperArmor: true,
};

const thornBurst = (r: number, windupMs: number): AttackDef => ({
  id: 'vex_thorn_burst',
  name: 'Thorn Burst',
  kind: 'pierce',
  pattern: { kind: 'circle', r, anchor: 'self', persist: { hazard: 'thorns', durationS: 3 } },
  windupMs,
  recoverMs: 700,
  dmgMult: 1.2,
  type: 'physical',
  cooldownS: 8,
  range: [0, r + 40],
  weight: 3,
  area: r >= 200,
});

const feyLights = (count: number): AttackDef => ({
  id: 'vex_fey_lights',
  name: 'Fey Lights',
  kind: 'utility',
  effects: [{ op: 'summon', enemyId: 'fey_light', count, max: count + 2, lifetimeS: 18 }],
  windupMs: 800,
  recoverMs: 500,
  dmgMult: 0,
  type: 'holy',
  cooldownS: 14,
  range: [0, 2000],
  weight: 2,
});

/**
 * A 120° cone of wind for 2 s that pushes players 150 px/s and hurts ×0.3/s (the 'wind' hazard). A utility so the
 * wind blows toward the target it was aimed at; the cone's own impact is the first ×0.3.
 */
const hexGale: AttackDef = {
  id: 'vex_hex_gale',
  name: 'Hex Gale',
  kind: 'utility',
  pattern: { kind: 'cone', angleDeg: 120, r: 500, anchor: 'self' },
  effects: [{ op: 'hazard', pattern: { kind: 'cone', angleDeg: 120, r: 500, anchor: 'self' }, hazard: 'wind', durationS: 2 }],
  windupMs: 900,
  recoverMs: 800,
  dmgMult: 0.3,
  type: 'physical',
  cooldownS: 10,
  range: [0, 480],
  weight: 2,
  area: true,
  parryable: false,
};

const rootLines: AttackDef = {
  // a one-step sequence keeps the five random angles from following (and collapsing onto) his facing
  id: 'vex_root_lines',
  name: 'Root Lines',
  kind: 'pierce',
  pattern: {
    kind: 'sequence',
    steps: [{ pattern: { kind: 'line', w: 50, l: 'room', anchor: 'self', count: 5, randomAngles: true }, delayS: 0 }],
    persist: { hazard: 'roots', durationS: 3 },
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

/** Three charges in a row, each re-aimed at the target with a fresh 0.5 s telegraph; a tree still ends it. */
const tripleCharge: AttackDef = {
  id: 'vex_triple_charge',
  name: 'Triple Charge',
  kind: 'red',
  pattern: { kind: 'line', w: 100, l: 'room', anchor: 'self' },
  move: { kind: 'charge', untilWall: true, speed: 760, propStaggerS: 2, charges: 3, chargeGapS: 0.5 },
  windupMs: 800,
  activeMs: 2400,
  recoverMs: 900,
  dmgMult: 1.9,
  type: 'physical',
  cooldownS: 14,
  range: [120, 1400],
  weight: 3,
  area: true,
  hyperArmor: true,
};

export const VEXTHORN: BossDef = {
  id: 'vexthorn',
  zone: 4,
  name: 'Vexthorn, the Hollow Stag',
  role: 'boss',
  radius: 46,
  speed: 175,
  resist: {},
  moveStyle: 'walk',
  preferredRange: 130,
  traits: { turnRate: 220 },
  phases: [
    { untilHpPct: 50, speedMult: 1, dmgMult: 1, attacks: [antlerGore, charge, thornBurst(160, 900), feyLights(3), hexGale] },
    {
      untilHpPct: 0,
      name: 'The heart-lantern flares',
      speedMult: 1.2,
      dmgMult: 1.25,
      // the clearing's edges grow thorn walls that deal ×0.5 on touch
      // ...and a ring of roots turns round the clearing's heart, carrying everyone 45 px/s clockwise (D90)
      arena: [{ op: 'thornWalls', value: 48, mult: 0.5 }, { op: 'movingFloor', floor: { kind: 'ring', x: 640, y: 368, rIn: 170, rOut: 250, speed: 45, look: 'roots' } }],
      attacks: [antlerGore, charge, thornBurst(220, 1100), feyLights(5), hexGale, rootLines, tripleCharge],
    },
  ],
  arenaId: 'forest_arena',
  introTitle: 'VEXTHORN, THE HOLLOW STAG',
  introSub: 'The forest has a heart. He is wearing it, and he will not give it back.',
  music: { root: 52, tempo: 118, bright: 0.5 },
  flavor: 'A fey stag with antlers of thorn, and the forest’s last Glowen in a lantern for a heart.',
  draw: 'boss_vexthorn',
  palette: ['#5a4632', '#ffcf6a', '#2a1e14'],
  hitSound: 'hitFlesh',
};

/** Forest clearing: five 2×2 trees (each takes one charge), four corner stumps. */
export const VEXTHORN_ARENA: RoomTemplate = {
  id: 'forest_arena',
  rows: [
    '###################DD###################',
    '#......................................#',
    '#.o..................................o.#',
    '#......................................#',
    '#.......tt....................tt.......#',
    '#.......tt....................tt.......#',
    '#......................................#',
    '#...................K..................#',
    '#......................................#',
    '#......................................#',
    'D...................H..................D',
    'D......................................D',
    '#......................................#',
    '#......................................#',
    '#..................tt..................#',
    '#..................tt..................#',
    '#.......tt....................tt.......#',
    '#.......tt....................tt.......#',
    '#......................................#',
    '#.o..................................o.#',
    '#......................................#',
    '###################DD###################',
  ],
};

/** Boss-only bodies and summons (special: true), merged into ENEMIES. */
export const VEXTHORN_PARTS: Record<string, EnemyDef> = {
  fey_light: {
    id: 'fey_light',
    zone: 4,
    name: 'Fey Light',
    role: 'swarm',
    // ×0.6 of the boss hit (45) on a swarm body (8): dmg ×5.625
    mult: { hp: 2, dmg: 5.625, shards: 0 },
    radius: 11,
    resist: {},
    moveStyle: 'hover',
    speed: 70,
    preferredRange: 0,
    attacks: [
      {
        // drifts in slowly and pops: the 0.7 s ring is the tell, then it is spent
        id: 'fey_light_pop',
        name: 'Pop',
        kind: 'normal',
        pattern: { kind: 'circle', r: 60, anchor: 'self' },
        effects: [{ op: 'die', quiet: true }],
        windupMs: 700,
        recoverMs: 300,
        dmgMult: 0.6,
        type: 'holy',
        cooldownS: 1,
        range: [0, 36],
        weight: 1,
        parryable: false,
      },
    ],
    traits: { lightsRoom: true, noDrops: true, noShards: true, hideHpBar: true },
    flavor: 'Pretty, slow, and in a hurry to meet you.',
    draw: 'boss_fey_light',
    palette: ['#ffe9a8', '#ffcf6a', '#8fd3ff'],
    hitSound: 'hitSlime',
    special: true,
  },
};
