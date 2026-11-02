// M1 engine sandbox: Joe walks with WASD / left stick and aims at the cursor / right stick.
import { app } from '../../app';
import { playSfx } from '../../engine/audio/sfx';
import { DEFAULT_LOOK, drawJoe } from '../../engine/draw/players';
import { held } from '../../engine/input/actions';
import { clamp } from '../../engine/math';
import type { Scene } from '../../engine/scene';
import { drawText } from '../../engine/text';
import { registerDebugApi, type DebugApi } from '../debug/menu';

export class SandboxScene implements Scene {
  readonly name = 'sandbox';
  x = 640;
  y = 400;
  px = 640;
  py = 400;
  facing = 0;
  t = 0;
  moving = 0;

  enter(): void {
    const stub = (s: string) => () => `${s}: available once the game world exists.`;
    const api: DebugApi = {
      god: () => undefined,
      isGod: () => false,
      listBases: () => [],
      giveItem: stub('give item'),
      giveGem: stub('give gem'),
      giveConsumable: stub('give consumable'),
      learnAllSpells: stub('spells'),
      setLevel: stub('level'),
      setStat: stub('stat'),
      listEnemies: () => [],
      spawnEnemy: stub('spawn'),
      killAll: stub('kill all'),
      listZones: () => ['1 Mossy Crypt'],
      jumpZone: stub('jump'),
      listRooms: () => [],
      jumpRoom: stub('jump'),
      jumpBoss: stub('boss'),
      setCycle: stub('cycle'),
      setFlask: stub('flask'),
      addShards: stub('shards'),
      addStardust: stub('stardust'),
      addTear: stub('tear'),
      testArena: stub('arena'),
      revealMap: stub('map'),
      stats: () => ({
        fps: app().loop.fps,
        simMs: app().loop.simMs,
        renderMs: app().loop.renderMs,
        entities: 1,
        enemies: 0,
        particles: app().particles.count,
        projectiles: 0,
        telegraphs: 0,
      }),
    };
    registerDebugApi(api);
  }

  exit(): void {
    registerDebugApi(null);
  }

  update(dt: number): void {
    const a = app();
    const f = a.input.sample(this.x, this.y);
    this.px = this.x;
    this.py = this.y;
    this.t += dt;
    this.x = clamp(this.x + f.moveX * 260 * dt, 40, 1240);
    this.y = clamp(this.y + f.moveY * 260 * dt, 56, 690);
    this.moving = Math.min(1, Math.hypot(f.moveX, f.moveY));
    this.facing = Math.atan2(f.aimY - this.y, f.aimX - this.x);
    if (held(f, 'attack') && (f.pressed & 1) !== 0) {
      playSfx('swingMedium');
      a.particles.burst(this.x + Math.cos(this.facing) * 40, this.y + Math.sin(this.facing) * 40, 8, 200, 0.4, 3, '#ffd27a', 'spark', this.facing, 0.6);
    }
  }

  render(ctx: CanvasRenderingContext2D, alpha: number): void {
    ctx.fillStyle = '#1b1f18';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.strokeStyle = '#2a3226';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 1280; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 16);
      ctx.lineTo(x, 720);
      ctx.stroke();
    }
    for (let y = 16; y <= 720; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1280, y);
      ctx.stroke();
    }
    const x = this.px + (this.x - this.px) * alpha;
    const y = this.py + (this.y - this.py) * alpha;
    drawJoe(ctx, DEFAULT_LOOK, { x, y, facing: this.facing, t: this.t, moving: this.moving });
    const inp = app().input;
    ctx.strokeStyle = '#e6b84a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(inp.mouseX, inp.mouseY, 8, 0, Math.PI * 2);
    ctx.stroke();
    app().particles.draw(ctx);
    drawText(ctx, 'Engine sandbox — WASD / left stick to move, mouse / right stick to aim, click to swing', 640, 50, { align: 'center', size: 16 });
    drawText(ctx, `device: ${inp.lastDevice}`, 16, 700, { size: 14, color: '#a59c8a' });
  }
}
