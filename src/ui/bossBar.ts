// Boss bar (GAME_DESIGN §7, §16): bottom-center, name above (no phase ticks since D226), a pale
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
  // above the skill circles at the bottom middle (hud.ts)
  const y = 600;
  // fade in during the intro, then the bar fills up as the boss gets going (souls style)
  const spawning = e.en.state === 'spawning';
  const k = spawning ? Math.max(0, 1 - (e.en.spawnUntil - w.time) / 1.5) : 1;
  const fill = spawning ? 1 - Math.pow(1 - Math.max(0, Math.min(1, 1 - (e.en.spawnUntil - w.time) / 1.1)), 3) : 1;
  ctx.save();
  ctx.globalAlpha = k;
  // a phase may carry its own name on the bar (D279: The Landlord, Unbound)
  drawText(ctx, def.phases[e.en.phase]?.barName ?? def.name, x, y - 8, { size: 16, weight: 'bold', color: '#efe6d2' });
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.fillRect(x - 3, y - 3, W + 6, H + 6);
  ctx.fillStyle = '#2a1418';
  ctx.fillRect(x, y, W, H);
  if (st.ghost > frac && !spawning) {
    ctx.fillStyle = withAlpha('#ffe0a0', 0.55);
    ctx.fillRect(x, y, W * st.ghost, H);
  }
  ctx.fillStyle = e.en.phaseTransitionUntil > w.time ? '#e8e0d0' : '#b8242c';
  ctx.fillRect(x, y, W * frac * fill, H);
  ctx.fillStyle = withAlpha('#ffffff', 0.15);
  ctx.fillRect(x, y, W * frac * fill, H * 0.35);
  // no phase ticks and no II / III (D226): where a phase begins is for the player to find out
  ctx.restore();
  // the phase name while the boss transforms
  const ph = def.phases[e.en.phase];
  if (e.en.phaseTransitionUntil > w.time && ph?.name) {
    const left = e.en.phaseTransitionUntil - w.time;
    drawText(ctx, ph.name, 640, y - 34, { size: 20, align: 'center', weight: 'bold', color: def.palette?.[1] ?? '#ffcf6a', alpha: Math.min(1, left * 1.5) });
  }
}
