// CONTENT_ENEMIES §11 Boss 2 — Mother Spore (Fungal Caverns). Mostly stationary at the arena center; the
// fight is about the floor. Three glowing pools cure Poison but slow you (arena 'w' spots).
import type { AttackDef, BossDef } from '../../game/types';

const stalkSlam: AttackDef = {
  id: 'spore_stalk_slam',
  name: 'Stalk Slam',
  kind: 'normal',
  pattern: { kind: 'circle', r: 110, anchor: 'targetPast(1.0)' },
  windupMs: 800,
  recoverMs: 800,
  dmgMult: 1.3,
  type: 'physical',
  cooldownS: 3,
  range: [0, 230],
  weight: 4,
  parryable: false,
};

const sporeBloom = (spacing: number): AttackDef => ({
  id: 'spore_bloom',
  name: 'Spore Bloom',
  kind: 'pierce',
  pattern: { kind: 'grid', spacing, r: 55, pulses: 2 },
  windupMs: 1200,
  recoverMs: 900,
  dmgMult: 0.8,
  type: 'physical',
  status: { id: 'poison', buildup: 30 },
  cooldownS: 9,
  range: [0, 1400],
  weight: 3,
  area: true,
});

const tendrilWhip: AttackDef = {
  id: 'spore_tendril_whip',
  name: 'Tendril Whip',
  kind: 'red',
  pattern: { kind: 'line', w: 50, l: 420, anchor: 'self' },
  windupMs: 600,
  recoverMs: 800,
  dmgMult: 1.5,
  type: 'physical',
  cooldownS: 5,
  range: [0, 430],
  weight: 3,
};

const sporelingBirth = (count: number): AttackDef => ({
  id: 'spore_birth',
  name: 'Sporeling Birth',
  kind: 'utility',
  effects: [{ op: 'summon', enemyId: 'sporeling', count, max: count + 1 }],
  windupMs: 900,
  recoverMs: 500,
  dmgMult: 0,
  type: 'physical',
  cooldownS: 16,
  range: [0, 2000],
  weight: 2,
});

const gasVent: AttackDef = {
  id: 'spore_gas_vent',
  name: 'Gas Vent',
  kind: 'normal',
  pattern: { kind: 'cone', angleDeg: 90, r: 400, anchor: 'self', persist: { hazard: 'poisonCloud', durationS: 5 } },
  windupMs: 900,
  recoverMs: 700,
  dmgMult: 0.3,
  type: 'physical',
  status: { id: 'poison', buildup: 20 },
  cooldownS: 10,
  range: [0, 420],
  weight: 2,
  area: true,
  parryable: false,
};

const rainOfCaps: AttackDef = {
  id: 'spore_rain_of_caps',
  name: 'Rain of Caps',
  kind: 'pierce',
  // two sets of 5 lanes, 1.0 s apart (D94): the gaps between one set's lanes are the other set's lanes, so you
  // stand in a B lane while A falls and step 64 px into a spent A lane before B does. (It was 6 lanes of 80 px:
  // a set left only 27 px gaps, narrower than Joe, so the whole hall was hit with no way out.)
  pattern: { kind: 'lanes', n: 5, w: 64, orientation: 'horizontal', alternate: true, setGapS: 1.0 },
  windupMs: 1200,
  recoverMs: 900,
  dmgMult: 1.2,
  type: 'physical',
  cooldownS: 11,
  range: [0, 1400],
  weight: 3,
  area: true,
};

const uproot: AttackDef = {
  id: 'spore_uproot',
  name: 'Uproot',
  kind: 'red',
  pattern: { kind: 'circle', r: 200, anchor: 'target' },
  move: { kind: 'leap' },
  windupMs: 1000,
  activeMs: 450,
  recoverMs: 400,
  dmgMult: 2.0,
  type: 'physical',
  cooldownS: 14,
  range: [0, 900],
  weight: 3,
  area: true,
  // the punish window
  stunAfterS: 3,
};

export const MOTHER_SPORE: BossDef = {
  id: 'mother_spore',
  zone: 2,
  name: 'Mother Spore',
  role: 'boss',
  radius: 66,
  speed: 40,
  resist: {},
  statusImmune: ['poison'],
  moveStyle: 'stationary',
  preferredRange: 200,
  phases: [
    { untilHpPct: 50, speedMult: 1, dmgMult: 1, attacks: [stalkSlam, sporeBloom(150), tendrilWhip, sporelingBirth(3), gasVent] },
    {
      untilHpPct: 0,
      name: 'The cap splits open',
      speedMult: 1.2,
      dmgMult: 1.25,
      arena: [{ op: 'darken', value: 0.45 }],
      attacks: [stalkSlam, sporeBloom(120), tendrilWhip, sporelingBirth(5), gasVent, rainOfCaps, uproot],
    },
  ],
  arenaId: 'caverns_arena',
  introTitle: 'MOTHER SPORE',
  introSub: 'Everything down here is her child. You are about to be adopted.',
  music: { root: 43, tempo: 96, bright: 0.25 },
  flavor: 'A cathedral-sized mushroom with a face in the stalk. Farms Glowen. Calls it family.',
  draw: 'boss_mother_spore',
  palette: ['#7a4a8a', '#c8f06a', '#3a2440'],
  hitSound: 'hitSlime',
};
