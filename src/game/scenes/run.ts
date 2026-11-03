// The run scene: a playthrough on screen. Wraps a GameSession (the run rules) with rendering, the HUD,
// minimap, map screen, title cards, room fades, the death screen, bonfire menu and autosaves.
import { drawGlyphLabel, drawPromptText, promptLabel } from '../../ui/glyphs';
import '../../engine/draw/enemies';
import '../../engine/draw/props';
import { app } from '../../app';
import { mixer } from '../../engine/audio/mixer';
import { music, type MusicSeed } from '../../engine/audio/music';
import { playSfx } from '../../engine/audio/sfx';
import { getStore } from '../../engine/settings';
import { drawText } from '../../engine/text';
import { glow } from '../../engine/draw/parts';
import { ZONES, zoneDef } from '../../data/zones';
import { ENEMIES } from '../../data/enemies';
import { btn, clearEl, h, layer } from '../../ui/dom';
import { drawMap, drawMinimap } from '../../ui/minimap';
import { drawInteractable } from '../../render/interactables';
import { drawPartyCards } from '../../ui/party';
import { WorldScene } from './worldScene';
import { GameSession, beginNextCycle } from '../session';
import { buyFromGary, garyStock } from '../bonfire/gary';
import type { NetHost } from '../net/host';
import { writeSave } from '../save/storage';
import type { DebugApi } from '../debug/menu';
import type { BossDef, SaveFile } from '../types';
import type { Entity } from '../world';
import { neighbourId } from '../procgen/zone';
import { openInventory } from '../../ui/menus/inventory';
import { openBonfire } from '../../ui/menus/bonfire';
import { renderSpellTab } from '../../ui/menus/spells';
import { renderGary } from '../../ui/menus/gary';
import { buyConsumable, buyGem, buyItem, cycleQuickSlot, fuseGems, levelUp, respec, sellAll, sellConsumable, sellGem, sellItem, socketGem, unsocketGem, upgradeGem } from '../items/inventory';
import { shopGem, shopGemPrice, shopItemPrice, shopPiece } from '../bonfire/shop';
import { refreshDerived, toggleTwoHand } from '../player/player';
import { stream } from '../../engine/rng';
import { toast } from '../../ui/dom';
import { openSettings } from '../../ui/menus/settings';
import { openAchievements } from '../../ui/achievements';
import { openStatistics } from '../../ui/statistics';
import { achievements } from '../achievements';
import { stats } from '../stats';
import { INSTRUCTOR } from '../../data/enemies/special';
import { BONFIRE_LINES, DEATH_QUIPS, EMBER_LINES, TIPS, bossIntroId, zoneCutsceneId, zoneLines } from '../../data/story';
import { ZoneCutscene, bossIntroCut, cutscenesEnabled, defeatCut, drawBossNameCard, drawZoneTitleCard, instructorCut, restLine, type Cutscene } from '../../ui/cutscene';

/** Scene switches the run scene asks for (wired in main.ts, avoids import cycles). */
export const runHooks: { toTitle?: () => void; credits?: (s: GameSession) => void; toLobby?: (save: SaveFile, net: NetHost) => void; newCycle?: (save: SaveFile) => void } = {};

export class RunScene extends WorldScene {
  readonly name = 'run';
  session: GameSession;
  private fade = 0;
  private title: { zone: number; names: string[]; until: number } | null = null;
  private bossCard: { def: BossDef; until: number } | null = null;
  private bossSeeds = new Map<string, MusicSeed>();
  private signText: string | null = null;
  private overlay: HTMLElement | null = null;
  private overlayKind: '' | 'death' | 'bonfire' | 'map' | 'inventory' | 'pause' | 'settings' = '';
  private pendingSave = false;
  private revealMap = false;
  private saveDebounce = 0;
  /** the cutscene playing (zone entry, boss intro, boss defeat, the Instructor); solo pauses the sim under it */
  private cut: Cutscene | null = null;
  private cutEnd: (() => void) | null = null;
  /** a zone cutscene ends by itself if the party leaves the room it started in (co-op: the sim runs on) */
  private cutRoom = '';
  private pendingDefeat: { def: BossDef; zone: number; at: number } | null = null;

