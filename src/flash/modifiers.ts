// The FlashGames modifiers (D452, GAME_DESIGN §25). This list is the game's side of public/flash.json: the ids, names,
// texts, weights and exclusions there must match it exactly (tests/unit/flash.test.ts holds them together). Each
// modifier sets run modifiers (src/game/runMods.ts) the systems read, changes Joe's starting kit, or sets a rule the
// FlashGames scene follows (turbo, one life, darkness). Keep ids stable once live: old days' plans refer to them.
import { Rng } from '../engine/rng';
import { CASTING_TOOLS } from '../data/castingTools';
import { SPELLS } from '../data/spells';
import { WEAPONS, WEAPON_IDS } from '../data/weapons';
import { itemRequirements } from '../game/items/bases';
import { generateItem } from '../game/items/generate';
import { makeItem } from '../game/items/make';
import type { RunMods } from '../game/runMods';
import type { Character, Item } from '../game/types';

/** Rules the run scene follows. */
export interface FlashRules {
  /** sim steps per update (Turbo: 2) */
  steps: number;
  /** a death ends the run */
  oneLife: boolean;
  /** every room is dark but for Joe's lantern */
  dark: boolean;
}

/** What a modifier's kit step may use: a seeded random number generator in [0, 1) per salt. */
export interface KitCtx {
  rng(salt: string): () => number;
}

/** The game's own seeded generator, seeded from a FlashRun stream. */
function gameRng(k: KitCtx, salt: string): Rng {
  return new Rng(Math.floor(k.rng(salt)() * 4294967296) >>> 0);
}

export interface FlashModifier {
  id: string;
  name: string;
  text: string;
  excludes?: string[];
  weight?: number;
  /** the run modifiers it sets */
  mods?(m: RunMods): void;
  /** Joe's starting kit (applied in list order, before any `stats`) */
  kit?(c: Character, k: KitCtx): void;
  /** Joe's stats, after every kit */
  stats?(c: Character): void;
  rules?: Partial<FlashRules>;
}

/** Bring each stat up to what an item asks for, so nothing Joe starts with is below its requirement. */
function meetReqs(c: Character, item: Item): void {
  const r = itemRequirements(item);
  c.stats.bonk = Math.max(c.stats.bonk, r.bonk);
  c.stats.slicey = Math.max(c.stats.slicey, r.slicey);
  c.stats.brain = Math.max(c.stats.brain, r.brain ?? 0);
  c.stats.prayer = Math.max(c.stats.prayer, r.prayer ?? 0);
}

/**
 * Wrong Bag: one of the 25 weapon classes at random, Legendary at item level 1 with its first skill unlocked (like The
 * Instructor's prize, D89), in the weapon hand; Joe's stats rise to its requirements. Two-handed when it must be, or
 * when nothing is in the off hand.
 */
function wrongBag(c: Character, k: KitCtx): void {
  const rng = gameRng(k, 'weapon');
  const baseId = rng.pick(WEAPON_IDS);
  const item = generateItem(rng, { source: 'boss', ilvl: 1, zone: 1, rarity: 'legendary', baseId });
  item.skills = Math.max(1, item.skills ?? 0);
  c.equipment.main = item;
  meetReqs(c, item);
  c.twoHanded = !!WEAPONS[baseId]?.twoHandOnly || !c.equipment.off;
}

/** Spells Only's spells: one sure opener per school and a seeded pick of the rest (solo-useful ones only). */
export const SPELLS_ONLY_POOL = {
  brain: { always: ['arcane_bolt'], pick: ['scatter_shards', 'frost_lance', 'fireball', 'chain_lightning', 'void_rift', 'arcane_beam'], n: 2 },
  prayer: { always: ['sunray', 'heal'], pick: ['ward_of_steel', 'haste', 'stone_skin', 'spirit_shield', 'purify'], n: 1 },
} as const;

/**
 * Spells Only: a Rare Arcane Staff in the weapon hand (its spells on Q / E / R) and a Rare Silver Talisman in the off
 * hand (1 / 2 / 3), three Brain and three Prayer spells, no weapon anywhere; Brain and Prayer rise to what the tools
 * and spells need.
 */
function spellsOnly(c: Character, k: KitCtx): void {
  const rng = gameRng(k, 'spells');
  const staff = makeItem('arcane_staff', 'rare', 1, { rng });
  const talisman = makeItem('silver_talisman', 'rare', 1, { rng });
  c.equipment.main = staff;
  c.equipment.off = talisman;
  c.altMain = null;
  c.altOff = null;
  c.twoHanded = false;
  c.bag = c.bag.filter((it) => it.kind !== 'weapon');
  const school = (s: 'brain' | 'prayer'): [string, string, string] => {
    const p = SPELLS_ONLY_POOL[s];
    const rest = rng.shuffle([...p.pick]).slice(0, p.n);
    const ids = [...p.always, ...rest];
    return [ids[0]!, ids[1]!, ids[2]!];
  };
  const brain = school('brain');
  const prayer = school('prayer');
  c.knownSpells = [...brain, ...prayer];
  c.spellLoadout = { brain, prayer };
  const need = (ids: string[], tool: string): number => Math.max(CASTING_TOOLS[tool]?.req ?? 0, ...ids.map((id) => SPELLS[id]?.req ?? 0));
  c.stats.brain = Math.max(c.stats.brain, need(brain, 'arcane_staff'));
  c.stats.prayer = Math.max(c.stats.prayer, need(prayer, 'silver_talisman'));
}

