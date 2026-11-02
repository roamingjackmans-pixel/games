// The run scene: a playthrough on screen. Wraps a GameSession (the run rules) with rendering, the HUD,
// minimap, map screen, title cards, room fades, the death screen, bonfire menu and autosaves.
import '../../engine/draw/enemies';
import '../../engine/draw/props';
import { app } from '../../app';
import { mixer } from '../../engine/audio/mixer';
import { music } from '../../engine/audio/music';
import { playSfx } from '../../engine/audio/sfx';
import { getStore } from '../../engine/settings';
import { drawText } from '../../engine/text';
import { glow } from '../../engine/draw/parts';
import { drawChest } from '../../engine/draw/enemies/crypt';
import { drawBonfire, drawReliquary, drawSign, drawStairs, drawStationMarker } from '../../engine/draw/props';
import { ZONES, zoneDef } from '../../data/zones';
import { ENEMIES } from '../../data/enemies';
import { TUTORIAL_STATIONS } from '../../data/rooms/special';
import { btn, clearEl, h, layer } from '../../ui/dom';
import { drawMap, drawMinimap } from '../../ui/minimap';
import { WorldScene } from './worldScene';
import { GameSession } from '../session';
import { writeSave } from '../save/storage';
import type { DebugApi } from '../debug/menu';
import type { SaveFile } from '../types';
import type { Entity } from '../world';
import { neighbourId } from '../procgen/zone';
import { openInventory } from '../../ui/menus/inventory';
import { openBonfire } from '../../ui/menus/bonfire';
import { renderSpellTab } from '../../ui/menus/spells';
import { buyConsumable, buyGem, buyItem, cycleQuickSlot, levelUp, rerollGem, respec, sellConsumable, sellGem, sellItem, socketGem, unsocketGem, upgradeGem } from '../items/inventory';
import { shopGem, shopGemPrice, shopItemPrice, shopPiece } from '../bonfire/shop';
import { refreshDerived, toggleTwoHand } from '../player/player';
import { stream } from '../../engine/rng';
import { toast } from '../../ui/dom';

export class RunScene extends WorldScene {
  readonly name = 'run';
  session: GameSession;
  private fade = 0;
  private title: { zone: number; names: string[]; until: number } | null = null;
  private signText: string | null = null;
  private overlay: HTMLElement | null = null;
  private overlayKind: '' | 'death' | 'bonfire' | 'map' | 'inventory' = '';
  private revealMap = false;
  private saveDebounce = 0;

  constructor(public save: SaveFile) {
    super();
    this.session = new GameSession(save, {
      roomEntered: () => {
        this.fade = 1;
        this.updateMusic();
      },
      playerDied: () => this.showDeath(),
      bonfire: (p, id, first) => this.showBonfire(p, id, first),
      titleCard: (zone, names) => {
        this.title = { zone, names, until: performance.now() / 1000 + 3.5 };
      },
      autosave: () => this.persist(),
      sign: (t) => {
        this.signText = t;
      },
      tutorialGoal: () => undefined,
    });
    this.w = this.session.w;
  }

  override enter(): void {
    this.session.start();
    this.w = this.session.w;
    this.local = this.session.localPlayer;
    this.view.palette = zoneDef(this.session.layout.zone).palette;
    this.view.propStyle = zoneDef(this.session.layout.zone).props;
    this.view.drawInteract = (ctx, e, now, pid) => this.drawInteractable(ctx, e, now, pid);
    super.enter();
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

  private updateMusic(): void {
    const z = zoneDef(this.session.layout.zone);
    const node = this.session.node;
    if (node.kind === 'boss') return; // the boss module switches to boss music
    music.play('ambient', { root: z.music.root, tempo: z.music.tempo, bright: z.music.bright, scale: z.music.scale, wave: z.music.wave });
  }

  protected override beforeStep(dt: number): void {
    const a = app();
    this.local = this.session.localPlayer;
    this.view.palette = zoneDef(this.session.layout.zone).palette;
    this.view.propStyle = zoneDef(this.session.layout.zone).props;
    if (!this.overlay) {
      if (a.input.consumeLocal('map')) this.showMap();
      else if (a.input.consumeLocal('inventory')) this.showInventory();
      else if (a.input.consumeLocal('cycleQuick') && this.local) {
        const q = cycleQuickSlot(this.local.pl!.char);
        toast(q ? `Quick-use: ${q.replace('_', ' ')}` : 'No consumables.', 1200);
      }
    } else if (this.overlayKind === 'map' && (a.input.consumeLocal('map') || a.input.consumeLocal('pause'))) this.closeOverlay();
    else if (this.overlayKind === 'inventory' && (a.input.consumeLocal('inventory') || a.input.consumeLocal('pause'))) this.closeOverlay();
    else if (this.overlayKind === 'bonfire' && a.input.consumeLocal('pause')) this.closeOverlay();
    this.saveDebounce -= dt;
  }

  // ------------------------------------------------------------------ overlays

  closeOverlay(): void {
    this.overlay?.remove();
    this.overlay = null;
    this.overlayKind = '';
    this.menuOpen = false;
  }

  private showDeath(): void {
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
    setTimeout(() => {
      b.disabled = false;
      b.focus();
    }, 1500);
    l.appendChild(
      h(
        'div',
        { class: 'col center', style: 'align-items:center;gap:18px' },
        h('div', { class: 'death-title' }, this.session.deathLine),
        h('div', { class: 'dim-text' }, lost > 0 ? `${Math.floor(lost)} Shards left where you fell. Touch them to take them back. Die first and they are gone.` : 'You had no Shards. Small mercies.'),
        h('div', { class: 'dim-text small' }, 'You will wake at your bonfire with full HP and a full Thermos.'),
        b,
      ),
    );
    this.overlay = l;
    this.overlayKind = 'death';
    this.menuOpen = true;
  }

  /** The bonfire menu: level up, respec, gem bench, shop, warp. */
  showBonfire(p: Entity, id: string, first: boolean): void {
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
    const rng = stream(ws.seed, `reroll:${c.stardust}:${c.gems.length}:${s.w.tick}`);
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
          upgradeGem: (gi) => r(upgradeGem(c, gi)),
          rerollGem: (gi) => r(rerollGem(c, gi, rng)),
          sellItem: (it) => r(sellItem(c, it)),
          sellGem: (gi) => r(sellGem(c, gi)),
          sellConsumable: (cid) => r(sellConsumable(c, cid)),
          buyConsumable: (cid) => r(buyConsumable(c, cid)),
          buyGem: () => r(buyGem(c, shopGem(ws.seed, zone, cyc), shopGemPrice())),
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
      this.overlayKind = 'bonfire';
      this.menuOpen = true;
    };
    open();
  }

