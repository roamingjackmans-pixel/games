// CONTENT_ENEMIES §11 Boss 5 — Foreman Ignatius (Ashen Forge). A fire-cult blacksmith riding an Anvil Golem's
// shoulders; the two share a bar. Arena: forge floor with a lava channel crossing it (2 bridges; its '~' tiles are
// live lava from the start of the fight) and bellows on the walls. Phase 2: Ignatius is knocked off and fights on
// foot (BossPhase.passive.splitBody, attacks marked `body: 'split'`) while the boss body is the molten Golem: two
// targets, one bar. Damage multipliers are of the boss hit (45 at zone 1 scaling).
import type { RoomTemplate } from '../../game/procgen/templates';
import type { ArenaChange, AttackDef, BossDef, EnemyDef } from '../../game/types';

const golemSlam: AttackDef = {
  id: 'ign_golem_slam',
  name: 'Golem Slam',
  kind: 'normal',
  pattern: { kind: 'circle', r: 120, anchor: 'self' },
  windupMs: 900,
  recoverMs: 900,
  dmgMult: 1.4,
  type: 'physical',
  cooldownS: 3,
  range: [0, 110],
  weight: 4,
  parryable: false,
};

/**
 * The hammer lands on a circle at the target, then flies back to its thrower along a line(40) (a second, normal
 * hit ×0.8 that is telegraphed for 0.45 s from wherever he stands by then).
 */
const hammerThrow = (body?: 'split'): AttackDef => ({
  id: 'ign_hammer_throw',
  name: 'Hammer Throw',
  kind: 'pierce',
  pattern: { kind: 'circle', r: 110, anchor: 'target' },
  effects: [
    {
      op: 'sequence',
      steps: [{ delayS: 0, effect: { op: 'damage', pattern: { kind: 'line', w: 40, l: 0, anchor: 'self', toAim: true }, mult: 0.8, type: 'fire', telegraphS: 0.45 } }],
    },
  ],
  windupMs: 1000,
  recoverMs: 900,
  dmgMult: 1.3,
  type: 'fire',
  cooldownS: 7,
  range: [120, 900],
  weight: 3,
  ...(body ? { body } : {}),
});

const forgeStrike: AttackDef = {
  id: 'ign_forge_strike',
  name: 'Forge Strike',
  kind: 'red',
  pattern: { kind: 'line', w: 90, l: 200, anchor: 'self' },
  windupMs: 700,
  recoverMs: 1000,
  dmgMult: 1.8,
  type: 'fire',
  cooldownS: 8,
  range: [0, 200],
  weight: 3,
};

const flamePillars = (setGapS: number, body?: 'split'): AttackDef => ({
  id: 'ign_flame_pillars',
  name: 'Flame Pillars',
  kind: 'pierce',
  pattern: { kind: 'grid', spacing: 150, r: 55, checkerboard: true, sets: 2, setGapS },
  windupMs: 1000,
  recoverMs: 900,
  dmgMult: 1.1,
  type: 'fire',
  cooldownS: 11,
  range: [0, 1400],
  weight: 2,
  area: true,
  ...(body ? { body } : {}),
});

/** Bellows fire: two jets across the room from the side walls, lit 3 s, ×0.5 every 0.25 s + Burn. */
const stoke: AttackDef = {
  id: 'ign_stoke',
  name: 'Stoke',
  kind: 'normal',
  pattern: { kind: 'lanes', n: 2, w: 60, orientation: 'horizontal', durationS: 3, tickS: 0.25 },
  windupMs: 1000,
  recoverMs: 700,
  dmgMult: 0.5,
  type: 'fire',
  status: { id: 'burn', buildup: 12 },
  cooldownS: 12,
  range: [0, 1400],
  weight: 2,
  area: true,
  parryable: false,
};

const moltenShockwave: AttackDef = {
  // the only gap is behind the Golem: get round it. Thrown only up close, with a 1.2 s tell (D94): from farther
  // out the ring (300 px/s, faster than a walk) caught you before you could get round him. With his back to a
  // wall, a pillar or the lava the gap opens on the nearest open side instead.
  id: 'ign_molten_shockwave',
  name: 'Molten Shockwave',
  kind: 'pierce',
  pattern: { kind: 'expandingRing', speed: 300, gaps: 3, gapW: 110, gapBehind: true, anchor: 'self', centerGapDeg: 15 },
  windupMs: 1200,
  recoverMs: 1000,
  dmgMult: 1.3,
  type: 'fire',
  cooldownS: 11,
  range: [0, 200],
  weight: 3,
  area: true,
};

/** Ignatius on foot: the whole room burns except within 140 px of him ("run to the priest"); Red, so i-frames work too. */
const immolation: AttackDef = {
  id: 'ign_immolation',
  name: 'Immolation',
  kind: 'red',
  pattern: { kind: 'pockets', n: 1, pocketR: 140, anchor: 'self' },
  windupMs: 1000,
  recoverMs: 1200,
  dmgMult: 2.5,
  type: 'fire',
  cooldownS: 16,
  range: [0, 2000],
  weight: 3,
  area: true,
  body: 'split',
};

