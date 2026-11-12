// The game session: one playthrough's run logic on the authoritative side (solo or co-op host).
// Rooms, doors, waves, clears, chests, bonfires (first-rest rule, D38), death + Shardpile (D3),
// the tutorial hall (PROCGEN §8). Headless: no DOM, canvas or audio.
import { dist } from '../engine/math';
import { addBestiarySeen } from '../data/bestiary';
import { stream } from '../engine/rng';
import { ENEMIES } from '../data/enemies';
import { DUMMY_PIERCE, DUMMY_RED, DUMMY_STILL, DUMMY_SWING, GARY, INSTRUCTOR, MIMIC } from '../data/enemies/special';
import { GARY_HITS_TO_LEAVE, garyStock } from './bonfire/gary';
import { TUTORIAL_STATIONS } from '../data/rooms/special';
import { zoneDef } from '../data/zones';
import { gemColor, gemKindLabel, gemTitle } from '../data/gems';
import { World, type Entity } from './world';
import { doorTiles, entryPoint, OPPOSITE, ROOM_W, ROOM_Y0, T, TERRAIN, TILE, worldToTile, type Side } from './room';
import { generateZone, neighbourId, type RoomNode, type ZoneLayout } from './procgen/zone';
import { buildRoom, type RoomMarkers } from './procgen/rooms';
import { planRoom, roomCountMult, type RoomPlan } from './procgen/waves';
import { smallChest, treasureChest } from './procgen/chests';
import { enemyFullHp, spawnEnemy, spawnUnit, rescaleForPlayers } from './enemies/spawn';
import { spawnPlayer, refreshDerived, resetSpellCooldowns } from './player/player';
import { installRules } from './rules';
import { lootHooks } from './lootHooks';
import './loot';
import { dormantMimicNear, mimicBite } from './interact';
import { cleanse, resetPlayerStun } from './combat/damage';
import { coopHpMult, enemyDmgMult, reviveRequirement } from './combat/formulas';
import { zoneDmgFactor } from '../data/roles';
import { BONUS_BOSS_HP_PCT, BONUS_BOSS_SHARD_MULT, bonusBossPhase } from './procgen/bonusBoss';
import { BOSSES } from '../data/bosses';
import { DEATH_TITLES } from '../data/story';
import { newWorldState } from './save/schema';
import { applyCoopProgress } from './save/coopProgress';
import { essenceCounts, essenceDef } from '../data/essence';
import { flaskCap, flaskMaxFor } from './combat/formulas';
import { applyArenaChanges } from './boss/arena';
import { achievements } from './achievements';
import { stats } from './stats';
import { startPhaseSummons, tickPhaseSummons } from './boss/summons';
import { spawnHazard } from './systems/hazards';
import type { BossDef, Character, EliteAffix, SaveFile } from './types';
import { uniqueItemId } from './items/inventory';

export interface SessionListener {
  roomEntered?(node: RoomNode, zoneChanged: boolean): void;
  playerDied?(p: Entity): void;
  bonfire?(p: Entity, bonfireId: string, firstRest: boolean): void;
  titleCard?(zone: number, mixNames: string[]): void;
  autosave?(reason: string): void;
  toast?(text: string, playerId?: string): void;
  chestOpened?(p: Entity, chestId: string): void;
  tutorialGoal?(goal: string): void;
  sign?(text: string | null): void;
  bossIntro?(def: BossDef, boss: Entity): void;
  bossPhase?(def: BossDef, phase: number): void;
  bossDefeated?(def: BossDef): void;
  /** a zone's boss fell (the host tells its guests, D195) */
  zoneBeaten?(zone: number): void;
  /** the stairs up after The Landlord */
  credits?(): void;
  /** the NG+ bonfire: the scene saves and restarts the run in the next cycle */
  newCycle?(): void;
  /** a player talks to Gary */
  gary?(p: Entity): void;
}

/**
 * New Game+ (GAME_DESIGN §13): next cycle, a new map seed, zone 1, everything on the character kept
 * (level, gear, spells, gems, flask max, Glowen, Shards), no tutorial. Cycle scaling is applied by the
 * formulas (D209: NG+ zone 1 starts 5% above the first zone 8 and climbs to 35% above it, +10% a cycle after; item
 * level +c).
 */
export function beginNextCycle(save: SaveFile): void {
  const c = save.character;
  c.cycle++;
  c.tutorialDone = true;
  c.flaskCur = flaskCap(c);
  const seed = `${save.world.seed.slice(0, 12)}+${c.cycle}`;
  save.world = newWorldState(seed);
  delete save.pending;
}

/** The boss name card holds inputs for this long (GAME_DESIGN §7). */
export const BOSS_INTRO_S = 1.5;
/** Spell reliquary after a boss (GAME_DESIGN §7). */
const BOSS_RELIQUARY_CHANCE = 0.25;

export { lootHooks, type LootHooks } from './lootHooks';

export interface SessionPlayer {
  char: Character;
  local: boolean;
  entity: Entity | null;
  slot: number;
}

const INTERACT_R = 56;
/** room edges in world px and how close to one a body must be to go through its open door */
const ROOM_TOP = 16;
const ROOM_BOTTOM = 720;
const ROOM_RIGHT = 1280;
const DOOR_SLACK = 6;
const HOLD_S = 0.6;
const DEATH_LINES = DEATH_TITLES;

export class GameSession {
  save: SaveFile;
  w: World;
  layout!: ZoneLayout;
  node!: RoomNode;
  markers!: RoomMarkers;
  plan: RoomPlan | null = null;
  waveIdx = 0;
  waveSize = 0;
  waveIds: number[] = [];
  roomPhase: 'peace' | 'armed' | 'fighting' | 'boss' | 'cleared' = 'peace';
  lockAt = 0;
  entry: [number, number] = [640, 368];
  players: SessionPlayer[] = [];
  listener: SessionListener = {};
  interactHold = new Map<number, { target: number; t: number }>();
  /** The zone title card waits until the party leaves the Training Hall. */
  private titlePending = false;
  tutorial: { goals: Set<string>; sx: number; sy: number; aim0: number; poked: boolean; dummy: Record<string, number> } | null = null;
  /** stations done in the Training Hall, kept while the player visits the Instructor's room and comes back */
  private tutGoals = new Set<string>();
  pendingTransition: { roomId: string; entry: Side | 'bonfire' | 'start' } | null = null;
  deathLine = DEATH_LINES[0]!;
  dead = false;
  /** guests' first-rest and downs bookkeeping lives here too (D38, D12) */
  downs: Record<string, number> = {};
  playtimeAcc = 0;
  lastAutosave = 0;
  /** treasure room guard / ambush bookkeeping */
  private guardSpawned = false;
  /** when each player may next hear "Revive X first!" (entity id → world time) */
  private reviveNagAt = new Map<number, number>();

  constructor(save: SaveFile, listener: SessionListener = {}) {
    this.save = save;
    this.listener = listener;
    this.w = new World(save.world.seed);
    this.w.zone = save.world.zone;
    this.w.cycle = save.character.cycle;
    installRules(this.w, {
      onDrops: (w, e, killer) => lootHooks.enemyDrops(this, e, killer),
      onPlayerDown: (w, p) => this.onPlayerDown(p),
      onKillStat: (_w, e) => {
        this.save.stats.kills++;
        if (e.en?.elite) this.save.stats.elitesKilled++;
        if (e.en?.def.traits?.mimic && e.en.mimicChestId) this.mimicKilled(e);
        if (e.en?.bonusBoss) this.bonusBossKilled(e);
        else if (e.en?.isBoss) this.bossKilled(e);
        if (e.en?.def.id === INSTRUCTOR.id) {
          this.save.world.instructorKilled = true;
          lootHooks.instructor(this, e.x, e.y);
          // his door down to the first bonfire opens (D127)
          const door = this.w.room.doors.e;
          if (this.node.kind === 'trial' && door.exists) {
            door.locked = false;
            door.open = true;
            this.w.room.version++;
            this.w.emit({ t: 'msg', text: 'The way down is open.', color: '#ffd27a' });
            this.w.sfx('doorOpen', e.x);
          }
        }
      },
      zoneFodder: () => {
        const mix = this.layout?.mix.map((id) => ENEMIES[id]).filter((d) => !!d && (d.role === 'fodder' || d.role === 'swarm'));
        return mix?.[0] ?? ENEMIES[zoneDef(this.w.zone).enemies[0]!] ?? null;
      },
    });
    this.w.hooks.onTick = (_w, dt) => this.tick(dt);
    this.w.hooks.onInteract = () => undefined; // interactions are polled in tick()
    this.w.hooks.onBossPhase = (_w, e, phase) => this.onBossPhase(e, phase);
    this.w.hooks.onRevive = (_w, ghost) => this.revive(ghost);
    this.w.hooks.onGaryHit = (_w, g) => this.garyHit(g);
    this.w.hooks.onPlayerDied = (_w, p) => this.bledOut(p);
    this.w.hooks.onPlayerParried = () => this.goal('parry');
    // the parry station also accepts a perfectly timed block without a parrying shield (D96)
    this.w.hooks.onTimedBlock = (w, p) => {
      if (!this.tutorial || this.tutorial.goals.has('parry')) return;
      this.goal('parry');
      w.emit({ t: 'msg', text: 'Perfect timing! With a buckler or a medium shield, that would have been a parry.', forPlayer: p.pl!.playerId, color: '#ffd27a' });
    };
    this.w.hooks.onPlayerBlocked = () => this.goal('block');
    this.w.hooks.onMimicWake = (_w, e) => {
      const id = e.en?.mimicChestId?.replace('awake:', '');
      if (id && !this.save.world.mimicsAwake.includes(id)) this.save.world.mimicsAwake.push(id);
    };
    this.w.hooks.onMimicBite = () => {
      this.save.stats.mimicDeaths++;
    };
    this.addPlayer(save.character, true);
  }

