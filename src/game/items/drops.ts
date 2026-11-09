// Drops (GAME_DESIGN §8.2, §11; CONTENT_ITEMS §3, §12): rolled per player from that player's own stream
// `loot:<playerId>:<n>` and visible only to them (D33).
import { stream, type Rng } from '../../engine/rng';
import { essenceTierFor } from '../../data/essence';
import { gemDropLevel } from '../../data/gems';
import { CONSUMABLE_CHANCE, DROP_CHANCE, GEM_CHANCE, GLOWEN_PUFF, GLOWEN_WISP_CHANCE, TEAR_CHANCE, type LootSource } from '../../data/lootTables';
import { SPELLS } from '../../data/spells';
import { WEAPON_IDS } from '../../data/weapons';
import { itemLevelFor } from '../combat/formulas';
import { ROOM_ENEMY_MULT } from '../procgen/waves';
import { generateItem, randomGem, type DropFavor } from './generate';
import { CLASSES } from '../../data/classes';
import type { Character, ConsumableId, Item, Role } from '../types';
import type { Entity, PickupC, World } from '../world';

export interface DropContext {
  w: World;
  seed: string;
  zone: number;
  cycle: number;
}

/** The class's primary and secondary stats, which weapon drops lean toward (D254). */
function favorOf(c: Character): DropFavor | undefined {
  const cl = CLASSES[c.classId];
  return cl ? { primary: cl.primary, secondary: cl.secondary } : undefined;
}

/** How much likelier a reliquary spell of this school is for a class (D317): ×3 if it is the primary stat, ×2 the secondary. */
export const SPELL_FAVOR_PRIMARY = 3;
export const SPELL_FAVOR_SECONDARY = 2;
export function spellSchoolFavor(school: string, f: DropFavor | undefined): number {
  if (!f) return 1;
  return f.primary === school ? SPELL_FAVOR_PRIMARY : f.secondary === school ? SPELL_FAVOR_SECONDARY : 1;
}

function lootRng(c: DropContext, playerId: string, tag = ''): Rng {
  // the zone and cycle in the label: the counter starts again with every world, so zone 2 rolled zone 1's drops (D232)
  return stream(c.seed, `loot:${playerId}:z${c.zone}c${c.cycle}:${tag}${c.w.nextLootIndex(playerId)}`);
}

function scatter(rng: Rng, x: number, y: number, r = 34): [number, number] {
  const a = rng.range(-Math.PI, Math.PI);
  const d = rng.range(8, r);
  return [x + Math.cos(a) * d, y + Math.sin(a) * d];
}

export function spawnPickup(w: World, x: number, y: number, pk: Omit<PickupC, 'until' | 'autoCollectAt'> & { until?: number }): Entity {
  const [fx, fy] = w.room.nearestFloor(x, y, 10);
  w.emit({ t: 'loot', playerId: pk.forPlayer ?? '', rarity: pk.rarity, x: fx, y: fy });
  return w.spawn('pickup', fx, fy, { radius: 14, pk: { until: 0, autoCollectAt: 0, ...pk } });
}

export function dropItem(w: World, playerId: string, item: Item, x: number, y: number): void {
  spawnPickup(w, x, y, { kind: 'item', forPlayer: playerId, item, amount: 1, rarity: item.rarity });
}

function sourceForRole(role: Role | 'boss', elite: boolean): LootSource {
  if (elite) return 'elite';
  if (role === 'brute' || role === 'tank' || role === 'assassin') return 'brute';
  return 'fodder';
}