  constructor(
    public save: SaveFile,
    public net: NetHost | null = null,
  ) {
    super();
    this.session = new GameSession(save, {
      roomEntered: (node) => {
        this.fade = 1;
        this.updateMusic();
        if (node.kind === 'trial') this.instructorIntro();
      },
      playerDied: () => this.showDeath(),
      bonfire: (p, id, first) => {
        // a co-op guest's bonfire menu opens on their screen
        const g = this.net?.guestByEntity(p);
        if (g) this.net!.sendEvent(g.peerId, { t: 'bonfire', id, first });
        else this.showBonfire(p, id, first);
      },
      titleCard: (zone, names) => this.zoneIntro(zone, names),
      autosave: (reason) => {
        if (reason === 'pickup') {
          // pickups save at most every 2 s
          this.pendingSave = true;
          this.saveDebounce = 2;
        } else this.persist();
      },
      sign: (t) => {
        this.signText = t;
      },
      tutorialGoal: () => undefined,
      bossIntro: (def, e) => {
        music.play('boss', this.bossSeed(def), 1);
        this.bossIntro(def, e);
      },
      bossPhase: (def, phase) => music.play('boss', this.bossSeed(def), phase + 1),
      bossDefeated: (def) => {
        music.play('off', null);
        // the defeat lines start once the boss has finished exploding
        if (cutscenesEnabled()) this.pendingDefeat = { def, zone: this.session.layout.zone, at: performance.now() / 1000 + 1.1 };
      },
      credits: () => {
        achievements().note({ k: 'credits' });
        // the end of the run: everyone in the party sees the credits, then the host finds the NG+ fire
        this.persist();
        this.closeOverlay();
        if (this.net) {
          this.net.broadcastEvent({ t: 'credits' });
          this.net.close();
          this.net = null;
        }
        runHooks.credits?.(this.session);
      },
      gary: (p) => {
        if (this.net?.guestByEntity(p)) {
          this.w.emit({ t: 'msg', text: 'Gary: "One customer at a time. The host first."', forPlayer: p.pl!.playerId, color: '#e6d08a' });
          return;
        }
        this.showGary();
      },
      newCycle: () => {
        beginNextCycle(this.save);
        this.persist();
        this.closeOverlay();
        if (this.net) {
          this.net.close();
          this.net = null;
        }
        runHooks.newCycle?.(this.save);
      },
    });
    this.w = this.session.w;
  }

  override enter(): void {
    this.session.start();
    // co-op: the guests waiting in the lobby enter the world now
    this.net?.start(this.session);
    this.w = this.session.w;
    this.local = this.session.localPlayer;
    this.view.palette = zoneDef(this.session.layout.zone).palette;
    this.view.propStyle = zoneDef(this.session.layout.zone).props;
    this.view.drawInteract = (ctx, e, now, pid) => this.drawInteractable(ctx, e, now, pid);
    super.enter();
    achievements().begin({ clean: this.save.stats.deaths === 0 });
    window.addEventListener('beforeunload', this.onUnload);
  }

  override exit(): void {
    super.exit();
    this.persist();
    this.closeOverlay();
    music.stop();
    window.removeEventListener('beforeunload', this.onUnload);
  }

  private onUnload = (): void => this.persist();

  persist(): void {
    try {
      writeSave(getStore(), this.save);
    } catch {
      // storage full: keep playing; the next save may succeed
    }
  }

  /** One stable seed object per boss (the music player compares seeds by identity). */
  private bossSeed(def: BossDef): MusicSeed {
    let s = this.bossSeeds.get(def.id);
    if (!s) {
      const z = zoneDef(this.session.layout.zone).music;
      s = { root: def.music.root, tempo: def.music.tempo, bright: def.music.bright, scale: z.scale, wave: z.wave };
      this.bossSeeds.set(def.id, s);
    }
    return s;
  }

  private updateMusic(): void {
    const z = zoneDef(this.session.layout.zone);
    const node = this.session.node;
    if (node.kind === 'boss') return; // the boss module switches to boss music
    music.play('ambient', { root: z.music.root, tempo: z.music.tempo, bright: z.music.bright, scale: z.music.scale, wave: z.music.wave });
  }