  // ------------------------------------------------------------------ players

  addPlayer(char: Character, local: boolean): SessionPlayer {
    const sp: SessionPlayer = { char, local, entity: null, slot: this.players.length };
    this.players.push(sp);
    return sp;
  }

  /** A co-op guest arrives (host only): spawn them beside the host and rescale enemy HP (D15). */
  joinPlayer(char: Character): SessionPlayer {
    const used = new Set(this.players.map((p) => p.slot));
    let slot = 0;
    while (used.has(slot)) slot++;
    const sp: SessionPlayer = { char, local: false, entity: null, slot };
    this.players.push(sp);
    const host = this.localPlayer;
    const [x, y] = this.w.room.nearestFloor((host?.x ?? this.entry[0]) + 30 * (slot % 2 ? 1 : -1), (host?.y ?? this.entry[1]) + 24, 14);
    sp.entity = spawnPlayer(this.w, char, slot, false, x, y);
    this.w.refreshLists();
    rescaleForPlayers(this.w, this.players.length);
    return sp;
  }

  /** A guest leaves (or the host returns to the lobby): their body goes, enemy HP rescales. */
  removePlayer(playerId: string): void {
    const i = this.players.findIndex((p) => !p.local && p.char.playerId === playerId);
    if (i < 0) return;
    const sp = this.players[i]!;
    if (sp.entity) this.w.remove(sp.entity);
    this.players.splice(i, 1);
    this.w.sweep();
    rescaleForPlayers(this.w, this.players.length);
    if (this.players.length > 0 && this.w.players.length > 0 && this.w.players.every((x) => x.pl!.downed || x.pl!.deadUntilRest)) this.wipe();
  }

  get localPlayer(): Entity | null {
    return this.players.find((p) => p.local)?.entity ?? null;
  }

  private placePlayers(x: number, y: number): void {
    for (const sp of this.players) {
      const ox = (sp.slot % 2) * 30 - 15 * (this.players.length > 1 ? 1 : 0);
      const oy = Math.floor(sp.slot / 2) * 30 - (this.players.length > 2 ? 15 : 0);
      const [px, py] = this.w.room.nearestFloor(x + ox, y + oy, 14);
      if (!sp.entity || sp.entity.removed) {
        sp.entity = spawnPlayer(this.w, sp.char, sp.slot, sp.local, px, py);
      } else {
        sp.entity.x = px;
        sp.entity.y = py;
        sp.entity.px = px;
        sp.entity.py = py;
        sp.entity.forced = null;
      }
    }
    this.w.refreshLists();
    rescaleForPlayers(this.w, this.players.length);
  }

  // ------------------------------------------------------------------ zones and rooms

  layoutFor(zone: number): ZoneLayout {
    const c = this.save.character;
    const tutorial = zone === 1 && c.cycle === 0 && !c.tutorialDone;
    const fewSpells = c.knownSpells.length < 2;
    return generateZone(this.save.world.seed, zone, { cycle: c.cycle, tutorial, fewSpells });
  }

  /** Start (or resume) the run: tutorial hall for new characters, else the saved respawn bonfire. */
  start(): void {
    const ws = this.save.world;
    // zones beaten as a guest in a zone this world had reached open the next ones here (D195)
    applyCoopProgress(this.save);
    this.layout = this.layoutFor(ws.zone);
    if (this.layout.tutorialId && !this.save.character.tutorialDone) {
      this.enterRoom(this.layout.tutorialId, 'start', true);
    } else {
      const bonfireRoom = this.layout.byId[ws.respawnBonfireId] ? ws.respawnBonfireId : this.layout.startId;
      this.enterRoom(bonfireRoom, 'bonfire', true);
    }
  }

  /** Move the whole party to another room. */
  enterRoom(roomId: string, entry: Side | 'bonfire' | 'start', zoneChanged = false): void {
    const ws = this.save.world;
    const node = this.layout.byId[roomId];
    if (!node) throw new Error(`no room ${roomId}`);
    const w = this.w;
    // clear the previous room: everything except players, and what follows a living player round (D350: a Regen Aura,
    // an incense cloud), which goes with them into the next room for the rest of its time
    this.rememberLeftBehind();
    const followsPlayer = (e: Entity): boolean => {
      const f = e.type === 'hazard' && e.hz?.follow ? w.get(e.hz.follow) : undefined;
      return !!f && f.type === 'player' && !f.pl?.downed && !f.pl?.deadUntilRest;
    };
    for (const e of w.entities.values()) if (e.type !== 'player' && !followsPlayer(e)) w.remove(e);
    w.sweep();
    w.scheduled = [];
    w.fallen = [];
    w.roomMods = { floodUntil: 0, floodSlow: 0.15, dark: 0, enrageUntil: 0, lateFeeUntil: 0, lightningBonusUntil: 0 };
    w.bossId = 0;
    w.zone = this.layout.zone;
    w.cycle = this.save.character.cycle;
    w.specialBudget = w.zone <= 3 ? 2 : 3;
    const built = buildRoom(this.layout, node, node.kind === 'boss' ? this.bossDef?.arenaId : undefined);
    w.room = built.room;
    w.spots = { graves: built.markers.graves };
    this.node = node;
    this.markers = built.markers;
    ws.roomId = roomId;
    if (!ws.roomsVisited.includes(roomId)) ws.roomsVisited.push(roomId);
    // where the party appears
    let pos: [number, number];
    if (entry === 'bonfire') pos = built.markers.bonfire ? [built.markers.bonfire[0], built.markers.bonfire[1] + 48] : [640, 400];
    else if (entry === 'start') pos = built.markers.start ?? [640, 400];
    else pos = entryPoint(entry);
    this.entry = pos;
    this.placePlayers(pos[0], pos[1]);
    this.interactHold.clear();
    this.guardSpawned = false;
    this.plan = null;
    this.waveIdx = 0;
    this.waveIds = [];
    // room content
    const cleared = ws.roomsCleared.includes(roomId);
    this.roomPhase = 'peace';
    if ((node.kind === 'combat' || node.kind === 'ambush') && !cleared) {
      this.plan = planRoom(this.layout, node, this.players.length);
      this.roomPhase = 'armed';
      this.lockAt = node.kind === 'ambush' ? w.time : 0;
    }
    this.spawnRoomContent(node, built.markers, cleared);
    this.applyDoorLocks();
    if (node.kind === 'tutorial') this.setupTutorial(built.markers);
    else {
      if (this.tutorial) {
        this.tutorial = null;
        this.listener.sign?.(null);
      }
      if (node.kind === 'trial') this.setupTrial(built.markers);
    }
    w.inputLock = Math.max(w.inputLock, w.time + 0.2);
    this.listener.roomEntered?.(node, zoneChanged);
    if (zoneChanged || this.titlePending) {
      this.titlePending = node.kind === 'tutorial' || node.kind === 'trial';
      if (!this.titlePending) {
        const names = this.layout.mix.map((id) => ENEMIES[id]?.name ?? id);
        this.listener.titleCard?.(this.layout.zone, names);
      }
    }
  }

  /** Door lock rules for the current room. */
  applyDoorLocks(): void {
    const room = this.w.room;
    const ws = this.save.world;
    const node = this.node;
    for (const s of ['n', 's', 'e', 'w'] as Side[]) {
      const d = room.doors[s];
      if (!d.exists) continue;
      d.locked = false;
      const n = neighbourId(this.layout, node.id, s);
      // the boss door
      if (n && this.layout.byId[n.id]?.kind === 'boss' && !this.bossDoorOpen()) d.locked = true;
      // the start room's south door is the tutorial hall: shut behind you
      if (node.kind === 'start' && s === 's' && this.layout.tutorialId) d.locked = true;
      // the Instructor's way down stays shut while he stands: beat him, or die and wake at the bonfire (D127)
      if (node.kind === 'trial' && s === 'e' && !this.save.world.instructorKilled) d.locked = true;
      if (!n && !this.layout.links[`${node.id}|${s}`]) d.locked = true;
      // the boss room shuts behind the party until the boss is dead
      if (this.roomPhase === 'boss') d.locked = true;
      d.open = !d.locked && this.roomPhase !== 'fighting';
    }
    void ws;
    room.version++;
    this.clearDoorways();
  }

