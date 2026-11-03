// CONTENT_ENEMIES §11 Boss 6 — Saint Aurelia the Unthawed (Frozen Reliquary). A knight-saint in a block of
// ice that cracks as the fight goes on. Reliquary nave with 6 pillars; the floor ices over in patches ('~' is
// the zone's ice). Phase 2: the ice shatters, frost wings, half the floor turns to ice. Damage multipliers are
// of the boss hit (45 at zone 1).
import type { RoomTemplate } from '../../game/procgen/templates';
import type { AttackDef, BossDef, EnemyDef } from '../../game/types';

const blessedBlade: AttackDef = {
  id: 'aurelia_blessed_blade',
  name: 'Blessed Blade',
  kind: 'normal',
  pattern: { kind: 'melee', shape: 'arc', angleDeg: 110, r: 135 },
  windupMs: 750,
  recoverMs: 900,
  dmgMult: 1.0,
  type: 'magic',
  status: { id: 'chill', buildup: 20 },
  comboMults: [1.0, 1.0, 1.4],
  comboGapMs: 420,
  cooldownS: 3,
  range: [0, 135],
  weight: 4,
  // the sheet: parryable on the third hit only
  parryable: true,
  parryableHits: [2],
};

const iceSpears = (twoSets: boolean): AttackDef => ({
  id: 'aurelia_ice_spears',
  name: 'Ice Spears',
  kind: 'pierce',
  pattern: twoSets ? { kind: 'lanes', n: 5, w: 80, orientation: 'vertical', alternate: true, setGapS: 0.8 } : { kind: 'lanes', n: 5, w: 80, orientation: 'vertical' },
  windupMs: 1100,
  recoverMs: 800,
  dmgMult: 1.2,
  type: 'magic',
  cooldownS: 9,
  range: [0, 1400],
  weight: 3,
  area: true,
});

const frostbiteLunge: AttackDef = {
  id: 'aurelia_frostbite_lunge',
  name: 'Frostbite Lunge',
  kind: 'red',
  pattern: { kind: 'line', w: 50, l: 260, anchor: 'self' },
  move: { kind: 'lunge', distance: 260 },
  windupMs: 600,
  recoverMs: 900,
  dmgMult: 1.7,
  type: 'magic',
  status: { id: 'chill', buildup: 70 },
  cooldownS: 6,
  range: [0, 280],
  weight: 3,
  hyperArmor: true,
};

const hymn = (pairs: boolean): AttackDef => ({
  id: 'aurelia_hymn',
  name: 'Hymn',
  kind: 'pierce',
  pattern: { kind: 'expandingRing', speed: 280, thickness: 40, gaps: 4, gapW: 110, anchor: 'self', centerGapDeg: 15, ...(pairs ? { count: 2, spacingS: 1.0 } : {}) },
  windupMs: 1000,
  recoverMs: 800,
  dmgMult: 0.6,
  type: 'holy',
  control: { id: 'silence', durationS: 2 },
  cooldownS: 11,
  range: [0, 1400],
  weight: 3,
  area: true,
});

const mirrorOfFaith: AttackDef = {
  id: 'aurelia_mirror_of_faith',
  name: 'Mirror of Faith',
  kind: 'utility',
  effects: [{ op: 'summon', enemyId: 'ice_mirror', count: 3, max: 3 }],
  windupMs: 900,
  recoverMs: 600,
  dmgMult: 0,
  type: 'magic',
  cooldownS: 20,
  range: [0, 2000],
  weight: 2,
};

const avalanche: AttackDef = {
  id: 'aurelia_avalanche',
  name: 'Avalanche',
  kind: 'pierce',
  // boulders roll down 4 horizontal lanes after the telegraph (alternating ends); step out of a lane
  pattern: { kind: 'lanes', n: 4, w: 120, orientation: 'horizontal', roll: { speed: 650 } },
  windupMs: 1200,
  recoverMs: 900,
  dmgMult: 1.5,
  type: 'physical',
  knockback: 140,
  cooldownS: 12,
  range: [0, 1400],
  weight: 3,
  area: true,
};

/** Judgment's second half: the Frost Nova where she lands (a separate Piercing attack, chained). */
const frostNova: AttackDef = {
  id: 'aurelia_frost_nova',
  name: 'Frost Nova',
  kind: 'pierce',
  pattern: { kind: 'expandingRing', speed: 300, thickness: 40, gaps: 4, gapW: 110, anchor: 'self', centerGapDeg: 15 },
  windupMs: 1000,
  recoverMs: 1000,
  dmgMult: 1.0,
  type: 'magic',
  cooldownS: 0,
  range: [0, 2000],
  weight: 0,
  area: true,
};

