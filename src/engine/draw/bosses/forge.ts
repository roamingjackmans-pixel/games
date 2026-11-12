// Boss 5 draw functions: Foreman Ignatius (Ashen Forge), a FIRE boss (ART_AUDIO §2: thick outlines, flat
// two-tone fills, real silhouettes). Phase 0: a hooded fire-cult smith riding the shoulders of an Anvil Golem
// (an iron giant whose chest is an anvil, horn forward, a furnace in its belly, sledgehammer heads for
// fists). Phase 1: the Golem goes molten (lava cracks, flames, dripping fists) and Ignatius fights on foot
// (his own draw). Upright 3/4 view in a frame mirrored to the facing side, like the zone 1–3 bosses.
// Poses: windup raises the fist/hammer (glowing the attack's element colour), attack slams along the facing,
// stagger slumps, roar is the intro's hero stance.
import { ELEMENTS } from '../../../game/elements';
import { registerDraw, type DrawState } from '../registry';
import {
  OUTLINE,
  TAU,
  arm2,
  atkGlow,
  atkK,
  begin,
  blendPose,
  dizzy,
  f,
  flame,
  glow,
  glowEye,
  groundShadow,
  hash,
  horn,
  mixPose,
  oval,
  ow,
  poseWeights,
  roar,
  roarLines,
  roarShake,
  shade,
  shape,
  stick,
  strokePts,
  taper,
  trail,
  withAlpha,
} from '../shapesBoss';
import { overtimeAura } from './overtime';

const FIRE = ELEMENTS.fire;
const IRON = '#4a4852';
const IRON_LIGHT = '#72707c';
const MOLTEN_BODY = '#3d1710';
const LAVA = '#ff7a1a';
const LAVA_HOT = '#ffd27a';
const ROBE = '#b52c1a';
const ROBE_DARK = '#6e140c';
const APRON = '#6a3a1e';
const SKIN = '#c8885a';
const WOOD = '#5a3a1e';

/** Facing in a frame mirrored so the boss always faces +x: [side (±1), local facing angle in [−π/2, π/2]]. */
function mirrored(s: DrawState): [number, number] {
  const fx = Math.cos(s.facing);
  return [fx >= 0 ? 1 : -1, Math.atan2(Math.sin(s.facing), Math.abs(fx))];
}

// ---------------------------------------------------------------- Ignatius himself
// pose arrays (× smith size): [gripX, gripY, hammerAngle, freeX, freeY, mouth, slump]
const SM_REST = [0.62, 0.05, 1.25, -0.62, 0.12, 0, 0];
const SM_RAISED = [0.3, -0.85, -2.5, -0.62, -0.5, 0.5, -0.05];
const SM_ROAR = [0.32, -1.0, -1.62, -0.7, -0.78, 1, -0.1];
const SM_STAGGER = [0.66, 0.15, 1.0, -0.6, 0.32, 0.3, 0.3];

/**
 * The smith in the current (mirrored) frame at (x, y), size sr: a pointed fire-cult hood curling back like a
 * flame, glowing goggles, a singed beard, a red mantle with a flame-tongue hem over a leather apron, a
 * sledgehammer with a red-hot head. `riding` draws him sitting (legs dangling) instead of standing.
 */
