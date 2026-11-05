// Co-op player cards (GAME_DESIGN §16): name in the player's colour, level, HP, and the downed timer and
// revive progress, stacked under the local HUD. Drawn for every player except the local one.
import { drawText } from '../engine/text';
import { withAlpha } from '../engine/draw/parts';
import { PLAYER_COLORS } from '../render/entities';
import type { World } from '../game/world';

export function drawPartyCards(ctx: CanvasRenderingContext2D, w: World, localPlayerId: string): void {
  let y = 112;
  for (const p of w.players) {
    const pl = p.pl;
    if (!pl || pl.playerId === localPlayerId) continue;
    const color = PLAYER_COLORS[pl.slot % PLAYER_COLORS.length] ?? '#efe6d2';
    ctx.fillStyle = 'rgba(10,8,14,0.6)';
    ctx.fillRect(12, y, 190, 38);
    ctx.fillStyle = color;
    ctx.fillRect(12, y, 3, 38);
    drawText(ctx, `${pl.name}`, 22, y + 14, { size: 13, weight: 'bold', color });
    drawText(ctx, `Lv ${pl.char.level}`, 196, y + 14, { size: 11, align: 'right', color: '#a59c8a' });
    const frac = p.hp ? Math.max(0, p.hp.hp / Math.max(1, p.hp.max)) : 0;
    ctx.fillStyle = '#2a2433';
    ctx.fillRect(22, y + 22, 170, 7);
    if (pl.deadUntilRest) drawText(ctx, 'out until the next bonfire', 22, y + 30, { size: 11, color: '#ff6a5a' });
    else if (pl.downed) {
      const k = Math.min(1, pl.reviveProgress / Math.max(1, pl.reviveNeed));
      ctx.fillStyle = withAlpha('#58d66a', 0.9);
      ctx.fillRect(22, y + 22, 170 * k, 7);
      const left = Math.max(0, pl.ghostUntil - w.time);
      drawText(ctx, `DOWN — hit them to revive ${pl.ghostUntil > 0 ? `(${w.time < pl.ghostPauseUntil ? 'held, ' : ''}${Math.ceil(left)}s)` : ''}`, 22, y + 36, { size: 10, color: '#ffcf6a' });
    } else {
      ctx.fillStyle = '#c0303a';
      ctx.fillRect(22, y + 22, 170 * frac, 7);
    }
    y += 44;
  }
}
