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
  pattern: { kind: 'wave', w: 140, speed: 340, from: 'random', safeTiles: 'G' },
  windupMs: 1200,
  recoverMs: 800,
  dmgMult: 1.4,
  type: 'physical',
  knockback: 140,
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

const belch = (puddles: boolean): AttackDef => ({
  id: 'bloat_belch',
  name: 'Belch',
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
      { pattern: { kind: 'wave', w: 140, speed: 340, from: 'north', safeTiles: 'G' }, delayS: 0 },
      { pattern: { kind: 'wave', w: 140, speed: 340, from: 'west', safeTiles: 'G' }, delayS: 0.8 },
    ],
  },
  windupMs: 1200,
  recoverMs: 900,
  dmgMult: 1.3,
  type: 'physical',
  knockback: 120,
  cooldownS: 12,
  range: [0, 1400],
  weight: 3,
  area: true,
};

const drowningGrasp: AttackDef = {
  id: 'bloat_grasp',
  name: 'Drowning Grasp',
  kind: 'red',
  pattern: { kind: 'circle', r: 80, anchor: 'target' },
  windupMs: 700,
  recoverMs: 900,
  dmgMult: 2.0,
  type: 'physical',
  status: { id: 'poison', buildup: 50 },
  grab: { holdS: 1.5, mult: 1 },
  cooldownS: 10,
  range: [0, 1000],
  weight: 3,
};

export const THE_BLOATKING: BossDef = {
  id: 'bloatking',
  zone: 3,
  name: 'The Bloatking',
  role: 'boss',
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
      arena: [{ op: 'floodAll', value: 0.3 }],
      attacks: [scepterSwing, wave, royalDecree, summonCourt(true), belch(true), crosswave, drowningGrasp],
    },
  ],
  arenaId: 'sewers_arena',
  introTitle: 'THE BLOATKING',
  introSub: 'Skims the rent. Drinks the runoff. Long may he float.',
  music: { root: 41, tempo: 88, bright: 0.3 },
  flavor: 'A drowned monarch on a floating throne of debris, fat on skimmed rent.',
  draw: 'boss_bloatking',
  palette: ['#4a6a5a', '#d6c25a', '#2a3a34'],
  hitSound: 'hitSlime',
};
