// Armor item icons: a helmet that looks like a helmet, a chest piece that looks like body armor and leg armor
// that looks like a knight's legs. Drawn in a ~44 unit box centred on the origin, by slot, weight class and the
// set's head/body type and colours (src/data/armor.ts).
import { OUTLINE, poly, shade, spec } from '../engine/draw/parts';
import type { ArmorSetDef } from '../game/types';

const W = 2;

function line(ctx: CanvasRenderingContext2D, pts: number[], color: string, w = 1.4): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0]!, pts[1]!);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i]!, pts[i + 1]!);
  ctx.stroke();
}

function rivets(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string): void {
  ctx.fillStyle = color;
  for (const [x, y] of pts) {
    ctx.beginPath();
    ctx.arc(x, y, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** A closed shape from a path callback, filled, then outlined. */
function shape(ctx: CanvasRenderingContext2D, build: () => void, fill: string, w = W): void {
  ctx.beginPath();
  build();
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineJoin = 'round';
  ctx.lineWidth = w;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

// ------------------------------------------------------------------------------------------------ helmets

function drawHelm(ctx: CanvasRenderingContext2D, set: ArmorSetDef | null): void {
  const col = set?.look.color ?? '#8a8f98';
  const trim = set?.look.trim ?? '#c9b98a';
  const kind = set?.look.head ?? 'helm';
  const steel = set?.weight === 'heavy' ? shade(col, 1.25) : col;
  switch (kind) {
    case 'hood': {
      // a cowl with a dark face opening and a drape over the shoulders
      shape(ctx, () => {
        ctx.moveTo(-16, 16);
        ctx.quadraticCurveTo(-17, -6, -4, -16);
        ctx.quadraticCurveTo(2, -19, 8, -14);
        ctx.quadraticCurveTo(17, -4, 16, 16);
      }, col);
      shape(ctx, () => ctx.ellipse(0, 2, 8, 9.5, 0, 0, Math.PI * 2), '#141018', 1.5);
      line(ctx, [-16, 13, 16, 13], trim, 2);
      return;
    }
    case 'cap':
    case 'bandana': {
      // a padded arming cap with a band and a little brim
      shape(ctx, () => {
        ctx.moveTo(-14, 6);
        ctx.quadraticCurveTo(-15, -14, 0, -15);
        ctx.quadraticCurveTo(15, -14, 14, 6);
      }, col);
      shape(ctx, () => ctx.rect(-15, 2, 30, 6), trim, 1.5);
      line(ctx, [0, -15, 0, 2], shade(col, 0.7));
      line(ctx, [-7, -12, -8, 2], shade(col, 0.7));
      line(ctx, [7, -12, 8, 2], shade(col, 0.7));
      if (kind === 'bandana') poly(ctx, [12, 4, 19, 12, 15, 14, 11, 8], trim, OUTLINE, 1.5);
      return;
    }
    case 'none': {
      // the Lessee's bowler hat
      shape(ctx, () => ctx.ellipse(0, 8, 19, 5, 0, 0, Math.PI * 2), shade(col, 1.3));
      shape(ctx, () => {
        ctx.moveTo(-11, 8);
        ctx.quadraticCurveTo(-12, -14, 0, -14);
        ctx.quadraticCurveTo(12, -14, 11, 8);
      }, shade(col, 1.3));
      shape(ctx, () => ctx.rect(-11, 2, 22, 4), trim, 1.4);
      spec(ctx, -5, -8, 1.6);
      return;
    }
    case 'crown': {
      shape(ctx, () => {
        ctx.moveTo(-15, 10);
        ctx.lineTo(-15, -8);
        ctx.lineTo(-9, -1);
        ctx.lineTo(-4, -13);
        ctx.lineTo(0, -3);
        ctx.lineTo(4, -13);
        ctx.lineTo(9, -1);
        ctx.lineTo(15, -8);
        ctx.lineTo(15, 10);
      }, '#e6b84a');
      shape(ctx, () => ctx.rect(-15, 4, 30, 6), shade('#e6b84a', 0.8), 1.5);
      for (const [x, c] of [[-8, '#d63a3a'], [0, '#4aa3ff'], [8, '#58d66a']] as const) shape(ctx, () => ctx.arc(x, 7, 2, 0, Math.PI * 2), c, 1);
      spec(ctx, -10, -2, 1.5);
      return;
    }
    case 'wizard':
    case 'mitre': {
      if (kind === 'wizard') {
        shape(ctx, () => {
          ctx.moveTo(-18, 12);
          ctx.lineTo(18, 12);
          ctx.lineTo(9, 7);
          ctx.quadraticCurveTo(6, -6, 10, -18);
          ctx.quadraticCurveTo(-2, -10, -8, 7);
        }, col);
        shape(ctx, () => ctx.rect(-8, 4, 17, 4), trim, 1.5);
        ctx.fillStyle = trim;
        ctx.font = 'bold 7px sans-serif';
        ctx.fillText('✦', -2, -3);
      } else {
        shape(ctx, () => {
          ctx.moveTo(-12, 14);
          ctx.lineTo(-12, -4);
          ctx.lineTo(0, -18);
          ctx.lineTo(12, -4);
          ctx.lineTo(12, 14);
        }, col);
        line(ctx, [0, -15, 0, 14], trim, 2.5);
        line(ctx, [-6, -2, 6, -2], trim, 2.5);
        line(ctx, [-12, 11, 12, 11], trim, 2);
      }
      return;
    }
    default: {
      // a knight's helm: a rounded skull, cheek plates, a visor slit with breaths; greathelms are flat-topped
      // barrels with a cross; horned helms grow horns; heavy sets get a crest
      const great = kind === 'greathelm';
      if (kind === 'horned') {
        poly(ctx, [-11, -6, -21, -16, -19, -21, -8, -12], '#e8e1c8', OUTLINE, 1.6);
        poly(ctx, [11, -6, 21, -16, 19, -21, 8, -12], '#e8e1c8', OUTLINE, 1.6);
      }
      if (set?.weight === 'heavy' && !great && kind !== 'horned') {
        // a plume
        shape(ctx, () => {
          ctx.moveTo(-2, -15);
          ctx.quadraticCurveTo(6, -24, 16, -19);
          ctx.quadraticCurveTo(8, -16, 3, -12);
        }, trim, 1.5);
      }
      shape(
        ctx,
        () => {
          if (great) {
            ctx.moveTo(-13, 16);
            ctx.lineTo(-14, -11);
            ctx.quadraticCurveTo(0, -17, 14, -11);
            ctx.lineTo(13, 16);
            ctx.quadraticCurveTo(0, 19, -13, 16);
          } else {
            ctx.moveTo(-13, 15);
            ctx.lineTo(-14, -2);
            ctx.quadraticCurveTo(-13, -17, 0, -17);
            ctx.quadraticCurveTo(13, -17, 14, -2);
            ctx.lineTo(13, 15);
            ctx.lineTo(5, 15);
            ctx.lineTo(4, 5);
            ctx.lineTo(-4, 5);
            ctx.lineTo(-5, 15);
          }
        },
        steel,
      );
      // the underside shade
      ctx.save();
      ctx.globalAlpha = 0.25;
      line(ctx, [-12, 10, 12, 10], OUTLINE, 3);
      ctx.restore();
      // visor slit
      shape(ctx, () => ctx.rect(-11, -4, 22, 3.4), '#141018', 1.2);
      if (great) {
        // breathing holes and a cross of trim
        line(ctx, [0, -1, 0, 14], trim, 2.2);
        rivets(ctx, [[-6, 4], [-6, 8], [6, 4], [6, 8]], '#141018');
      } else line(ctx, [0, -16, 0, -5], trim, 2);
      rivets(ctx, [[-11, -9], [11, -9], [-11, 9], [11, 9]], shade(steel, 0.55));
      spec(ctx, -7, -11, 1.8);
    }
  }
}

// --------------------------------------------------------------------------------------------- chest armor

function drawChest(ctx: CanvasRenderingContext2D, set: ArmorSetDef | null): void {
  const col = set?.look.color ?? '#8a8f98';
  const trim = set?.look.trim ?? '#c9b98a';
  const body = set?.look.body ?? 'plate';
  const torso = (): void => {
    // shoulders, a cinched waist and a skirt flare
    ctx.moveTo(-10, -15);
    ctx.lineTo(10, -15);
    ctx.lineTo(13, -11);
    ctx.lineTo(12, 4);
    ctx.lineTo(10, 15);
    ctx.lineTo(-10, 15);
    ctx.lineTo(-12, 4);
    ctx.lineTo(-13, -11);
  };
  if (body === 'robe' || body === 'cloak' || body === 'bathrobe') {
    shape(ctx, () => {
      ctx.moveTo(-9, -15);
      ctx.lineTo(9, -15);
      ctx.lineTo(18, -9);
      ctx.lineTo(15, -3);
      ctx.lineTo(12, -5);
      ctx.lineTo(15, 18);
      ctx.lineTo(-15, 18);
      ctx.lineTo(-12, -5);
      ctx.lineTo(-15, -3);
      ctx.lineTo(-18, -9);
    }, col);
    line(ctx, [-5, -15, 0, -6, 5, -15], trim, 2);
    line(ctx, [0, -6, 0, 18], trim, 2);
    shape(ctx, () => ctx.rect(-12, 3, 24, 3.5), shade(trim, 0.85), 1.2);
    return;
  }
  if (body === 'plate') {
    // pauldrons
    for (const s of [-1, 1]) {
      shape(ctx, () => {
        ctx.moveTo(s * 9, -16);
        ctx.quadraticCurveTo(s * 22, -17, s * 21, -5);
        ctx.lineTo(s * 13, -6);
        ctx.lineTo(s * 11, -12);
      }, shade(col, 1.15));
      line(ctx, [s * 12, -12, s * 20, -9], shade(col, 0.6), 1.2);
    }
    shape(ctx, torso, col);
    // a breastplate ridge, the gorget, waist lames and a trim emblem
    line(ctx, [0, -13, 0, 3], shade(col, 1.5), 1.6);
    shape(ctx, () => ctx.rect(-7, -16, 14, 4), shade(col, 0.8), 1.4);
    for (const y of [6, 10]) line(ctx, [-11, y, 11, y], shade(col, 0.55), 1.4);
    poly(ctx, [0, -10, 4, -5, 0, 0, -4, -5], trim, OUTLINE, 1.2);
    rivets(ctx, [[-9, -8], [9, -8], [-9, 12], [9, 12]], shade(col, 0.5));
    spec(ctx, -6, -9, 1.8);
    return;
  }
  shape(ctx, torso, col);
  if (body === 'chain') {
    // mail rings under a tabard
    ctx.fillStyle = shade(col, 0.65);
    for (let y = -12; y <= 13; y += 3) for (let x = -11 + ((y / 3) % 2 ? 1.5 : 0); x <= 11; x += 3) ctx.fillRect(x, y, 1.2, 1.2);
    shape(ctx, () => {
      ctx.moveTo(-5, -14);
      ctx.lineTo(5, -14);
      ctx.lineTo(6, 15);
      ctx.lineTo(0, 12);
      ctx.lineTo(-6, 15);
    }, trim, 1.4);
    shape(ctx, () => ctx.rect(-12, 3, 24, 3.5), '#5a3a22', 1.2);
    return;
  }
  // leather / suit / shirt: a jerkin with straps, a buckle and stitching
  line(ctx, [-11, -12, 9, 10], shade(col, 0.6), 2.4);
  shape(ctx, () => ctx.rect(-12, 3, 24, 4), shade(col, 0.6), 1.2);
  shape(ctx, () => ctx.rect(-2.5, 2.5, 5, 5), trim, 1);
  ctx.save();
  ctx.setLineDash([2, 2]);
  line(ctx, [0, -14, 0, 2], trim, 1);
  line(ctx, [0, 8, 0, 14], trim, 1);
  ctx.restore();
  if (body === 'suit') poly(ctx, [-3, -15, 3, -15, 0, -4], '#efe6d2', OUTLINE, 1.2);
}

// ----------------------------------------------------------------------------------------------- leg armor

function drawLegs(ctx: CanvasRenderingContext2D, set: ArmorSetDef | null): void {
  const col = set?.look.color ?? '#8a6a3a';
  const trim = set?.look.trim ?? '#c9b98a';
  const weight = set?.weight ?? 'light';
  // a belt / fauld across the hips
  shape(ctx, () => ctx.rect(-14, -18, 28, 6), weight === 'heavy' ? shade(col, 1.1) : shade(col, 0.7), 1.6);
  for (const s of [-1, 1]) {
    const x = s * 7;
    // thigh (cuisse), knee (poleyn), shin (greave), boot (sabaton)
    shape(ctx, () => {
      ctx.moveTo(x - 5.5, -12);
      ctx.lineTo(x + 5.5, -12);
      ctx.lineTo(x + 5, 2);
      ctx.lineTo(x - 5, 2);
    }, col);
    shape(ctx, () => {
      ctx.moveTo(x - 4.5, 4);
      ctx.lineTo(x + 4.5, 4);
      ctx.lineTo(x + 4, 13);
      ctx.lineTo(x - 4, 13);
    }, weight === 'light' ? shade(col, 0.85) : shade(col, 1.1));
    // boots point outward a little
    shape(ctx, () => {
      ctx.moveTo(x - 4.5, 12);
      ctx.lineTo(x + 4.5, 12);
      ctx.lineTo(x + 4.5 + s * 4, 18);
      ctx.lineTo(x - 4.5, 18);
    }, weight === 'heavy' ? shade(col, 0.75) : '#4a3222', 1.6);
    if (weight === 'light') {
      // cloth wraps
      for (const y of [-8, -3, 7, 10]) line(ctx, [x - 5, y, x + 5, y + 1.5], shade(col, 0.6), 1.2);
    } else {
      // a knee cop with a fan, and plate seams
      shape(ctx, () => ctx.ellipse(x, 3, 4.6, 3.4, 0, 0, Math.PI * 2), shade(col, 1.3), 1.5);
      line(ctx, [x - 5, -5, x + 5, -5], shade(col, 0.55), 1.2);
      line(ctx, [x, 6, x, 12], shade(col, 1.5), 1.2);
      if (weight === 'heavy') rivets(ctx, [[x - 3.5, -9], [x + 3.5, -9]], shade(col, 0.45));
      else {
        // mail at the thigh
        ctx.fillStyle = shade(col, 0.6);
        for (let yy = -10; yy < 0; yy += 2.5) for (let xx = x - 4; xx <= x + 4; xx += 2.5) ctx.fillRect(xx, yy, 1, 1);
      }
    }
  }
  // a tasset of trim at the front of the belt
  poly(ctx, [-4, -12, 4, -12, 3, -6, -3, -6], trim, OUTLINE, 1.2);
  spec(ctx, -9, -16, 1.4);
}

/** Draw an armor icon for one piece (`slot`) of `set` (null: the Loincloth or an unknown piece). */
export function drawArmorIcon(ctx: CanvasRenderingContext2D, slot: 'head' | 'body' | 'legs', set: ArmorSetDef | null): void {
  ctx.save();
  ctx.scale(1.12, 1.12);
  drawPiece(ctx, slot, set);
  ctx.restore();
}

function drawPiece(ctx: CanvasRenderingContext2D, slot: 'head' | 'body' | 'legs', set: ArmorSetDef | null): void {
  if (slot === 'head') drawHelm(ctx, set);
  else if (slot === 'body') drawChest(ctx, set);
  else if (!set) {
    // the Loincloth: a heroic strip of cloth
    shape(ctx, () => ctx.rect(-13, -10, 26, 5), '#8a6a3a', 1.6);
    shape(ctx, () => {
      ctx.moveTo(-5, -5);
      ctx.lineTo(5, -5);
      ctx.lineTo(3, 12);
      ctx.lineTo(-3, 12);
    }, '#a07a42', 1.6);
  } else drawLegs(ctx, set);
}
