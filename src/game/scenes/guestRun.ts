// A co-op guest's game screen: draws the mirror of the host's world with the normal view and HUD, sends
// input every frame, opens its own bonfire/inventory menus (its character is its own, D31/NETCODE §6) and
// syncs changes back to the host. No pause in co-op: menus are overlays (GAME_DESIGN §12).
import { app } from '../../app';
import { mixer } from '../../engine/audio/mixer';
import { music } from '../../engine/audio/music';
import { drawText } from '../../engine/text';
import { stream } from '../../engine/rng';
import { ZONES, zoneDef } from '../../data/zones';
import { btn, h, layer, toast } from '../../ui/dom';
import { drawMap, drawMinimap } from '../../ui/minimap';
import { drawPartyCards } from '../../ui/party';
import { openInventory } from '../../ui/menus/inventory';
import { openBonfire } from '../../ui/menus/bonfire';
import { renderSpellTab } from '../../ui/menus/spells';
import { openSettings } from '../../ui/menus/settings';
import { drawInteractable, nearestInteractable } from '../../render/interactables';
import { buyConsumable, buyGem, levelUp, rerollGem, respec, sellConsumable, sellGem, sellItem, socketGem, unsocketGem, upgradeGem } from '../items/inventory';
import { shopGem, shopGemPrice } from '../bonfire/shop';
import { refreshDerived } from '../player/player';
import { writeSave } from '../save/storage';
import { getStore } from '../../engine/settings';
import { WorldScene } from './worldScene';
import type { NetGuest } from '../net/guest';
import type { NetEvent } from '../net/protocol';
import type { SaveFile, WorldState } from '../types';

export const guestHooks: { toTitle?: () => void; toLobby?: (save: SaveFile, net: NetGuest) => void; credits?: () => void } = {};

export class GuestRunScene extends WorldScene {
  readonly name = 'guestRun';
  private overlay: HTMLElement | null = null;
  private overlayKind = '';
  private banner: { text: string; until: number } | null = null;
  private pingAt = 0;
  private saveAt = 0;
  /** host bonfires this guest has rested at this session (drawn as embers) */
  private rested = new Set<string>();

  constructor(
    public save: SaveFile,
    public net: NetGuest,
  ) {
    super();
    this.simulate = false;
    this.w = net.cw;
  }

  override enter(): void {
    const n = this.net;
    n.onEvent = (e) => this.onNetEvent(e);
    n.onCharChanged = () => {
      this.saveAt = Math.min(this.saveAt || Infinity, performance.now() / 1000 + 1);
    };
    n.onHostLeft = () => {
      this.persist();
      toast('The host left. Everything you earned is saved.', 4000);
      this.closeOverlay();
      guestHooks.toTitle?.();
    };
    this.view.drawInteract = (ctx, e, now) => drawInteractable(ctx, e, now, { bonfireUsed: (k) => this.rested.has(k), stationDone: () => false });
    super.enter();
  }

  override exit(): void {
    super.exit();
    this.persist();
    this.closeOverlay();
    music.stop();
  }

  persist(): void {
    this.saveAt = 0;
    try {
      writeSave(getStore(), this.save);
    } catch {
      // storage full: keep playing
    }
  }

  protected override beforeStep(dt: number): void {
    const a = app();
    const n = this.net;
    if (!this.overlay) {
      if (a.input.consumeLocal('pause')) this.showPause();
      else if (a.input.consumeLocal('map')) this.showMap();
      else if (a.input.consumeLocal('inventory')) this.showInventory();
    } else if (this.overlayKind !== 'bonfire' && (a.input.consumeLocal('pause') || a.input.consumeLocal('map') || a.input.consumeLocal('inventory'))) this.closeOverlay();
    else if (this.overlayKind === 'bonfire' && a.input.consumeLocal('pause')) this.closeOverlay();
    n.frame(this.local?.pl?.input ?? { moveX: 0, moveY: 0, aimX: 640, aimY: 360, aimNeutral: false, aimAssist: 0, buttons: 0, pressed: 0 }, dt);
    this.w = n.cw;
    this.local = n.me;
    this.view.palette = zoneDef(n.cw.zone).palette;
    this.view.propStyle = zoneDef(n.cw.zone).props;
    const now = performance.now() / 1000;
    if (now > this.pingAt) {
      this.pingAt = now + 1;
      n.ping();
    }
    if (this.saveAt && now > this.saveAt) this.persist();
    if (n.state === 'lobby') {
      // the host went back to the lobby
      this.persist();
      this.closeOverlay();
      guestHooks.toLobby?.(this.save, n);
    }
    const z = zoneDef(n.cw.zone).music;
    if (n.cw.bossId) music.play('boss', this.bossMusic, 1);
    else music.play('ambient', { root: z.root, tempo: z.tempo, bright: z.bright, scale: z.scale, wave: z.wave });
  }

