// The world view: draws a World in ART_AUDIO §1 layer order and turns sim events into sound and particles.
// Client side only (canvas + audio).
import { playSfx, type SfxId, SFX } from '../engine/audio/sfx';
import { glow, withAlpha } from '../engine/draw/parts';
import type { Particles } from '../engine/particles';
import type { Settings } from '../engine/settings';
import { drawText } from '../engine/text';
import { overlays } from '../game/debug/menu';
import { HAZARDS } from '../game/systems/hazards';
import { typeColor } from '../game/combat/damage';
import { drawRoomFloor, DEFAULT_PALETTE } from './room';
import { drawAttackIcon, drawTelegraph } from './telegraphs';
import { debugHitboxes, drawEnemyEntity, drawHazardEntity, drawPickup, drawPlayerEntity, drawProjectile } from './entities';
import type { Palette } from '../game/types';
import type { Entity, GameEvent, World } from '../game/world';

export interface InteractDrawer {
  (ctx: CanvasRenderingContext2D, e: Entity, now: number, localPlayerId: string): void;
}

export class WorldView {
  shake = 0;
  shakeX = 0;
  shakeY = 0;
  palette: Palette = DEFAULT_PALETTE;
  propStyle = 'crate';
  localPlayerId = '';
  messages: { text: string; until: number; color: string }[] = [];
  drawInteract: InteractDrawer | null = null;
  /** extra overlay hook (bosses' arena decorations, etc.) */
  underlay: ((ctx: CanvasRenderingContext2D, w: World, now: number) => void) | null = null;
  darkness = 0;
  private lastHitSoundAt = 0;

  constructor(
    private particles: Particles,
    private settings: () => Settings,
  ) {}

  /** Consume the world's events: sounds, particles, numbers, shake, messages. */
  consume(w: World, events: GameEvent[]): void {
    const st = this.settings();
    const p = this.particles;
    const now = performance.now() / 1000;
    for (const ev of events) {
      switch (ev.t) {
        case 'sfx':
          if (ev.id in SFX) {
            if (ev.id.startsWith('hit') && now - this.lastHitSoundAt < 0.02) break;
            if (ev.id.startsWith('hit')) this.lastHitSoundAt = now;
            const o: { vol?: number; rate?: number; pan?: number } = {};
            if (ev.vol !== undefined) o.vol = ev.vol;
            if (ev.rate !== undefined) o.rate = ev.rate;
            if (ev.x !== undefined) o.pan = (ev.x - 640) / 900;
            playSfx(ev.id as SfxId, o);
          }
          break;
        case 'dmg':
          if (!st.video.damageNumbers) break;
          p.spawn(ev.x + (Math.random() - 0.5) * 14, ev.y, (Math.random() - 0.5) * 30, -70, 0.9, ev.crit ? 22 : 15, ev.heal ? '#58d66a' : ev.toPlayer ? '#ff6a5a' : typeColor(ev.type), 'text', {
            drag: 3,
            grav: 60,
            text: `${ev.heal ? '+' : ''}${Math.max(1, Math.round(ev.amount))}${ev.crit ? '!' : ''}`,
          });
          break;
        case 'shake':
          this.shake = Math.min(18, Math.max(this.shake, ev.amount * st.video.shake));
          break;
        case 'msg':
          if (ev.text && (!ev.forPlayer || ev.forPlayer === this.localPlayerId)) {
            this.messages.push({ text: ev.text, until: now + 2.2, color: ev.color ?? '#efe6d2' });
            if (this.messages.length > 4) this.messages.shift();
          }
          break;
        case 'fx':
          this.fx(ev);
          break;
        case 'death':
          p.burst(ev.x, ev.y, ev.isPlayer ? 30 : 18, 160, 0.8, 4, '#8a8a8a', 'smoke');
          p.burst(ev.x, ev.y, 12, 220, 0.6, 3, '#d8d0c0', 'dot');
          break;
        case 'parry':
          p.burst(ev.x, ev.y, 18, 300, 0.4, 3, '#ffffff', 'spark');
          p.spawn(ev.x, ev.y, 0, 0, 0.35, 10, '#ffffff', 'ring', { grow: 120 });
          this.shake = Math.max(this.shake, 4 * st.video.shake);
          break;
        case 'shardGain':
          p.burst(ev.x, ev.y, 6, 120, 0.5, 2, '#9ad0ff', 'glow');
          break;
        default:
          break;
      }
    }
    void w;
  }

