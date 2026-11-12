// The debug API (D29). The active scene registers an implementation; the DOM panel calls into it.

export interface DebugStats {
  fps: number;
  simMs: number;
  renderMs: number;
  entities: number;
  enemies: number;
  particles: number;
  projectiles: number;
  telegraphs: number;
  heapMb?: number;
}

export interface DebugOverlays {
  hitbox: boolean;
  telegraph: boolean;
  ai: boolean;
  frameGraph: boolean;
}

export interface DebugApi {
  god(on: boolean): void;
  isGod(): boolean;
  listBases(): string[];
  giveItem(baseId: string, rarity: string, ilvl: number): string;
  /** families joined by '+' or ',' (1–3, same kind: 'brutal+tempo'); every perk at `tier` */
  /** level 1–50 and roll −50…+50 (%), D197 */
  giveGem(family: string, level?: number, rollPct?: number): string;
  giveConsumable(id: string, n: number): string;
  learnAllSpells(): string;
  setLevel(n: number): string;
  setStat(stat: string, n: number): string;
  listEnemies(): string[];
  spawnEnemy(id: string, elite: string | null): string;
  killAll(): string;
  listZones(): string[];
  jumpZone(z: number): string;
  listRooms(): string[];
  jumpRoom(roomId: string): string;
  jumpBoss(): string;
  setCycle(n: number): string;
  setFlask(cur: number, max: number): string;
  addShards(n: number): string;
  addGlowen(n: number): string;
  testArena(): string;
  revealMap(): string;
  stats(): DebugStats;
}

export const overlays: DebugOverlays = { hitbox: false, telegraph: false, ai: false, frameGraph: false };

let api: DebugApi | null = null;
let unlocked = false;

export function registerDebugApi(a: DebugApi | null): void {
  api = a;
}
export function debugApi(): DebugApi | null {
  return api;
}
export function isDebugUnlocked(): boolean {
  return unlocked;
}
export function setDebugUnlocked(v: boolean): void {
  unlocked = v;
}