  showInventory(onClose?: () => void): void {
    const p = this.local;
    if (!p) return;
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

  private showMap(): void {
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
        btn('Close (M)', () => this.closeOverlay()),
      ),
    );
    this.overlay = l;
    this.overlayKind = 'map';
    this.menuOpen = true;
  }

  // ------------------------------------------------------------------ drawing

  private drawInteractable(ctx: CanvasRenderingContext2D, e: Entity, now: number, _pid: string): void {
    const it = e.it!;
    switch (it.kind) {
      case 'bonfire':
        drawBonfire(ctx, e.x, e.y, now, it.data?.unlit ? 'unlit' : this.save.world.bonfiresUsed.includes(it.key) ? 'ember' : 'fresh');
        break;
      case 'chest':
        drawChest(ctx, e.x, e.y, it.used ? Math.min(1, e.anim.poseT * 4 + 0.3) : 0, false, 0, false, false);
        e.anim.poseT += 1 / 60;
        break;
      case 'reliquary':
        drawReliquary(ctx, e.x, e.y, now, it.used);
        break;
      case 'station': {
        const n = Number(it.data?.n ?? 0);
        const goal = TUTORIAL_STATIONS.find((s) => s.n === n)?.goal ?? '';
        drawStationMarker(ctx, e.x, e.y - 40, this.session.tutorialDone(goal), now);
        drawSign(ctx, e.x, e.y, n);
        break;
      }
      case 'stairs':
        drawStairs(ctx, e.x, e.y, now, it.data?.up === true);
        break;
      default:
        break;
    }
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
        drawText(ctx, `F  ${label}`, t.x, t.y - t.radius - 26, { size: 15, align: 'center', weight: 'bold' });
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
      drawText(ctx, this.signText, 640, 632, { size: 15, align: 'center', maxWidth: 780 });
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
    drawMinimap(ctx, { layout: this.session.layout, ws: this.save.world, currentId: this.session.node.id, revealAll: this.revealMap });
    // zone title card
    if (this.title && now < this.title.until) {
      const k = Math.min(1, (this.title.until - now) / 0.6, (now - (this.title.until - 3.5)) / 0.4);
      const z = ZONES[this.title.zone - 1]!;
      ctx.save();
      ctx.globalAlpha = Math.max(0, k);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 250, 1280, 150);
      ctx.restore();
      drawText(ctx, z.name.toUpperCase(), 640, 320, { size: 52, align: 'center', weight: 'bold', alpha: Math.max(0, k), color: z.palette.accent });
      drawText(ctx, this.title.names.join(' · '), 640, 356, { size: 16, align: 'center', alpha: Math.max(0, k), color: '#efe6d2' });
      drawText(ctx, z.tagline, 640, 384, { size: 14, align: 'center', alpha: Math.max(0, k) * 0.8, color: '#a59c8a' });
    }
    // room transition fade (0.3 s)
    if (this.fade > 0) {
      ctx.fillStyle = `rgba(0,0,0,${Math.min(1, this.fade)})`;
      ctx.fillRect(0, 0, 1280, 720);
      this.fade = Math.max(0, this.fade - realDt / 0.3);
    }
    if (this.session.node.kind === 'tutorial') drawText(ctx, 'TRAINING HALL — the exit is on the right. The big man is optional.', 640, 40, { size: 14, align: 'center', color: '#a59c8a' });
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