  /**
   * Nobody is left inside a door that has just shut (D192). In co-op one player can walk in and lock the room while
   * another is still standing in a doorway (walking back the way the party came), and the shut door held them fast;
   * anyone whose body touches a closed doorway now steps into the room beside it. The host owns positions, so a guest
   * is moved by the next snapshot.
   */
  private clearDoorways(): void {
    const w = this.w;
    for (const s of ['n', 's', 'e', 'w'] as Side[]) {
      const d = w.room.doors[s];
      if (!d.exists || d.open) continue;
      const tiles = doorTiles(s);
      const x0 = Math.min(...tiles.map((t) => t[0])) * TILE;
      const x1 = (Math.max(...tiles.map((t) => t[0])) + 1) * TILE;
      const y0 = ROOM_Y0 + Math.min(...tiles.map((t) => t[1])) * TILE;
      const y1 = ROOM_Y0 + (Math.max(...tiles.map((t) => t[1])) + 1) * TILE;
      for (const p of w.players) {
        if (p.removed || p.pl?.falling) continue;
        const cx = Math.max(x0, Math.min(x1, p.x));
        const cy = Math.max(y0, Math.min(y1, p.y));
        if (dist(p.x, p.y, cx, cy) >= p.radius) continue;
        // one body's width inside the wall, level with where they stood along it
        const inset = TILE + p.radius + 4;
        const along = (lo: number, hi: number, v: number): number => Math.max(lo + p.radius, Math.min(hi - p.radius, v));
        const [tx, ty]: [number, number] =
          s === 'w' ? [x0 + inset, along(y0, y1, p.y)]
          : s === 'e' ? [x1 - inset, along(y0, y1, p.y)]
          : s === 'n' ? [along(x0, x1, p.x), y0 + inset]
          : [along(x0, x1, p.x), y1 - inset];
        const [fx, fy] = w.room.nearestFloor(tx, ty, p.radius);
        p.x = p.px = fx;
        p.y = p.py = fy;
        p.forced = null;
      }
    }
  }

  /** The anteroom's boss door: always open; the boss room itself locks on entry (GAME_DESIGN §7). */
  bossDoorOpen(): boolean {
    return true;
  }

  /** This zone's boss (CONTENT_ENEMIES §11). */
  get bossDef(): BossDef | null {
    return BOSSES[zoneDef(this.layout.zone).boss] ?? null;
  }

  // ------------------------------------------------------------------ the boss room (GAME_DESIGN §7)

  private bossReliquaryRolled(): boolean {
    const c = this.save.character;
    return stream(this.layout.seed, `bossReliquary:${this.layout.zone}:${c.cycle}`).chance(BOSS_RELIQUARY_CHANCE);
  }

  private setupBossRoom(m: RoomMarkers): void {
    const def = this.bossDef;
    const w = this.w;
    const ws = this.save.world;
    if (!def) return;
    for (const [x, y] of m.pools) spawnHazard(w, 'curePool', [{ k: 'circle', x, y, r: 60 }], 1e6, 1, 0);
    if (ws.bossesBeatenThisCycle.includes(this.layout.zone)) {
      this.spawnBossLeftovers(m);
      return;
    }
    const zd = zoneDef(this.layout.zone);
    const [bx, by] = m.boss ?? [640, 300];
    const e = spawnEnemy(w, def, bx, by, { tellS: BOSS_INTRO_S, zone: this.layout.zone, zoneResist: zd.resist, zoneImmune: zd.statusImmune });
    w.bossId = e.id;
    w.refreshLists();
    this.roomPhase = 'boss';
    w.inputLock = w.time + BOSS_INTRO_S;
    w.sfx('doorLock');
    w.sfx('bossRoar', bx);
    // the Bestiary (D229): a boss's page opens the first time it is seen
    for (const sp of this.players) addBestiarySeen(sp.char, def.id);
    this.listener.bossIntro?.(def, e);
  }

  /**
   * Hold (or release) the boss intro: the boss stays in its spawn tell and every player's input stays locked
   * until `seconds` from now. The client's intro cutscene calls it: co-op extends the hold over the whole
   * cutscene (the sim runs on), solo shortens what is left once the paused cutscene ends.
   */
  holdBossIntro(seconds: number): void {
    const w = this.w;
    const until = w.time + Math.max(0, seconds);
    w.inputLock = until;
    const b = w.bossId ? w.get(w.bossId) : null;
    if (!b?.en || b.en.state !== 'spawning') return;
    b.en.spawnUntil = until;
    b.en.thinkAt = until;
    // keep its rising floor tell three-quarters done, so the boss is visible as the hold ends
    b.en.spawnedAt = Math.min(b.en.spawnedAt, w.time - 3 * Math.max(0.05, seconds));
  }

  /** The stairs (and the reliquary if one rolled) in a beaten boss's arena. */
  private spawnBossLeftovers(m: RoomMarkers): void {
    const w = this.w;
    const ws = this.save.world;
    const [sx, sy] = m.stairs ?? [640, 380];
    if (this.layout.zone < 8) w.spawn('interact', sx, sy, { radius: 26, drawId: 'stairs', it: { kind: 'stairs', key: `z${this.layout.zone}-stairs`, label: 'Descend', used: false, holdS: 0 } });
    else {
      // The Landlord is gone: the lease ends, the stairs go up, and a bonfire offers the next cycle (§13)
      w.spawn('interact', sx, sy, { radius: 26, drawId: 'stairs', it: { kind: 'stairs', key: 'z8-up', label: 'Climb out', used: false, holdS: 0, data: { up: true } } });
      const [bx, by] = w.room.nearestFloor(sx - 150, sy, 20);
      w.spawn('interact', bx, by, { radius: 20, drawId: 'bonfire', it: { kind: 'ngplus', key: 'ngplus', label: `Begin Cycle ${this.save.character.cycle + 2}`, used: false, holdS: HOLD_S } });
    }
    const key = `${this.node.id}-reliquary`;
    if (this.bossReliquaryRolled() && !ws.reliquariesOpened.includes(key)) {
      const [rx, ry] = w.room.nearestFloor(sx + 140, sy, 20);
      w.spawn('interact', rx, ry, { radius: 20, drawId: 'reliquary', it: { kind: 'reliquary', key, label: 'Open the reliquary', used: false, holdS: HOLD_S } });
    }
  }

  private onBossPhase(e: Entity, phase: number): void {
    const def = e.en!.def as unknown as BossDef;
    const ph = def.phases[phase];
    if (ph?.arena) applyArenaChanges(this.w, ph.arena, e);
    startPhaseSummons(this.w, e);
    this.listener.bossPhase?.(def, phase);
  }

  private bossKilled(e: Entity): void {
    const def = e.en!.def as unknown as BossDef;
    const w = this.w;
    const ws = this.save.world;
    if (!ws.bossesBeatenThisCycle.includes(this.layout.zone)) ws.bossesBeatenThisCycle.push(this.layout.zone);
    const z = this.layout.zone;
    this.listener.zoneBeaten?.(z);
    for (const sp of this.players) {
      const c = sp.char;
      c.bossesBeaten++;
      c.flaskMax = Math.max(c.flaskMax, flaskMaxFor(c.bossesBeaten, false));
      // the host's world counts it; a guest only when it is their next zone (D31)
      if (sp.local) c.highestZoneBeaten = Math.max(c.highestZoneBeaten, z);
      else if (z === c.highestZoneBeaten + 1) c.highestZoneBeaten = z;
    }
    this.save.stats.bossKills++;
    // after The Landlord the run resumes at his arena's anteroom (credits, then the NG+ fire)
    if (z === 8) {
      ws.respawnBonfireId = 'z8-boss';
      if (!ws.bonfiresDiscovered.includes('z8-boss')) ws.bonfiresDiscovered.push('z8-boss');
    }
    // the court leaves with its king
    for (const o of w.livingEnemies()) {
      if (o === e) continue;
      o.en!.quietDeath = true;
      o.hp!.dead = true;
      w.fx('dust', o.x, o.y, { n: 10 });
      w.remove(o);
    }
    // its telegraphs and its arena hazards (burning moss, puddles) go out with it
    for (const h of w.entities.values()) {
      if (h.type === 'telegraph' && h.tg?.team === 1) w.remove(h);
      if (h.type === 'hazard' && h.hz?.team === 1 && h.hz.hazard !== 'curePool') w.remove(h);
    }
    w.roomMods.dark = 0;
    w.roomMods.floodUntil = 0;
    // phase moving floors stop with their boss (Tock's own ring is part of his arena and keeps turning)
    if (w.room.movers.length) {
      w.room.movers = [];
      w.room.version++;
    }
    w.bossId = 0;
    this.roomPhase = 'cleared';
    this.reviveDowned();
    if (!ws.roomsCleared.includes(this.node.id)) ws.roomsCleared.push(this.node.id);
    w.emit({ t: 'stat', key: 'roomsCleared', playerId: '' });
    lootHooks.boss(this, e.x, e.y, def.id);
    w.emit({ t: 'levelBanner', text: 'BOSS DEFEATED', sub: def.name });
    w.emit({ t: 'shake', amount: 14 });
    w.sfx('bossRoar', e.x, 0.8, 0.6);
    const m = this.markers;
    const node = this.node;
    w.schedule(2, () => {
      if (this.node !== node) return;
      this.spawnBossLeftovers(m);
      this.applyDoorLocks();
      w.sfx('doorOpen');
    });
    this.listener.bossDefeated?.(def);
    this.listener.autosave?.('boss');
  }