  private bossMusic = { root: 45, tempo: 112, bright: 0.35, scale: [0, 3, 5, 7, 10], wave: 'sawtooth' as OscillatorType };

  private onNetEvent(e: NetEvent): void {
    if (e.t === 'bonfire') {
      this.rested.add(e.id);
      this.showBonfire(e.first);
    } else if (e.t === 'wipe') this.banner = { text: 'THE PARTY WAS EVICTED', until: performance.now() / 1000 + 3 };
    else if (e.t === 'chat') toast(`${e.from}: ${e.text}`, 4000);
    else if (e.t === 'credits') {
      this.persist();
      this.closeOverlay();
      guestHooks.credits?.();
    }
  }

  // ------------------------------------------------------------------ overlays

  closeOverlay(): void {
    this.overlay?.remove();
    this.overlay = null;
    this.overlayKind = '';
    this.menuOpen = false;
  }

  private changed(): void {
    if (this.local) refreshDerived(this.local);
    this.net.syncChar();
    this.persist();
  }

  private showBonfire(first: boolean): void {
    this.closeOverlay();
    const c = this.save.character;
    const seed = this.net.welcome?.seed ?? 'x';
    const zone = this.net.cw.zone;
    const r = (o: { msg: string }): string => {
      this.changed();
      return o.msg;
    };
    const rng = stream(seed, `guest-reroll:${c.stardust}:${c.gems.length}:${this.net.cw.tick}`);
    const open = (): void => {
      this.overlay?.remove();
      this.overlay = openBonfire({
        char: c,
        bonfireId: 'coop',
        firstRest: first,
        shopGem: shopGem(seed, zone, c.cycle),
        shopPiece: null,
        discovered: [],
        ops: {
          levelUp: (st) => r(levelUp(c, st)),
          respec: () => r(respec(c)),
          socket: (it, si, gi) => r(socketGem(c, it, si, gi)),
          unsocket: (it, si) => r(unsocketGem(c, it, si)),
          upgradeGem: (gi) => r(upgradeGem(c, gi)),
          rerollGem: (gi) => r(rerollGem(c, gi, rng)),
          sellItem: (it) => r(sellItem(c, it)),
          sellGem: (gi) => r(sellGem(c, gi)),
          sellConsumable: (cid) => r(sellConsumable(c, cid)),
          buyConsumable: (cid) => r(buyConsumable(c, cid)),
          buyGem: () => r(buyGem(c, shopGem(seed, zone, c.cycle), shopGemPrice())),
          buyPiece: () => 'Only the host can buy from this fire.',
          warp: () => 'Only the host can travel between fires.',
        },
        extraTabs: [{ label: 'Spells', render: (el, rr) => renderSpellTab(el, c, () => this.changed(), rr) }],
        openInventory: () => this.showInventory(() => open()),
        close: () => this.closeOverlay(),
      });
      this.overlayKind = 'bonfire';
      this.menuOpen = true;
    };
    open();
  }

  private showInventory(onClose?: () => void): void {
    const p = this.local;
    if (!p) return;
    this.overlay?.remove();
    const c = this.save.character;
    this.overlay = openInventory({
      char: c,
      derived: () => p.pl!.derived,
      changed: () => this.changed(),
      toggleTwoHand: () => {
        c.twoHanded = !c.twoHanded;
        this.changed();
      },
      extraTabs: [{ label: 'Spells', render: (el) => renderSpellTab(el, c, () => this.changed(), () => (this.overlay as HTMLElement & { rerender?: () => void })?.rerender?.()) }],
      close: () => {
        this.closeOverlay();
        onClose?.();
      },
    });
    this.overlayKind = 'inventory';
    this.menuOpen = true;
  }