  protected override beforeStep(dt: number): void {
    const a = app();
    this.tickCutscenes();
    this.local = this.session.localPlayer;
    this.view.palette = zoneDef(this.session.layout.zone).palette;
    this.view.propStyle = zoneDef(this.session.layout.zone).props;
    if (this.pendingSave && this.saveDebounce <= 0) {
      this.pendingSave = false;
      this.persist();
    }
    if (!this.overlay) {
      if (a.input.consumeLocal('pause')) this.showPause();
      else if (a.input.consumeLocal('map')) this.showMap();
      else if (a.input.consumeLocal('inventory')) this.showInventory();
      else if (a.input.consumeLocal('cycleQuick') && this.local) {
        const q = cycleQuickSlot(this.local.pl!.char);
        toast(q ? `Quick-use: ${q.replace('_', ' ')}` : 'No consumables.', 1200);
      }
    } else if (this.overlayKind === 'map' && (a.input.consumeLocal('map') || a.input.consumeLocal('pause'))) this.closeOverlay();
    else if (this.overlayKind === 'inventory' && (a.input.consumeLocal('inventory') || a.input.consumeLocal('pause'))) this.closeOverlay();
    else if (this.overlayKind === 'bonfire' && a.input.consumeLocal('pause')) this.closeOverlay();
    else if (this.overlayKind === 'pause' && a.input.consumeLocal('pause')) this.closeOverlay();
    this.saveDebounce -= dt;
    this.net?.beforeTick();
  }

  protected override afterStep(dt: number): void {
    achievements().frame(this.w, this.local, this.save.character, this.w.events);
    stats().frame(this.w, this.local, this.save, this.w.events);
    this.net?.afterTick(this.w.events, dt);
  }

  /** Co-op: other players are in this world. */
  get coop(): boolean {
    return !!this.net && this.net.guests.size > 0;
  }

  // ------------------------------------------------------------------ cutscenes (src/ui/cutscene.ts, src/data/story.ts)

  /** A line from a list: seeded by the world and a counter, so it varies without Math.random. */
  private pickLine(list: readonly string[], label: string): string {
    return stream(this.save.world.seed, `${label}:${this.save.stats.deaths}:${this.save.stats.kills}`).pick(list);
  }

  private seen(id: string): boolean {
    return (this.save.world.cutscenesSeen ?? []).includes(id);
  }

  private markSeen(id: string): void {
    const l = (this.save.world.cutscenesSeen ??= []);
    if (!l.includes(id)) l.push(id);
  }

  /** Start a cutscene; the solo sim pauses under it (menuOpen) and gameplay input is off. */
  private playCut(c: Cutscene, onEnd: (() => void) | null = null, roomBound = false): void {
    this.dropCut();
    this.cut = c;
    this.cutEnd = onEnd;
    this.cutRoom = roomBound ? this.session.node.id : '';
    this.menuOpen = true;
  }

  /** Finish the cutscene now (it ended, was skipped, or a menu opened over it). */
  private dropCut(): void {
    const c = this.cut;
    if (!c) return;
    this.cut = null;
    this.view.camera = null;
    if (!this.overlay) this.menuOpen = false;
    const end = this.cutEnd;
    this.cutEnd = null;
    end?.();
  }

  private tickCutscenes(): void {
    if (this.cut && (this.cut.done || (this.cutRoom && this.session.node.id !== this.cutRoom))) this.dropCut();
    const pd = this.pendingDefeat;
    if (!this.cut && pd && !this.overlay && performance.now() / 1000 >= pd.at) {
      this.pendingDefeat = null;
      this.view.banner = null;
      this.playCut(defeatCut(pd.def, pd.zone));
    }
  }

  /** Zone entry: the story cutscene the first time this cycle, the plain title card after (D57). */
  private zoneIntro(zone: number, names: string[]): void {
    const id = zoneCutsceneId(zone);
    if (!cutscenesEnabled() || this.seen(id)) {
      this.title = { zone, names, until: performance.now() / 1000 + 3.5 };
      return;
    }
    this.markSeen(id);
    const z = zoneDef(zone);
    const cycle = this.save.character.cycle;
    this.playCut(new ZoneCutscene({ zone, name: z.name, palette: z.palette, lines: zoneLines(zone, cycle), guests: names, cycle }), null, true);
  }