  private spawnRoomContent(node: RoomNode, m: RoomMarkers, cleared: boolean): void {
    const w = this.w;
    const ws = this.save.world;
    // bonfire
    if (m.bonfire && (node.kind === 'start' || node.kind === 'anteroom')) {
      const id = node.kind === 'start' ? `z${this.layout.zone}-start` : `z${this.layout.zone}-boss`;
      if (!ws.bonfiresDiscovered.includes(id)) {
        ws.bonfiresDiscovered.push(id);
        w.emit({ t: 'stat', key: 'bonfires', playerId: '' });
      }
      const unlit = node.kind === 'start' && this.layout.tutorialId !== null && !this.save.character.tutorialDone;
      w.spawn('interact', m.bonfire[0], m.bonfire[1], {
        radius: 20,
        drawId: 'bonfire',
        it: { kind: 'bonfire', key: id, label: unlit ? 'Unlit bonfire' : 'Rest', used: ws.bonfiresUsed.includes(id), holdS: 0, data: { unlit } },
      });
    }
    // chests
    const noMimics = this.players.some((p) => p.entity?.pl?.derived.powers.has('mimics_tooth'));
    const chestAt = (plan: { id: string; kind: 'small' | 'treasure'; mimic: boolean }, x: number, y: number): void => {
      if (ws.chestsOpened.includes(plan.id) || ws.mimicsKilled.includes(plan.id)) return;
      if (plan.mimic) {
        const awake = ws.mimicsAwake.includes(plan.id);
        const e = spawnEnemy(w, MIMIC, x, y, { tellS: 0.05, mimicChestId: awake ? `awake:${plan.id}` : plan.id, zone: this.layout.zone, zoneResist: zoneDef(this.layout.zone).resist });
        if (awake && e.en) e.en.state = 'alert';
        return;
      }
      w.spawn('interact', x, y, { radius: 18, drawId: 'chest', it: { kind: 'chest', key: plan.id, label: 'Open', used: false, holdS: HOLD_S, chestKind: plan.kind } });
    };
    if (node.kind === 'treasure' && m.chests[0]) {
      const plan = treasureChest(this.layout, node, noMimics);
      chestAt(plan, m.chests[0][0], m.chests[0][1]);
      if (plan.guarded && !cleared && !ws.chestsOpened.includes(plan.id)) {
        // a guard wave: half a normal room's budget from the mix
        const p = planRoom(this.layout, { ...node, kind: 'combat', depth: Math.max(1, Math.floor(node.depth / 2)) }, this.players.length);
        this.plan = { waves: p.waves.slice(0, 1), ambush: false };
        this.roomPhase = 'armed';
      }
    }
    // a combat room's chest (rolled with the zone, D93) stands there from the moment you walk in, fight or not
    if (node.kind === 'combat' || node.kind === 'ambush') {
      const plan = smallChest(this.layout, node, noMimics);
      const at = m.chests[0] ?? w.room.nearestFloor(640, 368, 22);
      if (plan) chestAt(plan, at[0], at[1]);
    }
    if (node.kind === 'reliquary' && m.reliquary && !ws.reliquariesOpened.includes(node.id)) {
      w.spawn('interact', m.reliquary[0], m.reliquary[1], { radius: 20, drawId: 'reliquary', it: { kind: 'reliquary', key: node.id, label: 'Open the reliquary', used: false, holdS: HOLD_S } });
    }
    if (node.kind === 'merchant' && m.merchant) this.spawnMerchant(m.merchant[0], m.merchant[1]);
    if (node.kind === 'boss') this.setupBossRoom(m);
    // the Shardpile
    const sp = ws.shardpile;
    if (sp && sp.zone === this.layout.zone && sp.roomId === node.id && sp.amount > 0) {
      w.spawn('pickup', sp.x, sp.y, { radius: 22, pk: { kind: 'shardpile', forPlayer: this.save.character.playerId, amount: sp.amount, until: 0, rarity: 'common', autoCollectAt: 0 } });
    }
    // co-op guests' piles: only the guest who dropped one sees and takes it
    for (const [pid, gp] of Object.entries(ws.guestPiles ?? {})) {
      if (gp.zone !== this.layout.zone || gp.roomId !== node.id || gp.amount <= 0) continue;
      w.spawn('pickup', gp.x, gp.y, { radius: 22, pk: { kind: 'shardpile', forPlayer: pid, amount: gp.amount, until: 0, rarity: 'common', autoCollectAt: 0 } });
    }
    // items left on the floor last time
    const left = ws.leftBehind[node.id];
    if (left) {
      for (const l of left) w.spawn('pickup', l.x, l.y, { radius: 14, pk: { kind: 'item', forPlayer: l.playerId, item: l.item, amount: 1, until: 0, rarity: l.item.rarity, autoCollectAt: 0 } });
      delete ws.leftBehind[node.id];
    }
  }

  /** Gary and his cart (GAME_DESIGN §11). Gone for good once he has been hit three times. */
  spawnMerchant(x: number, y: number): void {
    const w = this.w;
    if (this.save.world.garyGone) {
      w.emit({ t: 'msg', text: 'Cart tracks. Gary left.', color: '#a59c8a' });
      return;
    }
    const g = spawnEnemy(w, GARY, x, y, { tellS: 0.05, zone: this.layout.zone });
    g.facing = Math.PI / 2;
    w.spawn('interact', x, y, { radius: 34, drawId: '', it: { kind: 'gary', key: 'gary', label: 'Trade', used: false, holdS: 0, data: { garyId: g.id } } });
    garyStock(this.save.world, this.layout.zone, this.save.character.cycle);
  }

  private garyHit(gary: Entity): void {
    const w = this.w;
    const ws = this.save.world;
    if (ws.garyGone) return;
    const n = gary.en!.garyHits;
    const lines = ['Gary: "Hey."', 'Gary: "I would not."'];
    if (n < GARY_HITS_TO_LEAVE) {
      w.emit({ t: 'msg', text: lines[n - 1] ?? 'Gary: "…"', color: '#e6d08a' });
      return;
    }
    ws.garyGone = true;
    achievements().note({ k: 'garyGone' });
    w.emit({ t: 'msg', text: 'Gary: "Alright then."', color: '#e6d08a' });
    w.sfx('teleport', gary.x);
    for (const e of w.entities.values()) if (e.it?.kind === 'gary') w.remove(e);
    w.schedule(0.6, () => {
      w.fx('teleport', gary.x, gary.y);
      gary.hp!.dead = true;
      w.remove(gary);
    });
  }

  private rememberLeftBehind(): void {
    if (!this.node) return;
    const items: { playerId: string; item: import('./types').Item; x: number; y: number }[] = [];
    for (const e of this.w.entities.values()) {
      if (e.type === 'pickup' && e.pk?.kind === 'item' && e.pk.item && !e.removed) items.push({ playerId: e.pk.forPlayer ?? '', item: e.pk.item, x: e.x, y: e.y });
    }
    if (items.length) this.save.world.leftBehind[this.node.id] = items;
  }

  // ------------------------------------------------------------------ the per-tick room logic

  tick(dt: number): void {
    const w = this.w;
    const now = w.time;
    this.playtimeAcc += dt;
    if (this.playtimeAcc >= 1) {
      this.save.stats.playtimeSec += Math.floor(this.playtimeAcc);
      this.playtimeAcc -= Math.floor(this.playtimeAcc);
    }
    if (this.dead) return;
    if (this.roomPhase === 'boss') {
      const b = w.get(w.bossId);
      if (b && !b.hp?.dead) tickPhaseSummons(w, b);
    }
    // arming: lock the doors once the party is inside, then spawn waves
    if (this.roomPhase === 'armed' && this.plan) {
      // any player stepping in arms it (D151): it used to watch only the first player (the host), so a guest who
      // walked in first could cross the room, or leave by another door, before a single enemy appeared
      const players = w.livingPlayers();
      const inside = players.length > 0 && (this.plan.ambush || players.some((p) => dist(p.x, p.y, this.entry[0], this.entry[1]) > 70));
      if (inside) {
        this.roomPhase = 'fighting';
        this.applyDoorLocks();
        for (const s of ['n', 's', 'e', 'w'] as Side[]) if (w.room.doors[s].exists) w.room.doors[s].open = false;
        w.room.version++;
        w.sfx('doorLock');
        if (this.plan.ambush) {
          // the solo ambush springs at once; a party's extra waves follow one by one like any room's (D159)
          const burst = Math.min(this.plan.waves.length, this.plan.baseWaves ?? this.plan.waves.length);
          for (let i = 0; i < burst; i++) this.spawnWave(i, 1.5);
          this.waveIdx = burst;
        } else {
          this.spawnWave(0, 1.0);
          this.waveIdx = 1;
        }
      }
    }
    if (this.roomPhase === 'fighting' && this.plan) {
      const alive = this.waveIds.filter((id) => {
        const e = w.get(id);
        return e && !e.hp?.dead;
      }).length;
      const living = w.livingEnemies().filter((e) => !e.en!.isIllusion && e.en!.state !== 'dormant' && !e.en!.def.special).length + w.enemies.filter((e) => e.en?.state === 'spawning' && !e.hp?.dead).length;
      if (this.waveIdx < this.plan.waves.length && alive <= Math.floor(this.waveSize * 0.3)) {
        this.spawnWave(this.waveIdx, 1.0);
        this.waveIdx++;
      } else if (this.waveIdx >= this.plan.waves.length && living === 0) {
        this.clearRoom();
      }
    }
    // pickups: auto-collect
    for (const e of w.entities.values()) {
      if (e.type !== 'pickup' || e.removed || !e.pk) continue;
      for (const p of w.livingPlayers()) {
        if (e.pk.forPlayer && e.pk.forPlayer !== p.pl!.playerId) continue;
        if (dist(p.x, p.y, e.x, e.y) > p.radius + e.radius + 4) continue;
        if (this.collect(p, e)) {
          w.remove(e);
          break;
        }
      }
    }
    // interactions
    for (const p of w.livingPlayers()) this.interactions(p, dt);
    // doors → transitions
    if (!this.pendingTransition) this.checkDoors();
    if (this.pendingTransition) {
      const t = this.pendingTransition;
      this.pendingTransition = null;
      this.enterRoom(t.roomId, t.entry);
    }
    if (this.tutorial) this.tickTutorial();
    if (now - this.lastAutosave > 30) {
      this.lastAutosave = now;
      this.listener.autosave?.('timer');
    }
  }

