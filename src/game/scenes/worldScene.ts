// Shared client scene for anything that runs a World locally: input sampling, fixed stepping,
// event → sound/particle routing, world rendering, HUD, and the debug API basics.
import { app } from '../../app';
import { mixer } from '../../engine/audio/mixer';
import type { Scene } from '../../engine/scene';
import { WorldView } from '../../render/view';
import { drawHud } from '../../ui/hud';
import { drawBossBar, newBossBarState } from '../../ui/bossBar';
import { registerDebugApi, type DebugApi } from '../debug/menu';
import { refreshDebugPanel } from '../../ui/menus/debug';
import { stepWorld } from '../sim';
import { allBaseIds } from '../items/bases';
import { generateItem } from '../items/generate';
import { Rng } from '../../engine/rng';
import { ENEMIES } from '../../data/enemies';
import { SPELLS } from '../../data/spells';
import { spawnUnit } from '../enemies/spawn';
import { refreshDerived } from '../player/player';
import { levelFromStats } from '../player/character';
import type { ConsumableId, EliteAffix, EnemyDef, Item, Rarity, StatId } from '../types';
import type { Entity, World } from '../world';

export abstract class WorldScene implements Scene {
  abstract readonly name: string;
  w!: World;
  view: WorldView;
  local: Entity | null = null;
  ghostHp = 1;
  bossBar = newBossBarState();
  /** menus open: gameplay input off, solo sim paused */
  menuOpen = false;

  constructor() {
    const a = app();
    this.view = new WorldView(a.particles, () => a.settings);
  }

  enter(): void {
    registerDebugApi(this.debugApi());
    refreshDebugPanel();
  }

  exit(): void {
    registerDebugApi(null);
    app().input.gameplayEnabled = true;
  }

  /** Called before each sim tick (room logic, network). */
  protected beforeStep(_dt: number): void {}
  protected afterStep(_dt: number): void {}

  update(dt: number): void {
    const a = app();
    const w = this.w;
    a.input.gameplayEnabled = !this.menuOpen;
    w.hitstopEnabled = a.settings.video.hitstop;
    if (this.local?.pl) {
      const inp = a.input.sample(this.local.x, this.local.y);
      this.local.pl.input = inp;
    }
    this.beforeStep(dt);
    if (!this.menuOpen || w.playerCount > 1) stepWorld(w, dt);
    this.afterStep(dt);
    this.view.consume(w, w.events);
    w.events.length = 0;
  }

  render(ctx: CanvasRenderingContext2D, alpha: number, realDt: number): void {
    const w = this.w;
    const a = app();
    this.view.localPlayerId = this.local?.pl?.playerId ?? '';
    this.view.render(ctx, w, this.menuOpen && w.playerCount <= 1 ? 1 : alpha, realDt);
    if (this.local?.st && this.local.st.controls.blind > w.time) this.view.drawBlind(ctx, this.local.x, this.local.y, 1);
    this.renderOverlay(ctx, alpha, realDt);
    if (this.local) {
      const hpFrac = this.local.hp!.hp / this.local.hp!.max;
      this.ghostHp = Math.max(hpFrac, this.ghostHp - realDt * 0.4);
      drawHud(ctx, w, this.local, a.settings, { ghostHp: this.ghostHp });
    }
    drawBossBar(ctx, w, this.bossBar, realDt);
    this.renderTop(ctx, alpha, realDt);
    mixer.setDuck(1);
  }

  protected renderOverlay(_ctx: CanvasRenderingContext2D, _alpha: number, _realDt: number): void {}
  protected renderTop(_ctx: CanvasRenderingContext2D, _alpha: number, _realDt: number): void {}