function smith(
  ctx: CanvasRenderingContext2D,
  s: DrawState,
  x: number,
  y: number,
  sr: number,
  aL: number,
  riding: boolean,
  mood: number,
): void {
  const ag = atkGlow(s);
  const ak = atkK(s);
  const R = roar(s);
  const w = poseWeights(s);
  const fx = Math.cos(aL);
  const fy = Math.sin(aL);
  const struck = [0.45 + fx * 0.65, -0.15 + fy * 0.45, aL + 0.25, -0.6, 0.15, 0.8, 0.15];
  const p = blendPose(SM_REST, SM_RAISED, struck, w);
  if (s.pose === 'stagger') mixPose(p, SM_STAGGER, 1);
  mixPose(p, SM_ROAR, R);
  const [gX, gY, hA, frX, frY, mouth, slump] = p as [number, number, number, number, number, number, number];
  const bob = Math.sin(s.t * 3) * sr * 0.02;
  const gx = x + gX * sr;
  const gy = y + gY * sr + bob;
  const hot = ag ?? FIRE.glow;
  const heat = 0.5 + 0.5 * Math.sin(s.t * 6);

  // Immolation and other fire windups on foot: a ring of flame gathers around him
  if (!riding && ag && s.atk === 'fire' && s.pose === 'windup') {
    glow(ctx, x, y, sr * 3.2 * (0.6 + ak * 0.5), FIRE.glow, 0.45 * ak);
    for (let i = 0; i < 8; i++) {
      const a = s.t * 2.4 + (i * TAU) / 8;
      flame(
        ctx,
        x + Math.cos(a) * sr * 1.25,
        y + sr * 0.55 + Math.sin(a) * sr * 0.5,
        sr * (0.5 + 0.3 * ak),
        sr * 0.22,
        s.t,
        i + 5,
        FIRE.main,
        LAVA_HOT,
      );
    }
  }

  // the hammer: drawn behind him while raised overhead, in front when it swings or rests
  const drawHammer = (): void => {
    const dx = Math.cos(hA);
    const dy = Math.sin(hA);
    const px0 = gx - dx * sr * 0.22;
    const py0 = gy - dy * sr * 0.22;
    const hx = gx + dx * sr * 0.78;
    const hy = gy + dy * sr * 0.78;
    if (ag && s.pose === 'attack') {
      const a0 = Math.atan2(
        SM_RAISED[1]! * sr + Math.sin(SM_RAISED[2]!) * sr * 0.78,
        SM_RAISED[0]! * sr + Math.cos(SM_RAISED[2]!) * sr * 0.78,
      );
      const a1 = Math.atan2(hy - (y - 0.3 * sr), hx - (x + 0.45 * sr));
      trail(ctx, x + 0.45 * sr, y - 0.3 * sr, Math.hypot(hx - x - 0.45 * sr, hy - y + 0.3 * sr) + sr * 0.2, sr * 0.55, a0, a1, ag, ak);
    }
    glow(ctx, hx, hy, sr * (ag ? 0.9 + ak * 0.5 : 0.55), hot, ag ? 0.5 + ak * 0.4 : 0.35 + heat * 0.15);
    stick(ctx, px0, py0, hx, hy, sr * 0.11, f(s, WOOD));
    // the head: an iron block across the shaft with red-hot striking faces
    const nx = -dy;
    const ny = dx;
    const hl = sr * 0.3;
    const hw = sr * 0.17;
    const blk = [
      hx + nx * hl - dx * hw,
      hy + ny * hl - dy * hw,
      hx + nx * hl + dx * hw,
      hy + ny * hl + dy * hw,
      hx - nx * hl + dx * hw,
      hy - ny * hl + dy * hw,
      hx - nx * hl - dx * hw,
      hy - ny * hl - dy * hw,
    ];
    shape(ctx, blk, f(s, IRON), { under: f(s, '#24222a'), hi: s.flash ? null : withAlpha('#ffffff', 0.15) });
    for (const k of [-1, 1]) {
      const fx0 = hx + nx * hl * k;
      const fy0 = hy + ny * hl * k;
      shape(
        ctx,
        [
          fx0 - dx * hw * 0.9,
          fy0 - dy * hw * 0.9,
          fx0 + dx * hw * 0.9,
          fy0 + dy * hw * 0.9,
          fx0 + dx * hw * 0.7 - nx * hl * 0.22 * k,
          fy0 + dy * hw * 0.7 - ny * hl * 0.22 * k,
          fx0 - dx * hw * 0.7 - nx * hl * 0.22 * k,
          fy0 - dy * hw * 0.7 - ny * hl * 0.22 * k,
        ],
        s.flash ? '#ffffff' : ag ? hot : '#e0501c',
        { under: null, w: 0.7 },
      );
    }
    stick(
      ctx,
      hx - dx * hw * 1.05 + nx * hl * 0.35,
      hy - dy * hw * 1.05 + ny * hl * 0.35,
      hx - dx * hw * 1.05 - nx * hl * 0.35,
      hy - dy * hw * 1.05 - ny * hl * 0.35,
      sr * 0.05,
      f(s, '#8a8890'),
    );
  };
  const hammerBehind = w[1] > 0.5 && w[2] < 0.3 && R < 0.5;
  if (hammerBehind) drawHammer();

  // legs: dangling over the Golem's shoulders, or standing in heavy boots
  if (riding) {
    for (const k of [-1, 1]) {
      const lx = x + k * 0.2 * sr;
      taper(
        ctx,
        lx,
        y + 0.25 * sr,
        lx + 0.18 * sr,
        y + 0.62 * sr + Math.sin(s.t * 3 + k) * sr * 0.03,
        sr * 0.24,
        sr * 0.2,
        f(s, '#3a2418'),
      );
      oval(ctx, lx + 0.22 * sr, y + 0.66 * sr, sr * 0.15, sr * 0.1, f(s, '#1e1410'), { w: 0.8 });
    }
  } else {
    const step = Math.sin(s.t * 10) * sr * 0.08 * s.moving;
    shape(
      ctx,
      [
        x - 0.36 * sr,
        y + 0.22 * sr,
        x + 0.36 * sr,
        y + 0.22 * sr,
        x + 0.34 * sr + step,
        y + 0.62 * sr,
        x + 0.06 * sr,
        y + 0.62 * sr,
        x,
        y + 0.42 * sr,
        x - 0.06 * sr,
        y + 0.62 * sr,
        x - 0.34 * sr - step,
        y + 0.62 * sr,
      ],
      f(s, '#3a2418'),
      { uf: 0.5 },
    );
    oval(ctx, x - 0.22 * sr - step, y + 0.68 * sr, sr * 0.2, sr * 0.11, f(s, '#1e1410'), { w: 0.8 });
    oval(ctx, x + 0.24 * sr + step, y + 0.7 * sr, sr * 0.2, sr * 0.11, f(s, '#1e1410'), { w: 0.8 });
  }

  // the free arm (behind), its hand cupping a live coal
  const sly = y + slump * sr * 0.2 + bob;
  const frx = x + frX * sr;
  const fry = y + frY * sr + bob;
  arm2(ctx, x - 0.48 * sr, sly - 0.28 * sr, frx, fry, sr * 0.36, sr * 0.36, 1, sr * 0.26, sr * 0.22, sr * 0.2, f(s, ROBE_DARK));
  oval(ctx, frx, fry, sr * 0.13, sr * 0.12, f(s, SKIN));
  const coal = (frY < -0.3 ? 1.6 : 1) * (1 + R * 0.6);
  glow(ctx, frx, fry - sr * 0.12, sr * 0.7 * coal, FIRE.glow, 0.75);
  flame(ctx, frx, fry - sr * 0.04, sr * 0.36 * coal, sr * 0.2 * coal, s.t, 3, FIRE.main, LAVA_HOT);

  // torso: a stocky barrel in a red coat, leather apron with the cult's flame sigil, a belt
  shape(
    ctx,
    [
      x - 0.62 * sr,
      sly - 0.3 * sr,
      x - 0.4 * sr,
      sly - 0.5 * sr,
      x + 0.4 * sr,
      sly - 0.5 * sr,
      x + 0.62 * sr,
      sly - 0.3 * sr,
      x + 0.55 * sr,
      y + 0.15 * sr,
      x + 0.42 * sr,
      y + 0.36 * sr,
      x - 0.42 * sr,
      y + 0.36 * sr,
      x - 0.55 * sr,
      y + 0.15 * sr,
    ],
    f(s, ROBE),
    { smooth: true, under: f(s, ROBE_DARK), uf: 0.45 },
  );
  shape(
    ctx,
    [x - 0.28 * sr, sly - 0.3 * sr, x + 0.32 * sr, sly - 0.3 * sr, x + 0.38 * sr, y + 0.5 * sr, x - 0.34 * sr, y + 0.5 * sr],
    f(s, APRON),
    { under: f(s, shade(APRON, 0.7)), w: 0.8 },
  );
  shape(
    ctx,
    [
      x + 0.02 * sr,
      y - 0.02 * sr,
      x + 0.12 * sr,
      y + 0.12 * sr,
      x + 0.09 * sr,
      y + 0.24 * sr,
      x - 0.05 * sr,
      y + 0.24 * sr,
      x - 0.08 * sr,
      y + 0.12 * sr,
    ],
    f(s, '#ffb347'),
    { smooth: true, under: f(s, LAVA), w: 0.6 },
  );
  strokePts(ctx, [x - 0.5 * sr, y + 0.22 * sr, x + 0.5 * sr, y + 0.22 * sr], OUTLINE, sr * 0.08 + ow(1));
  strokePts(ctx, [x - 0.5 * sr, y + 0.22 * sr, x + 0.5 * sr, y + 0.22 * sr], f(s, '#2a1810'), sr * 0.08);
  oval(ctx, x + 0.04 * sr, y + 0.22 * sr, sr * 0.07, sr * 0.06, f(s, '#c9a85a'), { under: null, w: 0.6 });
  // the mantle: red, with a hem of flame tongues
  const mt = sly - 0.52 * sr;
  shape(
    ctx,
    [
      x - 0.72 * sr,
      sly - 0.22 * sr,
      x - 0.5 * sr,
      mt,
      x + 0.5 * sr,
      mt,
      x + 0.72 * sr,
      sly - 0.22 * sr,
      x + 0.58 * sr,
      sly - 0.05 * sr,
      x + 0.44 * sr,
      sly - 0.2 * sr,
      x + 0.3 * sr,
      sly - 0.0 * sr,
      x + 0.14 * sr,
      sly - 0.18 * sr,
      x - 0.02 * sr,
      sly + 0.02 * sr,
      x - 0.18 * sr,
      sly - 0.18 * sr,
      x - 0.34 * sr,
      sly - 0.02 * sr,
      x - 0.48 * sr,
      sly - 0.2 * sr,
      x - 0.62 * sr,
      sly - 0.06 * sr,
    ],
    f(s, '#cf3a1e'),
    { under: f(s, ROBE_DARK), uf: 0.35 },
  );

  // the head: a pointed hood whose tip curls back like a flame
  const hx = x + (0.06 + fx * 0.05) * sr;
  const hy = sly - 0.02 * sr;
  shape(
    ctx,
    [
      hx - 0.3 * sr,
      hy - 0.42 * sr,
      hx - 0.36 * sr,
      hy - 0.78 * sr,
      hx - 0.26 * sr,
      hy - 1.0 * sr,
      hx - 0.42 * sr,
      hy - 1.28 * sr,
      hx - 0.02 * sr,
      hy - 1.1 * sr,
      hx + 0.24 * sr,
      hy - 0.92 * sr,
      hx + 0.34 * sr,
      hy - 0.64 * sr,
      hx + 0.3 * sr,
      hy - 0.42 * sr,
    ],
    f(s, ROBE),
    { smooth: true, under: f(s, ROBE_DARK), uf: 0.4, hi: s.flash ? null : withAlpha('#ffffff', 0.12) },
  );
  const away = Math.sin(s.facing) < -0.6;
  if (!away) {
    oval(ctx, hx + 0.05 * sr, hy - 0.66 * sr, sr * 0.22, sr * 0.2, '#1a0c08', { under: null, w: 0.8 });
    oval(ctx, hx + 0.07 * sr, hy - 0.62 * sr, sr * 0.17, sr * 0.15, f(s, SKIN), { under: f(s, shade(SKIN, 0.75)) });
    // singed beard, open in a shout
    shape(
      ctx,
      [
        hx - 0.08 * sr,
        hy - 0.58 * sr,
        hx + 0.24 * sr,
        hy - 0.58 * sr,
        hx + 0.2 * sr,
        hy - 0.42 * sr,
        hx + 0.12 * sr,
        hy - 0.36 * sr,
        hx + 0.08 * sr,
        hy - 0.44 * sr,
        hx + 0.02 * sr,
        hy - 0.34 * sr,
        hx - 0.06 * sr,
        hy - 0.46 * sr,
      ],
      f(s, '#8a3a1a'),
      { under: f(s, '#5a2410'), w: 0.8 },
    );
    if (mouth > 0.08) {
      oval(ctx, hx + 0.09 * sr, hy - 0.52 * sr, sr * 0.07, sr * 0.06 * mouth + sr * 0.01, '#2a0806', { under: null, w: 0.6 });
    }
    // goggles that catch the fire
    for (const k of [0, 1]) {
      const ex = hx + (0.0 + k * 0.15 + fx * 0.03) * sr;
      const ey = hy - 0.7 * sr + fy * 0.01 * sr;
      oval(ctx, ex, ey, sr * 0.075, sr * 0.07, f(s, '#c9a85a'), { under: null, w: 0.7 });
      glowEye(ctx, ex, ey, sr * 0.05, sr * 0.04, s.flash ? '#ffffff' : LAVA_HOT, 0, 0.5 + mood * 0.5);
    }
  }
  strokePts(ctx, [hx - 0.24 * sr, hy - 0.72 * sr, hx + 0.3 * sr, hy - 0.72 * sr], '#2a1810', Math.max(1.2, sr * 0.035));

  // the hammer arm
  arm2(ctx, x + 0.46 * sr, sly - 0.28 * sr, gx, gy, sr * 0.38, sr * 0.38, -1, sr * 0.28, sr * 0.24, sr * 0.22, f(s, ROBE));
  if (!hammerBehind) drawHammer();
  oval(ctx, gx, gy, sr * 0.13, sr * 0.12, f(s, SKIN));
  if (R > 0) roarLines(ctx, hx, hy - 0.9 * sr, sr * 0.8, R, s.t, FIRE.glow);
}