  private spawnWave(i: number, tellS: number): void {
    const plan = this.plan;
    if (!plan) return;
    if (i === 0 && plan.bonusBoss) {
      this.spawnBonusBoss(plan.bonusBoss);
      return;
    }
    const wave = plan.waves[i];
    if (!wave) return;
    const w = this.w;
    const zd = zoneDef(this.layout.zone);
    const rng = stream(this.layout.seed, `spawn:${this.layout.zone}:${this.node.id}:${i}:${this.save.stats.deaths}`);
    const players = w.livingPlayers();
    const points = this.markers.spawns.filter((s) => players.every((p) => dist(p.x, p.y, s[0], s[1]) >= 200));
    const pts = points.length ? points : this.markers.spawns;
    this.waveIds = [];
    this.waveSize = 0;
    let k = rng.int(0, Math.max(0, pts.length - 1));
    const start = k;
    for (const u of wave) {
      const def = ENEMIES[u.defId];
      if (!def) continue;
      // big (co-op) waves come round each spawn point again; each lap spreads a little wider (D79)
      const lap = Math.floor((k - start) / Math.max(1, pts.length));
      const base = pts[k++ % Math.max(1, pts.length)] ?? [640, 368];
      const jx = base[0] + rng.spread(30 + 22 * lap);
      const jy = base[1] + rng.spread(30 + 22 * lap);
      const [x, y] = w.room.nearestFloor(jx, jy, def.radius);
      const ents = spawnUnit(w, def, x, y, { elite: u.elite as EliteAffix | null, tellS, zoneResist: zd.resist, zoneImmune: zd.statusImmune, share: this.plan?.share ?? roomCountMult(this.players.length) });
      for (const e of ents) this.waveIds.push(e.id);
      this.waveSize += ents.length;
      w.sfx('spawnTell', x, 0.4);
    }
  }

  /**
   * A New Game+ bonus fight (D278): a boss from any zone, in its second phase, with a bar of 30% of the room's
   * zone boss's full HP in this playthrough (D322: this cycle's, the party's; was 30% of its own). It hits as hard as a boss of the room's zone would (not
   * its own zone's), and its arena's changes and timed summons stay in its arena: it brings its phase's attacks. Its
   * Shards are cut like its HP. The room clears when it (and anything it called) is down.
   */
  private spawnBonusBoss(bossId: string): void {
    const def = BOSSES[bossId];
    const w = this.w;
    if (!def) return;
    const zd = zoneDef(this.layout.zone);
    const cyc = this.save.character.cycle;
    const here = this.layout.zone;
    const dmgFix = (enemyDmgMult(here, cyc) * zoneDmgFactor(here)) / (enemyDmgMult(def.zone, cyc) * zoneDmgFactor(def.zone));
    // the spawn point farthest from the party
    const players = w.livingPlayers();
    const far = (p: [number, number]): number => Math.min(1e9, ...players.map((q) => dist(q.x, q.y, p[0], p[1])));
    const pts: [number, number][] = this.markers.spawns.length ? [...this.markers.spawns].sort((a, b) => far(b) - far(a)) : [[640, 300]];
    const [x, y] = w.room.nearestFloor(pts[0]![0], pts[0]![1], def.radius || 56);
    const e = spawnEnemy(w, def, x, y, { tellS: 1.6, zone: def.zone, dmgMult: dmgFix, zoneResist: zd.resist, zoneImmune: zd.statusImmune });
    const en = e.en!;
    // D360: its second phase in NG+1, its third (Overtime) from NG+2 on, read from the form it spawned in
    const live = (en.def as unknown as BossDef).phases;
    const phase = bonusBossPhase(cyc, live.length);
    const ph = live[phase]!;
    en.bonusBoss = true;
    en.phase = phase;
    en.phaseAttacks = ph.attacks;
    // its table starts staggered, as a phase change leaves it
    ph.attacks.forEach((a, k) => {
      en.cooldowns[a.id] = w.time + 2.2 + k * 0.4;
    });
    // D322: a full bar of 30% of this zone's own boss's full HP (this cycle; co-op on top), whoever the bonus boss is,
    // so an Archmagister met in zone 1 is sized like zone 1's boss, not like itself. A party rescale keeps it.
    const zoneBoss = BOSSES[zd.boss];
    if (zoneBoss && !def.traits?.fixedHp && !def.traits?.invincible) en.hpScaleBase = enemyFullHp(zoneBoss, here, cyc);
    en.barMult = BONUS_BOSS_HP_PCT;
    e.hp!.max = Math.max(1, en.hpScaleBase * coopHpMult(w.playerCount, true) * en.barMult);
    e.hp!.hp = e.hp!.max;
    en.shards = Math.max(1, Math.round(en.shards * BONUS_BOSS_SHARD_MULT));
    w.bossId = e.id;
    w.refreshLists();
    this.waveIds = [e.id];
    this.waveSize = 1;
    for (const sp of this.players) addBestiarySeen(sp.char, def.id);
    w.sfx('doorLock');
    w.sfx('bossRoar', x, 0.8);
    w.emit({ t: 'msg', text: `${def.name} waits here, weakened.`, color: def.palette?.[1] ?? '#ffcf6a' });
  }

  /** The bonus boss is down (D278): what it called goes with it, a boss chest's worth of loot; the room clears as usual. */
  private bonusBossKilled(e: Entity): void {
    const w = this.w;
    for (const o of w.livingEnemies()) {
      if (o === e || o.en!.summonerId !== e.id) continue;
      o.en!.quietDeath = true;
      o.hp!.dead = true;
      w.fx('dust', o.x, o.y, { n: 10 });
      w.remove(o);
    }
    if (w.bossId === e.id) w.bossId = 0;
    const p = w.players[0];
    if (p) lootHooks.chest(this, p, `${this.node.id}-bonus:${e.en!.def.id}`, 'boss', e.x, e.y);
    w.emit({ t: 'levelBanner', text: 'CHALLENGER DEFEATED', sub: e.en!.def.name });
    w.emit({ t: 'shake', amount: 10 });
  }

  clearRoom(): void {
    const w = this.w;
    const ws = this.save.world;
    this.roomPhase = 'cleared';
    this.reviveDowned();
    if (!ws.roomsCleared.includes(this.node.id)) ws.roomsCleared.push(this.node.id);
    w.emit({ t: 'stat', key: 'roomsCleared', playerId: '' });
    this.applyDoorLocks();
    w.sfx('doorOpen');
    w.emit({ t: 'msg', text: 'Room cleared.', color: '#a9b7a0' });
    // no reward chest: a room's chest (if it has one) was already standing there when you came in (D93)
    // dropped Shards are granted instantly; items stay until the room is left (PROCGEN §4)
  }

  private checkDoors(): void {
    const w = this.w;
    for (const p of w.livingPlayers()) {
      // A body walking into an open door stops exactly on the room's edge (its radius from the border), so the
      // check needs a little slack; walls are 32 px thick, so only a door gap lets a body this close.
      const reach = p.radius + DOOR_SLACK;
      let side: Side | null = null;
      if (p.y <= ROOM_TOP + reach) side = 'n';
      else if (p.y >= ROOM_BOTTOM - reach) side = 's';
      else if (p.x <= reach) side = 'w';
      else if (p.x >= ROOM_RIGHT - reach) side = 'e';
      if (!side) continue;
      const d = w.room.doors[side];
      if (!d.exists || !d.open) continue;
      const n = neighbourId(this.layout, this.node.id, side);
      if (!n) continue;
      // nobody leaves while a ghost waits for its revive (D115)
      const ghost = this.waitingGhost();
      if (ghost) {
        this.reviveFirst(p, ghost);
        continue;
      }
      // the hall is done when you leave it for the first bonfire (not when you visit the Instructor)
      if ((this.node.kind === 'tutorial' || this.node.kind === 'trial') && n.id === this.layout.startId) this.finishTutorial();
      this.pendingTransition = { roomId: n.id, entry: n.entry };
      return;
    }
    void OPPOSITE;
  }

