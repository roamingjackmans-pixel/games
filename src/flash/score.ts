// The FlashGames run's score (D452, GAME_DESIGN §25): depth and speed. Every point is added as it is earned and never
// taken back, so the score only goes up; everything is counted from the same seeded run, so two players on the same
// day are measured the same way. Headless: no DOM, no FlashRun.

/** Points, each × the zone it was earned in (zone 1–8). */
export const FLASH_POINTS = {
  /** an enemy killed (every kill, respawned enemies too) */
  kill: 10,
  /** an Elite or a Mimic killed (instead of `kill`) */
  elite: 50,
  /** a room's fight won, once per room in the run */
  room: 100,
  /** a challenger (Boss Rush Hour) beaten, once per room in the run; again it counts as an Elite */
  challenger: 1000,
  /** the zone's boss beaten */
  boss: 3000,
  /** reaching a new zone (zone 2 on) */
  zone: 2000,
} as const;

/** Beating The Landlord inside the time: this many points a second left on the clock. */
export const FLASH_WIN_PER_SECOND = 10;

export type FlashKill = 'plain' | 'elite' | 'challenger' | 'boss';

export class FlashScore {
  points = 0;
  kills = 0;
  elites = 0;
  bosses = 0;
  challengers = 0;
  deaths = 0;
  /** the deepest zone reached */
  zone = 1;
  private rooms = new Set<string>();
  private beaten = new Set<string>();
  private bossZones = new Set<number>();

  get roomsCleared(): number {
    return this.rooms.size;
  }

  private add(n: number): void {
    if (n > 0 && Number.isFinite(n)) this.points += Math.round(n);
  }

  /** An enemy fell in `zone`; `key` names a challenger's room or a boss's zone so each is worth its points once. */
  kill(kind: FlashKill, zone: number, key = ''): void {
    const z = clampZone(zone);
    this.kills++;
    if (kind === 'boss') {
      if (this.bossZones.has(z)) return this.add(FLASH_POINTS.elite * z);
      this.bossZones.add(z);
      this.bosses++;
      return this.add(FLASH_POINTS.boss * z);
    }
    if (kind === 'challenger') {
      const k = `${z}:${key}`;
      if (!this.beaten.has(k)) {
        this.beaten.add(k);
        this.challengers++;
        return this.add(FLASH_POINTS.challenger * z);
      }
      this.elites++;
      return this.add(FLASH_POINTS.elite * z);
    }
    if (kind === 'elite') {
      this.elites++;
      return this.add(FLASH_POINTS.elite * z);
    }
    this.add(FLASH_POINTS.kill * z);
  }

  /** A room's fight was won (counted once per room of the run). */
  roomCleared(zone: number, roomId: string): void {
    const z = clampZone(zone);
    const k = `${z}:${roomId}`;
    if (this.rooms.has(k)) return;
    this.rooms.add(k);
    this.add(FLASH_POINTS.room * z);
  }

  /** The party stands in a zone; a deeper one than ever before pays its points. */
  reached(zone: number): void {
    const z = clampZone(zone);
    while (this.zone < z) {
      this.zone++;
      this.add(FLASH_POINTS.zone * this.zone);
    }
  }

  died(): void {
    this.deaths++;
  }

  /** The Landlord fell with `secondsLeft` on the clock. */
  won(secondsLeft: number): void {
    this.add(Math.max(0, Math.floor(secondsLeft)) * FLASH_WIN_PER_SECOND);
  }

  /** The short line FlashGames shows under the score. */
  detail(): string {
    const parts = [`Zone ${this.zone}`, `${this.roomsCleared} room${this.roomsCleared === 1 ? '' : 's'}`, `${this.kills} kill${this.kills === 1 ? '' : 's'}`];
    if (this.elites) parts.push(`${this.elites} Elite${this.elites === 1 ? '' : 's'}`);
    if (this.challengers) parts.push(`${this.challengers} challenger${this.challengers === 1 ? '' : 's'}`);
    if (this.bosses) parts.push(`${this.bosses} boss${this.bosses === 1 ? '' : 'es'}`);
    if (this.deaths) parts.push(`${this.deaths} death${this.deaths === 1 ? '' : 's'}`);
    return parts.join(' · ');
  }
}

function clampZone(z: number): number {
  return Math.max(1, Math.min(8, Math.floor(Number.isFinite(z) ? z : 1)));
}
