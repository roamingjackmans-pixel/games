// The Bestiary (D229): what a character has learned about each enemy and boss by fighting them. Kills unlock, in order:
// its picture, a few lines on who it is, what it resists and what hurts it, +25% damage against it, and −25% damage
// from it. A regular enemy at 1, 15, 40, 200 and 500 kills; a boss on first sight, then 1, 4 and 8 kills (the last
// two unlocks together at 8). The bonfire shows only what is unlocked and how many kills the next step needs, never
// what it will be.
import { ZONES } from './zones';
import { ENEMIES } from './enemies';
import { BOSSES } from './bosses';
import type { BossDef, Character, EnemyDef } from '../game/types';

export interface BestiaryStages {
  /** its picture and name (a boss: on first sight, counted as 0 kills) */
  icon: number;
  lore: number;
  resists: number;
  dealMore: number;
  takeLess: number;
}

export const ENEMY_STAGES: BestiaryStages = { icon: 1, lore: 15, resists: 40, dealMore: 200, takeLess: 500 };
export const BOSS_STAGES: BestiaryStages = { icon: 0, lore: 1, resists: 4, dealMore: 8, takeLess: 8 };

/** +25% damage against an enemy you have studied, and −25% from it. */
export const BESTIARY_DEAL_MULT = 1.25;
export const BESTIARY_TAKEN_MULT = 0.75;

export interface BestiaryZone {
  zone: number;
  name: string;
  enemies: EnemyDef[];
  boss: BossDef | null;
}

/** Every zone's roster and boss, in zone order (the book's chapters). */
export function bestiaryZones(): BestiaryZone[] {
  return ZONES.map((z, i) => ({
    zone: i + 1,
    name: z.name,
    enemies: z.enemies.map((id) => ENEMIES[id]).filter((d): d is EnemyDef => !!d),
    boss: BOSSES[z.boss] ?? null,
  }));
}

const IN_BOOK = new Set<string>();
function inBook(): Set<string> {
  if (!IN_BOOK.size) for (const z of bestiaryZones()) for (const id of [...z.enemies.map((e) => e.id), ...(z.boss ? [z.boss.id] : [])]) IN_BOOK.add(id);
  return IN_BOOK;
}

/** Whether kills of this enemy are recorded (zone rosters and bosses; not dummies, summons-only parts or Gary). */
export function isBestiaryEnemy(id: string): boolean {
  return inBook().has(id);
}

export function stagesFor(def: { role: string }): BestiaryStages {
  return def.role === 'boss' ? BOSS_STAGES : ENEMY_STAGES;
}

export function bestiaryKills(c: Pick<Character, 'bestiary'>, id: string): number {
  return c.bestiary?.kills[id] ?? 0;
}

export function bestiarySeen(c: Pick<Character, 'bestiary'>, id: string): boolean {
  return !!c.bestiary?.seen.includes(id) || bestiaryKills(c, id) > 0;
}

/** How far this character has studied an enemy: which unlocks it has, and the kills the next one needs (null: all). */
export function bestiaryProgress(c: Pick<Character, 'bestiary'>, def: { id: string; role: string }): { kills: number; icon: boolean; lore: boolean; resists: boolean; dealMore: boolean; takeLess: boolean; next: number | null } {
  const st = stagesFor(def);
  const kills = bestiaryKills(c, def.id);
  const isBoss = def.role === 'boss';
  const icon = isBoss ? bestiarySeen(c, def.id) : kills >= st.icon;
  const steps = [st.lore, st.resists, st.dealMore, st.takeLess];
  const next = steps.find((n) => kills < n) ?? null;
  return { kills, icon, lore: kills >= st.lore, resists: kills >= st.resists, dealMore: kills >= st.dealMore, takeLess: kills >= st.takeLess, next: icon ? next : (isBoss ? null : st.icon) };
}

/** The damage multiplier a character's hits get against this enemy (D229). */
export function bestiaryDealMult(c: Pick<Character, 'bestiary'> | undefined, def: { id: string; role: string }): number {
  if (!c?.bestiary) return 1;
  return bestiaryKills(c, def.id) >= stagesFor(def).dealMore ? BESTIARY_DEAL_MULT : 1;
}

/** The multiplier on what this enemy does to that character (D229). */
export function bestiaryTakenMult(c: Pick<Character, 'bestiary'> | undefined, def: { id: string; role: string }): number {
  if (!c?.bestiary) return 1;
  return bestiaryKills(c, def.id) >= stagesFor(def).takeLess ? BESTIARY_TAKEN_MULT : 1;
}

/** Record a kill (every standing player in the party is credited, as weapon experience is). */
export function addBestiaryKill(c: Character, id: string, n = 1): void {
  if (!isBestiaryEnemy(id)) return;
  c.bestiary ??= { kills: {}, seen: [] };
  c.bestiary.kills[id] = (c.bestiary.kills[id] ?? 0) + n;
}

/** Record a boss seen (its intro). */
export function addBestiarySeen(c: Character, id: string): void {
  if (!isBestiaryEnemy(id)) return;
  c.bestiary ??= { kills: {}, seen: [] };
  if (!c.bestiary.seen.includes(id)) c.bestiary.seen.push(id);
}