  /**
   * The boss storms in: the full intro the first time (and always in co-op, where the sim cannot pause and the
   * session holds the boss for the whole cutscene), the freeze-frame alone on later solo attempts.
   */
  private bossIntro(def: BossDef, e: Entity): void {
    const zone = this.session.layout.zone;
    if (!cutscenesEnabled()) {
      this.bossCard = { def, until: performance.now() / 1000 + 2.6 };
      return;
    }
    const coop = this.w.playerCount > 1;
    const id = bossIntroId(zone);
    const full = coop || !this.seen(id);
    this.markSeen(id);
    const cut = bossIntroCut(def, zone, zoneDef(zone).name, () => (this.w.bossId === e.id ? e : null), zoneDef(zone).palette.colors, full);
    if (coop) this.session.holdBossIntro(cut.length + 0.3);
    // solo: the sim was paused under the cutscene; the fight starts a moment after it ends
    this.playCut(cut, coop ? null : () => this.session.holdBossIntro(0.6));
  }

  /** The Instructor's lighter card, the first time Joe walks into his room. */
  private instructorIntro(): void {
    if (!cutscenesEnabled() || this.save.world.instructorKilled || this.seen('instructor')) return;
    const inst = this.w.enemies.find((x) => x.en?.def.id === INSTRUCTOR.id && !x.hp?.dead);
    if (!inst) return;
    this.markSeen('instructor');
    this.playCut(instructorCut(() => (inst.removed ? null : inst), zoneDef(1).palette.colors), null, true);
  }

  // ------------------------------------------------------------------ overlays

  closeOverlay(): void {
    this.overlay?.remove();
    this.overlay = null;
    this.overlayKind = '';
    this.menuOpen = false;
  }

  private showDeath(): void {
    this.dropCut();
    this.closeOverlay();
    mixer.setDuck(0.3);
    const lost = this.save.world.shardpile?.amount ?? 0;
    const l = layer('dim');
    l.setAttribute('data-testid', 'death-screen');
    const respawn = (): void => {
      this.closeOverlay();
      mixer.setDuck(1);
      this.session.respawn();
      this.local = this.session.localPlayer;
    };
    const b = btn('Get up', respawn, 'primary big');
    b.disabled = true;
    const coop = this.coop;
    if (coop) this.net!.broadcastEvent({ t: 'wipe' });
    setTimeout(() => {
      b.disabled = false;
      b.focus();
      if (coop && this.overlayKind === 'death') respawn();
    }, coop ? 3000 : 1500);
    l.appendChild(
      h(
        'div',
        { class: 'col center', style: 'align-items:center;gap:18px' },
        h('div', { class: 'death-title' }, this.session.deathLine),
        h('div', { style: 'font-size:20px;font-style:italic;color:#efe6d2' }, this.pickLine(DEATH_QUIPS, 'quip')),
        h('div', { class: 'dim-text' }, lost > 0 ? `${Math.floor(lost)} Shards left where you fell. Touch them to take them back. Die first and they are gone.` : 'You had no Shards. Small mercies.'),
        h('div', { class: 'dim-text small' }, 'You will wake at your bonfire with full HP and a full Thermos.'),
        h('div', { class: 'small', style: 'color:#cfc6b4;max-width:640px;text-align:center' }, `Tip: ${this.pickLine(TIPS, 'tip')}`),
        b,
      ),
    );
    this.overlay = l;
    this.overlayKind = 'death';
    this.menuOpen = true;
  }

