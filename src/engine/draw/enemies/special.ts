// Training dummy: a straw figure on a post.
import { OUTLINE, blob, limb, poly, shadow } from '../parts';
import { fc, registerDraw } from '../registry';

registerDraw('training_dummy', (ctx, s) => {
  const sway = Math.sin(s.t * 2) * 0.05 + (s.pose === 'attack' ? 0.3 : s.squash * -0.2);
  shadow(ctx, s.x, s.y + 4, s.r);
  ctx.save();
  ctx.translate(s.x, s.y + 10);
  ctx.rotate(sway);
  limb(ctx, 0, 6, 0, -30, 6, fc(s, '#6a4a2a'));
  limb(ctx, -22, -22, 22, -22, 5, fc(s, '#6a4a2a'));
  blob(ctx, 0, -18, 14, 18, { fill: fc(s, '#c8a860') });
  ctx.strokeStyle = '#8a6a30';
  ctx.lineWidth = 1.5;
  for (let i = -8; i <= 8; i += 4) {
    ctx.beginPath();
    ctx.moveTo(i, -32);
    ctx.lineTo(i * 0.8, -4);
    ctx.stroke();
  }
  blob(ctx, 0, -42, 11, 11, { fill: fc(s, '#d8b870') });
  poly(ctx, [-5, -45, -2, -42, -5, -39], OUTLINE, OUTLINE, 1);
  poly(ctx, [5, -45, 2, -42, 5, -39], OUTLINE, OUTLINE, 1);
  ctx.restore();
});
