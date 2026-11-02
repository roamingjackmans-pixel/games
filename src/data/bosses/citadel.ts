// CONTENT_ENEMIES §11 Boss 7 — Archmagister Tock (Clockwork Citadel). A clockwork mage on a floating gear
// platform; 4 turrets stand in the arena's corners (boss parts, summoned at the corners). The arena's central
// rotating floor ring carries anyone standing on it at 40 px/s; phase 2 rewinds the clock and the ring
// reverses. Damage multipliers are of the boss hit (45 at zone 1).
import type { RoomTemplate } from '../../game/procgen/templates';
import type { AttackDef, BossDef, EnemyDef, SummonDef } from '../../game/types';

const arcaneVolley: AttackDef = {
  id: 'tock_arcane_volley',
  name: 'Arcane Volley',
  kind: 'normal',
  pattern: { kind: 'projectile', speed: 360, r: 8, count: 5, spreadDeg: 72, range: 1100 },
  windupMs: 700,
  recoverMs: 600,
  dmgMult: 0.8,
  type: 'void',
  cooldownS: 2.6,
  range: [120, 950],
  weight: 4,
  // boss normal attacks are parryable only where the sheet says so (D58)
  parryable: false,
};

const laserSweep = (turrets: number): AttackDef => ({
  id: 'tock_laser_sweep',
  name: 'Laser Sweep',
  kind: 'pierce',
  // a corner turret's beam starts on the target and turns a full circle in 3 s (the telegraph shows the
  // turret's start line, the arc and the direction); phase 2: two opposite corners, turning opposite ways
  pattern: { kind: 'sweep', angleDeg: 360, r: 'room', durationS: 3, anchor: 'corner', tickS: 0.25, w: 30, beamLine: true, ...(turrets > 1 ? { count: turrets, opposite: true } : {}) },
  windupMs: 1000,
  recoverMs: 700,
  dmgMult: 1.0,
  type: 'lightning',
  cooldownS: 12,
  range: [0, 1400],
  weight: 3,
  area: true,
});

const timeBubble = (durationS: number): AttackDef => ({
  id: 'tock_time_bubble',
  name: 'Time Bubble',
  kind: 'pierce',
  // 3 slow zones (players move and act at 60% speed); no damage of their own
  pattern: { kind: 'circle', r: 140, anchor: 'target', count: 3, persist: { hazard: 'timeBubble', durationS } },
  windupMs: 1000,
  recoverMs: 700,
  dmgMult: 0,
  type: 'void',
  cooldownS: 13,
  range: [0, 1100],
  weight: 2,
  area: true,
});

const gearDash: AttackDef = {
  id: 'tock_gear_dash',
  name: 'Gear Dash',
  kind: 'red',
  pattern: { kind: 'line', w: 110, l: 380, anchor: 'self' },
  move: { kind: 'charge', distance: 380, speed: 760 },
  windupMs: 700,
  recoverMs: 900,
  dmgMult: 1.6,
  type: 'physical',
  cooldownS: 6,
  range: [60, 420],
  weight: 3,
  hyperArmor: true,
};

const tinReinforcements: AttackDef = {
  id: 'tock_tin_reinforcements',
  name: 'Tin Reinforcements',
  kind: 'utility',
  // they march in from the walls
  effects: [{ op: 'summon', enemyId: 'tin_soldier', count: 4, max: 4, at: 'edges' }],
  windupMs: 1000,
  recoverMs: 600,
  dmgMult: 0,
  type: 'physical',
  cooldownS: 22,
  range: [0, 2000],
  weight: 2,
};

/** One strike of Rewind Volley: 8 circles along every player's path, starting where they were 1.0 s ago. */
function rewindStrike(n: number, windupMs: number, chain?: AttackDef): AttackDef {
  return {
    id: n === 1 ? 'tock_rewind_volley' : `tock_rewind_volley_${n}`,
    name: 'Rewind Volley',
    kind: 'pierce',
    pattern: { kind: 'circle', r: 90, anchor: 'eachPlayerPast(1.0)', count: 8 },
    windupMs,
    activeMs: 0,
    recoverMs: chain ? 0 : 800,
    dmgMult: 1.1,
    type: 'void',
    cooldownS: 13,
    range: [0, 1400],
    weight: 3,
    area: true,
    ...(chain ? { chain } : {}),
  };
}
// three volleys, 0.7 s apart, each re-read from the history at its own start
const rewindVolley = rewindStrike(1, 900, rewindStrike(2, 700, rewindStrike(3, 700)));