  /** Debug API shared by every world scene; subclasses override what they support. */
  protected debugApi(): DebugApi {
    const self = this;
    const pl = (): Entity => {
      if (!self.local) throw new Error('no player');
      return self.local;
    };
    return {
      god: (on) => {
        self.w.god = on;
      },
      isGod: () => self.w.god,
      listBases: () => allBaseIds(),
      giveItem(baseId, rarity, ilvl) {
        const p = pl();
        const it = self.makeDebugItem(baseId, rarity as Rarity, ilvl);
        const ch = p.pl!.char;
        if (it.slot === 'main') {
          if (ch.equipment.main) ch.bag.push(ch.equipment.main);
          ch.equipment.main = it;
        } else if (it.slot === 'off') {
          if (ch.equipment.off) ch.bag.push(ch.equipment.off);
          ch.equipment.off = it;
          ch.twoHanded = false;
        } else if (it.slot === 'ring') {
          if (!ch.equipment.ring1) ch.equipment.ring1 = it;
          else if (!ch.equipment.ring2) ch.equipment.ring2 = it;
          else ch.bag.push(it);
        } else {
          const s = it.slot as 'head' | 'body' | 'legs';
          if (ch.equipment[s]) ch.bag.push(ch.equipment[s]!);
          ch.equipment[s] = it;
        }
        refreshDerived(p);
        return `Equipped ${it.name} (${it.rarity}, ilvl ${it.ilvl}).`;
      },
      giveGem(family, tier) {
        pl().pl!.char.gems.push({ family: family as never, tier: Math.max(1, Math.min(5, tier)) as 1 });
        return `Gem ${family} T${tier} added to the bag.`;
      },
      giveConsumable(id, n) {
        const ch = pl().pl!.char;
        const cid = id as ConsumableId;
        ch.consumables[cid] = Math.min(10, (ch.consumables[cid] ?? 0) + n);
        if (!ch.quickSlot) ch.quickSlot = cid;
        return `+${n} ${id}`;
      },
      learnAllSpells: () => self.learnAll(),
      setLevel(n) {
        const ch = pl().pl!.char;
        const target = Math.max(1, Math.min(400, Math.floor(n)));
        let cur = levelFromStats(ch);
        const order: StatId[] = ['hp', 'stamina', 'bonk', 'slicey', 'brain', 'prayer'];
        let i = 0;
        while (cur < target) {
          const s = order[i++ % 6]!;
          if (ch.stats[s] < 99) {
            ch.stats[s]++;
            cur++;
          }
          if (i > 2000) break;
        }
        ch.level = levelFromStats(ch);
        refreshDerived(pl());
        return `Level ${ch.level}.`;
      },
      setStat(stat, n) {
        const ch = pl().pl!.char;
        ch.stats[stat as StatId] = Math.max(1, Math.min(99, Math.floor(n)));
        ch.level = levelFromStats(ch);
        refreshDerived(pl());
        return `${stat} = ${ch.stats[stat as StatId]} (level ${ch.level}).`;
      },
      listEnemies: () => Object.keys(ENEMIES).sort(),
      spawnEnemy(id, elite) {
        const def = (ENEMIES[id] ?? self.bossDef(id)) as EnemyDef | undefined;
        if (!def) return `Unknown enemy ${id}`;
        const p = pl();
        const x = Math.max(80, Math.min(1200, p.x + 260));
        const y = p.y;
        spawnUnit(self.w, def as never, x, y, { elite: (elite as EliteAffix | null) ?? null, ...self.spawnContext() });
        return `Spawned ${def.name}${elite ? ` (${elite})` : ''}.`;
      },
      killAll() {
        let n = 0;
        for (const e of self.w.enemies) {
          if (e.hp && !e.hp.dead && !e.en?.gary) {
            e.hp.hp = 0;
            e.hp.dead = true;
            self.w.emit({ t: 'death', id: e.id, x: e.x, y: e.y, isPlayer: false, defId: e.en!.def.id });
            self.w.hooks.onEnemyKilled?.(self.w, e, self.local?.id ?? 0);
            n++;
          }
        }
        return `Killed ${n}.`;
      },
      listZones: () => ['1 Mossy Crypt', '2 Fungal Caverns', '3 Drowned Sewers', '4 Hollow Forest', '5 Ashen Forge', '6 Frozen Reliquary', '7 Clockwork Citadel', '8 The Abyss'],
      jumpZone: () => 'Not available in this scene.',
      listRooms: () => [],
      jumpRoom: () => 'Not available in this scene.',
      jumpBoss: () => 'Not available in this scene.',
      setCycle: () => 'Not available in this scene.',
      setFlask(cur, max) {
        const ch = pl().pl!.char;
        ch.flaskMax = Math.max(1, Math.min(5, Math.floor(max)));
        ch.flaskCur = Math.max(0, Math.min(ch.flaskMax, Math.floor(cur)));
        return `Flask ${ch.flaskCur}/${ch.flaskMax}.`;
      },
      addShards(n) {
        pl().pl!.char.shards += Math.floor(n);
        return `Shards ${pl().pl!.char.shards}.`;
      },
      addStardust(n) {
        pl().pl!.char.stardust += Math.floor(n);
        return `Stardust ${pl().pl!.char.stardust}.`;
      },
      addTear() {
        pl().pl!.char.tears++;
        return `Tears: ${pl().pl!.char.tears}.`;
      },
      testArena: () => self.toArena(),
      revealMap: () => 'Not available in this scene.',
      stats: () => {
        const a = app();
        let proj = 0;
        let tele = 0;
        for (const e of self.w.entities.values()) {
          if (e.type === 'projectile') proj++;
          else if (e.type === 'telegraph') tele++;
        }
        const perf = performance as unknown as { memory?: { usedJSHeapSize: number } };
        const out = {
          fps: a.loop.fps,
          simMs: a.loop.simMs,
          renderMs: a.loop.renderMs,
          entities: self.w.entities.size,
          enemies: self.w.enemies.length,
          particles: a.particles.count,
          projectiles: proj,
          telegraphs: tele,
        };
        return perf.memory ? { ...out, heapMb: perf.memory.usedJSHeapSize / 1048576 } : out;
      },
    };
  }

  protected makeDebugItem(baseId: string, rarity: Rarity, ilvl: number): Item {
    const lv = Math.max(1, Math.floor(ilvl));
    return generateItem(new Rng(`debug|${baseId}|${rarity}|${lv}|${this.w.tick}`), { source: 'boss', ilvl: lv, zone: Math.min(8, lv), rarity, baseId });
  }
  protected learnAll(): string {
    const p = this.local;
    if (!p) return 'No player.';
    for (const id of Object.keys(SPELLS)) if (!p.pl!.char.knownSpells.includes(id)) p.pl!.char.knownSpells.push(id);
    return `Known spells: ${p.pl!.char.knownSpells.length}.`;
  }
  protected bossDef(_id: string): unknown {
    return null;
  }
  protected spawnContext(): { zone?: number; cycle?: number; zoneResist?: Partial<Record<string, number>>; zoneImmune?: string[] } {
    return {};
  }
  protected toArena(): string {
    return 'Not available in this scene.';
  }
}