export const FLASH_MODIFIERS: readonly FlashModifier[] = [
  {
    id: 'glass',
    name: 'Glass Joe',
    text: '1 max HP and every stat at 999. Joe hits like a truck and breaks like a teacup.',
    excludes: ['bottomless', 'dry', 'onelife'],
    weight: 2,
    mods: (m) => {
      m.playerMaxHp = 1;
    },
    stats: (c) => {
      for (const k of Object.keys(c.stats) as (keyof Character['stats'])[]) c.stats[k] = 999;
    },
  },
  {
    id: 'turbo',
    name: 'Double Espresso',
    text: 'The whole dungeon runs at double speed. So does Joe.',
    rules: { steps: 2 },
  },
  {
    id: 'mimics',
    name: 'Mimic Mania',
    text: 'Every chest is a Mimic, and every fight room has one. Hit a chest before you open it.',
    mods: (m) => {
      m.allMimic = true;
    },
  },
  {
    id: 'elites',
    name: 'Elite Squad',
    text: 'Every enemy is an Elite (swarms aside): triple HP, harder hits, a nasty affix, triple Shards.',
    excludes: ['horde'],
    mods: (m) => {
      m.allElite = true;
    },
  },
  {
    id: 'horde',
    name: 'Paper Horde',
    text: 'Enemies have 1 HP, but three times as many of them come.',
    excludes: ['elites'],
    mods: (m) => {
      m.enemyOneHp = true;
      m.waveRepeat = 3;
    },
  },
  {
    id: 'bottomless',
    name: 'Bottomless Thermos',
    text: 'The Thermos never runs dry. Drink as often as you dare.',
    excludes: ['dry', 'glass'],
    mods: (m) => {
      m.flaskFree = true;
    },
  },
  {
    id: 'dry',
    name: 'Dry Spell',
    text: 'No Thermos at all. Bonfires still heal.',
    excludes: ['bottomless', 'glass'],
    mods: (m) => {
      m.noFlask = true;
    },
  },
  {
    id: 'crimson',
    name: 'Seeing Red',
    text: 'Every enemy attack is Red: no blocking, no parrying. Dodge or get out of the way.',
    mods: (m) => {
      m.allRed = true;
    },
  },
  {
    id: 'pinata',
    name: 'Piñata Party',
    text: 'Every enemy drops an item when it dies.',
    mods: (m) => {
      m.dropAll = true;
    },
  },
  {
    id: 'tiny',
    name: 'Tiny Joe',
    text: 'Joe shrank in the wash: half the size, a tiny hitbox, quicker feet, short arms and 40% less HP.',
    excludes: ['huge'],
    mods: (m) => {
      m.playerSize = 0.55;
      m.playerBody = 0.6;
      m.playerReach = 0.8;
      m.playerWalkMult = 1.2;
      m.playerHpMult = 0.6;
    },
  },
  {
    id: 'huge',
    name: 'Huge Joe',
    text: 'Joe is enormous: twice the HP, long reach, 25% harder hits, slow feet and impossible to miss.',
    excludes: ['tiny'],
    mods: (m) => {
      m.playerSize = 1.6;
      m.playerBody = 1.35;
      m.playerReach = 1.5;
      m.playerWalkMult = 0.85;
      m.playerHpMult = 2;
      m.playerDmgPct = 0.25;
    },
  },
  {
    id: 'wildcard',
    name: 'Wrong Bag',
    text: "Joe grabbed the wrong bag: a random Legendary weapon from the whole armoury, and the stats to swing it.",
    excludes: ['spells'],
    kit: wrongBag,
  },
  {
    id: 'spells',
    name: 'Spells Only',
    text: 'No weapons today: a staff, a talisman, six spells and half the cooldowns.',
    excludes: ['wildcard'],
    mods: (m) => {
      m.noWeapons = true;
      m.spellCooldownMult = 0.5;
    },
    kit: spellsOnly,
  },
  {
    id: 'bossy',
    name: 'Boss Rush Hour',
    text: 'Every third fight is a boss from another zone, waiting in its second phase.',
    mods: (m) => {
      m.bossEvery = 3;
    },
  },
  {
    id: 'onelife',
    name: 'Eviction Notice',
    text: 'One life. Die once and the run is over.',
    excludes: ['glass'],
    rules: { oneLife: true },
  },
  {
    id: 'dark',
    name: 'Lights Out',
    text: "The fuse blew. You see only what Joe's lantern reaches.",
    rules: { dark: true },
  },
];

export const FLASH_MODIFIER_BY_ID: Readonly<Record<string, FlashModifier>> = Object.fromEntries(FLASH_MODIFIERS.map((m) => [m.id, m]));