/** One dash of Overclock: a Gear Dash re-aimed at the target each time. */
function overclockDash(n: number, last: number, windupMs: number): AttackDef {
  return {
    id: n === 1 ? 'tock_overclock' : `tock_overclock_${n}`,
    name: 'Overclock',
    kind: 'red',
    pattern: { kind: 'line', w: 110, l: 380, anchor: 'self' },
    move: { kind: 'charge', distance: 380, speed: 820 },
    windupMs,
    recoverMs: n < last ? 0 : 1100,
    dmgMult: 1.6,
    type: 'physical',
    cooldownS: 15,
    range: [60, 700],
    weight: 3,
    hyperArmor: true,
    ...(n < last ? { chain: overclockDash(n + 1, last, 600) } : {}),
  };
}
const overclock = overclockDash(1, 4, 800);

/** The corner turrets rise right after the name card and stay for the whole fight. */
const turrets: SummonDef = { enemyId: 'clock_turret', count: 4, max: 4, everyS: 1, at: 'corners' };

export const ARCHMAGISTER_TOCK: BossDef = {
  id: 'archmagister_tock',
  zone: 7,
  name: 'Archmagister Tock',
  role: 'boss',
  radius: 48,
  speed: 100,
  resist: {},
  // the floating gear platform: hovers at range, is not carried by the floor ring
  moveStyle: 'hover',
  preferredRange: 300,
  hyperArmor: false,
  phases: [
    { untilHpPct: 50, speedMult: 1, dmgMult: 1, summons: [turrets], attacks: [arcaneVolley, laserSweep(1), timeBubble(6), gearDash, tinReinforcements] },
    {
      untilHpPct: 0,
      name: 'The clock runs backward',
      speedMult: 1.2,
      dmgMult: 1.25,
      arena: [{ op: 'reverseFloor' }],
      summons: [turrets],
      attacks: [arcaneVolley, laserSweep(2), timeBubble(10), gearDash, tinReinforcements, rewindVolley, overclock],
    },
  ],
  arenaId: 'citadel_arena',
  introTitle: 'ARCHMAGISTER TOCK',
  introSub: 'Your appointment was at the start of time. You are late.',
  music: { root: 48, tempo: 92, bright: 0.6 },
  flavor: 'A clockwork mage who wound himself up four hundred years ago and has never once run down.',
  draw: 'boss_tock',
  palette: ['#b08d3c', '#b06bff', '#2aa198'],
  hitSound: 'hitMetal',
  construct: true,
};

export const ARCHMAGISTER_TOCK_ARENA: RoomTemplate = {
  id: 'citadel_arena',
  rows: [
    '###################DD###################',
    '#..o................................o..#',
    '#..................H...................#',
    '#o....................................o#',
    '#......................................#',
    '#....PP..........................PP....#',
    '#....PP..........................PP....#',
    '#......................................#',
    '#......................................#',
    '#......................................#',
    'D........~~.........K........~~........D',
    'D........~~..................~~........D',
    '#......................................#',
    '#......................................#',
    '#......................................#',
    '#....PP..........................PP....#',
    '#....PP..........................PP....#',
    '#......................................#',
    '#o....................................o#',
    '#......................................#',
    '#..o................................o..#',
    '###################DD###################',
  ],
  // the central rotating floor ring: 40 px/s clockwise (phase 2 reverses it)
  rotFloor: { x: 640, y: 368, rIn: 110, rOut: 230, speed: 40 },
};

const ALL_STATUS: EnemyDef['statusImmune'] = ['burn', 'chill', 'shock', 'bleed', 'poison', 'freeze', 'blind', 'hexed', 'silence', 'root', 'hold'];

/** Boss-only bodies and summons (special: true), merged into ENEMIES. */
export const ARCHMAGISTER_TOCK_PARTS: Record<string, EnemyDef> = {
  clock_turret: {
    id: 'clock_turret',
    zone: 7,
    name: 'Corner Turret',
    role: 'hazard',
    radius: 20,
    resist: {},
    statusImmune: ALL_STATUS,
    moveStyle: 'stationary',
    preferredRange: 0,
    // Tock fires the Laser Sweep from these corners; the turrets themselves are scenery that cannot be broken
    attacks: [],
    traits: { invulnerable: true, noFlinch: true, hideHpBar: true, noDrops: true, noShards: true, homeRadius: 6 },
    flavor: 'Bolted into the corner in the year the citadel was wound.',
    draw: 'tock_turret',
    palette: ['#b08d3c', '#2aa198', '#6c4ab6'],
    hitSound: 'hitMetal',
    construct: true,
    special: true,
  },
};