// ---------------------------------------------------------------- the Anvil Golem
// pose arrays (× r): [leadFistX, leadFistY, backFistX, backFistY, lean, mouth]
const GO_REST = [1.06, 0.3, -1.06, 0.28, 0, 0];
const GO_RAISED = [0.62, -1.28, -0.98, -0.12, -0.12, 0.5];
const GO_ROAR = [1.02, -1.18, -1.02, -1.18, -0.14, 1];
const GO_STAGGER = [1.0, 0.46, -1.0, 0.46, 0.22, 0.2];

/** A sledgehammer-head fist at (x, y), its striking face toward angle a. */
function fist(
  ctx: CanvasRenderingContext2D,
  s: DrawState,
  x: number,
  y: number,
  a: number,
  r: number,
  body: string,
  face: string,
  molten: boolean,
): void {
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const nx = -dy;
  const ny = dx;
  const L = r * 0.24;
  const W = r * 0.27;
  const pts = [
    x - dx * L + nx * W,
    y - dy * L + ny * W,
    x + dx * L + nx * W,
    y + dy * L + ny * W,
    x + dx * L - nx * W,
    y + dy * L - ny * W,
    x - dx * L - nx * W,
    y - dy * L - ny * W,
  ];
  shape(ctx, pts, f(s, body), { under: f(s, shade(body, 0.62)), hi: s.flash ? null : withAlpha('#ffffff', 0.14) });
  // the striking face and a banded collar
  shape(
    ctx,
    [
      x + dx * L * 0.6 + nx * W,
      y + dy * L * 0.6 + ny * W,
      x + dx * L + nx * W * 1.04,
      y + dy * L + ny * W * 1.04,
      x + dx * L - nx * W * 1.04,
      y + dy * L - ny * W * 1.04,
      x + dx * L * 0.6 - nx * W,
      y + dy * L * 0.6 - ny * W,
    ],
    s.flash ? '#ffffff' : face,
    { under: null, w: 0.8 },
  );
  strokePts(
    ctx,
    [x - dx * L * 0.35 + nx * W, y - dy * L * 0.35 + ny * W, x - dx * L * 0.35 - nx * W, y - dy * L * 0.35 - ny * W],
    molten ? LAVA : OUTLINE,
    ow(molten ? 1.1 : 0.9),
  );
  ctx.fillStyle = molten ? LAVA_HOT : OUTLINE;
  for (const k of [-0.6, 0.6]) {
    ctx.beginPath();
    ctx.arc(x + nx * W * k, y + ny * W * k, Math.max(1.3, r * 0.028), 0, TAU);
    ctx.fill();
  }
}

