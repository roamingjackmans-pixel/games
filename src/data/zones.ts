// GAME_DESIGN §2.1, CONTENT_ENEMIES §2–9 headers, ART_AUDIO §2 palettes: the 8 zones.
import type { ZoneDef } from '../game/types';

export interface ZoneExtra {
  /** prop style for 'o' tiles */
  props: string;
  /** what '~' tiles are */
  hazardKind: string;
  floorSound: 'stepStone' | 'stepWater' | 'stepGrass';
}

const pent = [0, 3, 5, 7, 10];
const minorPent = [0, 3, 5, 7, 10, 12];

export const ZONES: (ZoneDef & ZoneExtra)[] = [
  {
    id: 1,
    name: 'Mossy Crypt',
    palette: { floor: '#2b3326', floor2: '#303a2a', wall: '#1c2219', wallTop: '#4a5a44', accent: '#a9b7a0', hazard: '#3a4a30', colors: ['#2f3d2a', '#a9b7a0', '#e8e1c8', '#6b7f66'] },
    enemies: ['shambler', 'bone_archer', 'crypt_rat_swarm', 'gravedigger', 'will_o_wisp', 'hollow_knight', 'ghoul_leaper', 'plague_bell', 'weeping_mourner', 'pallbearer'],
    boss: 'the_caretaker',
    music: { root: 50, tempo: 54, bright: 0.25, scale: minorPent, wave: 'triangle' },
    hazardTile: 'water',
    resist: {},
    statusImmune: [],
    tagline: 'Joe went down the stairs to find the fuse box.',
    props: 'coffin',
    hazardKind: 'water',
    floorSound: 'stepStone',
  },
  {
    id: 2,
    name: 'Fungal Caverns',
    palette: { floor: '#2a2236', floor2: '#2f263d', wall: '#1a1424', wallTop: '#5a3f7a', accent: '#5fd3c0', hazard: '#3a5a20', colors: ['#3b2a4f', '#5fd3c0', '#8b5a3c', '#c58cff'] },
    enemies: ['sporeling', 'cave_hound', 'myconid_shaman', 'boulder_beetle', 'glowcap_spitter', 'fungal_ogre', 'spore_bat', 'mycelium_weaver', 'lanternjaw', 'lichen_hermit'],
    boss: 'mother_spore',
    music: { root: 47, tempo: 58, bright: 0.45, scale: [0, 2, 3, 7, 8], wave: 'sine' },
    hazardTile: 'poisonCloud',
    resist: { fire: -0.35 },
    statusImmune: ['poison'],
    tagline: 'It smells like a basement that grew a basement.',
    props: 'mushroom',
    hazardKind: 'poisonCloud',
    floorSound: 'stepGrass',
  },
  {
    id: 3,
    name: 'Drowned Sewers',
    palette: { floor: '#232e22', floor2: '#283426', wall: '#121a12', wallTop: '#4a5a3a', accent: '#8fa37a', hazard: '#0e1a14', colors: ['#2d3b2b', '#7d5a2e', '#0e1a14', '#8fa37a'] },
    enemies: ['drowned', 'green_slime', 'sewer_crocodile', 'rat_physician', 'harpooner', 'leech_swarm', 'bloated_carrier', 'tide_caller', 'sewer_diver', 'fuse_eel'],
    boss: 'bloatking',
    music: { root: 45, tempo: 50, bright: 0.2, scale: [0, 1, 5, 7, 8], wave: 'triangle' },
    hazardTile: 'water',
    resist: {},
    statusImmune: ['poison'],
    tagline: 'All the rent drains down here. So does everything else.',
    props: 'barrel',
    hazardKind: 'water',
    floorSound: 'stepWater',
  },
  {
    id: 4,
    name: 'Hollow Forest',
    palette: { floor: '#2a2a18', floor2: '#30301c', wall: '#1a1408', wallTop: '#5a3a1a', accent: '#e6b84a', hazard: '#3a4a1a', colors: ['#c8621f', '#1f3d22', '#e6b84a', '#5a3a1a'] },
    enemies: ['hollow_wolf', 'thornling', 'fey_archer', 'treant', 'witch_of_the_glade', 'stag_sentinel', 'pixie_swarm', 'hollow_huntsman', 'hollow_scarecrow', 'hollow_beekeeper'],
    boss: 'vexthorn',
    music: { root: 52, tempo: 62, bright: 0.55, scale: pent, wave: 'sine' },
    hazardTile: 'thorns',
    resist: { holy: 0.2, fire: -0.4 },
    statusImmune: [],
    tagline: 'A forest. Under a sewer. Tapped dry. Nobody asks.',
    props: 'stump',
    hazardKind: 'thorns',
    floorSound: 'stepGrass',
  },
  {
    id: 5,
    name: 'Ashen Forge',
    palette: { floor: '#2a1814', floor2: '#301a16', wall: '#120808', wallTop: '#5a2a1a', accent: '#ff7a1a', hazard: '#ff4a10', colors: ['#8e1b1b', '#1a1010', '#ff7a1a', '#ffd27a'] },
    enemies: ['cinder_cultist', 'forge_hound', 'pyromancer', 'anvil_golem', 'slag_crawler', 'bellows_brute', 'ash_wraith', 'furnace_priest', 'rivet_gunner', 'crucible_bearer'],
    boss: 'foreman_ignatius',
    music: { root: 43, tempo: 70, bright: 0.6, scale: [0, 1, 4, 5, 7, 8], wave: 'sawtooth' },
    hazardTile: 'lava',
    resist: {},
    statusImmune: ['burn'],
    tagline: 'Hot. Loud. Not unionised. Yet.',
    props: 'anvil',
    hazardKind: 'lava',
    floorSound: 'stepStone',
  },
  {
    id: 6,
    name: 'Frozen Reliquary',
    palette: { floor: '#2a3a4a', floor2: '#30404f', wall: '#1a2430', wallTop: '#6a8aaa', accent: '#d4af37', hazard: '#a8d8f0', colors: ['#9ad0ff', '#f4f8ff', '#d4af37', '#3a5a8a'] },
    enemies: ['frost_knight', 'reliquary_wraith', 'icicle_lurker', 'frozen_hound', 'choir_acolyte', 'glacial_golem', 'hoarfrost_archer', 'relic_guardian', 'rime_moths', 'frozen_censer'],
    boss: 'saint_aurelia',
    music: { root: 57, tempo: 48, bright: 0.75, scale: [0, 2, 4, 7, 9], wave: 'sine' },
    hazardTile: 'ice',
    resist: {},
    statusImmune: ['chill', 'freeze'],
    tagline: 'The choir has been singing the same note for four hundred years.',
    props: 'crystal',
    hazardKind: 'ice',
    floorSound: 'stepStone',
  },
  {
    id: 7,
    name: 'Clockwork Citadel',
    palette: { floor: '#22202a', floor2: '#28252f', wall: '#121018', wallTop: '#6a5a2a', accent: '#2aa198', hazard: '#b08de8', colors: ['#b08d3c', '#2aa198', '#6c4ab6', '#1a1a22'] },
    enemies: ['tin_soldier', 'clockwork_spider', 'gear_turret', 'brass_juggernaut', 'citadel_magister', 'pendulum_knight', 'repair_drone', 'chronomancers_hand', 'cuckoo_clock', 'clockwork_butler'],
    boss: 'archmagister_tock',
    music: { root: 48, tempo: 76, bright: 0.65, scale: [0, 2, 3, 6, 7, 9], wave: 'square' },
    hazardTile: 'oil',
    resist: { physical: 0.2 },
    statusImmune: [],
    tagline: 'Everything ticks. Some of it tocks.',
    props: 'gear',
    hazardKind: 'oil',
    floorSound: 'stepStone',
  },
  {
    id: 8,
    name: 'The Abyss',
    palette: { floor: '#120a1c', floor2: '#160c22', wall: '#06030a', wallTop: '#2a0d3f', accent: '#7a2bd6', hazard: '#06030a', colors: ['#06030a', '#7a2bd6', '#ffffff', '#2a0d3f'] },
    enemies: ['hollow_joe', 'void_mote_swarm', 'eye_of_the_deep', 'abyssal_knight', 'nullwraith', 'maw', 'landlords_clerk', 'star_eater', 'fine_print', 'bailiff'],
    boss: 'the_landlord',
    music: { root: 38, tempo: 44, bright: 0.15, scale: [0, 1, 6, 7, 11], wave: 'sawtooth' },
    hazardTile: 'voidEdge',
    resist: { void: 0.5, holy: -0.4 },
    statusImmune: [],
    tagline: 'The rent is due. All of it.',
    props: 'void',
    hazardKind: 'void',
    floorSound: 'stepStone',
  },
];

export function zoneDef(z: number): ZoneDef & ZoneExtra {
  return ZONES[Math.max(0, Math.min(7, z - 1))]!;
}