  private showPause(): void {
    this.closeOverlay();
    const l = layer('dim');
    l.setAttribute('data-testid', 'pause-menu');
    const c = this.save.character;
    l.appendChild(
      h(
        'div',
        { class: 'panel col', style: 'width:380px' },
        h('h2', null, 'Co-op'),
        h('div', { class: 'small dim-text' }, `${c.name} · level ${c.level} · in ${this.net.lobby?.players.find((p) => p.host)?.name ?? 'the host'}'s world · ${Math.round(this.net.rtt * 1000)} ms`),
        h('div', { class: 'small dim-text' }, 'The game keeps running while this menu is open.'),
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
        btn(
          'Leave the game',
          () => {
            this.persist();
            this.closeOverlay();
            this.net.leave();
            guestHooks.toTitle?.();
          },
          'big',
        ),
      ),
    );
    this.overlay = l;
    this.overlayKind = 'pause';
    this.menuOpen = true;
  }

  private mapWs(): WorldState {
    return { ...this.save.world, zone: this.net.cw.zone, roomsVisited: this.net.visited, roomsCleared: this.net.cleared, bonfiresUsed: [], leftBehind: {}, shardpile: undefined } as unknown as WorldState;
  }

  private showMap(): void {
    const lay = this.net.layout;
    if (!lay) return;
    this.closeOverlay();
    const l = layer('dim');
    const cv = h('canvas', { width: 700, height: 520 });
    const ctx = cv.getContext('2d')!;
    ctx.fillStyle = '#14121a';
    ctx.fillRect(0, 0, 700, 520);
    drawMap(ctx, { layout: lay, ws: this.mapWs(), currentId: this.net.nodeId, revealAll: false }, 40, 40, 64, 42, 10, true);
    l.appendChild(h('div', { class: 'panel col', style: 'align-items:center' }, h('h2', null, ZONES[lay.zone - 1]?.name ?? ''), cv, btn('Close (M)', () => this.closeOverlay())));
    this.overlay = l;
    this.overlayKind = 'map';
    this.menuOpen = true;
  }

  // ------------------------------------------------------------------ drawing

  protected override renderOverlay(ctx: CanvasRenderingContext2D): void {
    const p = this.local;
    if (!p || this.overlay) return;
    const t = nearestInteractable(this.w.entities.values(), p);
    if (t?.it?.label && t.it.kind !== 'station') drawText(ctx, `F  ${t.it.label}`, t.x, t.y - t.radius - 26, { size: 15, align: 'center', weight: 'bold' });
  }

  protected override renderTop(ctx: CanvasRenderingContext2D): void {
    const lay = this.net.layout;
    if (lay && this.net.nodeId && lay.byId[this.net.nodeId]) drawMinimap(ctx, { layout: lay, ws: this.mapWs(), currentId: this.net.nodeId, revealAll: false });
    drawPartyCards(ctx, this.w, this.save.character.playerId);
    if (!this.local || this.net.state !== 'game') drawText(ctx, 'Joining the host’s world…', 640, 360, { size: 22, align: 'center', color: '#efe6d2' });
    if (this.local?.pl?.deadUntilRest) drawText(ctx, 'You are out until the party rests at a bonfire.', 640, 300, { size: 20, align: 'center', color: '#ff6a5a' });
    else if (this.local?.pl?.downed) drawText(ctx, 'DOWN — crawl to your friends; their hits revive you', 640, 300, { size: 20, align: 'center', color: '#ffcf6a' });
    const now = performance.now() / 1000;
    if (this.banner && now < this.banner.until) {
      mixer.setDuck(0.5);
      drawText(ctx, this.banner.text, 640, 340, { size: 48, align: 'center', weight: 'bold', color: '#ff6a5a' });
    }
  }
}