/** Lava cracks across the molten Golem's chest (× r, local frame), as polylines. */
const CRACKS: number[][] = [
  [-0.78, -0.5, -0.5, -0.42, -0.36, -0.52, -0.1, -0.4],
  [0.12, -0.6, 0.22, -0.44, 0.46, -0.48, 0.62, -0.36],
  [-0.6, -0.28, -0.32, -0.3, -0.18, -0.22],
  [0.98, -0.5, 0.8, -0.44],
  [-0.2, 0.0, 0.0, 0.06, 0.18, -0.02],
  [-0.4, 0.2, -0.16, 0.3, 0.1, 0.24, 0.34, 0.3],
];

registerDraw('boss_ignatius', (ctx, s) => {
  const r = begin(s);
  const p2 = s.phase >= 1;
  const p3 = s.phase >= 2; // D359: the third phase is a meltdown: white-hot seams, a sun of sparks and embers
  const [side, aL] = mirrored(s);
  const R = roar(s);
  const ag = atkGlow(s);
  const ak = atkK(s);
  const w = poseWeights(s);
  const fx = Math.cos(aL);
  const fy = Math.sin(aL);
  const struck = [0.55 + fx * 0.95, 0.42 + fy * 0.45, -0.95, 0.24, 0.18, 0.7];
  const p = blendPose(GO_REST, GO_RAISED, struck, w);
  if (s.pose === 'stagger') mixPose(p, GO_STAGGER, 1);
  mixPose(p, GO_ROAR, R);
  // the roar beats the chest between the raised fists once it has landed
  const beatK = R > 0.9 ? Math.max(0, Math.sin(s.poseT * 9)) * 0.25 : 0;
  const [lfX, lfY, bfX, bfY, lean, mouth] = p as [number, number, number, number, number, number];
  const heat = 0.5 + 0.5 * Math.sin(s.t * 5);
  const stomp = Math.abs(Math.sin(s.t * 4)) * r * 0.05 * s.moving;
  const body = p2 ? MOLTEN_BODY : IRON;
  const bodyLight = p2 ? '#5a2216' : IRON_LIGHT;
  const seam = p3 ? '#fff6d8' : p2 ? LAVA_HOT : FIRE.glow;

  groundShadow(ctx, s.x, s.y + r * 0.72, r * 1.25, r * 0.42, 0.42);
  if (p3) overtimeAura(ctx, s, r, { color: '#ff8a1a', core: '#fff2c0', rings: 3, wisps: 'shard', motes: 'ember', count: 8 });
  if (p2) glow(ctx, s.x, s.y - r * 0.3, r * 2.7, p3 ? '#ffb040' : LAVA, 0.38 + heat * 0.15);
  else glow(ctx, s.x, s.y - r * 0.1, r * 1.4, FIRE.glow, 0.18);
  if (R > 0) glow(ctx, s.x, s.y - r * 0.6, r * 2.8, FIRE.glow, 0.25 * R);

  ctx.save();
  ctx.translate(s.x + roarShake(s, r), s.y);
  ctx.scale(side, 1);
  ctx.translate(0, r * 0.7);
  ctx.scale(1 + s.squash * 0.05, 1 - s.squash * 0.07);
  ctx.translate(0, -r * 0.7);

  // legs: iron pillars on blocky feet
  for (const k of [-1, 1]) {
    const lift = (k > 0 ? 1 : -1) * Math.sin(s.t * 4) > 0 ? stomp : 0;
    const lx = k * 0.4 * r;
    taper(ctx, k * 0.32 * r, 0.2 * r, lx, 0.56 * r - lift, r * 0.38, r * 0.32, f(s, shade(body, 0.85)));
    shape(
      ctx,
      [lx - 0.24 * r, 0.74 * r - lift, lx + 0.26 * r, 0.74 * r - lift, lx + 0.2 * r, 0.52 * r - lift, lx - 0.18 * r, 0.52 * r - lift],
      f(s, bodyLight),
      { under: f(s, shade(body, 0.7)) },
    );
    if (p2) strokePts(ctx, [lx - 0.1 * r, 0.3 * r, lx + 0.04 * r, 0.42 * r, lx - 0.02 * r, 0.5 * r], LAVA, ow(1));
  }
  // pelvis and waist (the anvil's foot and neck) with the furnace door in the belly
  shape(ctx, [-0.52 * r, 0.32 * r, 0.52 * r, 0.32 * r, 0.38 * r, 0.02 * r, -0.38 * r, 0.02 * r], f(s, shade(body, 0.8)));

  ctx.save();
  ctx.translate(0, 0.1 * r);
  ctx.rotate(lean * 0.35);
  ctx.translate(0, -0.1 * r - stomp);
  shape(ctx, [-0.4 * r, 0.08 * r, 0.4 * r, 0.08 * r, 0.5 * r, -0.24 * r, -0.5 * r, -0.24 * r], f(s, body));
  // furnace: an arched door with glowing bars
  const fire = p2 ? LAVA_HOT : FIRE.glow;
  glow(ctx, 0, -0.08 * r, r * (p2 ? 0.8 : 0.5), fire, 0.55 + heat * 0.25);
  shape(
    ctx,
    [-0.22 * r, 0.04 * r, 0.22 * r, 0.04 * r, 0.22 * r, -0.12 * r, 0.12 * r, -0.21 * r, -0.12 * r, -0.21 * r, -0.22 * r, -0.12 * r],
    s.flash ? '#ffffff' : p2 ? LAVA_HOT : '#ff9a3a',
    { under: s.flash ? null : FIRE.main, uf: 0.5 },
  );
  for (const k of [-0.11, 0, 0.11]) strokePts(ctx, [k * r, 0.04 * r, k * r, -0.19 * r], OUTLINE, ow(1));

  // the anvil chest: heel behind, a long horn reaching forward
  const chest = [
    -1.0 * r,
    -0.42 * r,
    -0.84 * r,
    -0.66 * r,
    0.62 * r,
    -0.66 * r,
    0.92 * r,
    -0.6 * r,
    1.32 * r,
    -0.5 * r,
    0.9 * r,
    -0.4 * r,
    0.64 * r,
    -0.2 * r,
    -0.62 * r,
    -0.2 * r,
    -0.92 * r,
    -0.3 * r,
  ];
  shape(ctx, chest, f(s, body), { under: f(s, shade(body, 0.68)), uf: 0.42 });
  shape(ctx, [-0.82 * r, -0.66 * r, 0.62 * r, -0.66 * r, 0.6 * r, -0.58 * r, -0.8 * r, -0.58 * r], f(s, bodyLight), {
    under: null,
    w: 0.7,
  });
  if (!s.flash && !p2) {
    ctx.fillStyle = withAlpha('#ffffff', 0.22);
    ctx.fillRect(-0.7 * r, -0.65 * r, 1.1 * r, 0.025 * r);
  }
  // the horn's point glows red-hot, fresh off the forge
  glow(ctx, 1.18 * r, -0.5 * r, r * 0.4, FIRE.glow, 0.55 + heat * 0.25);
  shape(ctx, [1.32 * r, -0.5 * r, 1.06 * r, -0.57 * r, 1.0 * r, -0.44 * r], s.flash ? '#ffffff' : p2 ? LAVA_HOT : '#ff6a2a', {
    under: null,
    w: 0.7,
  });
  ctx.fillStyle = p2 ? LAVA_HOT : OUTLINE;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc((-0.7 + i * 0.27) * r, -0.27 * r, Math.max(1.3, r * 0.026), 0, TAU);
    ctx.fill();
  }
  // glowing seams (phase 0) / lava cracks everywhere (phase 1)
  if (p2) {
    for (const c of CRACKS) {
      const pts = c.map((v) => v * r);
      strokePts(ctx, pts, LAVA, ow(2.2), 0.6 + heat * 0.3);
      strokePts(ctx, pts, LAVA_HOT, ow(0.9));
    }
    for (const [cx, cy] of [
      [-0.4, -0.42],
      [0.35, -0.48],
      [0.0, 0.1],
    ] as const)
      glow(ctx, cx * r, cy * r, r * 0.35, LAVA, 0.4 + heat * 0.2);
  } else {
    strokePts(ctx, [-0.5 * r, -0.4 * r, -0.2 * r, -0.32 * r, 0.05 * r, -0.44 * r], seam, ow(0.8), 0.55);
  }

  // shoulders: domed pauldrons with spikes; arms down to hammer-head fists
  const lsx = 0.66 * r;
  const lsy = -0.6 * r;
  const bsx = -0.8 * r;
  const bsy = -0.6 * r;
  const lfx = lfX * r;
  const lfy = (lfY - beatK) * r;
  const bfx = bfX * r;
  const bfy = (bfY - (R > 0.9 ? 0.25 - beatK : 0)) * r;
  const armFill = f(s, body);
  const faceCol = p2 ? '#ff6a1a' : '#8a8890';
  // back arm first
  const be = arm2(ctx, bsx, bsy, bfx, bfy, r * 0.55, r * 0.55, -1, r * 0.34, r * 0.3, r * 0.4, armFill);
  fist(ctx, s, bfx, bfy, Math.atan2(bfy - be[1], bfx - be[0]), r, bodyLight, faceCol, p2);
  // the back pauldron
  const pauldron = (cx: number, cy: number, k: number): void => {
    shape(
      ctx,
      [
        cx - 0.26 * r,
        cy + 0.14 * r,
        cx - 0.24 * r,
        cy - 0.12 * r,
        cx,
        cy - 0.24 * r,
        cx + 0.24 * r,
        cy - 0.12 * r,
        cx + 0.28 * r,
        cy + 0.14 * r,
        cx,
        cy + 0.2 * r,
      ],
      f(s, bodyLight),
      { smooth: true, under: f(s, shade(body, 0.75)) },
    );
    horn(ctx, cx - 0.06 * r * k, cy - 0.2 * r, -Math.PI / 2 - 0.35 * k, r * 0.24, r * 0.12, 0.2 * k, f(s, p2 ? '#7a3020' : '#8a8890'), 0.8);
    horn(
      ctx,
      cx + 0.12 * r * k,
      cy - 0.16 * r,
      -Math.PI / 2 + 0.2 * k,
      r * 0.16,
      r * 0.09,
      0.15 * k,
      f(s, p2 ? '#7a3020' : '#8a8890'),
      0.8,
    );
    if (p2) {
      glow(ctx, cx, cy - 0.2 * r, r * 0.55, LAVA, 0.6);
      for (let i = 0; i < 3; i++)
        flame(
          ctx,
          cx + (i - 1) * 0.13 * r,
          cy - 0.14 * r,
          r * (0.3 + hash(i + k * 3) * 0.2),
          r * 0.13,
          s.t,
          i * 5 + k * 3,
          FIRE.main,
          LAVA_HOT,
        );
    }
  };
  pauldron(bsx, bsy, -1);

  // phase 0: Ignatius rides on the Golem's shoulders, behind its head
  if (!p2) smith(ctx, s, -0.42 * r, -1.0 * r, r * 0.42, aL, true, 1);

  // the head: a horned helm sunk between the shoulders, a furnace slit for eyes and a grille mouth
  const hdx0 = (0.14 + fx * 0.06) * r;
  const hdy0 = -0.8 * r;
  ctx.save();
  ctx.translate(hdx0, hdy0);
  ctx.scale(1.3, 1.3);
  const hdx = 0;
  const hdy = 0;
  for (const k of [-1, 1])
    horn(
      ctx,
      hdx + k * 0.17 * r,
      hdy - 0.08 * r,
      -Math.PI / 2 + k * 0.9,
      r * 0.3,
      r * 0.12,
      -k * 0.9,
      f(s, p2 ? '#6a2a1a' : '#55535c'),
      0.9,
    );
  shape(
    ctx,
    [
      hdx - 0.22 * r,
      hdy + 0.16 * r,
      hdx + 0.24 * r,
      hdy + 0.16 * r,
      hdx + 0.24 * r,
      hdy - 0.1 * r,
      hdx + 0.1 * r,
      hdy - 0.2 * r,
      hdx - 0.08 * r,
      hdy - 0.2 * r,
      hdx - 0.22 * r,
      hdy - 0.1 * r,
    ],
    f(s, bodyLight),
    { under: f(s, shade(body, 0.75)) },
  );
  glow(ctx, hdx + fx * 0.03 * r, hdy - 0.04 * r, r * 0.35, seam, 0.65 + R * 0.3);
  shape(
    ctx,
    [
      hdx - 0.15 * r + fx * 0.03 * r,
      hdy - 0.08 * r,
      hdx + 0.19 * r + fx * 0.03 * r,
      hdy - 0.08 * r,
      hdx + 0.16 * r + fx * 0.03 * r,
      hdy - 0.0 * r,
      hdx - 0.12 * r + fx * 0.03 * r,
      hdy - 0.0 * r,
    ],
    s.flash ? '#ffffff' : seam,
    { under: null, w: 0.7 },
  );
  const mo = mouth * 0.08 * r;
  shape(
    ctx,
    [
      hdx - 0.12 * r,
      hdy + 0.05 * r,
      hdx + 0.16 * r,
      hdy + 0.05 * r,
      hdx + 0.14 * r,
      hdy + 0.12 * r + mo,
      hdx - 0.1 * r,
      hdy + 0.12 * r + mo,
    ],
    mouth > 0.2 ? (s.flash ? '#ffffff' : seam) : '#1a1414',
    { under: null, w: 0.7 },
  );
  for (const k of [-0.04, 0.04])
    strokePts(ctx, [hdx + k * r + 0.02 * r, hdy + 0.05 * r, hdx + k * r + 0.02 * r, hdy + 0.12 * r + mo], OUTLINE, ow(0.7));
  if (p2)
    for (let i = 0; i < 3; i++)
      flame(
        ctx,
        hdx + (i - 1) * 0.11 * r,
        hdy - 0.16 * r,
        r * (0.3 + (i === 1 ? 0.14 : 0)) * (1 + R * 0.4),
        r * 0.12,
        s.t,
        11 + i,
        FIRE.main,
        LAVA_HOT,
      );
  ctx.restore();
  ctx.restore();

  // the lead arm (on the facing side) and its pauldron
  ctx.save();
  ctx.translate(0, 0.1 * r);
  ctx.rotate(lean * 0.35);
  ctx.translate(0, -0.1 * r - stomp);
  const le = arm2(ctx, lsx, lsy, lfx, lfy, r * 0.55, r * 0.55, 1, r * 0.36, r * 0.32, r * 0.42, armFill);
  const la = Math.atan2(lfy - le[1], lfx - le[0]);
  if (ag) {
    glow(ctx, lfx, lfy, r * (0.4 + ak * 0.25), ag, 0.3 + ak * 0.3);
    if (s.pose === 'attack') {
      const a0 = Math.atan2(GO_RAISED[1]! * r - lsy, GO_RAISED[0]! * r - lsx);
      const a1 = Math.atan2(lfy - lsy, lfx - lsx);
      trail(ctx, lsx, lsy, Math.hypot(lfx - lsx, lfy - lsy) + r * 0.2, r * 0.55, a0, a1, ag, ak);
    }
  }
  fist(ctx, s, lfx, lfy, la, r, bodyLight, ag ? ag : faceCol, p2);
  if (p2) glow(ctx, lfx, lfy, r * 0.5, LAVA, 0.55);
  pauldron(lsx, lsy, 1);
  ctx.restore();
  ctx.restore();

  // molten drips falling from the fists and belly (phase 1)
  if (p2) {
    for (let i = 0; i < 5; i++) {
      const k = (s.t * 0.9 + i * 0.23) % 1;
      const src = i % 3 === 0 ? [lfx, lfy + r * 0.2] : i % 3 === 1 ? [bfx, bfy + r * 0.2] : [(i - 2) * r * 0.2, 0.05 * r];
      const dxw = s.x + side * src[0]!;
      const dyw = s.y + src[1]! + k * r * 0.5;
      if (dyw > s.y + r * 0.75) continue;
      glow(ctx, dxw, dyw, r * 0.14, LAVA, 1 - k);
      oval(ctx, dxw, dyw, r * 0.035, r * 0.055, LAVA_HOT, { under: null, w: 0 });
    }
    // heat shimmer embers rising
    for (let i = 0; i < 6; i++) {
      const k = (s.t * 0.5 + i * 0.17) % 1;
      const ex = s.x + (hash(i * 7) - 0.5) * r * 1.8 + Math.sin(s.t * 2 + i) * r * 0.1;
      const ey = s.y - r * 0.2 - k * r * 1.6;
      glow(ctx, ex, ey, r * 0.08, LAVA_HOT, (1 - k) * 0.9);
    }
  }
  if (R > 0) roarLines(ctx, s.x + side * (0.12 * r), s.y - r * 1.1, r * 0.9, R, s.t, FIRE.glow);
  if (s.pose === 'stagger') dizzy(ctx, s.x + side * 0.12 * r, s.y - r * 1.35, r * 0.45, s.t);
});