  private fx(ev: Extract<GameEvent, { t: 'fx' }>): void {
    const p = this.particles;
    const c = ev.color ?? '#ffffff';
    switch (ev.kind) {
      case 'hit':
        p.burst(ev.x, ev.y, ev.n ?? 7, 260, 0.3, 2.5, c, 'spark', ev.a ?? 0, 0.9);
        break;
      case 'block':
        p.burst(ev.x, ev.y, 10, 220, 0.25, 2, '#ffe9b0', 'spark');
        break;
      case 'parry':
        p.spawn(ev.x, ev.y, 0, 0, 0.3, 6, '#ffffff', 'ring', { grow: 160 });
        break;
      case 'dodge':
        p.burst(ev.x, ev.y, 4, 60, 0.3, 4, '#9ad0ff', 'glow');
        break;
      case 'dust':
        p.burst(ev.x, ev.y, ev.n ?? 8, 80, 0.5, 6, '#8a7a6a', 'smoke');
        break;
      case 'status':
        p.burst(ev.x, ev.y, ev.n ?? 10, 90, 0.7, 3, c, 'glow', -Math.PI / 2, 1.2, { grav: -40 });
        break;
      case 'impact':
        p.spawn(ev.x, ev.y, 0, 0, 0.35, Math.min(200, ev.r ?? 40) * 0.5, c, 'ring', { grow: Math.min(400, (ev.r ?? 40) * 2) });
        p.burst(ev.x, ev.y, 6, 140, 0.4, 3, c, 'dot');
        break;
      case 'line': {
        const a = ev.a ?? 0;
        const l = Math.min(900, ev.r ?? 100);
        for (let i = 0; i < 6; i++) {
          const d = (l * i) / 6;
          p.burst(ev.x + Math.cos(a) * d, ev.y + Math.sin(a) * d, 2, 80, 0.35, 3, c, 'dot');
        }
        break;
      }
      case 'cone':
        p.burst(ev.x + Math.cos(ev.a ?? 0) * (ev.r ?? 60) * 0.6, ev.y + Math.sin(ev.a ?? 0) * (ev.r ?? 60) * 0.6, 8, 160, 0.35, 3, c, 'dot', ev.a ?? 0, ev.x2 ?? 0.6);
        break;
      case 'teleport':
        p.burst(ev.x, ev.y, 14, 140, 0.5, 4, '#b06bff', 'glow');
        break;
      case 'flask':
        p.burst(ev.x, ev.y, 12, 80, 0.8, 3, '#e6b84a', 'glow', -Math.PI / 2, 0.8, { grav: -60 });
        break;
      case 'heal':
        p.burst(ev.x, ev.y, 10, 60, 0.8, 3, '#58d66a', 'glow', -Math.PI / 2, 0.8, { grav: -50 });
        break;
      case 'revive':
        p.burst(ev.x, ev.y, 6, 80, 0.5, 3, '#58d66a', 'glow');
        break;
      case 'projHit':
        p.burst(ev.x, ev.y, 6, 120, 0.25, 2, c, 'spark');
        break;
      case 'immune':
        p.spawn(ev.x, ev.y, 0, -30, 0.6, 12, '#a59c8a', 'text', { text: 'immune', grav: 0 });
        break;
      case 'barrier':
        p.spawn(ev.x, ev.y, 0, 0, 0.3, 10, '#5fe0ff', 'ring', { grow: 60 });
        break;
      case 'levelup':
        p.spawn(ev.x, ev.y, 0, 0, 0.8, 10, '#e6b84a', 'ring', { grow: 160 });
        p.burst(ev.x, ev.y, 20, 140, 0.9, 3, '#ffd27a', 'glow', -Math.PI / 2, 1.2, { grav: -40 });
        break;
      case 'explosion':
        p.burst(ev.x, ev.y, 24, 300, 0.6, 5, c, 'glow');
        p.burst(ev.x, ev.y, 12, 120, 0.9, 10, '#3a3030', 'smoke');
        break;
      default:
        p.burst(ev.x, ev.y, ev.n ?? 6, 120, 0.4, 3, c, 'dot');
    }
  }