  /** The bonfire menu: level up, respec, gem bench, shop, warp. */
  showBonfire(p: Entity, id: string, first: boolean): void {
    this.dropCut();
    this.closeOverlay();
    const c = p.pl!.char;
    const ws = this.save.world;
    const s = this.session;
    const zone = s.layout.zone;
    const cyc = c.cycle;
    const changed = (): void => refreshDerived(p);
    const r = (o: { msg: string }): string => {
      changed();
      return o.msg;
    };
    const open = (): void => {
      this.overlay?.remove();
      this.overlay = openBonfire({
        char: c,
        bonfireId: id,
        firstRest: first,
        shopGem: shopGem(ws.seed, zone, cyc),
        shopPiece: shopPiece(ws, id, zone, cyc),
        discovered: ws.bonfiresDiscovered.map((b) => ({
          id: b,
          label: `${ZONES[Number(b.slice(1, b.indexOf('-'))) - 1]?.name ?? b} — ${b.endsWith('start') ? 'entrance' : 'before the boss'}`,
          used: ws.bonfiresUsed.includes(b),
        })),
        ops: {
          levelUp: (st) => {
            const o = levelUp(c, st);
            if (o.ok) {
              this.w.fx('levelup', p.x, p.y);
              this.w.sfx('levelUp', p.x);
              this.persist();
            }
            return r(o);
          },
          respec: () => r(respec(c)),
          socket: (it, si, gi) => r(socketGem(c, it, si, gi)),
          unsocket: (it, si) => r(unsocketGem(c, it, si)),
          upgradeGem: (loc, pi) => r(stats().count(upgradeGem(c, loc, pi), 'gemsUpgraded')),
          fuseGem: (o, d, picks) => r(stats().count(fuseGems(c, o, d, picks), 'gemsFused')),
          sellItem: (it) => r(sellItem(c, it)),
          sellAll: (f) => r(sellAll(c, f)),
          sellGem: (gi) => r(sellGem(c, gi)),
          sellConsumable: (cid) => r(sellConsumable(c, cid)),
          buyConsumable: (cid) => r(buyConsumable(c, cid)),
          buyGem: () => {
            const g = shopGem(ws.seed, zone, cyc);
            return r(buyGem(c, g, shopGemPrice(g)));
          },
          buyPiece: () => {
            const piece = shopPiece(ws, id, zone, cyc);
            if (!piece) return 'Sold out.';
            const o = buyItem(c, piece, shopItemPrice(piece));
            if (o.ok) ws.shopStock[id]!.sold = true;
            return r(o);
          },
          warp: (b) => {
            this.closeOverlay();
            s.warp(b);
            this.local = s.localPlayer;
            return '';
          },
        },
        extraTabs: [{ label: 'Spells', render: (el, rr) => renderSpellTab(el, c, changed, rr) }],
        openInventory: () => this.showInventory(() => open()),
        close: () => this.closeOverlay(),
      });
      this.overlay.appendChild(restLine(this.pickLine(first ? BONFIRE_LINES : EMBER_LINES, `rest:${id}`)));
      this.overlayKind = 'bonfire';
      this.menuOpen = true;
    };
    open();
  }

  /** Gary's cart: 3–5 special things for Glowen (GAME_DESIGN §11). */
  showGary(): void {
    this.dropCut();
    this.closeOverlay();
    const p = this.local;
    if (!p) return;
    const c = p.pl!.char;
    const stock = garyStock(this.save.world, this.session.layout.zone, c.cycle);
    const l = layer('dim');
    l.setAttribute('data-testid', 'gary');
    renderGary(l, { char: c, stock, buy: (e) => stats().count(buyFromGary(c, e), { garyBuys: 1, garyGlowen: e.price }), close: () => this.closeOverlay() }, () => {
      refreshDerived(p);
      this.w.sfx('lootRare', p.x);
      this.persist();
    });
    this.overlay = l;
    this.overlayKind = 'bonfire';
    this.menuOpen = true;
  }

  showInventory(onClose?: () => void): void {
    const p = this.local;
    if (!p) return;
    this.dropCut();
    this.overlay?.remove();
    this.overlay = openInventory({
      char: p.pl!.char,
      derived: () => p.pl!.derived,
      changed: () => refreshDerived(p),
      toggleTwoHand: () => toggleTwoHand(this.w, p),
      extraTabs: [{ label: 'Spells', render: (el) => renderSpellTab(el, p.pl!.char, () => refreshDerived(p), () => (this.overlay as HTMLElement & { rerender?: () => void })?.rerender?.()) }],
      close: () => {
        this.closeOverlay();
        onClose?.();
      },
    });
    this.overlayKind = 'inventory';
    this.menuOpen = true;
  }

  showPause(): void {
    this.dropCut();
    this.closeOverlay();
    const l = layer('dim');
    l.setAttribute('data-testid', 'pause-menu');
    const c = this.save.character;
    const where = `${c.name} · level ${c.level} · ${zoneDef(this.session.layout.zone).name}${c.cycle ? ` · Cycle ${c.cycle + 1}` : ''}`;
    l.appendChild(
      h(
        'div',
        { class: 'panel col', style: 'width:380px' },
        h('h2', null, 'Paused'),
        h('div', { class: 'small dim-text' }, where),
        btn('Resume', () => this.closeOverlay(), 'primary big'),
        btn('Inventory', () => this.showInventory(), 'big'),
        btn('Map', () => this.showMap(), 'big'),
        btn(
          'Settings',
          () => {
            this.overlay?.remove();
            this.overlay = openSettings(() => this.showPause());
            this.overlayKind = 'settings';
          },
          'big',
        ),
        btn('Achievements', () => {
          this.overlay?.remove();
          this.overlay = openAchievements(() => this.showPause());
          this.overlayKind = 'settings';
        }, 'big'),
        btn('Statistics', () => {
          this.overlay?.remove();
          this.overlay = openStatistics(() => this.showPause(), { save: this.save });
          this.overlayKind = 'settings';
        }, 'big'),
        this.net ? btn('Return to lobby (invite more)', () => this.returnToLobby(), 'big') : null,
        btn(this.net ? 'Save, end the session and quit' : 'Save and quit to title', () => this.quitToTitle(), 'big'),
      ),
    );
    this.overlay = l;
    this.overlayKind = 'pause';
    this.menuOpen = true;
  }