export function enemyDrops(c: DropContext, e: Entity): void {
  const en = e.en!;
  const w = c.w;
  const role = en.def.role as Role | 'boss';
  const ilvl = itemLevelFor(c.zone, c.cycle);
  // a room holds share × the original count of enemies (D79), so each one drops share times less often; an
  // Elite only divides by the party size, so the extra Elites of a big party are a little extra loot
  const share = Math.max(1, en.share ?? 1);
  const divide = en.elite ? Math.max(1, share / ROOM_ENEMY_MULT) : share;
  for (const p of w.players) {
    const pl = p.pl!;
    if (pl.deadUntilRest) continue;
    const pid = pl.playerId;
    const rng = lootRng(c, pid, 'e');
    const chance = (en.elite ? DROP_CHANCE.elite : role === 'swarm' ? DROP_CHANCE.swarm : role === 'fodder' ? DROP_CHANCE.fodder : DROP_CHANCE.other) / divide;
    if (rng.chance(chance)) {
      const item = generateItem(rng, { source: sourceForRole(role, !!en.elite), ilvl, zone: c.zone, favor: favorOf(pl.char) });
      const [x, y] = scatter(rng, e.x, e.y);
      dropItem(w, pid, item, x, y);
    }
    // Glowen seeps out of everything that lived (D83): a small puff from most kills
    if (!en.def.traits?.noShards && rng.chance(GLOWEN_PUFF.chance / divide)) {
      const k = en.elite ? GLOWEN_PUFF.elite : role === 'swarm' ? GLOWEN_PUFF.swarm : role === 'fodder' ? GLOWEN_PUFF.fodder : GLOWEN_PUFF.other;
      const [x, y] = scatter(rng, e.x, e.y);
      spawnPickup(w, x, y, { kind: 'glowen', forPlayer: pid, amount: Math.max(1, Math.round((4 + 2 * c.zone) * k * (1 + pl.derived.glowenFind))), rarity: 'common' });
    }
    if (rng.chance((GEM_CHANCE.enemy * (1 + pl.derived.gemFind)) / divide)) {
      const [x, y] = scatter(rng, e.x, e.y);
      spawnPickup(w, x, y, { kind: 'gem', forPlayer: pid, gem: randomGem(rng, c.cycle, undefined, gemDropLevel(rng, c.zone, c.cycle)), amount: 1, rarity: 'rare' });
    }
    if (role === 'fodder' && rng.chance(CONSUMABLE_CHANCE.fodderSingle / divide)) {
      const [x, y] = scatter(rng, e.x, e.y);
      spawnPickup(w, x, y, { kind: 'consumable', forPlayer: pid, consumable: rng.chance(0.6) ? 'throwing_knife' : 'firebomb', amount: 1, rarity: 'common' });
    }
    if (rng.chance(GLOWEN_WISP_CHANCE / divide)) {
      const [x, y] = scatter(rng, e.x, e.y);
      spawnPickup(w, x, y, { kind: 'glowen', forPlayer: pid, amount: Math.round(60 * c.zone * (1 + pl.derived.glowenFind)), rarity: 'uncommon' });
    }
    // Soul Essence (D198), rolled last so the older drops keep their rolls
    const et = essenceTierFor(c.zone, c.cycle);
    if (et && rng.chance((en.elite ? ESSENCE_DROP.elite : ESSENCE_DROP.enemy) / divide)) {
      const [x, y] = scatter(rng, e.x, e.y);
      dropEssence(w, pid, et, 1, x, y);
    }
  }
}

/** Soul Essence (D198): rare from enemies, likelier from Elites and chests, three from every boss. */
/** D226: every rate halved (enemy 2%, Elite 35%, small chest 25%, mimic 50%, treasure 1–2, boss 3 before). */
export const ESSENCE_DROP = { enemy: 0.01, elite: 0.175, smallChest: 0.125, mimic: 0.25, treasure: 0.75, boss: 1.5 } as const;

/** A whole number with `avg` as its average: the whole part, plus one more at the fraction's chance. */
function essenceCount(rng: { chance(p: number): boolean }, avg: number): number {
  const whole = Math.floor(avg);
  return whole + (rng.chance(avg - whole) ? 1 : 0);
}
const ESSENCE_RARITY = ['uncommon', 'rare', 'epic', 'legendary', 'legendary'] as const;

