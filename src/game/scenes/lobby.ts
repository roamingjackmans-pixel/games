// The co-op lobby (GAME_DESIGN §12, NETCODE §2). Host: a room code, the party's cards, Start. Guest: type the
// code, wait while the relays find the host ("finding your friend…" with a retry), see the party, wait for
// Start. Joining only happens here (D31); the host can come back here from the pause menu to invite more.
import { app } from '../../app';
import { music } from '../../engine/audio/music';
import { playSfx } from '../../engine/audio/sfx';
import type { Scene } from '../../engine/scene';
import { drawText } from '../../engine/text';
import { glow } from '../../engine/draw/parts';
import { CLASSES } from '../../data/classes';
import { ZONES } from '../../data/zones';
import { drawCharacterPreview } from '../../render/entities';
import { btn, clearEl, h, layer, toast } from '../../ui/dom';
import { gearOf, previewCharacter } from '../net/lobbyGear';
import { NetHost } from '../net/host';
import { NetGuest } from '../net/guest';
import { newRoomCode, parseRoomCode, type PublicPlayer } from '../net/protocol';
import { BroadcastTransport } from '../net/broadcast';
import { joinTrystero } from '../net/trystero';
import type { Transport } from '../net/transport';
import type { SaveFile } from '../types';
import { friendlyFireRow } from '../../ui/menus/settings';

/** Scene factories set by main.ts (keeps the lobby free of run-scene imports). */
export const lobbyHooks: {
  startHost?: (save: SaveFile, net: NetHost) => void;
  startGuest?: (save: SaveFile, net: NetGuest) => void;
  toTitle?: () => void;
} = {};

/** Which transport to use: BroadcastChannel for the in-browser test page and Playwright, else Trystero. */
export function netMode(): 'bc' | 'trystero' {
  return new URLSearchParams(location.search).get('net') === 'bc' ? 'bc' : 'trystero';
}

async function openTransport(code: string, role: 'host' | 'guest', status: (s: string) => void): Promise<Transport> {
  if (netMode() === 'bc') {
    status('connected (same-browser test transport)');
    return new BroadcastTransport(code);
  }
  return joinTrystero(code, role, status);
}

export interface LobbyOpts {
  role: 'host' | 'guest';
  /** coming back from a running session */
  host?: NetHost;
  guest?: NetGuest;
  /** a code to use (tests, ?code=) */
  code?: string;
  /** start / join without clicks (?auto=) */
  auto?: boolean;
}

export class LobbyScene implements Scene {
  readonly name = 'lobby';
  private root: HTMLElement | null = null;
  private t = 0;
  host: NetHost | null = null;
  guest: NetGuest | null = null;
  private status = '';
  private leaving = false;

  constructor(
    public save: SaveFile,
    public o: LobbyOpts,
  ) {
    this.host = o.host ?? null;
    this.guest = o.guest ?? null;
  }

  enter(): void {
    this.root = layer('clear');
    this.root.setAttribute('data-testid', 'lobby');
    this.root.style.alignItems = 'center';
    this.root.style.justifyContent = 'flex-end';
    this.root.style.paddingRight = '90px';
    music.play('title', { root: 45, tempo: 50, bright: 0.3, scale: [0, 3, 5, 7, 10], wave: 'triangle' });
    if (this.o.role === 'host') {
      if (this.host) this.wireHost(this.host);
      else void this.openHost();
    } else if (this.guest) {
      this.wireGuest(this.guest);
    } else if (this.o.code) void this.join(this.o.code);
    this.draw();
  }

  exit(): void {
    this.root?.remove();
    this.root = null;
  }

  update(dt: number): void {
    this.t += dt;
    if (app().input.consumeLocal('pause')) this.cancel();
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0d0b12';
    ctx.fillRect(0, 0, 1280, 720);
    glow(ctx, 380, 360, 260, '#e6b84a', 0.08);
    const players = this.players();
    drawText(ctx, this.o.role === 'host' ? 'HOSTING' : 'JOINING', 380, 92, { size: 48, weight: 'bold', align: 'center', color: '#efe6d2', outline: '#000', outlineWidth: 6 });
    const n = Math.max(1, players.length);
    players.forEach((p, i) => {
      const x = 380 + (i - (n - 1) / 2) * 150;
      // as they are now: their look, armor and what they hold (D170), not their class's starting kit
      drawCharacterPreview(ctx, previewCharacter(p), { x, y: 380 + Math.sin(this.t * 2 + i) * 3, facing: Math.PI / 2 - 0.25, t: this.t + i, scale: 2 });
      drawText(ctx, p.name, x, 496, { size: 16, weight: 'bold', align: 'center', color: p.host ? '#e6b84a' : '#efe6d2' });
      drawText(ctx, `${CLASSES[p.classId].name} · Lv ${p.level}${p.host ? ' · host' : ''}`, x, 516, { size: 12, align: 'center', color: '#a59c8a' });
    });
    if (this.status) drawText(ctx, this.status, 380, 600, { size: 14, align: 'center', color: '#a59c8a' });
  }

  private players(): PublicPlayer[] {
    if (this.host) return this.host.lobbyState().players;
    if (this.guest?.lobby) return this.guest.lobby.players;
    const c = this.save.character;
    return [{ peerId: '', playerId: c.playerId, name: c.name, classId: c.classId, level: c.level, host: this.o.role === 'host', cycle: c.cycle, appearance: c.appearance, gear: gearOf(c) }];
  }