  quitToTitle(): void {
    this.persist();
    this.closeOverlay();
    this.net?.close();
    this.net = null;
    runHooks.toTitle?.();
  }

  /** Host: everyone back to the lobby (the world is saved; the party re-enters at the host's bonfire). */
  returnToLobby(): void {
    const net = this.net;
    if (!net) return;
    this.persist();
    this.closeOverlay();
    net.toLobby();
    this.net = null;
    runHooks.toLobby?.(this.save, net);
  }

  private showMap(): void {
    this.dropCut();
    this.closeOverlay();
    const l = layer('dim');
    l.setAttribute('data-testid', 'map-screen');
    const c = h('canvas', { width: 700, height: 520 });
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = '#14121a';
    ctx.fillRect(0, 0, 700, 520);
    drawMap(ctx, { layout: this.session.layout, ws: this.save.world, currentId: this.session.node.id, revealAll: this.revealMap }, 40, 40, 64, 42, 10, true);
    const z = zoneDef(this.session.layout.zone);
    l.appendChild(
      h(
        'div',
        { class: 'panel col', style: 'align-items:center' },
        h('h2', null, `${z.name}${this.save.character.cycle ? ` — Cycle ${this.save.character.cycle + 1}` : ''}`),
        c,
        h('div', { class: 'small dim-text' }, '▲ bonfire (orange: fresh, brown: embers) · ■ treasure · ✦ reliquary · $ merchant · ☠ boss · blue dot: your Shardpile'),
        btn(promptLabel('map', 'Close', 'suffix'), () => this.closeOverlay()),
      ),
    );
    this.overlay = l;
    this.overlayKind = 'map';
    this.menuOpen = true;
  }

  // ------------------------------------------------------------------ drawing

  private drawInteractable(ctx: CanvasRenderingContext2D, e: Entity, now: number, _pid: string): void {
    drawInteractable(ctx, e, now, { bonfireUsed: (k) => this.save.world.bonfiresUsed.includes(k), stationDone: (g) => this.session.tutorialDone(g) });
  }