// ---------------------------------------------------------------- Ignatius on foot (phase 1's second body)
registerDraw('boss_ignatius_foot', (ctx, s) => {
  const r = begin(s);
  const [side, aL] = mirrored(s);
  const R = roar(s);
  groundShadow(ctx, s.x, s.y + r * 0.72, r * 0.9, r * 0.32, 0.38);
  // the forge glow follows him around
  glow(ctx, s.x, s.y - r * 0.2, r * 2.4, FIRE.glow, 0.25 + Math.sin(s.t * 6) * 0.06 + R * 0.25);
  ctx.save();
  ctx.translate(s.x + roarShake(s, r), s.y);
  ctx.scale(side, 1);
  ctx.translate(0, r * 0.7);
  ctx.scale(1 + s.squash * 0.05, 1 - s.squash * 0.07);
  ctx.translate(0, -r * 0.7);
  smith(ctx, s, 0, -r * 0.02, r, aL, false, 1);
  ctx.restore();
  if (R > 0)
    for (let i = 0; i < 5; i++) {
      const k = (s.t * 0.8 + i * 0.2) % 1;
      glow(ctx, s.x + (hash(i * 3) - 0.5) * r * 2, s.y - k * r * 2, r * 0.12, FIRE.glow, (1 - k) * R);
    }
  if (s.pose === 'stagger') dizzy(ctx, s.x, s.y - r * 1.45, r * 0.5, s.t);
});