  /**
   * A co-op ghost still waiting for a revive (downed, not bled out yet). While there is one, the room's doors and
   * stairs let nobody through (D115). A player who bled out (out until the next bonfire) does not hold the party up,
   * and a party that is all ghosts is wiped at once, so this never traps anyone.
   */
  waitingGhost(): Entity | null {
    return this.w.players.find((p) => !p.removed && p.pl!.downed && !p.pl!.deadUntilRest) ?? null;
  }

  /** "Revive Ann first!" to a player at a door or the stairs, at most every 2 s. */
  private reviveFirst(p: Entity, ghost: Entity): void {
    const now = this.w.time;
    if (now < (this.reviveNagAt.get(p.id) ?? -1)) return;
    this.reviveNagAt.set(p.id, now + 2);
    this.w.emit({ t: 'msg', text: `Revive ${ghost.pl!.name} first!`, forPlayer: p.pl!.playerId, color: '#ffd27a' });
    this.w.sfx('uiError', p.x, 0.5);
  }

  // ------------------------------------------------------------------ interaction

  /** The interactable a player can use right now (for the "F: Rest" prompt). */
  interactTarget(p: Entity): Entity | null {
    let best: Entity | null = null;
    let bd = INTERACT_R;
    for (const e of this.w.entities.values()) {
      if (e.removed) continue;
      const ok = (e.type === 'interact' && e.it && !e.it.used) || (e.type === 'enemy' && e.en?.state === 'dormant') || (e.type === 'interact' && e.it?.kind === 'bonfire');
      if (!ok) continue;
      const d = dist(p.x, p.y, e.x, e.y) - e.radius;
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
    return best;
  }

  holdProgress(p: Entity): number {
    const h = this.interactHold.get(p.id);
    return h ? Math.min(1, h.t / HOLD_S) : 0;
  }

  private interactions(p: Entity, dt: number): void {
    const inp = p.pl!.input;
    const heldI = (inp.buttons & (1 << 11)) !== 0;
    const pressedI = (inp.pressed & (1 << 11)) !== 0;
    const target = this.interactTarget(p);
    if (!target) {
      this.interactHold.delete(p.id);
      return;
    }
    const needsHold = target.type === 'enemy' || (target.it?.holdS ?? 0) > 0;
    if (needsHold) {
      if (!heldI) {
        this.interactHold.delete(p.id);
        return;
      }
      const h = this.interactHold.get(p.id) ?? { target: target.id, t: 0 };
      if (h.target !== target.id) {
        h.target = target.id;
        h.t = 0;
      }
      h.t += dt;
      this.interactHold.set(p.id, h);
      if (h.t < HOLD_S) return;
      this.interactHold.delete(p.id);
    } else if (!pressedI) return;
    this.interact(p, target);
  }

  interact(p: Entity, target: Entity): void {
    const w = this.w;
    const ws = this.save.world;
    if (target.type === 'enemy') {
      // a dormant mimic: it bites
      const m = dormantMimicNear(w, p, 90);
      if (m) mimicBite(w, p, m);
      return;
    }
    const it = target.it!;
    switch (it.kind) {
      case 'bonfire': {
        if (it.data?.unlit) {
          w.emit({ t: 'msg', text: 'The bonfire is cold. Finish the hall first.', forPlayer: p.pl!.playerId });
          return;
        }
        this.rest(p, it.key);
        it.used = true;
        break;
      }
      case 'chest': {
        it.used = true;
        if (!ws.chestsOpened.includes(it.key)) ws.chestsOpened.push(it.key);
        w.emit({ t: 'stat', key: 'chests', playerId: p.pl!.playerId });
        w.sfx('chestOpen', target.x);
        target.anim.pose = 'open';
        target.anim.poseT = 0;
        lootHooks.chest(this, p, it.key, it.chestKind ?? 'small', target.x, target.y);
        this.listener.chestOpened?.(p, it.key);
        break;
      }
      case 'reliquary': {
        it.used = true;
        if (!ws.reliquariesOpened.includes(it.key)) ws.reliquariesOpened.push(it.key);
        w.sfx('reliquary', target.x);
        target.anim.pose = 'open';
        lootHooks.reliquary(this, p, target.x, target.y);
        break;
      }
      case 'stairs': {
        const ghost = this.waitingGhost();
        if (ghost) {
          this.reviveFirst(p, ghost);
          break;
        }
        if (it.data?.up) this.listener.credits?.();
        else this.descend();
        break;
      }
      case 'ngplus':
        this.listener.newCycle?.();
        break;
      case 'gary':
        this.listener.gary?.(p);
        break;
      default:
        w.hooks.onInteract?.(w, p, target);
    }
  }

  /** Walk-over pickups. Returns true when collected. */
  collect(p: Entity, e: Entity): boolean {
    const pk = e.pk!;
    const c = p.pl!.char;
    const w = this.w;
    switch (pk.kind) {
      case 'shardpile':
        c.shards += pk.amount;
        if (p.pl!.playerId === this.save.character.playerId) delete this.save.world.shardpile;
        else if (this.save.world.guestPiles) delete this.save.world.guestPiles[p.pl!.playerId];
        w.emit({ t: 'msg', text: `Recovered ${Math.floor(pk.amount)} Shards.`, forPlayer: p.pl!.playerId, color: '#9ad0ff' });
        w.emit({ t: 'stat', key: 'shardsRecovered', playerId: p.pl!.playerId, n: Math.floor(pk.amount) });
        w.sfx('reliquary', e.x, 0.6);
        return true;
      case 'shards':
        c.shards += pk.amount;
        w.sfx('shardPickup', e.x);
        return true;
      default:
        return this.collectLoot(p, e);
    }
  }

  /** Item/gem/consumable/spell pickups (M5 expands). */
  collectLoot(p: Entity, e: Entity): boolean {
    const pk = e.pk!;
    const c = p.pl!.char;
    this.listener.autosave?.('pickup');
    if (pk.kind === 'item' && pk.item) {
      if (c.bag.length >= 60) return false;
      c.bag.push(uniqueItemId(c, pk.item));
      this.w.sfx(`loot${pk.rarity[0]!.toUpperCase()}${pk.rarity.slice(1)}`, e.x);
      this.w.emit({ t: 'msg', text: `${pk.item.name}`, forPlayer: p.pl!.playerId, color: rarityHex(pk.rarity) });
      return true;
    }
    if (pk.kind === 'gem' && pk.gem) {
      c.gems.push(pk.gem);
      this.w.emit({ t: 'stat', key: 'gems', playerId: p.pl!.playerId });
      this.w.sfx('lootRare', e.x);
      this.w.emit({ t: 'msg', text: `${gemKindLabel(pk.gem)}: ${gemTitle(pk.gem)}`, forPlayer: p.pl!.playerId, color: gemColor(pk.gem) });
      return true;
    }
    if (pk.kind === 'consumable' && pk.consumable) {
      c.consumables[pk.consumable] = Math.min(10, (c.consumables[pk.consumable] ?? 0) + pk.amount);
      if (!c.quickSlot) c.quickSlot = pk.consumable;
      this.w.sfx('lootCommon', e.x);
      return true;
    }
    if (pk.kind === 'glowen') {
      c.glowen += pk.amount;
      this.w.sfx('shardPickup', e.x, 0.8, 1.4);
      return true;
    }
    if (pk.kind === 'spell' && pk.spellId) {
      if (!c.knownSpells.includes(pk.spellId)) c.knownSpells.push(pk.spellId);
      this.w.sfx('reliquary', e.x);
      this.w.emit({ t: 'msg', text: 'You learned a spell.', forPlayer: p.pl!.playerId, color: '#c58cff' });
      return true;
    }
    if (pk.kind === 'essence' && pk.essenceTier) {
      const t = Math.max(1, Math.min(5, pk.essenceTier));
      const e = essenceCounts(c);
      e[t - 1]! += pk.amount;
      c.essence = e;
      const def = essenceDef(t);
      this.w.sfx('reliquary', p.x);
      this.w.emit({ t: 'msg', text: `${pk.amount > 1 ? `${pk.amount} × ` : ''}${def.name} (Soul Essence, Tier ${t})`, forPlayer: p.pl!.playerId, color: def.color });
      return true;
    }
    return false;
  }

  // ------------------------------------------------------------------ bonfires (D38)

  /** Rest at a bonfire: heals, refills the Thermos and cleanses the whole party on every rest (D150, D152); respawns enemies, saves, sets respawn. */
  rest(p: Entity, bonfireId: string): boolean {
    const ws = this.save.world;
    const pid = p.pl!.playerId;
    const isOwner = pid === this.save.character.playerId;
    const used = isOwner ? ws.bonfiresUsed : (ws.bonfiresUsedByPlayer[pid] ??= []);
    const first = !used.includes(bonfireId);
    if (first) used.push(bonfireId);
    // one player resting rests the whole party (D152): everyone standing is healed, refilled and cleansed
    // (a guest's Thermos count reaches its own save through the character sync)
    for (const sp of this.players) {
      const e = sp.entity;
      if (!e?.pl || !e.hp || e.hp.dead || e.pl.downed || e.pl.deadUntilRest) continue;
      e.hp.hp = e.hp.max;
      sp.char.flaskCur = flaskCap(sp.char);
      cleanse(e, ['statuses', 'controls']);
      resetPlayerStun(e);
      this.w.fx('levelup', e.x, e.y);
    }
    ws.respawnBonfireId = bonfireId;
    // players who bled out come back at the fire with full HP and a full Thermos (death refills, D12)
    for (const sp of this.players) {
      const e = sp.entity;
      if (!e?.pl?.deadUntilRest) continue;
      e.pl.deadUntilRest = false;
      e.pl.downed = false;
      resetPlayerStun(e);
      e.pl.state = 'idle';
      e.hp!.dead = false;
      e.hp!.hp = e.hp!.max;
      sp.char.flaskCur = flaskCap(sp.char);
      const [nx, ny] = this.w.room.nearestFloor(p.x + 30, p.y + 20, e.radius);
      e.x = e.px = nx;
      e.y = e.py = ny;
      e.anim.alpha = 1;
      this.w.emit({ t: 'revived', playerId: e.pl.playerId });
    }
    // every spell is ready again after a rest (D177)
    for (const sp of this.players) if (sp.entity) resetSpellCooldowns(sp.entity);
    // zone enemies respawn (bosses, opened chests and killed mimics stay done)
    ws.roomsCleared = ws.roomsCleared.filter((id) => this.layout.byId[id]?.kind === 'boss' || id === this.node.id);
    // a rest wipes everyone's downs, so a friend downed after it is back to the base revive effort (D153)
    this.downs = {};
    for (const sp of this.players) if (sp.entity?.pl) sp.entity.pl.downs = 0;
    this.w.sfx('bonfire', p.x);
    this.listener.bonfire?.(p, bonfireId, first);
    this.listener.autosave?.('bonfire');
    return first;
  }

  // ------------------------------------------------------------------ death (solo) and respawn

  private onPlayerDown(p: Entity): void {
    // nobody dies in the Training Hall (D73): the hit leaves you at 1 HP with a moment to recover
    if (this.node?.kind === 'tutorial') {
      p.hp!.hp = 1;
      p.hp!.dead = false;
      p.hp!.invulnUntil = Math.max(p.hp!.invulnUntil, this.w.time + 1.5);
      this.w.emit({ t: 'msg', text: 'The Instructor: "Up you get. Again."', forPlayer: p.pl!.playerId, color: '#e6d08a' });
      return;
    }
    if (this.players.length > 1) {
      this.downPlayer(p);
      return;
    }
    this.die(p);
  }

  /** Co-op downed state (D12) — the full rules live in the co-op module (M9). */
  downPlayer(p: Entity): void {
    const pl = p.pl!;
    pl.downs = (this.downs[pl.playerId] ?? 0) + 1;
    this.downs[pl.playerId] = pl.downs;
    pl.downed = true;
    pl.ghostUntil = this.w.time + 30;
    pl.ghostPauseUntil = 0;
    pl.reviveProgress = 0;
    pl.reviveNeed = reviveRequirement(pl.downs);
    pl.state = 'idle';
    pl.combo = null;
    p.hp!.hp = 0;
    // friendly fire (D115): note which ally's attack (or the burn, bleed… it left, within 10 s) put this player down
    const by = this.w.get(p.hp!.lastHitBy);
    pl.downedBy = by && by !== p && by.pl && this.w.time - p.hp!.lastHitAt <= 10 ? by.pl.playerId : '';
    this.w.emit({ t: 'downed', playerId: pl.playerId });
    if (by?.pl && pl.downedBy) {
      this.w.emit({ t: 'feat', kind: 'downAlly', playerId: pl.downedBy, targetId: p.id });
      this.w.emit({ t: 'msg', text: `${by.pl.name} downed ${pl.name}. Hit their ghost to bring them back.`, color: '#ff9b6a' });
    }
    this.w.sfx('downed', p.x);
    if (this.w.players.every((x) => x.pl!.downed || x.pl!.deadUntilRest)) this.wipe();
  }

  /** D329: the whole room is cleared (not just a wave): every downed player gets up, as a teammate's revive would. */
  private reviveDowned(): void {
    for (const p of this.w.players) if (p.pl!.downed) this.revive(p);
  }

  /** A teammate's hits filled a ghost's revive ring: back at 40% HP with 2 s of i-frames (D12). */
  revive(ghost: Entity): void {
    const pl = ghost.pl!;
    if (!pl.downed) return;
    pl.downed = false;
    pl.downedBy = '';
    pl.reviveProgress = 0;
    resetPlayerStun(ghost);
    pl.state = 'idle';
    ghost.hp!.dead = false;
    ghost.hp!.hp = ghost.hp!.max * 0.4;
    ghost.hp!.invulnUntil = this.w.time + 2;
    ghost.anim.alpha = 1;
    this.w.emit({ t: 'revived', playerId: pl.playerId });
    this.w.emit({ t: 'msg', text: `${pl.name} is back up.`, color: '#58d66a' });
    this.w.sfx('revive', ghost.x);
    this.w.fx('levelup', ghost.x, ghost.y);
  }

  /** A ghost's 30 s ran out: dead until the party rests or wipes. */
  private bledOut(p: Entity): void {
    const pl = p.pl!;
    this.w.emit({ t: 'msg', text: `${pl.name} is out until the next bonfire.`, color: '#ff6a5a' });
    // the ally who downed them let them bleed out: nobody revived them in 30 s (D115)
    if (pl.downedBy) this.w.emit({ t: 'feat', kind: 'abandonAlly', playerId: pl.downedBy, targetId: p.id });
    pl.downedBy = '';
    if (this.w.players.every((x) => x.pl!.downed || x.pl!.deadUntilRest)) this.wipe();
  }

  /** Party wipe (D12): everyone respawns at the bonfire; each player's Shards drop where they fell. */
  wipe(): void {
    this.w.emit({ t: 'msg', text: 'The party has been evicted.', color: '#ff6a5a' });
    this.w.sfx('wipe');
    const host = this.localPlayer;
    if (host) this.die(host);
  }

  die(p: Entity): void {
    if (this.dead) return;
    const ws = this.save.world;
    const c = this.save.character;
    this.dead = true;
    this.w.paused = true;
    this.save.stats.deaths++;
    if (this.w.get(p.hp?.lastHitBy ?? 0)?.en?.def.id === INSTRUCTOR.id) this.save.stats.instructorDeaths = (this.save.stats.instructorDeaths ?? 0) + 1;
    achievements().note({ k: 'death', by: this.w.get(p.hp?.lastHitBy ?? 0)?.en?.def.id });
    stats().note({ k: 'death', by: this.w.get(p.hp?.lastHitBy ?? 0)?.en?.def.id });
    // the Shardpile: at the death spot (in a boss room just inside the door)
    let x = p.x;
    let y = p.y;
    if (this.node.kind === 'boss') [x, y] = [this.entry[0], this.entry[1]];
    const [fx, fy] = this.w.room.nearestFloor(x, y, 14);
    if (c.shards > 0) ws.shardpile = { zone: this.layout.zone, roomId: this.node.id, x: fx, y: fy, amount: c.shards };
    else delete ws.shardpile;
    c.shards = 0;
    // co-op wipe: every guest's Shards fall where that guest fell
    for (const sp of this.players) {
      if (sp.local || !sp.entity) continue;
      const g = sp.entity;
      const [gx, gy] = this.node.kind === 'boss' ? this.w.room.nearestFloor(this.entry[0] + 30, this.entry[1], 14) : this.w.room.nearestFloor(g.x, g.y, 14);
      ws.guestPiles ??= {};
      if (sp.char.shards > 0) ws.guestPiles[sp.char.playerId] = { zone: this.layout.zone, roomId: this.node.id, x: gx, y: gy, amount: sp.char.shards };
      else delete ws.guestPiles[sp.char.playerId];
      sp.char.shards = 0;
    }
    this.deathLine = DEATH_LINES[this.save.stats.deaths % DEATH_LINES.length]!;
    this.w.sfx('death');
    this.listener.playerDied?.(p);
    this.listener.autosave?.('death');
  }

  /** Respawn at the last bonfire with full HP and a full Thermos (death refills, §9.3). */
  respawn(): void {
    const ws = this.save.world;
    this.dead = false;
    this.w.paused = false;
    for (const sp of this.players) {
      sp.char.flaskCur = flaskCap(sp.char);
      if (sp.entity) {
        const e = sp.entity;
        refreshDerived(e);
        e.hp!.dead = false;
        e.hp!.hp = e.hp!.max;
        e.stam!.cur = e.stam!.max;
        e.pl!.downed = false;
        e.pl!.deadUntilRest = false;
        e.pl!.downedBy = '';
        e.pl!.state = 'idle';
        e.pl!.combo = null;
        e.pl!.falling = null;
        e.pl!.downs = 0;
        // a real death readies every spell again (D177); being downed in co-op does not
        resetSpellCooldowns(e);
        e.anim.scale = 1;
        e.anim.alpha = 1;
        e.buffs = [];
        cleanse(e, ['statuses', 'controls']);
        resetPlayerStun(e);
      }
    }
    this.downs = {};
    ws.roomsCleared = ws.roomsCleared.filter((id) => this.layout.byId[id]?.kind === 'boss');
    if (this.layout.tutorialId && !this.save.character.tutorialDone) {
      // the Instructor floored you (D90): you wake at the first bonfire, past him, tutorial done
      this.finishTutorial();
      ws.respawnBonfireId = this.layout.startId;
    }
    const room = this.layout.byId[ws.respawnBonfireId] ? ws.respawnBonfireId : this.layout.startId;
    this.enterRoom(room, 'bonfire');
    this.listener.autosave?.('respawn');
  }

  // ------------------------------------------------------------------ zones

  /** Go down the stairs to the next zone (M8 wires the boss room's stairs). */
  descend(): void {
    const ws = this.save.world;
    const next = ws.zone + 1;
    if (next > 8) return;
    this.gotoZone(next);
  }

  gotoZone(z: number): void {
    const ws = this.save.world;
    ws.zone = z;
    ws.roomsCleared = [];
    ws.respawnBonfireId = `z${z}-start`;
    this.layout = this.layoutFor(z);
    this.enterRoom(this.layout.startId, 'bonfire', true);
    this.listener.autosave?.('zone');
  }

  /** Warp to a discovered bonfire (any zone of this playthrough). */
  warp(bonfireId: string): boolean {
    const m = /^z([0-9]+)-(start|boss)$/.exec(bonfireId);
    if (!m || !this.save.world.bonfiresDiscovered.includes(bonfireId)) return false;
    const z = Number(m[1]);
    if (z !== this.layout.zone) {
      this.save.world.zone = z;
      this.layout = this.layoutFor(z);
    }
    const room = m[2] === 'start' ? this.layout.startId : this.layout.anteroomId;
    this.enterRoom(room, 'bonfire', z !== this.w.zone);
    return true;
  }

  // ------------------------------------------------------------------ mimics

  private mimicKilled(e: Entity): void {
    const ws = this.save.world;
    const id = e.en!.mimicChestId!.replace('awake:', '');
    if (!ws.mimicsKilled.includes(id)) ws.mimicsKilled.push(id);
    ws.mimicsAwake = ws.mimicsAwake.filter((x) => x !== id);
    this.save.stats.mimicsKilled++;
    // the chest's loot plus a bonus roll from the Mimic row
    const p = this.w.get(e.hp!.lastHitBy) ?? this.localPlayer;
    if (p) lootHooks.chest(this, p, id, 'mimic', e.x, e.y);
  }

  // ------------------------------------------------------------------ tutorial hall (PROCGEN §8)

  private setupTutorial(m: RoomMarkers): void {
    const w = this.w;
    const tut = { goals: this.tutGoals, sx: 0, sy: 0, aim0: 0, poked: false, dummy: {} as Record<string, number> };
    const p = this.localPlayer;
    if (p) {
      tut.sx = p.x;
      tut.sy = p.y;
      tut.aim0 = Math.atan2(p.pl!.input.aimY - p.y, p.pl!.input.aimX - p.x);
    }
    const defs: Record<string, typeof DUMMY_STILL> = { a: DUMMY_STILL, b: DUMMY_SWING, c: DUMMY_RED, d: DUMMY_PIERCE, f: DUMMY_STILL };
    for (const d of m.dummies) {
      const def = defs[d.kind];
      if (!def) continue;
      const e = spawnEnemy(w, def, d.x, d.y, { tellS: 0.05, noDrop: true });
      e.en!.shards = 0;
      tut.dummy[d.kind] = e.id;
    }
    // the hazardous-terrain stations stand over a patch of each kind (D126)
    for (const st of m.stations) {
      if (st.n !== 10 && st.n !== 11) continue;
      const kind = st.n === 10 ? TERRAIN.Slow : TERRAIN.Hurt;
      const [ctx, cty] = worldToTile(st.x, st.y + 150);
      for (let ty = cty - 2; ty <= cty + 2; ty++)
        for (let tx = ctx - 3; tx <= ctx + 3; tx++) {
          if (Math.hypot((tx - ctx) / 3.2, (ty - cty) / 2.2) > 1) continue;
          if (w.room.get(tx, ty) === T.Floor) w.room.terrain[ty * ROOM_W + tx] = kind;
        }
    }
    for (const st of m.stations) {
      const s = TUTORIAL_STATIONS.find((x) => x.n === st.n);
      if (!s) continue;
      w.spawn('interact', st.x, st.y + 40, { radius: 10, drawId: 'sign', it: { kind: 'station', key: s.goal, label: '', used: false, holdS: 0, text: s.sign, data: { n: s.n } } });
    }
    this.tutorial = tut;
    for (const d of ['e'] as const) {
      this.w.room.doors[d].exists = true;
      this.w.room.doors[d].locked = false;
      this.w.room.doors[d].open = true;
    }
    this.w.room.version++;
  }

  /** The Instructor's room (D75): optional, he is nearly unbeatable, and here you can die. */
  private setupTrial(m: RoomMarkers): void {
    if (!m.instructor || this.save.world.instructorKilled) return;
    const e = spawnEnemy(this.w, INSTRUCTOR, m.instructor[0], m.instructor[1], { tellS: 0.05, zone: 1 });
    e.en!.shards = 0;
    e.facing = -Math.PI / 2;
  }

  goal(g: string): void {
    if (!this.tutorial || this.tutorial.goals.has(g)) return;
    this.tutorial.goals.add(g);
    this.w.sfx('uiConfirm');
    this.listener.tutorialGoal?.(g);
  }

  private tickTutorial(): void {
    const t = this.tutorial!;
    const p = this.localPlayer;
    if (!p) return;
    const w = this.w;
    if (dist(p.x, p.y, t.sx, t.sy) > 120) this.goal('move');
    const aim = Math.atan2(p.pl!.input.aimY - p.y, p.pl!.input.aimX - p.x);
    if (Math.abs(aim - t.aim0) > 1.0) this.goal('aim');
    const a = w.get(t.dummy.a ?? 0);
    if (a && a.hp && a.hp.hp < a.hp.max) this.goal('attack');
    if (p.pl!.char.twoHanded !== (p.pl!.char.classId === 'brute')) this.goal('twoHand');
    if (p.pl!.state === 'flask') this.goal('flask');
    // the hazardous-terrain stations: walk through the slow patch, take a bite from the hurt one (D126)
    const ground = w.room.terrainAt(p.x, p.y);
    if (ground === TERRAIN.Slow && p.pl!.state !== 'dodge') this.goal('slowTerrain');
    if (ground === TERRAIN.Hurt && p.pl!.state !== 'dodge') this.goal('hurtTerrain');
    // Red stomp: dodged if the dummy's stomp lands while Joe is inside and takes nothing
    for (const tele of w.entities.values()) {
      if (tele.type !== 'telegraph' || !tele.tg || tele.tg.fired) continue;
      if (w.time < tele.tg.impact - 1 / 60) continue;
      const owner = tele.tg.ownerId;
      const shape = tele.tg.shapes[0];
      if (!shape || shape.k === 'pockets' || shape.k === 'wave' || !('x' in shape)) continue;
      const near = dist(p.x, p.y, shape.x, shape.y) < (owner === t.dummy.d ? 220 : 300);
      if (owner === t.dummy.c && near && p.pl!.state === 'dodge') this.goal('dodgeRed');
      if (owner === t.dummy.d && near) {
        const hp0 = p.hp!.hp;
        w.schedule(0.05, () => {
          if (p.hp!.hp >= hp0) this.goal('escapePierce');
        });
      }
    }
    // sign text when close
    let sign: string | null = null;
    for (const e of w.entities.values()) {
      if (e.type === 'interact' && e.it?.kind === 'station' && dist(p.x, p.y, e.x, e.y - 40) < 70) sign = e.it.text ?? null;
    }
    this.listener.sign?.(sign);
  }

  private finishTutorial(): void {
    if (this.save.character.tutorialDone) return;
    this.save.character.tutorialDone = true;
    this.listener.sign?.(null);
    this.tutorial = null;
  }

  /** For the HUD: is each tutorial station done? */
  tutorialDone(goal: string): boolean {
    return this.tutorial?.goals.has(goal) ?? false;
  }
}

export function rarityHex(r: string): string {
  return ({ common: '#e8e8e8', uncommon: '#58d66a', rare: '#4aa3ff', epic: '#b06bff', legendary: '#ff9b2e' } as Record<string, string>)[r] ?? '#e8e8e8';
}