function dropEssence(w: World, pid: string, tier: number, n: number, x: number, y: number): void {
  if (tier <= 0 || n <= 0) return;
  spawnPickup(w, x, y, { kind: 'essence', forPlayer: pid, essenceTier: tier, amount: n, rarity: ESSENCE_RARITY[tier - 1]! });
}

const BUNDLE: ConsumableId[] = ['throwing_knife', 'firebomb', 'frost_jar', 'holy_water', 'stamina_tonic', 'lure', 'shard_pouch'];

/** Chest loot for every player (each sees only their own). Mimics add a bonus roll from the Mimic row. */
export function chestDrops(c: DropContext, chestId: string, kind: 'small' | 'treasure' | 'mimic' | 'boss', x: number, y: number): void {
  const w = c.w;
  const ilvl = itemLevelFor(c.zone, c.cycle);
  for (const p of w.players) {
    const pl = p.pl!;
    if (pl.deadUntilRest) continue;
    const pid = pl.playerId;
    const rng = stream(c.seed, `loot:${pid}:chest:${chestId}:${c.cycle}`);
    const rows: LootSource[] = kind === 'treasure' ? ['chestTreasure', 'chestTreasure'] : kind === 'mimic' ? ['chestSmall', 'mimic'] : kind === 'boss' ? ['boss'] : ['chestSmall'];
    for (const row of rows) {
      const item = generateItem(rng, { source: row, ilvl, zone: c.zone, favor: favorOf(pl.char) });
      const [ix, iy] = scatter(rng, x, y + 20, 40);
      dropItem(w, pid, item, ix, iy);
    }
    if (rng.chance(GEM_CHANCE.chest * (1 + pl.derived.gemFind))) {
      const [gx, gy] = scatter(rng, x, y + 20);
      spawnPickup(w, gx, gy, { kind: 'gem', forPlayer: pid, gem: randomGem(rng, c.cycle, undefined, gemDropLevel(rng, c.zone, c.cycle), kind === 'treasure' ? 1 : 0), amount: 1, rarity: 'rare' });
    }
    if (rng.chance(CONSUMABLE_CHANCE.chestBundle)) {
      const [bx, by] = scatter(rng, x, y + 20);
      spawnPickup(w, bx, by, { kind: 'consumable', forPlayer: pid, consumable: rng.pick(BUNDLE), amount: rng.int(3, 6), rarity: 'uncommon' });
    }
    // a little Glowen always
    const [sx, sy] = scatter(rng, x, y + 20);
    spawnPickup(w, sx, sy, { kind: 'glowen', forPlayer: pid, amount: Math.round((kind === 'treasure' ? 60 : 25) * c.zone * (1 + pl.derived.glowenFind)), rarity: 'common' });
    const et = essenceTierFor(c.zone, c.cycle);
    if (et) {
      const n = kind === 'treasure' ? essenceCount(rng, ESSENCE_DROP.treasure) : kind === 'mimic' ? (rng.chance(ESSENCE_DROP.mimic) ? 1 : 0) : kind === 'small' ? (rng.chance(ESSENCE_DROP.smallChest) ? 1 : 0) : 0;
      const [ex, ey] = scatter(rng, x, y + 20);
      dropEssence(w, pid, et, n, ex, ey);
    }
  }
}

/** Spell reliquary: a spell the player does not know (either school), 5% a Tear of Undoing instead. */
export function reliquaryDrops(c: DropContext, roomId: string, x: number, y: number): void {
  const w = c.w;
  for (const p of w.players) {
    const pl = p.pl!;
    const rng = stream(c.seed, `loot:${pl.playerId}:reliquary:${roomId}:${c.cycle}`);
    const unknown = Object.keys(SPELLS).filter((id) => !pl.char.knownSpells.includes(id));
    if (rng.chance(TEAR_CHANCE.reliquary) || unknown.length === 0) spawnPickup(w, x, y + 30, { kind: 'tear', forPlayer: pl.playerId, amount: 1, rarity: 'legendary' });
    else {
      // D317: a class whose primary (or secondary) stat is Brain or Prayer finds that school's spells more often
      const f = favorOf(pl.char);
      const weight = (id: string): number => spellSchoolFavor(SPELLS[id]!.school, f);
      const spellId = unknown[Math.max(0, rng.weighted(unknown.map(weight)))]!;
      spawnPickup(w, x, y + 30, { kind: 'spell', forPlayer: pl.playerId, spellId, amount: 1, rarity: 'epic' });
    }
  }
}