const judgment: AttackDef = {
  id: 'aurelia_judgment',
  name: 'Judgment',
  kind: 'red',
  // she dives through the target to the far wall (or a pillar), then the nova rings out from there
  pattern: { kind: 'line', w: 120, l: 'room', anchor: 'self' },
  move: { kind: 'charge', untilWall: true, speed: 950 },
  windupMs: 900,
  recoverMs: 300,
  dmgMult: 2.2,
  type: 'magic',
  cooldownS: 14,
  range: [0, 1400],
  weight: 3,
  area: true,
  hyperArmor: true,
  chain: frostNova,
};

export const SAINT_AURELIA: BossDef = {
  id: 'saint_aurelia',
  zone: 6,
  name: 'Saint Aurelia the Unthawed',
  role: 'boss',
  radius: 46,
  speed: 125,
  resist: {},
  moveStyle: 'walk',
  preferredRange: 110,
  hyperArmor: false,
  phases: [
    { untilHpPct: 50, speedMult: 1, dmgMult: 1, attacks: [blessedBlade, iceSpears(false), frostbiteLunge, hymn(false), mirrorOfFaith] },
    {
      untilHpPct: 0,
      name: 'The ice shatters',
      speedMult: 1.2,
      dmgMult: 1.25,
      // "the floor is 50% ice patches": 20 patches of r 80 cover about half of the nave
      arena: [
        { op: 'iceFloor', value: 20 },
        // the nave's middle breaks into a floe ring that slides 50 px/s anticlockwise (D95)
        { op: 'movingFloor', floor: { kind: 'ring', x: 640, y: 368, rIn: 110, rOut: 220, speed: -50, look: 'ice' } },
      ],
      attacks: [blessedBlade, iceSpears(true), frostbiteLunge, hymn(true), mirrorOfFaith, avalanche, judgment],
    },
  ],
  arenaId: 'reliquary_arena',
  introTitle: 'SAINT AURELIA THE UNTHAWED',
  introSub: 'Four hundred years on guard duty. Nobody told her she could stop.',
  music: { root: 57, tempo: 54, bright: 0.8 },
  flavor: 'Froze at her post to keep the collectors out. The ice was a blessing, once.',
  draw: 'boss_aurelia',
  palette: ['#d6ecff', '#9ad0ff', '#d4af37'],
  hitSound: 'hitMetal',
};

export const SAINT_AURELIA_ARENA: RoomTemplate = {
  id: 'reliquary_arena',
  rows: [
    '###################DD###################',
    '#......................................#',
    '#..............................~~~.....#',
    '#..............................~~~.....#',
    '#.......PP....oo........oo....PP.......#',
    '#.......PP....................PP.......#',
    '#..................K....~~~............#',
    '#..~~~..................~~~............#',
    '#..~~~.................................#',
    '#......................................#',
    'D.......PP....................PP.......D',
    'D.......PP....................PP.......D',
    '#......................................#',
    '#.............~~~......................#',
    '#.............~~~..H.............~~~...#',
    '#................................~~~...#',
    '#.......PP....................PP.......#',
    '#.......PP...........~~~......PP.......#',
    '#...~~~..............~~~...............#',
    '#...~~~................................#',
    '#......................................#',
    '###################DD###################',
  ],
};

/** Boss-only bodies and summons (special: true), merged into ENEMIES. */
export const SAINT_AURELIA_PARTS: Record<string, EnemyDef> = {
  ice_mirror: {
    id: 'ice_mirror',
    zone: 6,
    name: 'Ice Mirror',
    role: 'hazard',
    radius: 20,
    resist: {},
    moveStyle: 'stationary',
    preferredRange: 0,
    attacks: [],
    // 1 HP: any melee hit breaks it; projectiles and projectile spells bounce back at the thrower
    traits: { fixedHp: 1, reflectsProjectiles: true, noFlinch: true, hideHpBar: true, noDrops: true, noShards: true },
    flavor: 'Faith, polished until it shows you your own arrow coming back.',
    draw: 'aurelia_mirror',
    palette: ['#cfeaff', '#9ad0ff', '#ffffff'],
    hitSound: 'hitMetal',
    special: true,
  },
};
