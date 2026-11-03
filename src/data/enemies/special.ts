// Non-roster enemies: training dummies (tutorial hall and the M2 test arena).
import type { EnemyDef } from '../../game/types';

const dummyBase = {
  zone: 0,
  role: 'brute' as const,
  radius: 22,
  resist: {},
  moveStyle: 'stationary' as const,
  preferredRange: 0,
  flavor: 'Has taken more hits than Joe. Complains less.',
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
// its ring stops at 150 px so the station's sign (about 200 px away) can be read in peace (D107)
export const DUMMY_PIERCE: EnemyDef = { ...TRAINING_DUMMY, id: 'dummy_pierce', name: 'Ringing Dummy', attacks: [{ ...TRAINING_DUMMY.attacks[2]!, pattern: { kind: 'ring', rIn: 40, rOut: 150, anchor: 'self' }, range: [0, 900] }] };
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

/** CONTENT_ENEMIES §10: the tutorial boss you are meant to walk past. ~120,000 HP, hits like a truck. */
export const INSTRUCTOR: EnemyDef = {
  id: 'the_instructor',
  zone: 0,
  name: 'The Instructor',
  role: 'brute',
  mult: { dmg: 2.7, poise: 1000, shards: 0 },
  speed: 70,
  radius: 34,
  resist: {},
  moveStyle: 'walk',
  preferredRange: 90,
  hyperArmor: true,
  special: true,
  attacks: [
    { id: 'instructor_overhead', name: 'Overhead', kind: 'normal', pattern: { kind: 'line', w: 80, l: 160, anchor: 'self' }, windupMs: 1400, recoverMs: 900, dmgMult: 1, type: 'physical', cooldownS: 2.5, range: [0, 170], weight: 3 },
    { id: 'instructor_stomp', name: 'Stomp', kind: 'red', pattern: { kind: 'circle', r: 140, anchor: 'self' }, windupMs: 1000, recoverMs: 900, dmgMult: 1, type: 'physical', cooldownS: 6, range: [0, 150], weight: 2 },
    { id: 'instructor_clap', name: 'Clap', kind: 'pierce', pattern: { kind: 'ring', rIn: 60, rOut: 260, anchor: 'self' }, windupMs: 1500, recoverMs: 900, dmgMult: 0.8, type: 'physical', cooldownS: 8, range: [40, 270], weight: 2, area: true },
  ],
  // he walks the whole room (D110: no more 230 px leash)
  traits: { noFlinch: true, noDrops: true, fixedHp: 14420 }, // D111: he no longer heals
  // below half health he blows the whistle: everything comes faster, he leaves his corner, and people who stand far
  // away get homework (D107)
  phase2: {
    untilHpPct: 50,
    name: 'Second half',
    noLeash: true,
    attacks: [
      { id: 'instructor_overhead_2', name: 'Overhead', kind: 'normal', pattern: { kind: 'line', w: 80, l: 160, anchor: 'self' }, windupMs: 900, recoverMs: 550, dmgMult: 1, type: 'physical', cooldownS: 1.5, range: [0, 170], weight: 3 },
      { id: 'instructor_stomp_2', name: 'Stomp', kind: 'red', pattern: { kind: 'circle', r: 140, anchor: 'self' }, windupMs: 700, recoverMs: 550, dmgMult: 1, type: 'physical', cooldownS: 3.6, range: [0, 150], weight: 2 },
      { id: 'instructor_clap_2', name: 'Clap', kind: 'pierce', pattern: { kind: 'ring', rIn: 60, rOut: 260, anchor: 'self' }, windupMs: 1000, recoverMs: 550, dmgMult: 0.8, type: 'physical', cooldownS: 5, range: [40, 270], weight: 2, area: true },
      // for anyone standing back: a fan of soccer balls, a running leap, and a basketball lobbed at your feet
      { id: 'instructor_whistles', name: 'Soccer Volley', kind: 'normal', pattern: { kind: 'projectile', speed: 480, r: 9, count: 5, spreadDeg: 36, range: 1100, drawId: 'e_soccer' }, windupMs: 800, recoverMs: 500, dmgMult: 0.6, type: 'physical', cooldownS: 4, range: [260, 1200], weight: 3 },
      { id: 'instructor_laps', name: 'Run a Lap', kind: 'red', pattern: { kind: 'circle', r: 110, anchor: 'target' }, move: { kind: 'leap' }, windupMs: 900, activeMs: 450, recoverMs: 900, dmgMult: 1.3, type: 'physical', cooldownS: 7, range: [300, 900], weight: 2 },
      { id: 'instructor_medicine_ball', name: 'Full-Court Lob', kind: 'pierce', pattern: { kind: 'projectile', speed: 420, r: 12, lob: true, drawId: 'e_basketball', onImpact: { kind: 'circle', r: 95, anchor: 'point' } }, windupMs: 1000, recoverMs: 700, dmgMult: 0.9, type: 'physical', cooldownS: 5, range: [250, 1100], weight: 2 },
    ],
  },
  flavor: 'He has a whistle. He will use it.',
  draw: 'the_instructor',
  hitSound: 'hitFlesh',
};
SPECIAL_ENEMIES.the_instructor = INSTRUCTOR;

/** CONTENT_ENEMIES §10: Gary, the wandering merchant. Does not attack. Three hits and he leaves. */
export const GARY: EnemyDef = {
  id: 'gary',
  zone: 0,
  name: 'Gary',
  role: 'tank',
  mult: { hp: 6667, shards: 0 },
  radius: 22,
  resist: {},
  moveStyle: 'stationary',
  preferredRange: 0,
  special: true,
  attacks: [],
  traits: { merchant: true, hideHpBar: true, noDrops: true, noFlinch: true, noShards: true },
  flavor: 'Pays no rent. Asks no questions. Answers fewer.',
  draw: 'gary',
  hitSound: 'hitFlesh',
};
SPECIAL_ENEMIES.gary = GARY;