  // ------------------------------------------------------------------ host

  private async openHost(): Promise<void> {
    const code = this.o.code ? (parseRoomCode(this.o.code) ?? newRoomCode()) : newRoomCode();
    this.status = 'opening the room…';
    this.draw();
    try {
      const t = await openTransport(code, 'host', (s) => {
        this.status = s;
        this.draw();
      });
      if (this.leaving) {
        t.leave();
        return;
      }
      this.host = new NetHost(t, code, this.save);
      this.wireHost(this.host);
    } catch (err) {
      this.status = `Could not open a room (${String(err)}). Check your connection and try again.`;
    }
    this.draw();
  }

  private wireHost(n: NetHost): void {
    // the host's friendly fire is the party's (D115)
    n.friendlyFire = () => app().settings.game.friendlyFire;
    n.onLobbyChange = () => {
      this.draw();
      // tests: '&players=N' in the address waits for a party of N before starting (D156; 2 by default)
      const want = Math.max(2, Math.min(4, Number(new URLSearchParams(location.search).get('players')) || 2));
      if (this.o.auto && n.guests.size >= want - 1) setTimeout(() => this.start(), 800);
    };
    n.onGuestLeft = (name) => toast(`${name} left.`);
    n.sendLobby();
  }

  private start(): void {
    if (!this.host || this.leaving) return;
    this.leaving = true;
    playSfx('uiConfirm');
    lobbyHooks.startHost?.(this.save, this.host);
  }

  // ------------------------------------------------------------------ guest

  private async join(raw: string): Promise<void> {
    const code = parseRoomCode(raw);
    if (!code) {
      toast('A room code is 6 digits.');
      return;
    }
    this.status = 'finding your friend…';
    this.draw();
    try {
      const t = await openTransport(code, 'guest', (s) => {
        this.status = s;
        this.draw();
      });
      if (this.leaving) {
        t.leave();
        return;
      }
      this.guest = new NetGuest(t, this.save);
      this.wireGuest(this.guest);
    } catch (err) {
      this.status = `Could not connect (${String(err)}).`;
    }
    this.draw();
  }

  private wireGuest(g: NetGuest): void {
    g.onLobby = () => {
      this.status = 'In the lobby. Waiting for the host to press Start.';
      this.draw();
    };
    g.onReject = (reason) => {
      this.status = reason;
      toast(reason);
      playSfx('uiError');
      this.draw();
    };
    g.onWelcome = () => {
      if (this.leaving) return;
      this.leaving = true;
      lobbyHooks.startGuest?.(this.save, g);
    };
    g.onHostLeft = () => {
      toast('The host left.');
      this.cancel();
    };
    if (g.state === 'lobby') g.onLobby();
  }

  // ------------------------------------------------------------------ UI

  private cancel(): void {
    this.leaving = true;
    if (this.host) this.host.close();
    if (this.guest) this.guest.leave();
    this.host = null;
    this.guest = null;
    lobbyHooks.toTitle?.();
  }

  private draw(): void {
    if (!this.root) return;
    clearEl(this.root);
    const kids: (HTMLElement | null)[] = [];
    const c = this.save.character;
    if (this.o.role === 'host') {
      const code = this.host?.code ?? '······';
      kids.push(
        h('h2', null, 'Host a game'),
        h('div', { class: 'small dim-text' }, 'Give your friends this code. Up to 3 can join.'),
        h('div', { class: 'room-code', 'data-testid': 'room-code', style: 'font-size:44px;letter-spacing:10px;font-weight:bold;text-align:center;padding:10px 0;color:#e6b84a' }, code),
        h('div', { class: 'small dim-text' }, `Your world: ${ZONES[this.save.world.zone - 1]?.name ?? ''}. Everyone starts at your bonfire.`),
        friendlyFireRow({ changed: () => this.host?.sendLobby(false) }),
        btn('Start', () => this.start(), 'primary big'),
      );
    } else {
      const input = h('input', { type: 'text', inputmode: 'numeric', maxlength: '8', placeholder: '6-digit code', 'data-testid': 'code-input', style: 'font-size:28px;letter-spacing:8px;text-align:center' }) as HTMLInputElement;
      if (this.o.code) input.value = this.o.code;
      const go = (): void => void this.join(input.value);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') go();
      });
      kids.push(h('h2', null, 'Join a game'), h('div', { class: 'small dim-text' }, `Joining as ${c.name}, level ${c.level}. You keep everything you earn.`));
      if (!this.guest || this.guest.state === 'rejected' || this.guest.state === 'closed') kids.push(input, btn(this.guest ? 'Retry' : 'Join', go, 'primary big'));
      else if (this.guest.state === 'lobby') kids.push(friendlyFireRow({ hostValue: this.guest.hostFriendlyFire }));
      else if (this.guest.state === 'connecting') kids.push(h('div', { class: 'dim-text' }, 'Looking for the host… public relays can take a few seconds.'), btn('Retry', () => this.retry(), 'big'));
    }
    kids.push(btn('Back', () => this.cancel(), 'big'));
    this.root.appendChild(h('div', { class: 'panel col', 'data-view': 'lobby', style: 'min-width:380px;max-width:520px' }, ...kids.filter((k): k is HTMLElement => !!k)));
  }

  private retry(): void {
    this.guest?.leave();
    this.guest = null;
    this.draw();
  }
}