  render(ctx: CanvasRenderingContext2D, w: World, alpha: number, realDt: number): void {
    const st = this.settings();
    const now = w.time;
    const rt = performance.now() / 1000;
    // screen shake (decays in real time)
    this.shake = Math.max(0, this.shake - realDt * 40);
    this.shakeX = (Math.random() - 0.5) * this.shake;
    this.shakeY = (Math.random() - 0.5) * this.shake;
    ctx.fillStyle = '#0b0a0f';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);
    drawRoomFloor(ctx, w.room, this.palette, this.propStyle, 0);
    if (w.room.rotFloor) {
      const rf = w.room.rotFloor;
      ctx.save();
      ctx.strokeStyle = withAlpha('#b08d3c', 0.5);
      ctx.lineWidth = rf.rOut - rf.rIn;
      ctx.setLineDash([18, 14]);
      ctx.lineDashOffset = -now * rf.speed * 2;
      ctx.beginPath();
      ctx.arc(rf.x, rf.y, (rf.rIn + rf.rOut) / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    this.underlay?.(ctx, w, now);
    // hazards
    for (const e of w.entities.values()) if (e.type === 'hazard' && !e.removed) drawHazardEntity(ctx, e, now, HAZARDS[e.hz!.hazard].color);
    // telegraphs
    for (const e of w.entities.values()) if (e.type === 'telegraph' && !e.removed) drawTelegraph(ctx, w, e, st.video.highContrastTelegraphs, now);
    // walls (Guardian Wall)
    for (const e of w.entities.values()) {
      if (e.type !== 'wall' || e.removed || !e.wl) continue;
      ctx.save();
      ctx.strokeStyle = '#fff3b0';
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = e.wl.w;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(e.wl.x1, e.wl.y1);
      ctx.lineTo(e.wl.x2, e.wl.y2);
      ctx.stroke();
      ctx.restore();
    }
    // sorted entities
    const list: Entity[] = [];
    for (const e of w.entities.values()) {
      if (e.removed) continue;
      if (e.type === 'player' || e.type === 'enemy' || e.type === 'pickup' || e.type === 'interact' || e.type === 'decoy') list.push(e);
    }
    list.sort((a, b) => a.y - b.y);
    const iconScale = st.video.telegraphIconSize * (st.video.highContrastTelegraphs ? 1.5 : 1);
    for (const e of list) {
      const x = e.px + (e.x - e.px) * alpha;
      const y = e.py + (e.y - e.py) * alpha;
      if (e.type === 'player') drawPlayerEntity(ctx, w, e, x, y, now, e.pl!.playerId === this.localPlayerId);
      else if (e.type === 'enemy') drawEnemyEntity(ctx, e, x, y, now, this.palette.colors, iconScale);
      else if (e.type === 'pickup') {
        const mine = !e.pk!.forPlayer || e.pk!.forPlayer === this.localPlayerId;
        if (mine) drawPickup(ctx, e, now);
      } else if (e.type === 'interact') this.drawInteract?.(ctx, e, now, this.localPlayerId);
      else if (e.type === 'decoy' && e.dc) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        glow(ctx, x, y, 30, '#9ad0ff', 0.6);
        ctx.restore();
        drawAttackIcon(ctx, x, y - 26, 'pierce', 0.6, now);
      }
    }
    for (const e of w.entities.values()) {
      if (e.type !== 'projectile' || e.removed) continue;
      const x = e.px + (e.x - e.px) * alpha;
      const y = e.py + (e.y - e.py) * alpha;
      drawProjectile(ctx, e, x, y, rt);
    }
    this.particles.draw(ctx);
    if (overlays.hitbox) debugHitboxes(ctx, w);
    if (overlays.ai) {
      for (const e of w.enemies) {
        if (!e.en) continue;
        drawText(ctx, `${e.en.state}${e.en.attack ? `:${e.en.attack.def.id}:${e.en.attack.phase}` : ''}`, e.x, e.y + e.radius + 14, { size: 10, align: 'center', color: '#5fd3c0' });
      }
    }
    if (overlays.telegraph) {
      for (const e of w.entities.values()) {
        if (e.type !== 'telegraph' || !e.tg) continue;
        drawText(ctx, `${e.tg.kind} ${Math.max(0, e.tg.impact - now).toFixed(2)}s`, e.x, e.y - 20, { size: 10, align: 'center', color: '#fff' });
      }
    }
    ctx.restore();
    // darkness (Fungal phase 2, Blind)
    if (this.darkness > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this.darkness})`;
      ctx.fillRect(0, 0, 1280, 720);
    }
    // messages
    let my = 140;
    this.messages = this.messages.filter((m) => m.until > rt);
    for (const m of this.messages) {
      drawText(ctx, m.text, 640, my, { size: 18, align: 'center', color: m.color, alpha: Math.min(1, (m.until - rt) * 2) });
      my += 24;
    }
  }

  /** Blind: the view closes to 35% around the local player (GAME_DESIGN §5.5). */
  drawBlind(ctx: CanvasRenderingContext2D, x: number, y: number, k: number): void {
    if (k <= 0) return;
    ctx.save();
    const g = ctx.createRadialGradient(x, y, 60, x, y, 260);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${0.92 * k})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1280, 720);
    ctx.restore();
  }
}
