// Boss bar (GAME_DESIGN §7, §16): bottom-center, name above, a tick at each phase threshold, a pale
// trailing bar for recent damage, and the phase name during a transition.
import { drawText } from '../engine/text';
import { withAlpha } from '../engine/draw/parts';
import type { BossDef } from '../game/types';
import type { World } from '../game/world';

export interface BossBarState {
  ghost: number;
  id: number;
}

export function newBossBarState(): BossBarState {
  return { ghost: 1, id: 0 };
}

export function drawBossBar(ctx: CanvasRenderingContext2D, w: World, st: BossBarState, realDt: number): void {
  const e = w.bossId ? w.get(w.bossId) : null;
  if (!e || !e.hp || e.hp.dead || !e.en?.isBoss) {
    st.id = 0;
    return;
  }
  const def = e.en.def as unknown as BossDef;
  if (st.id !== e.id) {
    st.id = e.id;
    st.ghost = 1;
  }
  const frac = Math.max(0, e.hp.hp / e.hp.max);
  st.ghost = Math.max(frac, st.ghost - realDt * 0.25);
  const W = 460;
  const H = 14;
  const x = 640 - W / 2;
  const y = 676;
  // fade in during the intro
  const k = e.en.state === 'spawning' ? Math.max(0, 1 - (e.en.spawnUntil - w.time) / 1.5) : 1;
  ctx.save();
  ctx.globalAlpha = k;
  drawText(ctx, def.name, x, y - 8, { size: 16, weight: 'bold', color: '#efe6d2' });
  if (e.en.phase > 0) drawText(ctx, e.en.phase === 1 ? 'II' : 'III', x + W, y - 8, { size: 14, align: 'right', weight: 'bold', color: def.palette?.[1] ?? '#ffcf6a' });
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(x - 3, y - 3, W + 6, H + 6);
  ctx.fillStyle = '#2a1418';
  ctx.fillRect(x, y, W, H);
  if (st.ghost > frac) {
    ctx.fillStyle = withAlpha('#ffe0a0', 0.55);
    ctx.fillRect(x, y, W * st.ghost, H);
  }
  ctx.fillStyle = e.en.phaseTransitionUntil > w.time ? '#e8e0d0' : '#b8242c';
  ctx.fillRect(x, y, W * frac, H);
  ctx.fillStyle = withAlpha('#ffffff', 0.15);
  ctx.fillRect(x, y, W * frac, H * 0.35);
  // phase ticks
  for (let i = 0; i < def.phases.length - 1; i++) {
    const t = def.phases[i]!.untilHpPct / 100;
    ctx.fillStyle = i < e.en.phase ? withAlpha('#efe6d2', 0.35) : '#efe6d2';
    ctx.fillRect(x + W * t - 1.5, y - 5, 3, H + 10);
  }
  ctx.restore();
  // the phase name while the boss transforms
  const ph = def.phases[e.en.phase];
  if (e.en.phaseTransitionUntil > w.time && ph?.name) {
    const left = e.en.phaseTransitionUntil - w.time;
    drawText(ctx, ph.name, 640, y - 34, { size: 20, align: 'center', weight: 'bold', color: def.palette?.[1] ?? '#ffcf6a', alpha: Math.min(1, left * 1.5) });
  }
}