  protected override renderOverlay(ctx: CanvasRenderingContext2D): void {
    const p = this.local;
    if (!p) return;
    const now = performance.now() / 1000;
    // interaction prompt with a hold ring
    const t = this.session.interactTarget(p);
    if (t && !this.overlay) {
      const label = t.type === 'enemy' ? 'Open' : t.it?.label || '';
      if (label && t.it?.kind !== 'station') {
        const prog = this.session.holdProgress(p);
        drawGlyphLabel(ctx, 'interact', label, t.x, t.y - t.radius - 31, { size: 15 });
        if (prog > 0) {
          ctx.save();
          ctx.strokeStyle = '#e6b84a';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.radius + 12, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
    // tutorial sign text
    if (this.signText) {
      ctx.save();
      ctx.fillStyle = 'rgba(10,8,14,0.85)';
      ctx.fillRect(240, 600, 800, 52);
      ctx.strokeStyle = '#8a6a3a';
      ctx.strokeRect(240, 600, 800, 52);
      ctx.restore();
      drawPromptText(ctx, this.signText, 640, 627, { size: 15, maxWidth: 780, weight: 'normal' });
    }
    // locked boss door hint
    const node = this.session.node;
    if (node.kind === 'anteroom') {
      for (const s of ['n', 's', 'e', 'w'] as const) {
        const d = this.w.room.doors[s];
        const n = neighbourId(this.session.layout, node.id, s);
        if (d.exists && d.locked && n && this.session.layout.byId[n.id]?.kind === 'boss') {
          const pos = s === 'n' ? [640, 60] : s === 's' ? [640, 690] : s === 'w' ? [60, 368] : [1220, 368];
          glow(ctx, pos[0]!, pos[1]!, 40, '#ff3b3b', 0.3 + Math.sin(now * 3) * 0.1);
        }
      }
    }
    void now;
  }

  protected override renderTop(ctx: CanvasRenderingContext2D, _alpha: number, realDt: number): void {
    const now = performance.now() / 1000;
    if (!this.cut) {
      drawMinimap(ctx, { layout: this.session.layout, ws: this.save.world, currentId: this.session.node.id, revealAll: this.revealMap });
      if (this.w.players.length > 1) drawPartyCards(ctx, this.w, this.local?.pl?.playerId ?? '');
    }
    // zone title card (a zone already introduced this cycle)
    if (this.title && now < this.title.until) {
      const z = ZONES[this.title.zone - 1]!;
      drawZoneTitleCard(ctx, z.name, z.palette.accent, this.title.names, z.tagline, this.title.until - now, 3.5);
    }
    // boss name card when cutscenes are off (inputs are held for the first 1.5 s by the session)
    if (this.bossCard && now < this.bossCard.until) drawBossNameCard(ctx, this.bossCard.def.introTitle, this.bossCard.def.introSub, this.bossCard.def.palette?.[1] ?? '#e6b84a', this.bossCard.until - now, 2.6);
    // the cutscene: drawn with the camera the world used this frame, then ticked for the next one
    if (this.cut) {
      this.cut.draw(ctx, { cam: this.view.camera });
      this.cut.tick(realDt);
      this.view.camera = this.cut.camera(app().settings.video.shake);
    }
    // room transition fade (0.3 s)
    if (this.fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${Math.min(1, this.fade)})`;
      ctx.fillRect(0, 0, 1280, 720);
      this.fade = Math.max(0, this.fade - realDt / 0.3);
    }
    if (app().settings.video.showFps) drawText(ctx, `${app().loop.fps.toFixed(0)} fps`, 1270, 150, { size: 12, align: 'right', mono: true, color: '#a59c8a' });
    if (this.session.node.kind === 'tutorial') drawText(ctx, 'TRAINING HALL — the exit is on the right. The big man waits behind it: beat him or walk past him.', 640, 40, { size: 14, align: 'center', color: '#a59c8a' });
    else if (this.session.node.kind === 'trial') drawText(ctx, 'THE INSTRUCTOR — nearly unbeatable. Beat him for a prize, or die and wake at the first bonfire. The way down is east.', 640, 40, { size: 14, align: 'center', color: '#e6a07a' });
  }

  // ------------------------------------------------------------------ debug

  protected override debugApi(): DebugApi {
    const base = super.debugApi();
    const s = this.session;
    return {
      ...base,
      listZones: () => ZONES.map((z) => `${z.id} ${z.name}`),
      jumpZone: (z) => {
        const zz = Math.max(1, Math.min(8, Math.floor(z)));
        s.save.character.tutorialDone = true;
        s.gotoZone(zz);
        this.local = s.localPlayer;
        return `Zone ${zz}: ${zoneDef(zz).name}.`;
      },
      listRooms: () => s.layout.rooms.map((r) => `${r.id} (${r.kind})`),
      jumpRoom: (id) => {
        const rid = id.split(' ')[0]!;
        if (!s.layout.byId[rid]) return `No room ${rid}`;
        s.enterRoom(rid, 'bonfire');
        return `Room ${rid}.`;
      },
      jumpBoss: () => {
        s.enterRoom(s.layout.anteroomId, 'bonfire');
        return 'Boss anteroom.';
      },
      setCycle: (n) => {
        s.save.character.cycle = Math.max(0, Math.floor(n));
        s.w.cycle = s.save.character.cycle;
        return `Cycle ${s.save.character.cycle} (applies to new rooms; use Jump to zone to regenerate).`;
      },
      revealMap: () => {
        this.revealMap = true;
        return 'Map revealed.';
      },
      testArena: () => 'Open the test arena from the title screen (or reload with ?arena).',
    };
  }

  protected override spawnContext(): { zone?: number; cycle?: number; zoneResist?: Partial<Record<string, number>>; zoneImmune?: string[] } {
    const z = zoneDef(this.session.layout.zone);
    return { zone: z.id, cycle: this.save.character.cycle, zoneResist: z.resist, zoneImmune: z.statusImmune };
  }
}

export function playUi(): void {
  playSfx('uiClick');
}

export { clearEl, ENEMIES };