/** The Instructor: a Legendary weapon at ilvl 3 with all three skills, or (50%) a random spell. */
export function instructorDrops(c: DropContext, x: number, y: number): void {
  const w = c.w;
  for (const p of w.players) {
    const pl = p.pl!;
    const rng = stream(c.seed, `loot:${pl.playerId}:instructor`);
    // a fat purse for the walk down to the first bonfire (D90)
    spawnPickup(w, x + 30, y + 20, { kind: 'glowen', forPlayer: pl.playerId, amount: 500, rarity: 'uncommon' });
    const unknown = Object.keys(SPELLS).filter((id) => !pl.char.knownSpells.includes(id));
    if (unknown.length && rng.chance(0.5)) {
      spawnPickup(w, x, y, { kind: 'spell', forPlayer: pl.playerId, spellId: rng.pick(unknown), amount: 1, rarity: 'legendary' });
      continue;
    }
    const item = generateItem(rng, { source: 'boss', ilvl: 3, zone: 3, rarity: 'legendary', baseId: rng.pick(WEAPON_IDS) });
    // his weapon comes with its Q skill (D89: no E or R before NG+)
    item.skills = 1;
    delete item.bonusSkills;
    dropItem(w, pl.playerId, item, x, y);
  }
}

/**
 * A boss (GAME_DESIGN §7, §8.2, D84): per player 2–5 items from the boss rarity row, a gem (65%, D281), 10% a Tear of
 * Undoing, and some Glowen. The arena's spell reliquary is rolled by the session (it is a world object).
 */
export function bossDrops(c: DropContext, bossId: string, x: number, y: number): void {
  const w = c.w;
  const ilvl = itemLevelFor(c.zone, c.cycle);
  for (const p of w.players) {
    const pl = p.pl!;
    if (pl.deadUntilRest) continue;
    const pid = pl.playerId;
    const rng = stream(c.seed, `loot:${pid}:boss:${bossId}:${c.cycle}`);
    const rolls = rng.int(DROP_CHANCE.bossMin, DROP_CHANCE.bossMax);
    for (let i = 0; i < rolls; i++) {
      const item = generateItem(rng, { source: 'boss', ilvl, zone: c.zone, favor: favorOf(pl.char) });
      const [ix, iy] = scatter(rng, x, y, 60);
      dropItem(w, pid, item, ix, iy);
    }
    // D281: a gem 65% of the time (was always); D284: it rolls its quality one extra time and keeps the best
    if (rng.chance(GEM_CHANCE.boss)) {
      const [gx, gy] = scatter(rng, x, y, 60);
      spawnPickup(w, gx, gy, { kind: 'gem', forPlayer: pid, gem: randomGem(rng, c.cycle, undefined, gemDropLevel(rng, c.zone, c.cycle), 1), amount: 1, rarity: 'rare' });
    }
    if (rng.chance(TEAR_CHANCE.boss)) {
      const [tx, ty] = scatter(rng, x, y, 60);
      spawnPickup(w, tx, ty, { kind: 'tear', forPlayer: pid, amount: 1, rarity: 'legendary' });
    }
    const [sx, sy] = scatter(rng, x, y, 60);
    spawnPickup(w, sx, sy, { kind: 'glowen', forPlayer: pid, amount: Math.round(150 * c.zone * (1 + pl.derived.glowenFind)), rarity: 'uncommon' });
    const [ex, ey] = scatter(rng, x, y, 60);
    dropEssence(w, pid, essenceTierFor(c.zone, c.cycle), essenceCount(rng, ESSENCE_DROP.boss), ex, ey);
  }
}