// ---------------------------------------------------------------- the arena
const ARENA_ROWS = [
  '###################DD###################',
  '#......................................#',
  '#......................................#',
  '#......................................#',
  '#...........PP............PP...........#',
  '#o..........PP............PP..........o#',
  '#o..................K.................o#',
  '#......................................#',
  '#......................................#',
  '#...................H..................#',
  'D......................................D',
  'D......................................D',
  '#......................................#',
  '#~~~~~~~...~~~~~~~~~~~~~~~~~~...~~~~~~~#',
  '#~~~~~~~...~~~~~~~~~~~~~~~~~~...~~~~~~~#',
  '#~~~~~~~...~~~~~~~~~~~~~~~~~~...~~~~~~~#',
  '#......................................#',
  '#......................................#',
  '#......................................#',
  '#o..........PP............PP..........o#',
  '#o..........PP............PP..........o#',
  '###################DD###################',
];

/** Phase 2: the channel widens by a row on each side and the west bridge (x 8–10) goes under; the east one stays. */
function widenedChannel(): string[] {
  const tiles: string[] = [];
  for (let y = 12; y <= 16; y++)
    for (let x = 1; x <= 38; x++) {
      if (x >= 29 && x <= 31) continue;
      if (ARENA_ROWS[y]![x] !== '~') tiles.push(`${x},${y},~`);
    }
  return tiles;
}

const LAVA: ArenaChange = { op: 'hazardTiles', hazard: 'lava' };

/** Phase 2's conveyor belts (D95): they run along the channel, never toward it, so they carry you past the lava. */
const BELT_NORTH: ArenaChange = { op: 'movingFloor', floor: { kind: 'belt', x: 64, y: 48, w: 1152, h: 64, dir: 'e', speed: 70, look: 'forge' } };
const BELT_MIDDLE: ArenaChange = { op: 'movingFloor', floor: { kind: 'belt', x: 64, y: 240, w: 1152, h: 64, dir: 'w', speed: 70, look: 'forge' } };

export const FOREMAN_IGNATIUS: BossDef = {
  id: 'foreman_ignatius',
  zone: 5,
  name: 'Foreman Ignatius',
  role: 'boss',
  radius: 58,
  speed: 85,
  resist: {},
  moveStyle: 'walk',
  preferredRange: 110,
  traits: { turnRate: 120 },
  phases: [
    { untilHpPct: 50, speedMult: 1, dmgMult: 1, arena: [LAVA], attacks: [golemSlam, hammerThrow(), forgeStrike, flamePillars(1.0), stoke] },
    {
      untilHpPct: 0,
      name: 'The Golem goes molten',
      speedMult: 1.2,
      dmgMult: 1.25,
      // the forge's conveyor belts start: east along the north wall, west through the middle of the floor (D95)
      arena: [{ op: 'setTiles', tiles: widenedChannel() }, LAVA, BELT_NORTH, BELT_MIDDLE],
      passive: { splitBody: 'ignatius_on_foot' },
      attacks: [golemSlam, forgeStrike, stoke, moltenShockwave, hammerThrow('split'), flamePillars(0.5, 'split'), immolation],
    },
  ],
  arenaId: 'forge_arena',
  introTitle: 'FOREMAN IGNATIUS',
  introSub: 'Twelve-hour shifts. No breaks. You are the break.',
  music: { root: 43, tempo: 104, bright: 0.6 },
  flavor: 'A fire-cult blacksmith riding an Anvil Golem’s shoulders. The Golem does not get a say.',
  draw: 'boss_ignatius',
  palette: ['#3a3a40', '#ff7a1a', '#ffd27a'],
  hitSound: 'hitMetal',
  construct: true,
};

export const FOREMAN_IGNATIUS_ARENA: RoomTemplate = { id: 'forge_arena', rows: ARENA_ROWS };

/** Boss-only bodies and summons (special: true), merged into ENEMIES. */
export const FOREMAN_IGNATIUS_PARTS: Record<string, EnemyDef> = {
  // phase 2's second body: its attacks come from the phase table (`body: 'split'`), its damage goes to the boss bar
  ignatius_on_foot: {
    id: 'ignatius_on_foot',
    zone: 5,
    name: 'Foreman Ignatius',
    role: 'brute',
    radius: 24,
    speed: 140,
    resist: {},
    moveStyle: 'walk',
    preferredRange: 220,
    attacks: [hammerThrow('split'), flamePillars(0.5, 'split'), immolation],
    traits: { hideHpBar: true, noDrops: true, noShards: true, turnRate: 300 },
    flavor: 'Knocked off his Golem. Still on the clock.',
    draw: 'boss_ignatius_foot',
    palette: ['#5a2a1a', '#ff7a1a', '#ffd27a'],
    hitSound: 'hitFlesh',
    special: true,
  },
};
