// Drops (GAME_DESIGN §8.2, §11; CONTENT_ITEMS §3, §12): rolled per player from that player's own stream
// `loot:<playerId>:<n>` and visible only to them (D33).
import { stream, type Rng } from '../../engine/rng';
import { CONSUMABLE_CHANCE, DROP_CHANCE, GEM_CHANCE, GLOWEN_PUFF, GLOWEN_WISP_CHANCE, TEAR_CHANCE, type LootSource } from '../../data/lootTables';
import { SPELLS } from '../../data/spells';
import { WEAPON_IDS } from '../../data/weapons';
import { itemLevelFor } from '../combat/formulas';
import { ROOM_ENEMY_MULT } from '../procgen/waves';
import { generateItem, randomGem } from './generate';
import type { ConsumableId, Item, Role } from '../types';
import type { Entity, PickupC, World } from '../world';

export interface DropContext {
  w: World;
  seed: string;
  zone: number;
  cycle: number;
}

function lootRng(c: DropContext, playerId: string, tag = ''): Rng {
  return stream(c.seed, `loot:${playerId}:${tag}${c.w.nextLootIndex(playerId)}`);
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
      const item = generateItem(rng, { source: sourceForRole(role, !!en.elite), ilvl, zone: c.zone });
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
      spawnPickup(w, x, y, { kind: 'gem', forPlayer: pid, gem: randomGem(rng, 1), amount: 1, rarity: 'rare' });
    }
    if (role === 'fodder' && rng.chance(CONSUMABLE_CHANCE.fodderSingle / divide)) {
      const [x, y] = scatter(rng, e.x, e.y);
      spawnPickup(w, x, y, { kind: 'consumable', forPlayer: pid, consumable: rng.chance(0.6) ? 'throwing_knife' : 'firebomb', amount: 1, rarity: 'common' });
    }
    if (rng.chance(GLOWEN_WISP_CHANCE / divide)) {
      const [x, y] = scatter(rng, e.x, e.y);
      spawnPickup(w, x, y, { kind: 'glowen', forPlayer: pid, amount: Math.round(60 * c.zone * (1 + pl.derived.glowenFind)), rarity: 'uncommon' });
    }
  }
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
      const item = generateItem(rng, { source: row, ilvl, zone: c.zone });
      const [ix, iy] = scatter(rng, x, y + 20, 40);
      dropItem(w, pid, item, ix, iy);
    }
    if (rng.chance(GEM_CHANCE.chest * (1 + pl.derived.gemFind))) {
      const [gx, gy] = scatter(rng, x, y + 20);
      spawnPickup(w, gx, gy, { kind: 'gem', forPlayer: pid, gem: randomGem(rng, kind === 'treasure' ? 2 : 1), amount: 1, rarity: 'rare' });
    }
    if (rng.chance(CONSUMABLE_CHANCE.chestBundle)) {
      const [bx, by] = scatter(rng, x, y + 20);
      spawnPickup(w, bx, by, { kind: 'consumable', forPlayer: pid, consumable: rng.pick(BUNDLE), amount: rng.int(3, 6), rarity: 'uncommon' });
    }
    // a little Glowen always
    const [sx, sy] = scatter(rng, x, y + 20);
    spawnPickup(w, sx, sy, { kind: 'glowen', forPlayer: pid, amount: Math.round((kind === 'treasure' ? 60 : 25) * c.zone * (1 + pl.derived.glowenFind)), rarity: 'common' });
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
    else spawnPickup(w, x, y + 30, { kind: 'spell', forPlayer: pl.playerId, spellId: rng.pick(unknown), amount: 1, rarity: 'epic' });
  }
}

/** The Instructor: a Legendary weapon at ilvl 3 with all three skills, or (50%) a random spell. */
export function instructorDrops(c: DropContext, x: number, y: number): void {
  const w = c.w;
  for (const p of w.players) {
    const pl = p.pl!;
    const rng = stream(c.seed, `loot:${pl.playerId}:instructor`);
    const unknown = Object.keys(SPELLS).filter((id) => !pl.char.knownSpells.includes(id));
    if (unknown.length && rng.chance(0.5)) {
      spawnPickup(w, x, y, { kind: 'spell', forPlayer: pl.playerId, spellId: rng.pick(unknown), amount: 1, rarity: 'legendary' });
      continue;
    }
    const item = generateItem(rng, { source: 'boss', ilvl: 3, zone: 3, rarity: 'legendary', baseId: rng.pick(WEAPON_IDS) });
    item.bonusSkills = 1;
    dropItem(w, pl.playerId, item, x, y);
  }
}

/**
 * A boss (GAME_DESIGN §7, §8.2, D84): per player 2–5 items from the boss rarity row, one gem, 10% a Tear of
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
      const item = generateItem(rng, { source: 'boss', ilvl, zone: c.zone });
      const [ix, iy] = scatter(rng, x, y, 60);
      dropItem(w, pid, item, ix, iy);
    }
    const tier = Math.min(5, Math.ceil(c.zone / 3) + c.cycle) as 1 | 2 | 3 | 4 | 5;
    const [gx, gy] = scatter(rng, x, y, 60);
    spawnPickup(w, gx, gy, { kind: 'gem', forPlayer: pid, gem: randomGem(rng, tier), amount: 1, rarity: 'rare' });
    if (rng.chance(TEAR_CHANCE.boss)) {
      const [tx, ty] = scatter(rng, x, y, 60);
      spawnPickup(w, tx, ty, { kind: 'tear', forPlayer: pid, amount: 1, rarity: 'legendary' });
    }
    const [sx, sy] = scatter(rng, x, y, 60);
    spawnPickup(w, sx, sy, { kind: 'glowen', forPlayer: pid, amount: Math.round(150 * c.zone * (1 + pl.derived.glowenFind)), rarity: 'uncommon' });
  }
}
