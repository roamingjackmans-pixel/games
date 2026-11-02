// Non-roster enemies: training dummies (tutorial hall and the M2 test arena).
import type { EnemyDef } from '../../game/types';

const dummyBase = {
  zone: 0,
  role: 'brute' as const,
  radius: 22,
  resist: {},
  moveStyle: 'stationary' as const,
  preferredRange: 0,
  flavor: 'Has taken more hits than Joe. Will take more.',
  draw: 'training_dummy',
  special: true,
  hitSound: 'hitFlesh' as const,
};

/** Performs a normal swing, a Red stomp and a Piercing ring in turn (GAME_DESIGN §5.4–5.6 test). */
export const TRAINING_DUMMY: EnemyDef = {
  ...dummyBase,
  id: 'training_dummy',
  name: 'Training Dummy',
  mult: { hp: 20, dmg: 0.6, shards: 0 },
  attacks: [
    { id: 'dummy_swing', name: 'Swing', kind: 'normal', pattern: { kind: 'melee', shape: 'arc', angleDeg: 120, r: 120 }, windupMs: 800, recoverMs: 500, dmgMult: 1, type: 'physical', cooldownS: 0, range: [0, 900], weight: 1 },
    { id: 'dummy_stomp', name: 'Red Stomp', kind: 'red', pattern: { kind: 'circle', r: 140, anchor: 'self' }, windupMs: 1000, recoverMs: 500, dmgMult: 1.2, type: 'physical', cooldownS: 0, range: [0, 900], weight: 1 },
    { id: 'dummy_ring', name: 'Piercing Ring', kind: 'pierce', pattern: { kind: 'ring', rIn: 60, rOut: 260, anchor: 'self' }, windupMs: 1500, recoverMs: 500, dmgMult: 1, type: 'void', cooldownS: 0, range: [0, 900], weight: 1 },
  ],
  traits: { scripted: true, noDrops: true, noFlinch: true, regenPctPerS: 0.5 },
};

/** Tutorial dummies: each performs a single attack on a timer. */
export const DUMMY_SWING: EnemyDef = { ...TRAINING_DUMMY, id: 'dummy_swing', name: 'Swinging Dummy', attacks: [TRAINING_DUMMY.attacks[0]!] };
export const DUMMY_RED: EnemyDef = { ...TRAINING_DUMMY, id: 'dummy_red', name: 'Stomping Dummy', attacks: [TRAINING_DUMMY.attacks[1]!] };
export const DUMMY_PIERCE: EnemyDef = { ...TRAINING_DUMMY, id: 'dummy_pierce', name: 'Ringing Dummy', attacks: [TRAINING_DUMMY.attacks[2]!] };
export const DUMMY_POKE: EnemyDef = {
  ...TRAINING_DUMMY,
  id: 'dummy_poke',
  name: 'Poking Dummy',
  mult: { hp: 20, dmg: 0.4, shards: 0 },
  attacks: [{ ...TRAINING_DUMMY.attacks[0]!, id: 'dummy_poke', name: 'Poke', windupMs: 900 }],
};
export const DUMMY_STILL: EnemyDef = { ...TRAINING_DUMMY, id: 'dummy_still', name: 'Practice Dummy', attacks: [], traits: { noDrops: true, noFlinch: true, regenPctPerS: 1 } };

export const SPECIAL_ENEMIES: Record<string, EnemyDef> = {
  training_dummy: TRAINING_DUMMY,
  dummy_swing: DUMMY_SWING,
  dummy_red: DUMMY_RED,
  dummy_pierce: DUMMY_PIERCE,
  dummy_poke: DUMMY_POKE,
  dummy_still: DUMMY_STILL,
};

/** GAME_DESIGN §6.5, CONTENT_ENEMIES §10: a chest that is not a chest. Woken stats scale with the zone. */
export const MIMIC: EnemyDef = {
  id: 'mimic',
  zone: 0,
  name: 'Mimic',
  role: 'brute',
  radius: 22,
  resist: {},
  moveStyle: 'walk',
  preferredRange: 60,
  special: true,
  attacks: [
    { id: 'mimic_bite', name: 'Bite', kind: 'normal', pattern: { kind: 'melee', shape: 'arc', angleDeg: 60, r: 70 }, windupMs: 500, recoverMs: 500, dmgMult: 1.2, type: 'physical', cooldownS: 1.4, range: [0, 70], weight: 3 },
    {
      id: 'mimic_chomp',
      name: 'Chomp',
      kind: 'red',
      pattern: { kind: 'line', w: 50, l: 200, anchor: 'self' },
      move: { kind: 'lunge', distance: 200 },
      windupMs: 600,
      recoverMs: 800,
      dmgMult: 1.8,
      type: 'physical',
      cooldownS: 6,
      range: [60, 240],
      weight: 2,
    },
    {
      id: 'mimic_tongue',
      name: 'Tongue Sweep',
      kind: 'pierce',
      pattern: { kind: 'sweep', angleDeg: 180, r: 180, durationS: 1.2, anchor: 'self' },
      windupMs: 1000,
      recoverMs: 600,
      dmgMult: 1.0,
      type: 'physical',
      cooldownS: 9,
      range: [0, 190],
      weight: 2,
    },
  ],
  traits: { mimic: true },
  flavor: 'Was a chest. Is a problem.',
  draw: 'mimic',
  hitSound: 'hitFlesh',
};
SPECIAL_ENEMIES.mimic = MIMIC;
