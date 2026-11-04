// Joe: a person in top-down 3/4 view (ART_AUDIO §2). Head with a face and hair, a neck, shoulders, a
// shaped torso, two arms whose hands hold the weapon grip and the shield or staff, hips and two legs with a
// walk cycle that reads from any facing (back view when facing up). Armor is drawn on top from a JoeLook:
// the base fields come from the armor set (head/body type, colour, trim), the optional extras from
// src/data/armorLooks.ts (pauldrons, capes, crests, visors, emblems, belts, greaves...).
//
// Space: body space is Joe's own frame, origin at his centre, unscaled; +y is down the screen. Offsets in
// the ground plane relative to his body (shoulder axis, feet) are squashed by K in y for the 3/4 look.
import { OUTLINE, glow, hexToRgb, mix, shade, shadow } from './parts';

export type HeadGear = 'none' | 'hood' | 'helm' | 'greathelm' | 'cap' | 'wizard' | 'mitre' | 'horned' | 'bandana' | 'crown' | 'bowler';
export type BodyGear = 'shirt' | 'leather' | 'chain' | 'plate' | 'robe' | 'cloak' | 'bathrobe' | 'loincloth' | 'suit';
export type HairStyle = 'short' | 'messy' | 'bald' | 'long' | 'topknot' | 'braids' | 'mohawk' | 'slick' | 'curly' | 'spiky' | 'ponytail' | 'afro' | 'bob' | 'pigtails';
export type Beard = 'none' | 'stubble' | 'full' | 'goatee' | 'moustache' | 'braided' | 'mutton' | 'long';
// ---- the character creator's appearance options (Character.appearance, read by lookFor)
export type EyeShape = 'dot' | 'round' | 'narrow' | 'sleepy' | 'glow';
export type NoseShape = 'button' | 'big' | 'long' | 'hooked' | 'pointy' | 'red';
export type Brows = 'normal' | 'thick' | 'angry' | 'worried' | 'mono' | 'none';
export type FaceMark = 'none' | 'freckles' | 'rosy' | 'scar' | 'eyepatch' | 'warpaint' | 'rune';
/** arm features: the forearm and hand of one side (a hook or a strapped mount still holds the weapon) */
export type ArmFeature = 'none' | 'hook' | 'wooden' | 'clockwork' | 'missing' | 'bandaged' | 'tattoo';
/** leg features: the shin and foot of one side (a peg still walks) */
export type LegFeature = 'none' | 'peg' | 'clockwork' | 'bandaged';
/** sub-style of the head type (cap: coif/mushroom/flaps/feather/goggles/cogcap; helm: kettle/shell/winged/finned/nasal;
 *  greathelm: bucket/great/grille/spiked; horned: horns/antlers; hood: pointed/cowl/deep/ranger; crown: gold/drowned;
 *  bandana: tied/mask) */
export type HeadStyle =
  | 'coif' | 'mushroom' | 'flaps' | 'feather' | 'goggles' | 'cogcap' | 'soft'
  | 'kettle' | 'shell' | 'winged' | 'finned' | 'nasal'
  | 'bucket' | 'great' | 'grille' | 'spiked'
  | 'horns' | 'antlers'
  | 'pointed' | 'cowl' | 'deep' | 'ranger'
  | 'gold' | 'drowned'
  | 'tied' | 'mask';
export type Crest = 'none' | 'plume' | 'flame' | 'halo' | 'spikes' | 'pipes' | 'fin' | 'gem';
export type Visor = 'slit' | 'cross' | 'grille' | 'glow';
export type Pauldron = 'none' | 'round' | 'layered' | 'spiked' | 'shell' | 'fur' | 'royal' | 'winged' | 'massive' | 'leather' | 'shroom' | 'gear';
export type CapeStyle = 'full' | 'short' | 'tattered';
export type Over = 'none' | 'tabard' | 'surcoat' | 'apron' | 'stole' | 'mantle' | 'vest';
export type Emblem =
  | 'none' | 'cross' | 'shovel' | 'trident' | 'leaf' | 'antler' | 'flame' | 'anvil' | 'sun' | 'eye'
  | 'star' | 'cog' | 'gauge' | 'padlock' | 'spores' | 'rat' | 'skull' | 'moon' | 'drop';
export type Texture = 'none' | 'rings' | 'scales' | 'dents' | 'studs' | 'cracks' | 'spots' | 'stitches' | 'patches';
export type Hands = 'skin' | 'glove' | 'gauntlet' | 'wraps';
export type BodyExtra = 'none' | 'boiler' | 'pouches' | 'bandolier' | 'suspenders' | 'quiver' | 'tie';
export type LegStyle = 'trousers' | 'greaves' | 'chausses' | 'boots' | 'wraps' | 'waders' | 'hose' | 'slippers' | 'slacks' | 'leggings' | 'scales' | 'bare';

export interface JoeLook {
  skin: string;
  hair: string;
  head: HeadGear;
  headColor: string;
  body: BodyGear;
  bodyColor: string;
  trim: string;
  legsColor: string;
  // ---- the person
  hairStyle?: HairStyle;
  beard?: Beard;
  /** heavy, tired eyelids (Hollow Joe) */
  lids?: boolean;
  /** eye colour (default: plain dark dots) */
  eyes?: string;
  eyeShape?: EyeShape;
  nose?: NoseShape;
  brows?: Brows;
  mark?: FaceMark;
  /** left (off-hand) and right (weapon-hand) arm, left and right leg */
  armL?: ArmFeature;
  armR?: ArmFeature;
  legL?: LegFeature;
  legR?: LegFeature;
  // ---- head piece extras
  headStyle?: HeadStyle;
  /** band / rim / embroidery colour on the head piece (defaults to trim) */
  headTrim?: string;
  crest?: Crest;
  crestColor?: string;
  visor?: Visor;
  /** glowing eyes in a shadowed hood or behind a visor */
  eyeGlow?: string;
  /** a woman's build and face (D183): narrower shoulders and waist, wider hips, lashes, lips, a chest wrap when bare */
  female?: boolean;
  // ---- body piece extras
  pauldrons?: Pauldron;
  cape?: string;
  capeLining?: string;
  capeStyle?: CapeStyle;
  over?: Over;
  overColor?: string;
  emblem?: Emblem;
  emblemColor?: string;
  belt?: string;
  /** rivets, buckles, studs */
  metal?: string;
  /** glowing seams / embroidery */
  glow?: string;
  texture?: Texture;
  hands?: Hands;
  extra?: BodyExtra;
  // ---- legs piece extras
  legs?: LegStyle;
  bootColor?: string;
  legMetal?: string;
}

export type HeadExtras = Pick<JoeLook, 'headStyle' | 'headTrim' | 'crest' | 'crestColor' | 'visor' | 'eyeGlow'>;
export type BodyExtras = Pick<
  JoeLook,
  'pauldrons' | 'cape' | 'capeLining' | 'capeStyle' | 'over' | 'overColor' | 'emblem' | 'emblemColor' | 'belt' | 'metal' | 'glow' | 'texture' | 'hands' | 'extra'
>;
export type LegExtras = Pick<JoeLook, 'legs' | 'bootColor' | 'legMetal'>;

export const DEFAULT_LOOK: JoeLook = {
  skin: '#e8c9a0',
  hair: '#4a3626',
  head: 'none',
  headColor: '#777',
  body: 'shirt',
  bodyColor: '#6a7f9a',
  trim: '#c9b98a',
  legsColor: '#3d3a4a',
};

/** An item held in one hand. */
export interface HandPose {
  /** grip position in body space */
  x: number;
  y: number;
  /** item angle (radians, world); the item is drawn pointing along +x after rotation */
  a: number;
  /** draws the item with its grip at the origin, pointing along +x */
  draw?: (ctx: CanvasRenderingContext2D) => void;
  /** 'grip' (default): the fingers close over a handle, drawn on top; 'shield': the hand is behind the item */
  hold?: 'grip' | 'shield';
  /** force the draw layer (otherwise from the hand's depth) */
  layer?: 'front' | 'back';
}

export interface JoePose {
  x: number;
  y: number;
  facing: number;
  t: number;
  /** 0..1 walk cycle intensity */
  moving: number;
  /** squash/stretch amount (attack windup negative, release positive) */
  squash?: number;
  flash?: boolean;
  tint?: 'red' | 'blue' | null;
  alpha?: number;
  /** grey desaturation (downed ghost) */
  ghost?: boolean;
  scale?: number;
  /** both hands on the main weapon */
  twoHanded?: boolean;
  blocking?: boolean;
  /** main (right) hand item; preferred over drawWeapon */
  main?: HandPose;
  /** off (left) hand item; preferred over drawOffhand */
  off?: HandPose;
  /** 0..1 progress of a flask drink (left hand lifts the Thermos) */
  drink?: number;
  /** legacy: draws the weapon in body space (the caller translates to the right hand) */
  drawWeapon?: (ctx: CanvasRenderingContext2D) => void;
  /** legacy: draws the off-hand item in body space */
  drawOffhand?: (ctx: CanvasRenderingContext2D) => void;
}

// ------------------------------------------------------------------ proportions (body space)
const K = 0.42; // ground-plane depth squash for offsets around the body
const SY = -8.5; // shoulder line
const WY = -0.5; // waist
const HY = 4.5; // hips
const FY = 14; // feet on the ground
const HEAD_Y = -19.5;
const HR = 8; // head radius
const SW = 10.5; // shoulder half-width (lateral) / chest depth
const SD = 6.2;
const WW = 7.4;
const WD = 5.4;
const HW = 8;
const HD = 5.6;
/** a woman's shoulders, waist and hips (D183) */
const SW_F = 9.4;
const WW_F = 6.3;
const HW_F = 8.8;
const TAU = Math.PI * 2;

/** Default grips (match the long-standing caller convention). */
export function mainGripAt(facing: number): { x: number; y: number; a: number } {
  return { x: Math.cos(facing + 0.9) * 10, y: Math.sin(facing + 0.9) * 10 + 2, a: facing + 0.7 };
}
export function offGripAt(facing: number): { x: number; y: number; a: number } {
  return { x: Math.cos(facing - 1.1) * 13, y: Math.sin(facing - 1.1) * 13 + 2, a: facing };
}

interface Rig {
  c: CanvasRenderingContext2D;
  L: JoeLook;
  f: number;
  fx: number;
  fy: number;
  t: number;
  mv: number;
  ph: number;
  flash: boolean;
  ghost: boolean;
  /** projected half widths of shoulders, waist, hips */
  sw: number;
  ww: number;
  hw: number;
  /** lateral shoulder half-width before projection (narrower on a woman, D183) */
  shW: number;
  /** screen x of the torso's front centre, and how flat-on the front is seen (0..1) */
  fcx: number;
  sqz: number;
}

const clamp = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v);
const proj = (w: number, d: number, fx: number, fy: number): number => Math.sqrt(w * w * fy * fy + d * d * fx * fx);

const greyCache = new Map<string, string>();
function greyOf(hex: string): string {
  let g = greyCache.get(hex);
  if (!g) {
    const [r, gg, b] = hexToRgb(hex);
    const l = 0.3 * r + 0.59 * gg + 0.11 * b;
    const v = (x: number): number => Math.round(clamp(x, 0, 255));
    g = `#${((1 << 24) | (v(l * 0.62 + 52) << 16) | (v(l * 0.62 + 52) << 8) | v(l * 0.64 + 62)).toString(16).slice(1)}`;
    greyCache.set(hex, g);
  }
  return g;
}
const liftCache = new Map<string, string>();
/** near-black fills are lifted a little so they stay apart from the outline on dark floors */
function lift(hex: string): string {
  let o = liftCache.get(hex);
  if (!o) {
    const [r, g, b] = hexToRgb(hex);
    const l = 0.3 * r + 0.59 * g + 0.11 * b;
    o = l >= 46 ? hex : mix(hex, '#5a5468', 0.3 * (1 - l / 46) + 0.08);
    liftCache.set(hex, o);
  }
  return o;
}
/** resolve a colour for flash / ghost */
function C(r: Rig, hex: string): string {
  return r.flash ? '#ffffff' : r.ghost ? greyOf(hex) : lift(hex);
}
const shadeCache = new Map<string, string>();
/** shaded colour, resolved (shades are cached: they are asked for every frame) */
function S(r: Rig, hex: string, k: number): string {
  if (r.flash) return '#ffffff';
  const key = hex + k;
  let s = shadeCache.get(key);
  if (!s) {
    s = shade(hex, k);
    if (shadeCache.size > 4000) shadeCache.clear();
    shadeCache.set(key, s);
  }
  return C(r, s);
}

/** Fill the region inside both circles (a lens) without a clip. */
function lens(c: CanvasRenderingContext2D, x1: number, y1: number, r1: number, x2: number, y2: number, r2: number, fill: string): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const d = Math.hypot(dx, dy);
  c.beginPath();
  if (d >= r1 + r2) return;
  if (d <= Math.abs(r1 - r2)) {
    if (r1 < r2) c.arc(x1, y1, r1, 0, TAU);
    else c.arc(x2, y2, r2, 0, TAU);
  } else {
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const t12 = Math.atan2(dy, dx);
    const al = Math.acos(clamp(a / r1, -1, 1));
    const be = Math.acos(clamp((d - a) / r2, -1, 1));
    c.arc(x1, y1, r1, t12 - al, t12 + al);
    c.arc(x2, y2, r2, t12 + Math.PI - be, t12 + Math.PI + be);
    c.closePath();
  }
  c.fillStyle = fill;
  c.fill();
}

// ------------------------------------------------------------------ low-level shapes
function ell(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, ow = 2, rot = 0): void {
  c.beginPath();
  c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU);
  c.fillStyle = fill;
  c.fill();
  if (ow > 0) {
    c.lineWidth = ow;
    c.strokeStyle = OUTLINE;
    c.stroke();
  }
}
/** a domed plate seen from above-front: an arched top over a gently sagging lower edge */
function dome(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, fill: string, ow = 2): void {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, Math.PI, TAU);
  c.quadraticCurveTo(x, y + ry * 0.7, x - rx, y);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (ow > 0) {
    c.lineJoin = 'round';
    c.lineWidth = ow;
    c.strokeStyle = OUTLINE;
    c.stroke();
  }
}
function polyF(c: CanvasRenderingContext2D, pts: number[], fill: string, ow = 2): void {
  c.beginPath();
  c.moveTo(pts[0]!, pts[1]!);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i]!, pts[i + 1]!);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  if (ow > 0) {
    c.lineJoin = 'round';
    c.lineWidth = ow;
    c.strokeStyle = OUTLINE;
    c.stroke();
  }
}
function line(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string, w: number): void {
  c.strokeStyle = color;
  c.lineWidth = w;
  c.beginPath();
  c.moveTo(x1, y1);
  c.lineTo(x2, y2);
  c.stroke();
}
function dot(c: CanvasRenderingContext2D, x: number, y: number, rad: number, fill: string): void {
  c.fillStyle = fill;
  c.beginPath();
  c.arc(x, y, rad, 0, TAU);
  c.fill();
}
/** a jointed limb a→b→e: outline first, then two coloured segments, so the joint has no seam */
function limb2(c: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, ex: number, ey: number, w1: number, w2: number, c1: string, c2: string): void {
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.strokeStyle = OUTLINE;
  c.lineWidth = Math.max(w1, w2) + 3;
  c.beginPath();
  c.moveTo(ax, ay);
  c.lineTo(bx, by);
  c.lineTo(ex, ey);
  c.stroke();
  line(c, ax, ay, bx, by, c1, w1);
  line(c, bx, by, ex, ey, c2, w2);
}

// ------------------------------------------------------------------ main entry
export function drawJoe(ctx: CanvasRenderingContext2D, look: JoeLook, p: JoePose): void {
  const s = p.scale ?? 1;
  const sq = p.squash ?? 0;
  const f = p.facing;
  const fx = Math.cos(f);
  const fy = Math.sin(f);
  const ghost = !!p.ghost;
  const mv = ghost ? 0 : clamp(p.moving, 0, 1);
  const r: Rig = {
    c: ctx,
    L: look,
    f,
    fx,
    fy,
    t: p.t,
    mv,
    ph: p.t * 12,
    flash: !!p.flash,
    ghost,
    // a woman (D183): shoulders and waist a little narrower, hips a little wider
    sw: proj(look.female ? SW_F : SW, SD, fx, fy),
    ww: proj(look.female ? WW_F : WW, WD, fx, fy),
    hw: proj(look.female ? HW_F : HW, HD, fx, fy),
    shW: look.female ? SW_F : SW,
    fcx: fx * SD * 0.85,
    sqz: Math.max(0.22, Math.abs(fy)),
  };
  ctx.save();
  ctx.globalAlpha *= p.alpha ?? 1;
  shadow(ctx, p.x, p.y + 3.5, 13.5 * s);
  ctx.translate(p.x, p.y);
  ctx.scale(s * (1 - sq * 0.12), s * (1 + sq * 0.12));
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // upper body: bob and lean into the walk; slump when downed
  const bob = Math.abs(Math.sin(r.ph)) * 1.3 * mv + Math.sin(p.t * 2.2) * 0.35 * (1 - mv);
  const ux = fx * 0.9 * mv;
  const uy = -bob + fy * 0.4 * mv + (ghost ? 3 : 0);

  const groups = planArms(r, p);
  const hasCape = !!look.cape || look.body === 'cloak';
  const capeFront = hasCape && fy < -0.25;

  ctx.translate(ux, uy);
  if (hasCape && !capeFront) drawCape(r, false);
  if (fy > -0.2) hairBack(r);
  for (const g of groups) if (!g.front) drawGroup(r, g, true);
  drawLegs(r, ux, uy);
  drawLower(r);
  drawTorso(r);
  if (capeFront) drawCape(r, true);
  drawCollar(r);
  for (const g of groups) if (!g.front) for (const a of g.arms) if (!a.pauldronInGroup) pauldron(r, a);
  const hx = fx * 1.1;
  const hy = HEAD_Y + fy * 0.7 + (ghost ? 1.5 : 0);
  drawHead(r, hx, hy);
  for (const g of groups) if (g.front) drawGroup(r, g, false);
  ctx.restore();

  if (p.tint === 'red') {
    glow(ctx, p.x, p.y, 34 * s, '#ff3b3b', 0.55 + Math.sin(p.t * 20) * 0.2);
  } else if (p.tint === 'blue') {
    glow(ctx, p.x, p.y, 34 * s, '#8fd3ff', 0.55);
  }
}

// ------------------------------------------------------------------ arms and held items
interface ArmPlan {
  side: 1 | -1;
  sx: number;
  sy: number;
  hx: number;
  hy: number;
  pauldronInGroup: boolean;
  showHand: boolean;
  /** the hand holds nothing (a missing arm shows its tied sleeve) */
  free?: boolean;
}
interface Group {
  front: boolean;
  arms: ArmPlan[];
  /** item drawn at a grip */
  item?: HandPose;
  /** legacy body-space item */
  legacy?: (ctx: CanvasRenderingContext2D) => void;
  hold: 'grip' | 'shield';
  thermos?: { x: number; y: number; a: number };
}

function shoulderOf(r: Rig, side: 1 | -1): { x: number; y: number; depth: number } {
  // lateral right axis on the ground is (-fy, fx)
  return { x: -r.fy * (r.shW - 1.6) * side, y: SY + 1.2 + r.fx * r.shW * K * 0.8 * side, depth: r.fx * side };
}

function isFront(r: Rig, hy: number, side: 1 | -1): boolean {
  return hy - 2 + r.fx * side * r.shW * K * 0.5 > 0;
}

function freeHand(r: Rig, side: 1 | -1): { x: number; y: number } {
  const a = r.f + 1.38 * side;
  const swing = -Math.sin(r.ph) * 3.2 * r.mv * side;
  return { x: Math.cos(a) * 10.2 + r.fx * swing, y: Math.sin(a) * 10.2 + 3.6 + r.fy * swing * 0.6 };
}

function planArms(r: Rig, p: JoePose): Group[] {
  const groups: Group[] = [];
  const shR = shoulderOf(r, 1);
  const shL = shoulderOf(r, -1);
  const far = (d: number): boolean => d < -0.6;
  // main hand
  const mg = p.main ?? (p.drawWeapon ? mainGripAt(r.f) : null);
  const main: Group = { front: true, arms: [], hold: 'grip' };
  if (mg) {
    main.front = p.main?.layer ? p.main.layer === 'front' : isFront(r, mg.y, 1);
    main.arms.push({ side: 1, sx: shR.x, sy: shR.y, hx: mg.x, hy: mg.y, pauldronInGroup: main.front || far(shR.depth), showHand: true });
    if (p.main) main.item = p.main;
    else if (p.drawWeapon) main.legacy = p.drawWeapon;
  } else {
    const h = freeHand(r, 1);
    main.front = isFront(r, h.y, 1);
    main.arms.push({ side: 1, sx: shR.x, sy: shR.y, hx: h.x, hy: h.y, pauldronInGroup: main.front || far(shR.depth), showHand: true, free: true });
  }
  groups.push(main);
  // off hand
  const drink = p.drink ?? 0;
  if (p.twoHanded && mg && drink <= 0) {
    const gx = mg.x - Math.cos(mg.a) * 6.5;
    const gy = mg.y - Math.sin(mg.a) * 6.5;
    main.arms.unshift({ side: -1, sx: shL.x, sy: shL.y, hx: gx, hy: gy, pauldronInGroup: main.front || far(shL.depth), showHand: true });
    return groups;
  }
  const off: Group = { front: true, arms: [], hold: 'grip' };
  if (drink > 0) {
    const up = clamp(Math.min(drink * 4, (1 - drink) * 4), 0, 1);
    const rest = freeHand(r, -1);
    const mx = r.fx * 5.5 - r.fy * 1.5;
    const my = HEAD_Y + 5 + r.fy * 2.5;
    const hx = rest.x + (mx - rest.x) * up;
    const hy = rest.y + (my - rest.y) * up;
    off.front = r.fy > -0.3;
    off.arms.push({ side: -1, sx: shL.x, sy: shL.y, hx, hy, pauldronInGroup: off.front || far(shL.depth), showHand: true });
    off.thermos = { x: hx, y: hy, a: -Math.PI / 2 + (r.fx * 0.9 + 0.3) * up };
  } else {
    const og = p.off ?? (p.drawOffhand ? offGripAt(r.f) : null);
    if (og) {
      off.front = p.off?.layer ? p.off.layer === 'front' : isFront(r, og.y, -1);
      off.hold = p.off?.hold ?? (p.drawOffhand ? 'shield' : 'grip');
      off.arms.push({ side: -1, sx: shL.x, sy: shL.y, hx: og.x, hy: og.y, pauldronInGroup: off.front || far(shL.depth), showHand: true });
      if (p.off) off.item = p.off;
      else if (p.drawOffhand) off.legacy = p.drawOffhand;
    } else {
      const h = freeHand(r, -1);
      off.front = isFront(r, h.y, -1);
      off.arms.push({ side: -1, sx: shL.x, sy: shL.y, hx: h.x, hy: h.y, pauldronInGroup: off.front || far(shL.depth), showHand: true, free: true });
    }
  }
  groups.push(off);
  return groups;
}

function drawGroup(r: Rig, g: Group, back: boolean): void {
  const c = r.c;
  for (const a of g.arms) {
    drawArm(r, a);
    if (a.pauldronInGroup || !back) pauldron(r, a);
  }
  if (g.hold === 'shield') for (const a of g.arms) armHand(r, a);
  if (g.item?.draw) {
    c.save();
    c.translate(g.item.x, g.item.y);
    c.rotate(g.item.a);
    g.item.draw(c);
    c.restore();
  } else if (g.legacy) {
    c.save();
    g.legacy(c);
    c.restore();
  }
  if (g.thermos) thermos(r, g.thermos.x, g.thermos.y, g.thermos.a);
  if (g.hold === 'grip') for (const a of g.arms) armHand(r, a);
}

function armHand(r: Rig, a: ArmPlan): void {
  if (a.free && armFeat(r.L, a.side) === 'missing') return;
  hand(r, a.hx, a.hy, a.hx - a.sx, a.hy - a.sy, a.side);
}

const armFeat = (L: JoeLook, side: 1 | -1): ArmFeature => (side === 1 ? L.armR : L.armL) ?? 'none';
const legFeat = (L: JoeLook, side: 1 | -1): LegFeature => (side === 1 ? L.legR : L.legL) ?? 'none';
const WOOD = '#a87a4a';
const BRASS = '#c09a48';
const WRAPS = '#e6dcc4';
const INK = '#2c4f7a';

/** marks along a forearm a→b: bandage turns, tattoo lines, clockwork rivets, wood grain */
function forearmDetail(r: Rig, feat: ArmFeature, ex: number, ey: number, hx: number, hy: number): void {
  const c = r.c;
  const dx = hx - ex;
  const dy = hy - ey;
  const l = Math.hypot(dx, dy) || 1;
  const nx = -dy / l;
  const ny = dx / l;
  switch (feat) {
    case 'bandaged':
      for (const k of [0.25, 0.5, 0.75]) {
        const x = ex + dx * k;
        const y = ey + dy * k;
        line(c, x + nx * 2 - dx * 0.06, y + ny * 2 - dy * 0.06, x - nx * 2 + dx * 0.06, y - ny * 2 + dy * 0.06, S(r, WRAPS, 0.72), 0.8);
      }
      break;
    case 'tattoo':
      line(c, ex + dx * 0.25 + nx, ey + dy * 0.25 + ny, ex + dx * 0.45 - nx, ey + dy * 0.45 - ny, C(r, INK), 0.9);
      line(c, ex + dx * 0.45 - nx, ey + dy * 0.45 - ny, ex + dx * 0.65 + nx, ey + dy * 0.65 + ny, C(r, INK), 0.9);
      dot(c, ex + dx * 0.8, ey + dy * 0.8, 0.7, C(r, INK));
      break;
    case 'clockwork':
      line(c, ex + dx * 0.2, ey + dy * 0.2, ex + dx * 0.8, ey + dy * 0.8, S(r, BRASS, 0.55), 1.1);
      dot(c, ex, ey, 2.2, S(r, BRASS, 0.7));
      dot(c, ex, ey, 0.9, C(r, '#3a2a14'));
      dot(c, ex + dx * 0.55 + nx * 1.2, ey + dy * 0.55 + ny * 1.2, 0.55, C(r, '#fff1c0'));
      break;
    case 'wooden':
    case 'missing':
      line(c, ex + dx * 0.2 + nx * 0.6, ey + dy * 0.2 + ny * 0.6, ex + dx * 0.85 + nx * 0.4, ey + dy * 0.85 + ny * 0.4, S(r, WOOD, 0.68), 0.7);
      // the leather strap where it meets the arm
      line(c, ex + nx * 2.4 + dx * 0.08, ey + ny * 2.4 + dy * 0.08, ex - nx * 2.4 + dx * 0.08, ey - ny * 2.4 + dy * 0.08, C(r, '#5a3a22'), 1.6);
      break;
    default:
      break;
  }
}

/** a missing arm with a free hand: a short stump in its sleeve, the empty cuff tied in a knot */
function tiedSleeve(r: Rig, a: ArmPlan, upper: string, skin: boolean): void {
  const c = r.c;
  const dx = a.hx - a.sx;
  const dy = a.hy - a.sy;
  const l = Math.hypot(dx, dy) || 1;
  const ux = dx / l;
  const uy = dy / l;
  const ex = a.sx + ux * 4.2;
  const ey = a.sy + uy * 4.2 + 0.6;
  c.lineCap = 'round';
  line(c, a.sx, a.sy, ex, ey, OUTLINE, 7.4);
  line(c, a.sx, a.sy, ex, ey, upper, 4.4);
  if (skin) {
    // a bare stump, bound with a strip of cloth
    line(c, ex - uy * 2.2, ey + ux * 2.2, ex + uy * 2.2, ey - ux * 2.2, C(r, WRAPS), 1.4);
    return;
  }
  // the knot and the two tails of the folded-up sleeve
  ell(c, ex + ux * 1.2, ey + uy * 1.2, 1.7, 1.5, upper, 1.2);
  const sw = Math.sin(r.t * 5) * 0.6 * (0.3 + r.mv);
  polyF(c, [ex + ux * 1.8, ey + uy * 1.8, ex + ux * 4.6 - uy * 1.8 + sw, ey + uy * 4.6 + ux * 1.8, ex + ux * 3.2 - uy * 0.2, ey + uy * 3.2 + ux * 0.2], upper, 1);
  polyF(c, [ex + ux * 1.8, ey + uy * 1.8, ex + ux * 4.2 + uy * 1.9 - sw, ey + uy * 4.2 - ux * 1.9, ex + ux * 3.2 + uy * 0.3, ey + uy * 3.2 - ux * 0.3], upper, 1);
}

interface ArmLook {
  upper: string;
  fore: string;
  cuff: string | null;
  wide: boolean;
  bracer: string | null;
  elbow: string | null;
}
function armLook(r: Rig): ArmLook {
  const L = r.L;
  const b = L.bodyColor;
  switch (L.body) {
    case 'plate':
      return { upper: S(r, b, 0.85), fore: S(r, b, 1.05), cuff: null, wide: false, bracer: null, elbow: S(r, b, 1.2) };
    case 'chain': {
      const m = mailOf(L);
      return { upper: C(r, m), fore: C(r, m), cuff: S(r, glove(L), 1), wide: false, bracer: null, elbow: null };
    }
    case 'leather':
      return { upper: S(r, b, 0.82), fore: S(r, b, 0.82), cuff: null, wide: false, bracer: S(r, b, 0.58), elbow: null };
    case 'robe':
      return { upper: C(r, b), fore: C(r, b), cuff: C(r, L.trim), wide: true, bracer: null, elbow: null };
    case 'bathrobe':
      return { upper: C(r, b), fore: C(r, b), cuff: S(r, b, 1.2), wide: true, bracer: null, elbow: null };
    case 'cloak':
      return { upper: S(r, b, 0.8), fore: C(r, '#cfc4a8'), cuff: null, wide: false, bracer: null, elbow: null };
    case 'suit':
      return { upper: C(r, b), fore: C(r, b), cuff: C(r, '#efe6d2'), wide: false, bracer: null, elbow: null };
    case 'loincloth':
      return { upper: C(r, L.skin), fore: C(r, L.skin), cuff: null, wide: false, bracer: null, elbow: null };
    case 'shirt':
    default:
      return { upper: C(r, b), fore: C(r, L.skin), cuff: null, wide: false, bracer: null, elbow: null };
  }
}

function drawArm(r: Rig, a: ArmPlan): void {
  const c = r.c;
  const dx = a.hx - a.sx;
  const dy = a.hy - a.sy;
  const len = Math.hypot(dx, dy) || 1;
  let nx = -dy / len;
  let ny = dx / len;
  // elbows bend outward, down and behind
  const out = clamp(a.sx / 5, -1, 1);
  const px = -r.fx * 0.7 + out * 0.6;
  const py = 0.65 - r.fy * 0.2;
  if (nx * px + ny * py < 0) {
    nx = -nx;
    ny = -ny;
  }
  const bend = clamp((15.5 - len) * 0.42, 0.8, 4.2);
  const ex = (a.sx + a.hx) / 2 + nx * bend;
  const ey = (a.sy + a.hy) / 2 + ny * bend;
  const al = armLook(r);
  const feat = armFeat(r.L, a.side);
  const sleeve = al.fore;
  if (feat !== 'none') {
    if (feat === 'missing' && a.free) {
      tiedSleeve(r, a, al.upper, r.L.body === 'loincloth');
      return;
    }
    // prosthetics show through any sleeve; tattoos only on bare skin
    if (feat === 'wooden' || feat === 'missing') al.fore = C(r, WOOD);
    else if (feat === 'clockwork') al.fore = C(r, BRASS);
    else if (feat === 'bandaged') al.fore = C(r, WRAPS);
    if (feat !== 'tattoo' && feat !== 'hook' && !al.wide) {
      al.bracer = null;
      al.cuff = null;
    }
  }
  if (al.wide) {
    limb2(c, a.sx, a.sy, ex, ey, a.hx, a.hy, 4.6, 4.6, al.upper, al.fore);
    // the flared sleeve: a trapezoid widening to the wrist, with an embroidered cuff
    const ux = a.hx - ex;
    const uy = a.hy - ey;
    const ul = Math.hypot(ux, uy) || 1;
    const qx = -uy / ul;
    const qy = ux / ul;
    const wx = a.hx - (ux / ul) * 1.8;
    const wy = a.hy - (uy / ul) * 1.8;
    polyF(c, [ex + qx * 2.3, ey + qy * 2.3, wx + qx * 4.2, wy + qy * 4.2, wx - qx * 4.2, wy - qy * 4.2, ex - qx * 2.3, ey - qy * 2.3], sleeve, 1.6);
    if (al.cuff) line(c, wx + qx * 3.6, wy + qy * 3.6, wx - qx * 3.6, wy - qy * 3.6, al.cuff, 1.6);
    return;
  }
  const foreSkin = al.fore === C(r, r.L.skin);
  if (feat === 'missing') {
    // the stump to the elbow, then a strapped-on wooden mount that holds the item
    limb2(c, a.sx, a.sy, ex, ey, ex, ey, 4.4, 4.4, al.upper, al.upper);
    line(c, ex, ey, a.hx, a.hy, OUTLINE, 5);
    line(c, ex, ey, a.hx, a.hy, al.fore, 2.3);
  } else limb2(c, a.sx, a.sy, ex, ey, a.hx, a.hy, 4.4, 3.9, al.upper, al.fore);
  if (feat !== 'none' && (feat !== 'tattoo' || foreSkin)) forearmDetail(r, feat, ex, ey, a.hx, a.hy);
  if (al.elbow) dot(c, ex, ey, 1.6, al.elbow);
  if (al.bracer) {
    const bx = ex + (a.hx - ex) * 0.55;
    const by = ey + (a.hy - ey) * 0.55;
    line(c, ex + (a.hx - ex) * 0.25, ey + (a.hy - ey) * 0.25, bx + (a.hx - ex) * 0.2, by + (a.hy - ey) * 0.2, al.bracer, 4.6);
    dot(c, bx, by, 0.9, C(r, r.L.metal ?? '#c9b98a'));
  }
  if (al.cuff) {
    const k = 0.78;
    dot(c, ex + (a.hx - ex) * k, ey + (a.hy - ey) * k, 2.5, al.cuff);
  }
}

function glove(L: JoeLook): string {
  return L.body === 'chain' ? '#5a3d26' : shade(L.bodyColor, 0.55);
}
function handStyle(L: JoeLook): Hands {
  if (L.hands) return L.hands;
  if (L.body === 'plate') return 'gauntlet';
  if (L.body === 'chain') return 'glove';
  return 'skin';
}
function hand(r: Rig, x: number, y: number, dx = 0, dy = 1, side: 1 | -1 = 1): void {
  const c = r.c;
  const feat = armFeat(r.L, side);
  if (feat !== 'none' && feat !== 'tattoo') {
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    switch (feat) {
      case 'hook': {
        // a leather cuff and an iron hook curled over the grip
        ell(c, x - ux * 1.6, y - uy * 1.6, 2.4, 2.4, C(r, '#5a3a22'), 1.5);
        const a0 = Math.atan2(uy, ux);
        const cx = x + ux * 1.4;
        const cy = y + uy * 1.4;
        c.lineCap = 'round';
        for (const [col, w] of [[OUTLINE, 2.8], [C(r, '#cfd4dc'), 1.3]] as const) {
          c.strokeStyle = col;
          c.lineWidth = w;
          c.beginPath();
          c.moveTo(x - ux * 0.6, y - uy * 0.6);
          c.arc(cx, cy, 2.1, a0 + Math.PI, a0 + Math.PI * 2.3);
          c.stroke();
        }
        return;
      }
      case 'wooden':
        ell(c, x, y, 2.6, 2.5, C(r, WOOD), 1.6);
        dot(c, x + ux * 0.8, y + uy * 0.8, 0.6, S(r, WOOD, 0.6));
        return;
      case 'clockwork':
        ell(c, x, y, 2.7, 2.6, C(r, BRASS), 1.6);
        line(c, x - uy * 1.8, y + ux * 1.8, x + uy * 1.8, y - ux * 1.8, S(r, BRASS, 0.6), 0.8);
        if (!r.flash) dot(c, x - 0.8, y - 0.9, 0.7, 'rgba(255,255,255,0.7)');
        return;
      case 'missing':
        // the iron cap at the end of the mount
        ell(c, x, y, 2.1, 2.1, C(r, '#6a6a74'), 1.5);
        return;
      case 'bandaged':
        ell(c, x, y, 2.7, 2.7, C(r, WRAPS), 1.6);
        line(c, x - uy * 2, y + ux * 2, x + uy * 2, y - ux * 2, S(r, WRAPS, 0.72), 0.7);
        return;
    }
  }
  const hs = handStyle(r.L);
  if (hs === 'gauntlet') {
    // an armoured fist with a flared cuff at the wrist
    const m = shade(r.L.body === 'plate' ? r.L.bodyColor : r.L.metal ?? r.L.bodyColor, 1.15);
    const l = Math.hypot(dx, dy) || 1;
    const ux = dx / l;
    const uy = dy / l;
    const wx = x - ux * 2.6;
    const wy = y - uy * 2.6;
    c.lineCap = 'butt';
    line(c, wx - uy * 3.6, wy + ux * 3.6, wx + uy * 3.6, wy - ux * 3.6, OUTLINE, 3.6);
    line(c, wx - uy * 2.9, wy + ux * 2.9, wx + uy * 2.9, wy - ux * 2.9, C(r, shade(m, 0.9)), 1.8);
    c.lineCap = 'round';
    ell(c, x, y, 2.8, 2.8, C(r, m), 1.6);
    if (!r.flash) dot(c, x - 0.9, y - 0.9, 0.8, 'rgba(255,255,255,0.7)');
    return;
  }
  const col = hs === 'glove' ? glove(r.L) : hs === 'wraps' ? '#cfc4a8' : r.L.skin;
  ell(c, x, y, 2.7, 2.7, C(r, col), 1.6);
}

function thermos(r: Rig, x: number, y: number, a: number): void {
  const c = r.c;
  c.save();
  c.translate(x, y);
  c.rotate(a);
  // a dented green Thermos with a steel cup-lid
  polyF(c, [-3, -2.6, 6, -2.6, 6, 2.6, -3, 2.6], C(r, '#4a7a5a'), 1.6);
  polyF(c, [6, -2.2, 9, -2.2, 9, 2.2, 6, 2.2], C(r, '#c9ced6'), 1.4);
  line(c, -1, -2.6, -1, 2.6, S(r, '#4a7a5a', 0.7), 1);
  c.restore();
  hand(r, x, y, 0, 1, -1);
}

// ------------------------------------------------------------------ pauldrons
function pauldron(r: Rig, a: ArmPlan): void {
  const L = r.L;
  const st = L.pauldrons ?? 'none';
  if (st === 'none' || st === 'fur') return;
  const c = r.c;
  const out = clamp(a.sx / 6, -1, 1);
  const x = a.sx + out * 1.3;
  const y = a.sy - 1;
  const base = L.body === 'plate' || L.body === 'chain' ? L.bodyColor : shade(L.bodyColor, 0.8);
  const metal = L.metal ?? L.trim;
  const rx = 5;
  const ry = 3.5;
  switch (st) {
    case 'round':
      dome(c, x + out * 0.6, y + 3, rx - 0.5, 2.6, S(r, base, 0.82), 1.6);
      dome(c, x, y + 1.4, rx + 0.3, 4.6, C(r, base), 2);
      dot(c, x - 1.6, y - 1.2, 1, 'rgba(255,255,255,0.45)');
      dot(c, x + out * 2.8, y + 0.6, 0.7, C(r, metal));
      break;
    case 'layered':
    case 'royal':
      for (let i = 2; i >= 0; i--) {
        const lx = x + out * i * 0.6;
        const ly = y + 1.4 + i * 1.8;
        dome(c, lx, ly, rx - i * 0.4, 4.4 - i * 1, S(r, base, 1 - i * 0.1), 1.6);
        if (st === 'royal' || L.glow) {
          c.strokeStyle = C(r, L.glow ?? metal);
          c.lineWidth = 1;
          c.beginPath();
          c.moveTo(lx - rx + i * 0.4 + 0.9, ly);
          c.quadraticCurveTo(lx, ly + (4.4 - i) * 0.6, lx + rx - i * 0.4 - 0.9, ly);
          c.stroke();
        }
      }
      if (st === 'royal') dot(c, x, y - 0.6, 1.2, C(r, L.emblemColor ?? '#5fd3c0'));
      break;
    case 'spiked':
      polyF(c, [x - 2.2, y - 1.5, x + out * 2.5 - 0.5, y - 8.5, x + 1.8, y - 1.9], C(r, metal), 1.4);
      polyF(c, [x + out * 2, y - 0.5, x + out * 7.5, y - 5, x + out * 3.5, y + 1.5], C(r, metal), 1.4);
      dome(c, x + out * 0.6, y + 3, rx - 0.5, 2.6, S(r, base, 0.82), 1.6);
      dome(c, x, y + 1.4, rx, 4.6, C(r, base), 2);
      dot(c, x - 1.2, y - 1.2, 0.8, 'rgba(255,255,255,0.6)');
      break;
    case 'shell':
      ell(c, x, y + 0.5, rx + 1.6, ry + 0.6, C(r, base), 2);
      c.strokeStyle = S(r, base, 0.6);
      c.lineWidth = 1;
      c.beginPath();
      for (let i = -2; i <= 2; i++) {
        c.moveTo(x + i * 1.6, y + 1.5);
        c.lineTo(x + i * 2.1, y + 4.2);
      }
      c.stroke();
      dot(c, x - 1.8, y - 1.2, 1.1, C(r, L.glow ?? L.trim));
      dot(c, x + 1.6, y - 0.4, 0.8, C(r, L.glow ?? L.trim));
      break;
    case 'winged':
      for (let i = 0; i < 3; i++) polyF(c, [x - 1 + out * i, y - 1, x + out * (4.5 + i * 2.4), y - 8 + i * 2.6, x + out * (2 + i * 1.6), y + 0.5], C(r, i === 0 ? metal : shade(base, 1.15)), 1.2);
      dome(c, x + out * 0.6, y + 3, rx - 0.5, 2.6, S(r, base, 0.82), 1.6);
      dome(c, x, y + 1.4, rx, 4.6, C(r, base), 2);
      dot(c, x, y - 0.8, 1, C(r, metal));
      break;
    case 'massive': {
      const mx = x + out * 0.8;
      dome(c, mx, y + 2.4, rx + 2, 6.4, C(r, base), 2.2);
      c.fillStyle = C(r, metal);
      for (let i = 0; i < 5; i++) {
        const t = Math.PI * (1.12 + i * 0.19);
        c.beginPath();
        c.arc(mx + Math.cos(t) * (rx + 0.4), y + 2.4 + Math.sin(t) * 5, 0.75, 0, TAU);
        c.fill();
      }
      c.strokeStyle = S(r, base, 0.6);
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(mx - rx, y + 2.2);
      c.quadraticCurveTo(mx, y + 4.6, mx + rx, y + 2.2);
      c.stroke();
      dot(c, x - 1.5, y - 2.4, 1.1, 'rgba(255,255,255,0.55)');
      break;
    }
    case 'leather':
      dome(c, x + out * 0.4, y + 2.8, rx - 1, 2.4, S(r, base, 0.85), 1.4);
      dome(c, x, y + 1.4, rx - 0.4, 3.8, C(r, base), 1.6);
      dot(c, x, y - 0.6, 0.8, C(r, metal));
      break;
    case 'shroom':
      // little mushrooms growing out of the shoulder
      dome(c, x, y + 1.4, rx - 0.6, 3.6, C(r, base), 1.6);
      for (const [ox, oy, rr] of [[-1.5, -2.5, 2.6], [2.2, -1.2, 1.9]] as const) {
        line(c, x + ox, y + oy, x + ox, y + oy + 2.4, C(r, '#e8e1c8'), 1.4);
        ell(c, x + ox, y + oy, rr, rr * 0.7, C(r, L.trim), 1.2);
        dot(c, x + ox - 0.6, y + oy - 0.4, 0.5, C(r, '#ffffff'));
      }
      break;
    case 'gear': {
      const g = C(r, metal === L.trim ? L.bodyColor : metal);
      c.fillStyle = g;
      c.strokeStyle = OUTLINE;
      c.lineWidth = 1.4;
      c.beginPath();
      for (let i = 0; i < 16; i++) {
        const t = (i / 16) * TAU + r.t * 0.6 * a.side;
        const rr = i % 2 === 0 ? 5.2 : 4;
        c.lineTo(x + Math.cos(t) * rr, y + Math.sin(t) * rr * 0.85);
      }
      c.closePath();
      c.fill();
      c.stroke();
      ell(c, x, y, 1.6, 1.4, C(r, L.trim), 1.2);
      break;
    }
  }
}

// ------------------------------------------------------------------ legs
interface LegLook {
  thigh: string;
  shin: string;
  boot: string;
  bootTop: number; // 0 = ankle, 1 = knee
  knee: string | null;
  sabaton: boolean;
}
function legLook(r: Rig): LegLook {
  const L = r.L;
  const lc = L.legsColor;
  const st: LegStyle = L.legs ?? (L.body === 'loincloth' ? 'bare' : 'trousers');
  switch (st) {
    case 'greaves':
      return { thigh: S(r, lc, 0.85), shin: S(r, lc, 1.1), boot: S(r, lc, 0.95), bootTop: 0.15, knee: C(r, L.legMetal ?? shade(lc, 1.35)), sabaton: true };
    case 'chausses':
      return { thigh: C(r, mix(lc, '#a2a8b0', 0.55)), shin: C(r, mix(lc, '#a2a8b0', 0.55)), boot: C(r, L.bootColor ?? '#4a3322'), bootTop: 0.45, knee: null, sabaton: false };
    case 'boots':
      return { thigh: C(r, lc), shin: C(r, L.bootColor ?? '#3a2618'), boot: C(r, L.bootColor ?? '#3a2618'), bootTop: 0.95, knee: null, sabaton: false };
    case 'wraps':
      return { thigh: C(r, lc), shin: S(r, lc, 1.15), boot: S(r, lc, 0.7), bootTop: 0.1, knee: null, sabaton: false };
    case 'waders': {
      const w = L.bootColor ?? '#3d4a30';
      return { thigh: C(r, w), shin: C(r, w), boot: S(r, w, 0.85), bootTop: 0, knee: null, sabaton: false };
    }
    case 'hose':
      return { thigh: C(r, lc), shin: C(r, lc), boot: C(r, L.bootColor ?? '#2a1a10'), bootTop: 0.05, knee: null, sabaton: false };
    case 'slippers':
      return { thigh: C(r, lc), shin: C(r, lc), boot: C(r, L.bootColor ?? '#efe6d2'), bootTop: 0, knee: null, sabaton: false };
    case 'slacks':
      return { thigh: C(r, lc), shin: C(r, lc), boot: C(r, L.bootColor ?? '#0e0c10'), bootTop: 0, knee: null, sabaton: false };
    case 'leggings':
      return { thigh: C(r, lc), shin: C(r, lc), boot: C(r, L.bootColor ?? shade(lc, 0.6)), bootTop: 0.5, knee: null, sabaton: false };
    case 'scales':
      return { thigh: C(r, lc), shin: S(r, lc, 1.15), boot: S(r, lc, 0.6), bootTop: 0.3, knee: C(r, L.legMetal ?? shade(lc, 1.5)), sabaton: true };
    case 'bare':
      return { thigh: C(r, L.skin), shin: C(r, L.skin), boot: C(r, '#8a6a3a'), bootTop: 0, knee: null, sabaton: false };
    case 'trousers':
    default:
      return { thigh: C(r, lc), shin: C(r, lc), boot: C(r, L.bootColor ?? '#3b2a1f'), bootTop: 0.2, knee: null, sabaton: false };
  }
}

function drawLegs(r: Rig, ux: number, uy: number): void {
  const c = r.c;
  const { fx, fy, mv, ph } = r;
  const ll = legLook(r);
  const st = r.L.legs;
  const robe = r.L.body === 'robe';
  const order: (1 | -1)[] = fx >= 0 ? [-1, 1] : [1, -1];
  // the nearer foot is drawn last
  const feet = order.map((side) => {
    const step = Math.sin(r.ph) * 4.6 * mv * side;
    const lift = Math.max(0, Math.cos(ph) * side) * 2.3 * mv;
    const lat = 4.1;
    const hipX = -fy * lat * side;
    const hipY = HY + 0.8 + fx * lat * K * side;
    const footX = -fy * (lat + 0.3) * side + fx * step - ux;
    const footY = FY + fx * lat * K * side + fy * step * 0.55 - lift - uy;
    return { side, hipX, hipY, footX, footY, lift };
  });
  if (feet[0]!.footY > feet[1]!.footY) feet.reverse();
  for (const ft of feet) {
    const ax = ft.footX;
    const ay = ft.footY - 1.4;
    const kx = (ft.hipX + ax) / 2 + fx * 1.3 * (0.35 + ft.lift * 0.45);
    const ky = (ft.hipY + ay) / 2 + fy * 0.7 * (0.35 + ft.lift * 0.45);
    const lf = legFeat(r.L, ft.side);
    if (lf === 'peg' || lf === 'clockwork') {
      // the thigh in its trousers, then a wooden peg or a brass leg from the knee down (same walk cycle)
      if (!robe) limb2(c, ft.hipX, ft.hipY, kx, ky, kx, ky, 5.4, 5.4, ll.thigh, ll.thigh);
      const k0x = robe ? ax + (kx - ax) * 0.45 : kx;
      const k0y = robe ? ay + (ky - ay) * 0.45 : ky;
      const tx = ft.footX + fx * 0.4;
      const ty = ft.footY + 0.4;
      const dl = Math.hypot(tx - k0x, ty - k0y) || 1;
      const nx = -(ty - k0y) / dl;
      const ny = (tx - k0x) / dl;
      if (lf === 'peg') {
        polyF(c, [k0x + nx * 2.7, k0y + ny * 2.7, tx + nx * 1.3, ty + ny * 1.3, tx - nx * 1.3, ty - ny * 1.3, k0x - nx * 2.7, k0y - ny * 2.7], C(r, WOOD), 1.6);
        line(c, k0x + (tx - k0x) * 0.25, k0y + (ty - k0y) * 0.25, k0x + (tx - k0x) * 0.8, k0y + (ty - k0y) * 0.8, S(r, WOOD, 0.68), 0.7);
        if (!robe) line(c, k0x + nx * 2.9, k0y + ny * 2.9, k0x - nx * 2.9, k0y - ny * 2.9, C(r, '#5a3a22'), 2);
        ell(c, tx, ty, 1.5, 1.1, C(r, '#4a4650'), 1.3);
      } else {
        line(c, k0x, k0y, ax, ay, OUTLINE, 6.4);
        line(c, k0x, k0y, ax, ay, C(r, BRASS), 3.6);
        line(c, k0x + (ax - k0x) * 0.2, k0y + (ay - k0y) * 0.2, ax, ay, S(r, BRASS, 0.55), 1);
        if (!robe) {
          dot(c, k0x, k0y, 2.6, OUTLINE);
          dot(c, k0x, k0y, 1.9, S(r, BRASS, 0.75));
          dot(c, k0x, k0y, 0.8, C(r, '#3a2a14'));
        }
        const bx = ft.footX + fx * 1.3;
        const by = ft.footY + fy * 0.5;
        ell(c, bx, by, 2.6 + Math.abs(fx) * 1.4, 2 + Math.abs(fy) * 0.4, S(r, BRASS, 0.8), 1.7);
      }
      continue;
    }
    if (!robe) {
      limb2(c, ft.hipX, ft.hipY, kx, ky, ax, ay, 5.4, 4.9, ll.thigh, ll.shin);
      if (ll.bootTop > 0) {
        // boot shaft up the shin
        const k = ll.bootTop;
        line(c, ax, ay, ax + (kx - ax) * k, ay + (ky - ay) * k, ll.boot, 5.2);
        if (k > 0.3) line(c, ax + (kx - ax) * k * 0.92 - 0.1, ay + (ky - ay) * k * 0.92, ax + (kx - ax) * k, ay + (ky - ay) * k, S(r, r.L.bootColor ?? '#3a2618', 1.25), 5.6);
      }
      if (st === 'greaves' || st === 'scales') {
        // shin plate ridge
        line(c, kx + 0.6, ky + 1, ax + 0.5, ay - 0.6, 'rgba(255,255,255,0.35)', 1);
      } else if (st === 'wraps') {
        c.strokeStyle = S(r, r.L.legsColor, 0.7);
        c.lineWidth = 0.9;
        c.beginPath();
        for (let i = 1; i <= 3; i++) {
          const tx = kx + (ax - kx) * (i / 4);
          const ty = ky + (ay - ky) * (i / 4);
          c.moveTo(tx - 2.4, ty - 0.8);
          c.lineTo(tx + 2.4, ty + 0.8);
        }
        c.stroke();
      } else if (st === 'waders') {
        line(c, kx - 1, ky - 3, kx - 0.6, ky + 1, 'rgba(255,255,255,0.3)', 1);
      } else if (st === 'slacks') {
        line(c, ft.hipX, ft.hipY + 1, ax, ay - 1, S(r, r.L.legsColor, 1.4), 0.7);
      }
      if (ll.knee) ell(c, kx, ky, 2.4, 2.1, ll.knee, 1.4);
      if (lf === 'bandaged') {
        // a bandage wound round the shin over whatever is worn
        line(c, kx + (ax - kx) * 0.15, ky + (ay - ky) * 0.15, kx + (ax - kx) * 0.8, ky + (ay - ky) * 0.8, C(r, WRAPS), 4.4);
        for (const k of [0.3, 0.5, 0.7]) {
          const tx = kx + (ax - kx) * k;
          const ty = ky + (ay - ky) * k;
          line(c, tx - 2.2, ty - 0.7, tx + 2.2, ty + 0.7, S(r, WRAPS, 0.7), 0.8);
        }
        dot(c, kx + (ax - kx) * 0.5 + 1, ky + (ay - ky) * 0.5, 0.8, C(r, '#b03a3a'));
      }
    }
    // the foot
    const bx = ft.footX + fx * 1.3;
    const by = ft.footY + fy * 0.5;
    if (ll.sabaton) {
      polyF(c, [bx - fx * 3 - fy * 2.4, by - fy * 1.2 + fx * 1.1, bx + fx * 3.8, by + fy * 1.6, bx - fx * 3 + fy * 2.4, by - fy * 1.2 - fx * 1.1, bx - fx * 3.4, by - 1.6], ll.boot, 1.7);
    } else {
      ell(c, bx, by, 2.8 + Math.abs(fx) * 1.5, 2.2 + Math.abs(fy) * 0.4, ll.boot, 1.7);
    }
    if (st === 'bare' || (!st && r.L.body === 'loincloth')) {
      // sandal straps over bare toes
      ell(c, bx + fx * 0.6, by + fy * 0.4, 1.9 + Math.abs(fx), 1.4, C(r, r.L.skin), 0);
      line(c, bx - 1.6, by - 0.4, bx + 1.6, by - 0.4, C(r, '#5a3a1a'), 0.9);
    } else if (st === 'slacks' && !r.flash) {
      dot(c, bx - 0.8, by - 0.8, 0.7, 'rgba(255,255,255,0.7)');
    }
  }
}

// ------------------------------------------------------------------ cape
function drawCape(r: Rig, front: boolean): void {
  const c = r.c;
  const L = r.L;
  const col = L.cape ?? L.bodyColor;
  const style: CapeStyle = L.capeStyle ?? (L.body === 'cloak' ? 'tattered' : 'full');
  const len = style === 'short' ? 11.5 : 21.5;
  const top = SY - 1.2;
  const trail = (Math.abs(r.fy) < 0.5 ? 3 : 1.5) + 5 * r.mv;
  const sway = Math.sin(r.t * 3.1) * (0.6 + r.mv * 1.3);
  const tx = -r.fx * trail + sway;
  const ty = -r.fy * trail * K;
  const aw = r.sw - 0.8;
  const hw = proj(SW + 3, SD + 3.5, r.fx, r.fy) + 1.5;
  const hemY = top + len + ty;
  c.beginPath();
  c.moveTo(-aw, top);
  c.quadraticCurveTo(0, top - 1.8, aw, top);
  c.quadraticCurveTo(aw + 1.8 + tx * 0.3, top + len * 0.45, hw + tx, hemY);
  if (style === 'tattered') {
    const n = 7;
    for (let i = 1; i < n; i++) {
      const k = i / n;
      const x = hw + tx - k * 2 * hw;
      const jag = i % 2 === 0 ? 0 : 2.8 + ((i * 7) % 3) * 0.6;
      c.lineTo(x + Math.sin(r.t * 4 + i) * 0.5 * r.mv, hemY - jag + Math.sin(k * Math.PI) * 1.4);
    }
  } else {
    c.quadraticCurveTo(tx, hemY + 2.4, -hw + tx, hemY);
  }
  c.lineTo(-hw + tx, hemY);
  c.quadraticCurveTo(-aw - 1.8 + tx * 0.3, top + len * 0.45, -aw, top);
  c.closePath();
  c.fillStyle = front ? C(r, col) : C(r, L.capeLining ?? shade(col, 0.6));
  c.fill();
  c.lineWidth = 2;
  c.strokeStyle = OUTLINE;
  c.stroke();
  if (front) {
    // folds, trim and the device on the back
    c.save();
    c.clip();
    c.strokeStyle = S(r, col, 0.72);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(-aw * 0.4, top + 3);
    c.lineTo(-hw * 0.45 + tx, hemY);
    c.moveTo(aw * 0.4, top + 3);
    c.lineTo(hw * 0.45 + tx, hemY);
    c.stroke();
    if (style !== 'tattered') {
      c.strokeStyle = C(r, L.trim);
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(hw + tx, hemY - 0.8);
      c.quadraticCurveTo(tx, hemY + 1.6, -hw + tx, hemY - 0.8);
      c.stroke();
    }
    c.restore();
    if (L.emblem && L.emblem !== 'none' && style !== 'tattered') emblem(r, L.emblem, tx * 0.45, top + len * 0.48, r.sqz, L.emblemColor ?? L.trim, 1.1);
  }
}

// ------------------------------------------------------------------ lower garments (over the legs)
function skirt(r: Rig, y0: number, y1: number, wTop: number, wBot: number, fill: string, notch: number, sway = 0): void {
  const c = r.c;
  const fc = r.fcx * 0.9;
  c.beginPath();
  c.moveTo(-wTop, y0);
  c.lineTo(wTop, y0);
  c.lineTo(wBot + sway, y1);
  if (notch > 0 && r.fy > -0.2) {
    c.lineTo(fc + notch * r.sqz + sway, y1);
    c.lineTo(fc + sway, y1 - notch * 1.2);
    c.lineTo(fc - notch * r.sqz + sway, y1);
  } else {
    c.quadraticCurveTo(sway, y1 + 1.2, -wBot + sway, y1);
  }
  c.lineTo(-wBot + sway, y1);
  c.closePath();
  c.fillStyle = fill;
  c.fill();
  c.lineWidth = 2;
  c.strokeStyle = OUTLINE;
  c.stroke();
}

function drawLower(r: Rig): void {
  const c = r.c;
  const L = r.L;
  const b = L.bodyColor;
  const hw = r.hw;
  const sway = Math.sin(r.ph) * 0.9 * r.mv;
  // the pelvis, so legs join the body
  ell(c, 0, HY, hw - 0.4, 3.2, C(r, legLook(r).thigh), 2);
  switch (L.body) {
    case 'plate': {
      // tassets: a skirt of plates, split at the front
      skirt(r, HY - 1.5, HY + 5, hw + 0.2, hw + 1.6, S(r, b, 0.92), 1.6, sway * 0.5);
      c.strokeStyle = S(r, b, 0.62);
      c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(-hw - 0.6, HY + 1.8);
      c.lineTo(hw + 0.6, HY + 1.8);
      c.stroke();
      if (L.glow) line(c, -hw, HY + 1.8, hw, HY + 1.8, C(r, L.glow), 0.8);
      if (L.over === 'tabard' && r.fy > -0.2) {
        const w = 3.6 * r.sqz;
        polyF(c, [r.fcx - w, HY - 1.5, r.fcx + w, HY - 1.5, r.fcx + w + sway, HY + 8, r.fcx - w + sway, HY + 8], C(r, L.overColor ?? L.trim), 1.6);
      } else if (L.over === 'tabard') {
        const w = 3.6 * r.sqz;
        polyF(c, [-r.fcx - w, HY - 1.5, -r.fcx + w, HY - 1.5, -r.fcx + w + sway, HY + 8, -r.fcx - w + sway, HY + 8], C(r, L.overColor ?? L.trim), 1.6);
      }
      break;
    }
    case 'chain': {
      const m = mailOf(L);
      skirt(r, HY - 1.5, HY + 4.6, hw + 0.2, hw + 1.6, C(r, m), 0, sway * 0.5);
      if (L.over === 'apron') {
        const w = 4.8 * r.sqz + 1;
        if (r.fy > -0.2) polyF(c, [r.fcx - w, HY - 2, r.fcx + w, HY - 2, r.fcx + w + 0.6, HY + 8.5, r.fcx - w - 0.6, HY + 8.5], C(r, L.overColor ?? '#6a4a2a'), 1.6);
      } else if (L.over !== 'none') {
        skirt(r, HY - 1.5, HY + 6.5, hw - 0.6, hw + 0.8, C(r, L.overColor ?? b), 2.4, sway);
        c.strokeStyle = C(r, L.trim);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(-hw + 0.2 + sway, HY + 5.6);
        c.lineTo(hw - 0.2 + sway, HY + 5.6);
        c.stroke();
      }
      break;
    }
    case 'leather': {
      skirt(r, HY - 1.5, HY + 4.2, hw + 0.1, hw + 1, S(r, b, 0.88), 0, sway * 0.6);
      // pteruges: hanging strips
      c.strokeStyle = S(r, b, 0.55);
      c.lineWidth = 1;
      c.beginPath();
      for (let i = -2; i <= 2; i++) {
        const x = (i / 2.6) * hw;
        c.moveTo(x, HY + 0.6);
        c.lineTo(x * 1.1 + sway * 0.6, HY + 4.2);
      }
      c.stroke();
      break;
    }
    case 'robe':
    case 'bathrobe': {
      const hem = L.body === 'robe' ? 12.6 : 10.5;
      const flare = proj(HW + 3.8, HD + 2.5, r.fx, r.fy);
      skirt(r, HY - 2.5, hem, hw, flare, C(r, b), 0, sway * 1.4);
      // hem band and the front panel of embroidery
      c.save();
      c.beginPath();
      c.moveTo(-hw, HY - 2.5);
      c.lineTo(hw, HY - 2.5);
      c.lineTo(flare + sway * 1.4, hem);
      c.quadraticCurveTo(sway * 1.4, hem + 1.2, -flare + sway * 1.4, hem);
      c.closePath();
      c.clip();
      c.fillStyle = S(r, b, 0.8);
      c.fillRect(-flare - 3, hem - 4.5, flare * 2 + 6, 6);
      if (L.body === 'robe') {
        line(c, -flare - 3 + sway, hem - 1.6, flare + 3 + sway, hem - 1.6, C(r, L.trim), 1.8);
        const fc = r.fy > -0.2 ? r.fcx * 1.15 : -r.fcx * 1.15;
        line(c, fc, HY - 2.5, fc + sway * 1.4, hem, C(r, L.trim), 2.6 * r.sqz + 0.5);
        if (L.glow) {
          c.fillStyle = C(r, L.glow);
          for (let i = 0; i < 7; i++) {
            const x = -flare + ((i + 0.5) / 7) * flare * 2 + sway;
            c.beginPath();
            c.arc(x, hem - 3.4 - (i % 2) * 1.2, 0.8, 0, TAU);
            c.fill();
          }
        }
      }
      c.restore();
      if (L.glow && !r.flash) glow(c, 0, hem - 2, 9, L.glow, 0.12);
      break;
    }
    case 'cloak':
      skirt(r, HY - 1.5, HY + 4, hw, hw + 0.8, S(r, b, 0.7), 0, sway);
      break;
    case 'suit':
      skirt(r, HY - 1.5, HY + 2.2, hw + 0.2, hw + 0.7, C(r, b), 1.2, 0);
      break;
    case 'loincloth': {
      // rope belt and the famous flap
      const lc = '#a07a48';
      const fc = r.fy > -0.2 ? r.fcx : -r.fcx;
      const w = 3.2 * r.sqz + 0.6;
      polyF(c, [fc - w, HY - 0.5, fc + w, HY - 0.5, fc + w * 0.8 + sway * 1.6, HY + 7.5, fc - w * 0.8 + sway * 1.6, HY + 7.5], C(r, lc), 1.6);
      line(c, -hw, HY - 0.6, hw, HY - 0.6, C(r, '#7a5a32'), 1.6);
      break;
    }
    case 'shirt':
    default:
      skirt(r, HY - 1.5, HY + 3.4, hw + 0.1, hw + 0.9, S(r, b, 0.92), 0, sway * 0.6);
      line(c, -hw - 0.6 + sway * 0.6, HY + 2.6, hw + 0.6 + sway * 0.6, HY + 2.6, S(r, L.trim, 0.9), 1);
      break;
  }
}

// ------------------------------------------------------------------ torso
/** A cloth band across a bare woman's chest (D183), seen from any side. */
function chestWrap(r: Rig, front: boolean, fc: number, q: number): void {
  const c = r.c;
  const cloth = '#c9b98a';
  c.fillStyle = C(r, cloth);
  c.fillRect(-20, SY + 2.2, 40, 5.4);
  line(c, -20, SY + 2.2, 20, SY + 2.2, C(r, shade(cloth, 0.6)), 1);
  line(c, -20, SY + 7.6, 20, SY + 7.6, C(r, shade(cloth, 0.6)), 1);
  if (front && !r.flash) {
    c.strokeStyle = C(r, shade(cloth, 0.72));
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(fc - 5 * q, SY + 6.4);
    c.quadraticCurveTo(fc - 2.6 * q, SY + 7.8, fc - 0.3 * q, SY + 6);
    c.moveTo(fc + 0.3 * q, SY + 6);
    c.quadraticCurveTo(fc + 2.6 * q, SY + 7.8, fc + 5 * q, SY + 6.4);
    c.stroke();
    // a knot at the front
    dot(c, fc, SY + 4.8, 1.1, C(r, shade(cloth, 0.85)));
  } else if (!front) line(c, -0.5 * q, SY + 2.4, 0.5 * q, SY + 7.4, C(r, shade(cloth, 0.6)), 1);
  dot(c, fc + 0.2, WY + 1.6, 0.6, S(r, r.L.skin, 0.6));
}

/** Two soft curves under a woman's top (D183). */
function bustLines(r: Rig, fc: number, q: number, base: string): void {
  const c = r.c;
  c.strokeStyle = S(r, base, 0.7);
  c.lineWidth = 0.9;
  c.beginPath();
  c.moveTo(fc - 5.2 * q, SY + 5.6);
  c.quadraticCurveTo(fc - 2.8 * q, SY + 7.6, fc - 0.6 * q, SY + 5.8);
  c.moveTo(fc + 0.6 * q, SY + 5.8);
  c.quadraticCurveTo(fc + 2.8 * q, SY + 7.6, fc + 5.2 * q, SY + 5.6);
  c.stroke();
}

function mailOf(L: JoeLook): string {
  return mix(L.bodyColor, '#a7adb5', 0.55);
}

function torsoPath(c: CanvasRenderingContext2D, sw: number, ww: number, hw: number, belly = 0): void {
  c.beginPath();
  c.moveTo(-sw + 2.6, SY - 2.2);
  c.quadraticCurveTo(0, SY - 3.8, sw - 2.6, SY - 2.2);
  c.quadraticCurveTo(sw + 0.7, SY - 1.6, sw, SY + 2.2);
  c.quadraticCurveTo(ww + 0.4 + belly, (SY + WY) / 2 + 2.6, ww + belly * 0.6, WY);
  c.quadraticCurveTo(hw + 0.6, (WY + HY) / 2, hw, HY);
  c.quadraticCurveTo(0, HY + 1.4, -hw, HY);
  c.quadraticCurveTo(-hw - 0.6, (WY + HY) / 2, -ww - belly * 0.6, WY);
  c.quadraticCurveTo(-ww - 0.4 - belly, (SY + WY) / 2 + 2.6, -sw, SY + 2.2);
  c.quadraticCurveTo(-sw - 0.7, SY - 1.6, -sw + 2.6, SY - 2.2);
  c.closePath();
}

function drawTorso(r: Rig): void {
  const c = r.c;
  const L = r.L;
  const belly = L.body === 'loincloth' && !L.female ? 1.6 * Math.max(0.3, Math.abs(r.fx)) + 0.8 : 0;
  const base = L.body === 'chain' ? mailOf(L) : L.body === 'loincloth' ? L.skin : L.body === 'cloak' ? shade(L.bodyColor, 0.78) : L.bodyColor;
  torsoPath(c, r.sw, r.ww, r.hw, belly);
  c.fillStyle = C(r, base);
  c.fill();
  c.save();
  c.clip();
  // two-tone: the side away from the light and the belly underside are darker
  c.fillStyle = S(r, base, 0.82);
  c.beginPath();
  c.ellipse(r.sw * 0.95, WY, r.sw * 0.5, 14, 0, 0, TAU);
  c.fill();
  c.fillRect(-20, HY - 2, 40, 6);
  const front = r.fy > -0.2;
  const fc = front ? r.fcx : -r.fcx;
  const q = r.sqz;
  switch (L.body) {
    case 'plate':
      plateDetail(r, front, fc, q);
      break;
    case 'chain':
      chainDetail(r, front, fc, q);
      break;
    case 'leather':
      leatherDetail(r, front, fc, q);
      break;
    case 'robe':
    case 'bathrobe':
      robeDetail(r, front, fc, q);
      break;
    case 'suit':
      suitDetail(r, front, fc, q);
      break;
    case 'loincloth':
      if (L.female) {
        // bare, a woman wears a cloth wrap across her chest (D183)
        chestWrap(r, front, fc, q);
        break;
      }
      if (front && !r.flash) {
        // pecs, a belly button and some chest hair: Nobody keeps his dignity elsewhere
        c.strokeStyle = S(r, L.skin, 0.72);
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(fc - 6 * q, SY + 4.5);
        c.quadraticCurveTo(fc - 3 * q, SY + 6.2, fc - 0.4 * q, SY + 4.2);
        c.moveTo(fc + 0.4 * q, SY + 4.2);
        c.quadraticCurveTo(fc + 3 * q, SY + 6.2, fc + 6 * q, SY + 4.5);
        c.stroke();
        dot(c, fc + 0.2, WY + 1.6, 0.7, S(r, L.skin, 0.6));
        c.fillStyle = C(r, L.hair);
        for (let i = 0; i < 5; i++) c.fillRect(fc + (i - 2) * 1.1 * q - 0.3, SY + 2.6 + (i % 2) * 0.9, 0.7, 0.9);
      }
      break;
    case 'cloak':
      // only the tunic shows; the cloak goes on in drawCollar
      line(c, -12, WY + 0.6, 12, WY + 0.6, C(r, '#8a7a5a'), 1.6);
      break;
    case 'shirt':
    default:
      shirtDetail(r, front, fc, q);
      break;
  }
  // a woman's chest under clothing and soft armor: two soft curves (D183); plate and mail keep their own shapes
  if (L.female && front && !r.flash && L.body !== 'loincloth' && L.body !== 'plate' && L.body !== 'chain') bustLines(r, fc, q, base);
  c.restore();
  torsoPath(c, r.sw, r.ww, r.hw, belly);
  c.lineWidth = 2.2;
  c.strokeStyle = OUTLINE;
  c.stroke();
  if (L.extra === 'boiler' && !front) boiler(r);
}

function belt(r: Rig, front: boolean, fc: number, color: string, y = WY + 0.4, buckle = true): void {
  const c = r.c;
  c.fillStyle = C(r, color);
  c.fillRect(-14, y - 1.2, 28, 2.6);
  c.strokeStyle = OUTLINE;
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(-14, y - 1.2);
  c.lineTo(14, y - 1.2);
  c.moveTo(-14, y + 1.4);
  c.lineTo(14, y + 1.4);
  c.stroke();
  if (buckle && front) {
    c.fillStyle = C(r, r.L.metal ?? '#d8c890');
    c.fillRect(fc - 1.6 * r.sqz - 0.3, y - 1.5, 3.2 * r.sqz + 0.6, 3.2);
    c.fillStyle = C(r, color);
    c.fillRect(fc - 0.7 * r.sqz, y - 0.6, 1.4 * r.sqz, 1.4);
  }
  if (r.L.extra === 'pouches') {
    for (const side of [-1, 1]) {
      const x = fc + side * 5 * r.sqz - side * 0.5;
      c.fillStyle = S(r, color, 1.15);
      c.fillRect(x - 1.6, y + 0.4, 3.2, 3);
      c.strokeRect(x - 1.6, y + 0.4, 3.2, 3);
    }
  }
}

function plateDetail(r: Rig, front: boolean, fc: number, q: number): void {
  const c = r.c;
  const L = r.L;
  const b = L.bodyColor;
  const metal = L.metal ?? '#d8d0b8';
  if (front) {
    // breastplate: keel ridge with a lit half
    c.fillStyle = S(r, b, 1.12);
    c.beginPath();
    c.moveTo(fc, SY - 3);
    c.lineTo(-r.sw - 1, SY - 3);
    c.lineTo(-r.ww - 1, WY - 1);
    c.lineTo(fc, WY - 1.5);
    c.closePath();
    c.fill();
    line(c, fc, SY - 2.5, fc, WY - 1.5, S(r, b, 0.6), 1);
    // plackart and faulds
    c.strokeStyle = S(r, b, 0.55);
    c.lineWidth = 1.1;
    c.beginPath();
    c.moveTo(-r.ww - 1, WY - 1.2);
    c.quadraticCurveTo(fc, WY + 0.8, r.ww + 1, WY - 1.2);
    c.moveTo(-r.hw - 1, HY - 1.6);
    c.quadraticCurveTo(fc, HY + 0.2, r.hw + 1, HY - 1.6);
    c.stroke();
    // rivets
    c.fillStyle = C(r, metal);
    for (const k of [-1, 1]) {
      c.beginPath();
      c.arc(fc + k * 4.2 * q, WY + 0.9, 0.7, 0, TAU);
      c.arc(fc + k * 5.4 * q, SY + 0.6, 0.65, 0, TAU);
      c.fill();
    }
  } else {
    // backplate: the spine and shoulder-blade plates
    line(c, fc, SY - 2, fc, HY - 1, S(r, b, 0.62), 1.1);
    c.strokeStyle = S(r, b, 0.62);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(fc - 6 * q, SY + 4);
    c.quadraticCurveTo(fc - 3 * q, SY + 1, fc, SY + 3.5);
    c.quadraticCurveTo(fc + 3 * q, SY + 1, fc + 6 * q, SY + 4);
    c.stroke();
  }
  if (L.glow) {
    // molten / glowing seams
    c.strokeStyle = C(r, L.glow);
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(-r.ww, WY - 0.6);
    c.quadraticCurveTo(fc, WY + 1.4, r.ww, WY - 0.6);
    if (L.texture === 'cracks') {
      c.moveTo(fc - 3 * q, SY + 0.5);
      c.lineTo(fc - 1.5 * q, SY + 3);
      c.lineTo(fc - 3.2 * q, SY + 5);
      c.moveTo(fc + 2.6 * q, SY + 2);
      c.lineTo(fc + 4 * q, SY + 4.6);
    }
    c.stroke();
  }
  if (L.texture === 'dents' && front) {
    // the shovel dents
    c.strokeStyle = S(r, b, 0.55);
    c.lineWidth = 0.9;
    c.beginPath();
    c.arc(fc - 3.2 * q, SY + 3.2, 1.4, 0.3, 2.6);
    c.moveTo(fc + 3 * q + 1.1, WY - 2.5);
    c.arc(fc + 3 * q, WY - 3, 1.2, 0.4, 2.4);
    c.stroke();
  }
  if (L.over === 'tabard') {
    const w = 3.6 * q;
    const col = L.overColor ?? L.trim;
    polyF(c, [fc - w, SY - 2, fc + w, SY - 2, fc + w, HY + 2, fc - w, HY + 2], C(r, col), 1.4);
    line(c, fc - w + 0.8, SY - 1, fc - w + 0.8, HY + 2, S(r, col, 1.3), 0.8);
    if (front && L.emblem && L.emblem !== 'none') emblem(r, L.emblem, fc, SY + 5.2, q, L.emblemColor ?? L.trim, 0.85);
  } else if (front && L.emblem && L.emblem !== 'none') {
    emblem(r, L.emblem, fc, SY + 4.2, q, L.emblemColor ?? L.trim, 0.85);
  }
  if (L.belt) belt(r, front, fc, L.belt, HY - 1.6);
}

function rings(c: CanvasRenderingContext2D, color: string, x0: number, x1: number, y0: number, y1: number): void {
  c.strokeStyle = color;
  c.lineWidth = 0.7;
  c.beginPath();
  let row = 0;
  for (let y = y0; y <= y1; y += 2.1) {
    const off = row++ % 2 === 0 ? 0 : 1.1;
    for (let x = x0 + off; x <= x1; x += 2.2) {
      c.moveTo(x + 0.9, y);
      c.arc(x, y, 0.9, 0, Math.PI);
    }
  }
  c.stroke();
}
function scales(c: CanvasRenderingContext2D, fill: string, edge: string, x0: number, x1: number, y0: number, y1: number): void {
  let row = 0;
  for (let y = y0; y <= y1; y += 2.4) {
    const off = row++ % 2 === 0 ? 0 : 1.5;
    c.beginPath();
    for (let x = x0 + off; x <= x1; x += 3) {
      c.moveTo(x + 1.6, y);
      c.arc(x, y, 1.6, 0, Math.PI);
    }
    c.fillStyle = fill;
    c.fill();
    c.strokeStyle = edge;
    c.lineWidth = 0.7;
    c.stroke();
  }
}

function chainDetail(r: Rig, front: boolean, fc: number, q: number): void {
  const c = r.c;
  const L = r.L;
  const m = mailOf(L);
  if (L.texture === 'scales') scales(c, C(r, shade(L.bodyColor, 1.35)), S(r, L.bodyColor, 0.5), -r.sw - 1, r.sw + 1, SY - 2, HY);
  else if (!r.flash) rings(c, shade(m, 0.62), -r.sw, r.sw, SY - 2, HY);
  const over = L.over ?? 'surcoat';
  const oc = L.overColor ?? L.bodyColor;
  if (over === 'surcoat' || over === 'vest') {
    // sleeveless surcoat over the mail
    const w = (r.sw - 2.4) * (over === 'vest' ? 0.85 : 1);
    c.beginPath();
    c.moveTo(-w + 1.6, SY - 2.6);
    c.quadraticCurveTo(0, SY - 0.4, w - 1.6, SY - 2.6);
    c.lineTo(r.ww - 0.6, WY);
    c.lineTo(r.hw - 0.6, HY + 2);
    c.lineTo(-r.hw + 0.6, HY + 2);
    c.lineTo(-r.ww + 0.6, WY);
    c.closePath();
    c.fillStyle = C(r, oc);
    c.fill();
    c.lineWidth = 1.4;
    c.strokeStyle = OUTLINE;
    c.stroke();
    c.strokeStyle = C(r, L.trim);
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(-w + 2.4, SY - 1.8);
    c.quadraticCurveTo(0, SY + 0.6, w - 2.4, SY - 1.8);
    c.stroke();
    if (front && L.emblem && L.emblem !== 'none') emblem(r, L.emblem, fc, SY + 4.6, q, L.emblemColor ?? L.trim, 0.9);
  } else if (over === 'apron' && front) {
    // the smith's leather apron with a bib and a pocket
    const w = 4.6 * q + 1;
    const ac = L.overColor ?? '#6a4a2a';
    polyF(c, [fc - w * 0.75, SY - 1, fc + w * 0.75, SY - 1, fc + w, HY + 3, fc - w, HY + 3], C(r, ac), 1.4);
    line(c, fc - w * 0.75, SY - 1, -r.sw + 2.5, SY - 2.6, C(r, ac), 1.2);
    line(c, fc + w * 0.75, SY - 1, r.sw - 2.5, SY - 2.6, C(r, ac), 1.2);
    c.strokeStyle = S(r, ac, 0.6);
    c.lineWidth = 0.9;
    c.strokeRect(fc - 2.2 * q, WY + 0.8, 4.4 * q, 2.6);
    if (L.emblem && L.emblem !== 'none') emblem(r, L.emblem, fc, SY + 3.8, q, L.emblemColor ?? L.trim, 0.8);
  }
  belt(r, front, fc, L.belt ?? '#4a3322', WY + 0.6);
  if (L.extra === 'bandolier' && front) bandolier(r, fc, q);
}

function bandolier(r: Rig, fc: number, q: number): void {
  const c = r.c;
  const col = C(r, r.L.belt ?? '#4a3322');
  c.strokeStyle = OUTLINE;
  c.lineWidth = 3.4;
  c.beginPath();
  c.moveTo(fc + 5.5 * q, SY - 2);
  c.lineTo(fc - 5.5 * q, HY - 1);
  c.stroke();
  line(c, fc + 5.5 * q, SY - 2, fc - 5.5 * q, HY - 1, col, 2);
  c.fillStyle = C(r, r.L.metal ?? '#c9b98a');
  for (let i = 1; i < 4; i++) {
    const k = i / 4;
    c.fillRect(fc + (5.5 - 11 * k) * q - 0.6, SY - 2 + (HY + 1 - SY) * k - 0.8, 1.2, 1.6);
  }
}

function leatherDetail(r: Rig, front: boolean, fc: number, q: number): void {
  const c = r.c;
  const L = r.L;
  const b = L.bodyColor;
  if (L.texture === 'studs') {
    // brigandine: rows of rivets
    c.fillStyle = C(r, L.metal ?? L.trim);
    for (let y = SY; y <= HY - 2; y += 3) {
      for (let x = -r.sw + 2; x <= r.sw - 2; x += 3) {
        c.beginPath();
        c.arc(x + ((y / 3) % 2) * 0.8, y, 0.6, 0, TAU);
        c.fill();
      }
    }
  } else if (L.texture === 'stitches') {
    c.strokeStyle = S(r, b, 0.6);
    c.lineWidth = 0.7;
    c.setLineDash([1.2, 1]);
    c.beginPath();
    c.moveTo(-r.sw + 2.5, SY);
    c.lineTo(-r.ww + 1.2, HY - 2);
    c.moveTo(r.sw - 2.5, SY);
    c.lineTo(r.ww - 1.2, HY - 2);
    c.stroke();
    c.setLineDash([]);
  }
  if (front) {
    if (L.over === 'vest') {
      // open vest over a shirt
      const w = 2.2 * q + 0.4;
      c.fillStyle = C(r, '#d8d0b8');
      c.beginPath();
      c.moveTo(fc - w * 1.6, SY - 3);
      c.lineTo(fc + w * 1.6, SY - 3);
      c.lineTo(fc + w * 0.6, HY);
      c.lineTo(fc - w * 0.6, HY);
      c.closePath();
      c.fill();
      c.strokeStyle = OUTLINE;
      c.lineWidth = 1;
      c.stroke();
    } else {
      // laced front
      c.strokeStyle = C(r, L.trim);
      c.lineWidth = 0.8;
      c.beginPath();
      for (let i = 0; i < 3; i++) {
        const y = SY - 0.5 + i * 2.2;
        c.moveTo(fc - 1.2 * q, y);
        c.lineTo(fc + 1.2 * q, y + 1.6);
        c.moveTo(fc + 1.2 * q, y);
        c.lineTo(fc - 1.2 * q, y + 1.6);
      }
      c.stroke();
    }
    if (L.emblem && L.emblem !== 'none') emblem(r, L.emblem, fc - 4 * q, SY + 3.4, q, L.emblemColor ?? L.trim, 0.7);
  }
  if (L.extra === 'suspenders') {
    for (const k of [-1, 1]) line(c, fc + k * 3.6 * q, SY - 3, fc + k * 3 * q, HY, C(r, L.belt ?? '#2a2a20'), 1.6);
  } else {
    // baldric strap with a buckle
    const col = C(r, shade(b, 0.55));
    c.strokeStyle = OUTLINE;
    c.lineWidth = 3.2;
    c.beginPath();
    c.moveTo(-r.sw + 2, SY - 1.6);
    c.lineTo(r.ww, WY - 0.4);
    c.stroke();
    line(c, -r.sw + 2, SY - 1.6, r.ww, WY - 0.4, col, 1.8);
    if (front) {
      c.fillStyle = C(r, L.metal ?? '#c9b98a');
      c.fillRect(-r.sw * 0.25 - 1, SY + 2.2, 2, 2);
    }
  }
  belt(r, front, fc, L.belt ?? shade(b, 0.45), WY + 0.6);
  if (L.extra === 'quiver' && !front) {
    polyF(c, [fc - 2, SY - 4, fc + 2.5, SY - 5, fc + 4, HY - 1, fc, HY], C(r, '#5a3a1a'), 1.4);
  }
}

function robeDetail(r: Rig, front: boolean, fc: number, q: number): void {
  const c = r.c;
  const L = r.L;
  const b = L.bodyColor;
  if (L.body === 'bathrobe') {
    // a fluffy collar and a belt tied in a bow
    const col = S(r, b, 1.15);
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(fc - 5 * q, SY - 3);
    c.lineTo(fc, WY);
    c.lineTo(fc + 5 * q, SY - 3);
    c.lineTo(fc + 2.4 * q, SY - 3);
    c.lineTo(fc, SY + 2);
    c.lineTo(fc - 2.4 * q, SY - 3);
    c.closePath();
    c.fill();
    belt(r, front, fc, L.trim, WY + 0.6, false);
    if (front) {
      ell(c, fc - 1.6, WY + 0.6, 1.6, 1.1, C(r, L.trim), 0.8);
      ell(c, fc + 1.6, WY + 0.6, 1.6, 1.1, C(r, L.trim), 0.8);
    }
    return;
  }
  if (front) {
    // V-neck over an under-robe
    c.fillStyle = S(r, L.trim, 0.55);
    c.beginPath();
    c.moveTo(fc - 3.2 * q, SY - 3);
    c.lineTo(fc, SY + 2.4);
    c.lineTo(fc + 3.2 * q, SY - 3);
    c.closePath();
    c.fill();
    c.strokeStyle = C(r, L.trim);
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(fc - 3.6 * q, SY - 3);
    c.lineTo(fc, SY + 2.6);
    c.lineTo(fc + 3.6 * q, SY - 3);
    c.moveTo(fc, SY + 2.6);
    c.lineTo(fc, HY + 2);
    c.stroke();
  } else {
    line(c, fc, SY - 2, fc, HY + 2, S(r, b, 0.75), 1);
  }
  if (L.over === 'stole') {
    // a gold stole hanging from the neck, crosses near the hem
    const sc = C(r, L.overColor ?? L.trim);
    for (const k of [-1, 1]) {
      const x = fc + k * 2.6 * q;
      line(c, x, SY - 2.5, x + k * 0.3, HY + 2, sc, 2.2 * q + 0.4);
    }
    if (front) {
      for (const k of [-1, 1]) {
        const x = fc + k * 2.6 * q;
        line(c, x - 0.9 * q, WY + 2.6, x + 0.9 * q, WY + 2.6, C(r, '#ffffff'), 0.7);
        line(c, x, WY + 1.6, x, WY + 3.8, C(r, '#ffffff'), 0.7);
      }
    }
  }
  if (L.glow) {
    // spores in the weave
    c.fillStyle = C(r, L.glow);
    const pts = [-5, -6, 4, -3, -2, 1, 5, 2, -6, -1, 1, -7];
    for (let i = 0; i < pts.length; i += 2) {
      c.beginPath();
      c.arc(pts[i]! * (r.sw / SW), pts[i + 1]!, 0.75, 0, TAU);
      c.fill();
    }
  }
  if (front && L.emblem && L.emblem !== 'none' && L.over !== 'stole') emblem(r, L.emblem, fc + 4.6 * q, SY + 3.2, q, L.emblemColor ?? L.trim, 0.7);
  // sash with a knot and hanging tails at the side
  const sash = L.belt ?? L.trim;
  belt(r, front, fc, sash, WY + 0.8, false);
  if (front) {
    const kx = fc - 3.6 * q;
    ell(c, kx, WY + 0.8, 1.5, 1.3, S(r, sash, 1.1), 0.9);
  }
}

function suitDetail(r: Rig, front: boolean, fc: number, q: number): void {
  const c = r.c;
  const L = r.L;
  if (!front) {
    line(c, fc, SY - 1, fc, HY + 2, S(r, L.bodyColor, 1.6), 0.6);
    return;
  }
  // shirt, tie, lapels, a pocket square, two buttons
  c.fillStyle = C(r, L.trim);
  c.beginPath();
  c.moveTo(fc - 3 * q, SY - 3);
  c.lineTo(fc + 3 * q, SY - 3);
  c.lineTo(fc, WY + 0.5);
  c.closePath();
  c.fill();
  polyF(c, [fc - 0.8 * q, SY - 2.6, fc + 0.8 * q, SY - 2.6, fc + 1.2 * q, WY - 2, fc, WY, fc - 1.2 * q, WY - 2], C(r, L.emblemColor ?? '#8a1a2a'), 0.8);
  c.strokeStyle = S(r, L.bodyColor, 2.2);
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(fc - 3.6 * q, SY - 2.6);
  c.lineTo(fc - 1.8 * q, SY + 2);
  c.lineTo(fc, WY + 0.5);
  c.moveTo(fc + 3.6 * q, SY - 2.6);
  c.lineTo(fc + 1.8 * q, SY + 2);
  c.lineTo(fc, WY + 0.5);
  c.stroke();
  c.fillStyle = C(r, L.trim);
  c.fillRect(fc + 3.8 * q, SY + 1.6, 1.8 * q, 1.1);
  dot(c, fc, WY + 2, 0.55, C(r, '#3a3a44'));
  dot(c, fc, HY - 0.5, 0.55, C(r, '#3a3a44'));
}

function shirtDetail(r: Rig, front: boolean, fc: number, q: number): void {
  const c = r.c;
  const L = r.L;
  if (front) {
    // round neck and chest lacing in the class trim
    c.fillStyle = S(r, L.bodyColor, 0.7);
    c.beginPath();
    c.ellipse(fc * 0.8, SY - 2.6, 3.4 * q + 0.4, 1.8, 0, 0, Math.PI);
    c.fill();
    c.strokeStyle = C(r, L.trim);
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(fc * 0.8, SY - 1);
    c.lineTo(fc * 0.9, SY + 3.2);
    c.moveTo(fc - 1 * q, SY + 0.2);
    c.lineTo(fc + 1 * q, SY + 1.2);
    c.moveTo(fc + 1 * q, SY + 0.2);
    c.lineTo(fc - 1 * q, SY + 1.2);
    c.stroke();
    if (L.emblem && L.emblem !== 'none') emblem(r, L.emblem, fc, SY + 5, q, L.emblemColor ?? L.trim, 0.8);
  }
  belt(r, front, fc, L.belt ?? '#4a3322', WY + 0.8);
}

function boiler(r: Rig): void {
  // the Juggernaut's back-mounted boiler with a gauge and two stacks
  const c = r.c;
  const L = r.L;
  const m = L.metal ?? '#2aa198';
  polyF(c, [-5.5, SY - 1, 5.5, SY - 1, 5, WY + 2, -5, WY + 2], C(r, shade(L.bodyColor, 0.8)), 1.8);
  ell(c, 0, SY + 4, 2.6, 2.6, C(r, '#efe6d2'), 1.2);
  line(c, 0, SY + 4, 1.4, SY + 3, C(r, '#a02020'), 0.8);
  for (const k of [-1, 1]) {
    polyF(c, [k * 3.5 - 1.3, SY - 1, k * 3.5 + 1.3, SY - 1, k * 3.5 + 1.3, SY - 6, k * 3.5 - 1.3, SY - 6], C(r, m), 1.4);
  }
}

// ------------------------------------------------------------------ collars, cloaks, mantles (after the torso)
function drawCollar(r: Rig): void {
  const c = r.c;
  const L = r.L;
  const front = r.fy > -0.2;
  if (L.body === 'cloak') {
    // the cloak drapes over both shoulders, open down the front over the tunic, ragged at the hem
    const col = L.cape ?? L.bodyColor;
    const w = r.sw + 1.2;
    const hem = 10.5;
    const sway = Math.sin(r.ph) * 0.9 * r.mv;
    c.beginPath();
    c.moveTo(-w + 2.4, SY - 2.6);
    c.quadraticCurveTo(0, SY - 4.4, w - 2.4, SY - 2.6);
    c.quadraticCurveTo(w + 1.2, SY - 1, w + 0.8, SY + 3);
    c.lineTo(r.hw + 1.6 + sway, hem);
    for (let i = 1; i < 6; i++) {
      const k = i / 6;
      c.lineTo(r.hw + 1.6 - k * (r.hw + 1.6) * 2 + sway, hem - (i % 2 ? 2.6 : 0));
    }
    c.lineTo(-r.hw - 1.6 + sway, hem);
    c.lineTo(-w - 0.8, SY + 3);
    c.quadraticCurveTo(-w - 1.2, SY - 1, -w + 2.4, SY - 2.6);
    c.closePath();
    c.fillStyle = C(r, col);
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = OUTLINE;
    c.stroke();
    if (front) {
      // the opening shows the tunic and a rope belt
      const fc = r.fcx;
      const g = 2.2 * r.sqz + 0.8;
      polyF(c, [fc - g * 0.6, SY - 1.5, fc + g * 0.6, SY - 1.5, fc + g + sway, hem - 1.5, fc - g + sway, hem - 1.5], S(r, L.bodyColor, 0.72), 1.2);
      line(c, fc - g, WY + 1, fc + g, WY + 1, C(r, L.belt ?? '#8a7a5a'), 1.4);
      dot(c, fc, SY - 1.8, 1.3, C(r, L.trim));
    }
    if (L.texture === 'patches' && !r.flash) {
      c.fillStyle = shade(col, 0.75);
      c.fillRect(-w + 2.5, SY + 4, 3, 2.6);
      c.fillRect(w - 5, WY + 3, 2.6, 2.4);
    }
    return;
  }
  if (L.pauldrons === 'fur') {
    // a fur mantle across the shoulders
    const fur = C(r, L.cape ? shade(L.cape, 1.3) : '#8a6a4a');
    c.fillStyle = fur;
    c.strokeStyle = OUTLINE;
    c.lineWidth = 1.6;
    const n = 7;
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const x = -r.sw - 1.5 + k * (r.sw * 2 + 3);
      const y = SY - 1.5 + Math.sin(k * Math.PI) * -1.2;
      c.moveTo(x + 3, y);
      c.arc(x, y, 3, 0, TAU);
    }
    c.fill();
    c.stroke();
    c.beginPath();
    for (let i = 0; i <= n; i++) {
      const k = i / n;
      const x = -r.sw - 1.5 + k * (r.sw * 2 + 3);
      c.moveTo(x + 2.4, SY - 1.5 - Math.sin(k * Math.PI) * 1.2);
      c.arc(x, SY - 1.5 - Math.sin(k * Math.PI) * 1.2, 2.4, 0, TAU);
    }
    c.fill();
  }
  if (L.over === 'mantle') {
    // a short shoulder cape with a trimmed edge
    const col = L.overColor ?? L.bodyColor;
    const w = r.sw + 1.4;
    c.beginPath();
    c.moveTo(-w + 2.6, SY - 2.8);
    c.quadraticCurveTo(0, SY - 4.4, w - 2.6, SY - 2.8);
    c.quadraticCurveTo(w + 1.2, SY - 1, w + 0.4, SY + 4);
    c.quadraticCurveTo(0, SY + 7.5, -w - 0.4, SY + 4);
    c.quadraticCurveTo(-w - 1.2, SY - 1, -w + 2.6, SY - 2.8);
    c.closePath();
    c.fillStyle = C(r, col);
    c.fill();
    c.lineWidth = 1.8;
    c.strokeStyle = OUTLINE;
    c.stroke();
    c.strokeStyle = C(r, L.trim);
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(w - 0.4, SY + 3.4);
    c.quadraticCurveTo(0, SY + 6.6, -w + 0.4, SY + 3.4);
    c.stroke();
    if (front && L.emblem && L.emblem !== 'none') emblem(r, L.emblem, r.fcx, SY + 2.6, r.sqz, L.emblemColor ?? L.trim, 0.75);
  }
  if (L.body === 'plate') {
    // gorget
    const gw = proj(4.8, 3.8, r.fx, r.fy) + 0.6;
    ell(c, 0, SY - 2.6, gw, 2.3, S(r, L.bodyColor, 0.95), 1.6);
    c.strokeStyle = S(r, L.bodyColor, 1.3);
    c.lineWidth = 0.7;
    c.beginPath();
    c.ellipse(0, SY - 2.9, gw - 1, 1.2, 0, Math.PI * 1.1, Math.PI * 1.9);
    c.stroke();
  } else if (L.body === 'leather' || L.body === 'chain') {
    ell(c, 0, SY - 2.6, proj(4.2, 3.4, r.fx, r.fy) + 0.4, 1.9, L.body === 'chain' ? C(r, mailOf(L)) : S(r, L.bodyColor, 0.75), 1.4);
  } else if (L.body === 'suit') {
    if (front) {
      polyF(c, [r.fcx - 2.6 * r.sqz, SY - 3.2, r.fcx, SY - 1, r.fcx - 0.4, SY - 3.4], C(r, L.trim), 0.8);
      polyF(c, [r.fcx + 2.6 * r.sqz, SY - 3.2, r.fcx, SY - 1, r.fcx + 0.4, SY - 3.4], C(r, L.trim), 0.8);
    }
  }
}

// ------------------------------------------------------------------ emblems: little devices for chests, tabards and capes
function emblem(r: Rig, kind: Emblem, x: number, y: number, sx: number, color: string, size: number): void {
  if (kind === 'none') return;
  const c = r.c;
  const col = C(r, color);
  const dk = r.flash ? '#ffffff' : shade(color, 0.45);
  c.save();
  c.translate(x, y);
  c.scale(Math.max(0.25, sx) * size, size);
  c.fillStyle = col;
  c.strokeStyle = col;
  c.lineWidth = 1;
  c.beginPath();
  switch (kind) {
    case 'cross':
      c.rect(-0.8, -3, 1.6, 6);
      c.rect(-2.4, -1.6, 4.8, 1.5);
      c.fill();
      break;
    case 'shovel':
      c.rect(-0.45, -3.4, 0.9, 3.6);
      c.rect(-1.4, -3.8, 2.8, 0.8);
      c.moveTo(-1.8, 0.2);
      c.lineTo(1.8, 0.2);
      c.lineTo(1.4, 2.6);
      c.lineTo(0, 3.6);
      c.lineTo(-1.4, 2.6);
      c.closePath();
      c.fill();
      break;
    case 'trident':
      c.rect(-0.45, -1.4, 0.9, 5);
      c.rect(-2.4, -1.4, 4.8, 0.9);
      c.rect(-2.4, -3.6, 0.8, 2.4);
      c.rect(1.6, -3.6, 0.8, 2.4);
      c.rect(-0.45, -4, 0.9, 3);
      c.fill();
      break;
    case 'leaf':
      c.ellipse(0, 0, 1.6, 3.2, 0.5, 0, TAU);
      c.fill();
      line(c, -1, 2.4, 1, -2.2, dk, 0.5);
      break;
    case 'antler':
      c.lineWidth = 0.8;
      c.moveTo(-0.6, 3);
      c.lineTo(-1.6, -0.5);
      c.lineTo(-2.8, -3);
      c.moveTo(-1.6, -0.5);
      c.lineTo(-0.6, -2.6);
      c.moveTo(0.6, 3);
      c.lineTo(1.6, -0.5);
      c.lineTo(2.8, -3);
      c.moveTo(1.6, -0.5);
      c.lineTo(0.6, -2.6);
      c.stroke();
      break;
    case 'flame':
      c.moveTo(0, -3.6);
      c.quadraticCurveTo(2.8, -0.6, 2, 1.6);
      c.quadraticCurveTo(1.4, 3.4, 0, 3.4);
      c.quadraticCurveTo(-1.6, 3.4, -2, 1.6);
      c.quadraticCurveTo(-2.2, -0.4, -0.6, -1.2);
      c.quadraticCurveTo(-0.4, -2.4, 0, -3.6);
      c.fill();
      break;
    case 'anvil':
      c.moveTo(-3, -1.8);
      c.lineTo(3, -1.8);
      c.lineTo(1.2, 0.2);
      c.lineTo(1.2, 1.6);
      c.lineTo(2.2, 2.8);
      c.lineTo(-2.2, 2.8);
      c.lineTo(-1.2, 1.6);
      c.lineTo(-1.2, 0.2);
      c.lineTo(-2, -0.6);
      c.closePath();
      c.fill();
      break;
    case 'sun':
      c.arc(0, 0, 1.5, 0, TAU);
      c.fill();
      c.beginPath();
      c.lineWidth = 0.7;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        c.moveTo(Math.cos(a) * 2.1, Math.sin(a) * 2.1);
        c.lineTo(Math.cos(a) * 3.3, Math.sin(a) * 3.3);
      }
      c.stroke();
      break;
    case 'eye':
      c.moveTo(-3.2, 0);
      c.quadraticCurveTo(0, -2.8, 3.2, 0);
      c.quadraticCurveTo(0, 2.8, -3.2, 0);
      c.fill();
      dot(c, 0, 0, 1.1, dk);
      break;
    case 'star':
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i / 10) * TAU;
        const rr = i % 2 === 0 ? 3.2 : 1.3;
        c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      c.closePath();
      c.fill();
      break;
    case 'cog':
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU;
        const rr = i % 2 === 0 ? 3.1 : 2.3;
        c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      c.closePath();
      c.fill();
      dot(c, 0, 0, 0.9, dk);
      break;
    case 'gauge':
      c.arc(0, 0, 2.8, 0, TAU);
      c.fill();
      line(c, 0, 0, 1.6, -1.4, dk, 0.7);
      break;
    case 'padlock':
      c.lineWidth = 0.9;
      c.arc(0, -1, 1.7, Math.PI, TAU);
      c.stroke();
      c.beginPath();
      c.rect(-2.4, -1, 4.8, 3.8);
      c.fill();
      dot(c, 0, 0.6, 0.6, dk);
      break;
    case 'spores':
      for (const [px, py] of [[0, -2.2], [-2, 0.4], [2, 0.6], [-0.8, 2.4], [1.2, -0.2]] as const) {
        c.moveTo(px + 0.9, py);
        c.arc(px, py, 0.9, 0, TAU);
      }
      c.fill();
      break;
    case 'rat':
      c.ellipse(-0.4, 0.4, 2.4, 1.4, 0, 0, TAU);
      c.fill();
      dot(c, 2, -0.2, 0.9, col);
      c.beginPath();
      c.lineWidth = 0.6;
      c.moveTo(-2.6, 0.6);
      c.quadraticCurveTo(-3.8, 2.6, -1.8, 3);
      c.stroke();
      break;
    case 'skull':
      c.arc(0, -0.6, 2.4, 0, TAU);
      c.rect(-1.4, 1, 2.8, 1.8);
      c.fill();
      dot(c, -0.9, -0.6, 0.6, dk);
      dot(c, 0.9, -0.6, 0.6, dk);
      break;
    case 'moon':
      c.arc(0, 0, 2.8, 0.6, TAU - 0.6);
      c.arc(1.2, 0, 2, TAU - 0.9, 0.9, true);
      c.closePath();
      c.fill();
      break;
    case 'drop':
      c.moveTo(0, -3.2);
      c.quadraticCurveTo(2.6, 0.6, 1.6, 2.2);
      c.quadraticCurveTo(0, 3.6, -1.6, 2.2);
      c.quadraticCurveTo(-2.6, 0.6, 0, -3.2);
      c.fill();
      break;
  }
  c.restore();
}

// ------------------------------------------------------------------ the head
function coversHead(L: JoeLook): boolean {
  return L.head === 'hood' || L.head === 'helm' || L.head === 'greathelm' || (L.head === 'cap' && L.headStyle === 'coif') || L.head === 'horned';
}

function hairBack(r: Rig): void {
  // long hair falls behind the shoulders (front views)
  const L = r.L;
  if (coversHead(L)) return;
  if (L.hairStyle === 'long') longHair(r, r.fx * 1.1, HEAD_Y + r.fy * 0.7);
}

function longHair(r: Rig, hx: number, hy: number): void {
  const c = r.c;
  const w = proj(7.4, 5, r.fx, r.fy);
  const bx = hx - r.fx * 2.5;
  c.beginPath();
  c.moveTo(hx - w, hy - 1);
  c.lineTo(hx + w, hy - 1);
  c.quadraticCurveTo(bx + w + 0.8, hy + 7, bx + w * 0.6, hy + 11);
  c.quadraticCurveTo(bx, hy + 13, bx - w * 0.6, hy + 11);
  c.quadraticCurveTo(bx - w - 0.8, hy + 7, hx - w, hy - 1);
  c.closePath();
  c.fillStyle = C(r, r.L.hair);
  c.fill();
  c.lineWidth = 1.8;
  c.strokeStyle = OUTLINE;
  c.stroke();
  line(c, bx, hy + 2, bx, hy + 10, S(r, r.L.hair, 0.7), 0.8);
}

/** a point on the head's surface at ground angle th and height dy (from the head centre) */
function onHead(r: Rig, hx: number, hy: number, th: number, rad: number, dy: number): { x: number; y: number; v: number } {
  const s = Math.sin(th);
  return { x: hx + Math.cos(th) * rad, y: hy + dy + s * rad * 0.38, v: s };
}

function drawHead(r: Rig, hx: number, hy: number): void {
  const c = r.c;
  const L = r.L;
  // behind the head: hood drape, mitre lappets, bandana tails, the far horn
  headBehind(r, hx, hy);
  const cover = coversHead(L);
  if (!cover) hairBehindHead(r, hx, hy);
  // neck
  c.fillStyle = S(r, L.skin, 0.8);
  c.fillRect(hx - 2.6, hy + 4, 5.2, 5);
  // the head
  ell(c, hx, hy, HR, HR, C(r, L.skin), 2.2);
  if (cover) {
    headShell(r, hx, hy);
  } else {
    hair(r, hx, hy);
    face(r, hx, hy, false);
    ears(r, hx, hy);
  }
  headTop(r, hx, hy);
}

function ears(r: Rig, hx: number, hy: number): void {
  const c = r.c;
  for (const side of [1, -1]) {
    const p = onHead(r, hx, hy, r.f + (Math.PI / 2) * side, HR * 0.97, 2);
    if (p.v < -0.55) continue;
    ell(c, p.x, p.y, 1.6, 2.1, C(r, r.L.skin), 1.3);
  }
}

function hair(r: Rig, hx: number, hy: number): void {
  const c = r.c;
  const L = r.L;
  const st = L.hairStyle ?? 'short';
  const { fx, fy } = r;
  const hc = C(r, L.hair);
  if (st === 'bald') {
    if (!r.flash) dot(c, hx - 2.5, hy - 4, 1.6, 'rgba(255,255,255,0.45)');
    // a fringe around the back
    c.save();
    c.beginPath();
    c.arc(hx, hy, HR - 1, 0, TAU);
    c.clip();
    c.strokeStyle = hc;
    c.lineWidth = 2.2;
    c.beginPath();
    c.arc(hx - fx * 1.5, hy + 1 - fy * 1.6, HR - 0.6, r.f + Math.PI - 1.2, r.f + Math.PI + 1.2);
    c.stroke();
    c.restore();
    return;
  }
  // the hair cap: the part of the head covered by a disc offset away from the face
  const cx = hx - fx * HR * 0.55;
  const cy = hy - HR * 0.5 - fy * HR * 0.45;
  lens(c, hx, hy, HR - 1, cx, cy, HR * 1.05, hc);
  if (st === 'slick' && !r.flash) {
    c.strokeStyle = 'rgba(255,255,255,0.35)';
    c.lineWidth = 0.8;
    c.beginPath();
    c.arc(hx - fx * 2, hy - 3 - fy * 2, HR * 0.55, Math.PI * 1.1, Math.PI * 1.6);
    c.stroke();
  }
  switch (st) {
    case 'messy':
      for (const [ox, oy, a] of [[-3, -7, -0.6], [0.5, -8.2, 0.1], [3.6, -6.8, 0.7]] as const) {
        polyF(c, [hx + ox - 1.8 - fx, hy + oy + 1.6, hx + ox + Math.sin(a) * 3.6 - fx * 2, hy + oy - 2.4, hx + ox + 1.8 - fx, hy + oy + 1.6], hc, 1.2);
      }
      break;
    case 'topknot':
      ell(c, hx - fx * 3, hy - HR + 0.5 - fy * 1.5, 2.8, 2.5, hc, 1.6);
      break;
    case 'mohawk':
      polyF(c, [hx - fx * 6 - 1.5, hy - 4, hx - fx * 1, hy - HR - 4, hx + fx * 5, hy - HR - 1.5, hx + fx * 6 + 1.5, hy - 4], hc, 1.4);
      break;
    case 'braids':
      for (const side of [1, -1]) {
        const p = onHead(r, hx, hy, r.f + 1.75 * side, HR, 2);
        if (p.v < -0.6) continue;
        c.lineCap = 'round';
        line(c, p.x, p.y, p.x + (p.x - hx) * 0.15, p.y + 8, OUTLINE, 4);
        line(c, p.x, p.y, p.x + (p.x - hx) * 0.15, p.y + 8, hc, 2.4);
      }
      break;
    case 'bob':
      // chin-length sides framing the face (D183)
      for (const side of [1, -1]) {
        const p = onHead(r, hx, hy, r.f + 1.45 * side, HR * 0.98, 1.2);
        if (p.v < -0.65) continue;
        ell(c, p.x + (p.x - hx) * 0.08, p.y + 1.4, 2.7, 4.6, hc, 1.4);
      }
      if (fy <= -0.2) ell(c, hx, hy + 1.5, HR * 0.95, 4.6, hc, 1.6);
      break;
    case 'pigtails':
      // two tails tied at the sides, swinging as she moves (D183)
      for (const side of [1, -1]) {
        const b = onHead(r, hx, hy, r.f + 1.95 * side, HR * 0.95, -2);
        if (b.v < -0.75) continue;
        const sw = Math.sin(r.t * 5 + side) * 0.7 * (0.3 + r.mv);
        const ex = b.x + (b.x - hx) * 0.55 + sw;
        const ey = b.y + 8;
        c.lineCap = 'round';
        line(c, b.x, b.y, ex, ey, OUTLINE, 5);
        line(c, b.x, b.y, ex, ey, hc, 3);
        dot(c, b.x + (ex - b.x) * 0.15, b.y + (ey - b.y) * 0.15, 1.4, C(r, L.trim));
      }
      break;
    case 'long':
      // locks falling past the jaw on both sides of the face (D183: from the front it read as short hair)
      for (const side of [1, -1]) {
        const p = onHead(r, hx, hy, r.f + 1.4 * side, HR * 0.98, 1.6);
        if (p.v < -0.6 || fy <= -0.2) continue;
        ell(c, p.x + (p.x - hx) * 0.1, p.y + 3.6, 2.5, 6.2, hc, 1.4);
      }
      if (fy <= -0.2) longHair(r, hx, hy);
      break;
    case 'ponytail':
      if (fy <= -0.2) ponytail(r, hx, hy);
      break;
    case 'curly':
    case 'afro': {
      // curls round the hairline, away from the face
      const big = st === 'afro';
      for (const a of big ? [-1.5, -0.75, 0, 0.75, 1.5] : [-1.6, -0.8, 0, 0.8, 1.6]) {
        const p = onHead(r, hx, hy, r.f + Math.PI + a, HR * (big ? 1.02 : 0.86), big ? -4.2 : -3.4);
        dot(c, p.x, p.y, big ? 3 : 2.4, OUTLINE);
        dot(c, p.x, p.y, big ? 2.2 : 1.7, hc);
      }
      break;
    }
    case 'spiky':
      for (const a of [-1.7, -0.85, 0, 0.85, 1.7]) {
        const p = onHead(r, hx, hy, r.f + Math.PI + a, HR * 0.55, -5);
        const tx = p.x + (p.x - hx) * 0.55;
        const ty = p.y - 5 + Math.abs(a) * 1.2;
        polyF(c, [p.x - 2, p.y + 1.5, tx, ty, p.x + 2, p.y + 1.5], hc, 1.2);
      }
      break;
  }
}

function face(r: Rig, hx: number, hy: number, shadowed: boolean): void {
  const c = r.c;
  const L = r.L;
  const { fx, fy } = r;
  if (fy < -0.35) return;
  const eyeCol = shadowed && L.eyeGlow ? C(r, L.eyeGlow) : r.flash ? '#ffffff' : OUTLINE;
  const mark: FaceMark = shadowed ? 'none' : (L.mark ?? 'none');
  const shape: EyeShape = L.eyeShape ?? 'dot';
  const eyes = [onHead(r, hx, hy, r.f + 0.43, HR * 0.78, 1.6), onHead(r, hx, hy, r.f - 0.43, HR * 0.78, 1.6)] as const;
  // under the eyes: cheeks, freckles, war paint
  if (mark === 'rosy' || mark === 'freckles' || mark === 'rune') {
    for (const side of [1, -1]) {
      const p = onHead(r, hx, hy, r.f + 0.74 * side, HR * 0.8, 3.7);
      if (p.v < 0.1) continue;
      if (mark === 'rosy') {
        if (r.flash) continue;
        const ga = c.globalAlpha;
        c.globalAlpha = ga * 0.42;
        dot(c, p.x, p.y, 1.8, '#e0607a');
        c.globalAlpha = ga;
      } else if (mark === 'freckles') {
        const fc = S(r, L.skin, 0.62);
        dot(c, p.x - 0.9, p.y - 0.3, 0.45, fc);
        dot(c, p.x + 0.7, p.y - 0.6, 0.45, fc);
        dot(c, p.x, p.y + 0.6, 0.45, fc);
      } else if (side === 1) {
        const rc = C(r, '#2a9a94');
        line(c, p.x, p.y - 1.4, p.x, p.y + 1.4, rc, 0.8);
        line(c, p.x, p.y - 0.2, p.x - 1, p.y - 1.2, rc, 0.8);
        line(c, p.x, p.y - 0.2, p.x + 1, p.y - 1.2, rc, 0.8);
      }
    }
  } else if (mark === 'warpaint') {
    const mid = onHead(r, hx, hy, r.f, HR * 0.9, 1.5);
    const ga = c.globalAlpha;
    c.globalAlpha = ga * 0.85;
    c.lineCap = 'round';
    for (const side of [1, -1]) {
      const t = onHead(r, hx, hy, r.f + 0.95 * side, HR * 0.9, 1.3);
      if (t.v > -0.1) line(c, mid.v > 0 ? mid.x : eyes[side === 1 ? 0 : 1].x, mid.v > 0 ? mid.y : eyes[side === 1 ? 0 : 1].y, t.x, t.y, C(r, '#3a64b8'), 2.8);
    }
    c.globalAlpha = ga;
  }
  // eyes and brows
  const browCol = S(r, L.hair, 0.8);
  const browSt: Brows = L.brows ?? 'normal';
  const lx = -fy * 1.3;
  for (const side of [1, -1] as const) {
    const p = eyes[side === 1 ? 0 : 1];
    if (p.v < 0.05) continue;
    if (shadowed) {
      dot(c, p.x, p.y, 1.1, eyeCol);
      if (L.eyeGlow && !r.flash) glow(c, p.x, p.y, 4, L.eyeGlow, 0.7);
      continue;
    }
    if (mark === 'eyepatch' && side === -1) {
      // the strap round the head, then the patch
      const a = onHead(r, hx, hy, r.f - 1.45, HR * 0.98, -0.4);
      const b = onHead(r, hx, hy, r.f + 0.8, HR * 0.94, -4.6);
      if (a.v > -0.3) line(c, a.x, a.y, p.x, p.y, OUTLINE, 0.9);
      if (b.v > -0.3) line(c, p.x, p.y, b.x, b.y, OUTLINE, 0.9);
      ell(c, p.x, p.y + 0.1, 2.1, 1.9, C(r, '#2a2430'), 0.9);
    } else {
      eye(r, p.x, p.y, shape);
      // a woman's lashes, flicked up at the outer corner (D183)
      if (L.female && !r.flash && shape !== 'glow' && shape !== 'narrow') {
        const ox = p.x >= hx ? 1 : -1;
        line(c, p.x + ox * 1.1, p.y - 0.7, p.x + ox * 2.3, p.y - 1.7, OUTLINE, 0.75);
        line(c, p.x + ox * 0.3, p.y - 1.2, p.x + ox * 0.9, p.y - 2.3, OUTLINE, 0.7);
      }
      if (L.lids && !r.flash) {
        c.fillStyle = S(r, L.skin, 0.7);
        c.beginPath();
        c.arc(p.x, p.y + 0.25, 1.75, Math.PI, TAU);
        c.fill();
      }
    }
    if (browSt === 'none' || browSt === 'mono') continue;
    // inner end first; the default pair is a little lopsided (Joe is unimpressed)
    const ix = p.x - lx * side * 0.9 - 0.2;
    const ox = p.x + lx * side * 0.9;
    const [iy, oy] = browSt === 'angry' ? [p.y - 1.5, p.y - 2.7] : browSt === 'worried' ? [p.y - 2.7, p.y - 1.8] : [p.y - 2 + 0.2 * side, p.y - 2.3 - 0.1 * side];
    line(c, ix, iy, ox, oy, browCol, browSt === 'thick' ? 1.7 : 0.9);
  }
  if (shadowed) return;
  if (browSt === 'mono') {
    const [a, b] = eyes;
    const pa = a.v >= 0.05 ? a : b;
    const pb = b.v >= 0.05 ? b : a;
    c.strokeStyle = browCol;
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(pa.x + lx * 0.9, pa.y - 2.3);
    c.quadraticCurveTo((pa.x + pb.x) / 2, (pa.y + pb.y) / 2 - 1.5, pb.x - lx * 0.9, pb.y - 2.3);
    c.stroke();
  }
  // nose
  const np = onHead(r, hx, hy, r.f, HR * (0.88 + 0.14 * (1 - Math.abs(fy))), 3.4);
  if (np.v > -0.15) nose(r, np.x, np.y, L.nose ?? 'button');
  if (mark === 'scar') {
    const p = eyes[0].v >= 0.05 ? eyes[0] : eyes[1];
    if (p.v >= 0.05) {
      const sc = C(r, '#b8606a');
      line(c, p.x + 0.9, p.y - 3.6, p.x - 0.9, p.y + 3.2, sc, 0.9);
      line(c, p.x + 0.1, p.y - 2.4, p.x + 1.3, p.y - 2, sc, 0.6);
      line(c, p.x - 0.5, p.y + 1.8, p.x + 0.7, p.y + 2.2, sc, 0.6);
    }
  }
  // beard
  const beard = L.beard ?? 'stubble';
  const jaw = onHead(r, hx, hy, r.f, HR * 0.5, 4.9);
  if (beard === 'stubble' && !r.flash) {
    const ga = c.globalAlpha;
    c.globalAlpha = ga * 0.38;
    lens(c, hx, hy, HR - 1.1, jaw.x + fx * 1.2, jaw.y + 4.2, 5.6, C(r, L.hair));
    c.globalAlpha = ga;
  } else if (beard === 'mutton') {
    for (const side of [1, -1]) {
      const p = onHead(r, hx, hy, r.f + 1.02 * side, HR * 0.84, 3.4);
      if (p.v > -0.25) ell(c, p.x, p.y, 1.9, 2.9, C(r, L.hair), 1.1);
    }
  } else if (beard === 'full' || beard === 'braided' || beard === 'long') {
    const w = HR * 0.78 * (0.6 + 0.4 * Math.abs(fy));
    const len = beard === 'long' ? 10.5 : 5.4;
    c.beginPath();
    c.moveTo(jaw.x - w, jaw.y - 1.8);
    c.quadraticCurveTo(jaw.x - w * 0.8, jaw.y + len - 0.8, jaw.x + fx * 1.5, jaw.y + len);
    c.quadraticCurveTo(jaw.x + w * 0.8, jaw.y + len - 0.8, jaw.x + w, jaw.y - 1.8);
    c.quadraticCurveTo(jaw.x, jaw.y + 0.6, jaw.x - w, jaw.y - 1.8);
    c.fillStyle = C(r, L.hair);
    c.fill();
    c.lineWidth = 1.4;
    c.strokeStyle = OUTLINE;
    c.stroke();
    if (beard === 'braided') {
      line(c, jaw.x + fx, jaw.y + 4.6, jaw.x + fx * 1.4, jaw.y + 9, OUTLINE, 3.4);
      line(c, jaw.x + fx, jaw.y + 4.6, jaw.x + fx * 1.4, jaw.y + 9, C(r, L.hair), 2);
      dot(c, jaw.x + fx * 1.4, jaw.y + 9, 1, C(r, '#c9b98a'));
    }
  } else if (beard === 'goatee') {
    ell(c, jaw.x + fx * 1.2, jaw.y + 2.4, 1.6, 1.5, C(r, L.hair), 1);
  }
  if (beard === 'long' && !r.flash) line(c, jaw.x + fx * 1.2, jaw.y + 2.5, jaw.x + fx * 1.4, jaw.y + 8.5, S(r, L.hair, 0.7), 0.8);
  if (beard === 'moustache' || beard === 'full' || beard === 'braided' || beard === 'long' || beard === 'mutton') {
    const m = onHead(r, hx, hy, r.f, HR * 0.86, 4.6);
    const w = 2.6 * (0.4 + 0.6 * Math.abs(fy));
    c.strokeStyle = C(r, shade(L.hair, beard === 'moustache' ? 1 : 0.8));
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(m.x - w, m.y + 0.8);
    c.quadraticCurveTo(m.x, m.y - 0.8, m.x + w, m.y + 0.8);
    c.stroke();
  } else if (fy > 0.15 && L.female) {
    // a woman's lips: small and soft (D183)
    const m = onHead(r, hx, hy, r.f, HR * 0.84, 5.2);
    const lip = C(r, mix(L.skin, '#c0465e', 0.55));
    ell(c, m.x, m.y + 0.1, 1.25 * fy + 0.35, 0.62, lip, 0);
    line(c, m.x - 1.2 * fy, m.y, m.x + 1.2 * fy, m.y, C(r, shade(L.skin, 0.5)), 0.6);
  } else if (fy > 0.15) {
    // mouth: a flat line, Joe is not impressed
    const m = onHead(r, hx, hy, r.f, HR * 0.84, 5.2);
    line(c, m.x - 1.1 * fy, m.y, m.x + 1.1 * fy, m.y, C(r, shade(L.skin, 0.55)), 0.8);
  }
}

function eye(r: Rig, x: number, y: number, shape: EyeShape): void {
  const c = r.c;
  const L = r.L;
  const col = L.eyes;
  if (r.flash) {
    dot(c, x, y, 1.25, '#ffffff');
    return;
  }
  switch (shape) {
    case 'round':
      // big googly whites with a coloured iris that looks where Joe looks
      ell(c, x, y, 1.8, 1.65, C(r, '#f4efe4'), 0.7);
      dot(c, x + r.fx * 0.4, y + r.fy * 0.25, 1, C(r, col ?? '#5a3a22'));
      dot(c, x + r.fx * 0.45, y + r.fy * 0.3, 0.45, OUTLINE);
      return;
    case 'narrow':
      line(c, x - 1.4, y + 0.1, x + 1.4, y - 0.1, OUTLINE, 1.1);
      if (col) dot(c, x, y, 0.45, C(r, col));
      return;
    case 'sleepy':
      dot(c, x, y + 0.3, 1.1, OUTLINE);
      c.fillStyle = S(r, L.skin, 0.72);
      c.beginPath();
      c.arc(x, y + 0.35, 1.6, Math.PI, TAU);
      c.fill();
      line(c, x - 1.6, y + 0.35, x + 1.6, y + 0.35, OUTLINE, 0.6);
      return;
    case 'glow':
      dot(c, x, y, 1.2, C(r, col ?? '#8fd3ff'));
      glow(c, x, y, 3.8, col ?? '#8fd3ff', 0.6);
      return;
    case 'dot':
    default:
      dot(c, x, y, 1.3, OUTLINE);
      if (col) dot(c, x + r.fx * 0.15, y - 0.1, 0.7, C(r, col));
  }
}

function nose(r: Rig, x: number, y: number, st: NoseShape): void {
  const c = r.c;
  const L = r.L;
  const { fx, fy } = r;
  switch (st) {
    case 'big':
      ell(c, x, y + 0.2, 2.1, 1.8, S(r, L.skin, 0.9), 0.9);
      if (!r.flash) dot(c, x - 0.6, y - 0.4, 0.5, 'rgba(255,255,255,0.45)');
      return;
    case 'long':
      ell(c, x + fx * 0.7, y + 0.7, 1.05 + Math.abs(fx) * 1.1, 2.1, S(r, L.skin, 0.86), 0.8);
      return;
    case 'hooked':
      c.beginPath();
      c.moveTo(x - 0.8, y - 1.9);
      c.quadraticCurveTo(x + fx * 2.8 + 1.1 * fy, y - 1.5, x + fx * 1.7 + 0.4, y + 1.3);
      c.lineTo(x - 0.9, y + 0.9);
      c.closePath();
      c.fillStyle = S(r, L.skin, 0.84);
      c.fill();
      c.lineWidth = 0.8;
      c.strokeStyle = OUTLINE;
      c.stroke();
      return;
    case 'pointy':
      polyF(c, [x - 1, y - 1, x + 1, y - 1, x + fx * 3.4, y + 0.9 + fy * 0.9], S(r, L.skin, 0.88), 0.8);
      return;
    case 'red':
      ell(c, x, y + 0.2, 1.75, 1.6, C(r, '#d0453f'), 0.9);
      if (!r.flash) dot(c, x - 0.5, y - 0.3, 0.5, 'rgba(255,255,255,0.6)');
      return;
    case 'button':
    default:
      ell(c, x, y, 1.25, 1.1, S(r, L.skin, 0.82), 0);
  }
}

/** hair that sits behind the head itself (drawn before it): the afro's volume, a ponytail seen from the front */
function hairBehindHead(r: Rig, hx: number, hy: number): void {
  const st = r.L.hairStyle;
  if (st === 'afro') {
    ell(r.c, hx - r.fx * 1.4, hy - 2.6 - r.fy * 0.6, HR * 1.42, HR * 1.3, C(r, r.L.hair), 2);
  } else if (st === 'ponytail' && r.fy > -0.2) {
    ponytail(r, hx, hy);
  }
}

function ponytail(r: Rig, hx: number, hy: number): void {
  const c = r.c;
  const b = onHead(r, hx, hy, r.f + Math.PI, HR * 0.9, -2.5);
  const sw = Math.sin(r.t * 5) * 0.8 * (0.3 + r.mv);
  const ex = b.x - r.fx * 4 + sw;
  const ey = b.y + 8.5;
  c.lineCap = 'round';
  line(c, b.x, b.y, ex, ey, OUTLINE, 5.4);
  line(c, b.x, b.y, ex, ey, C(r, r.L.hair), 3.2);
  dot(c, b.x + (ex - b.x) * 0.12, b.y + (ey - b.y) * 0.12, 1.5, C(r, r.L.trim));
}

function headBehind(r: Rig, hx: number, hy: number): void {
  const c = r.c;
  const L = r.L;
  const { fx, fy } = r;
  const hc = L.headColor;
  switch (L.head) {
    case 'hood': {
      // the hood's cowl lying on the shoulders
      const st = L.headStyle ?? 'pointed';
      const w = st === 'ranger' ? 12 : 10.5;
      ell(c, hx - fx * 1.5, hy + 5.5, w, 6.5, S(r, hc, 0.85), 2);
      break;
    }
    case 'cap':
      if (L.headStyle === 'coif') ell(c, hx - fx * 1.2, hy + 5.2, 10, 5.6, C(r, mix(hc, '#a7adb5', 0.6)), 2);
      break;
    case 'helm':
      if (L.headStyle === 'winged' || L.headStyle === 'finned') {
        // the sallet's tail / scale aventail over the neck
        polyF(c, [hx - 7, hy + 2, hx + 7, hy + 2, hx + 8 - fx * 3, hy + 8, hx - 8 - fx * 3, hy + 8], S(r, hc, 0.8), 1.8);
      }
      break;
    case 'mitre':
      if (fy < 0.6) {
        // lappets
        for (const k of [-1, 1]) {
          const x = hx - fx * 4 + k * 2.4 * Math.abs(fy) + k * 0.8;
          polyF(c, [x - 1.2, hy - 2, x + 1.2, hy - 2, x + 1.4, hy + 9, x - 1.4, hy + 9], C(r, L.headTrim ?? L.trim), 1.2);
        }
      }
      break;
    case 'bandana':
      if ((L.headStyle ?? 'tied') === 'tied' || L.headStyle === 'mask') {
        // the knot's tails flutter behind
        const k = onHead(r, hx, hy, r.f + Math.PI, HR * 0.95, L.headStyle === 'mask' ? 3 : -2.5);
        const fl = Math.sin(r.t * 6) * 1.2 * (0.4 + r.mv);
        const tx = -fx * (5 + 3 * r.mv);
        const ty = -fy * 2 + 3;
        polyF(c, [k.x, k.y - 1, k.x + tx + fl, k.y + ty - 1.5, k.x + tx * 0.8 + fl, k.y + ty + 1.2], C(r, hc), 1.3);
        polyF(c, [k.x, k.y, k.x + tx * 0.7 - fl, k.y + ty + 3, k.x + tx * 0.4 - fl, k.y + ty + 4.4], S(r, hc, 0.85), 1.3);
      }
      break;
  }
}

interface Win {
  ox: number;
  oy: number;
  orx: number;
  ory: number;
}
/** the face opening of a hood or open helm; it slides to the edge of the head in profile */
function faceWin(r: Rig, hx: number, hy: number, wk: number, hk: number, dy: number): Win {
  const side = 1 - Math.abs(r.fy);
  return { ox: hx + r.fx * HR * (0.42 + 0.4 * side), oy: hy + dy + r.fy * 1.2, orx: HR * wk * (0.62 + 0.38 * Math.abs(r.fy)), ory: HR * hk };
}
/** Paint the face inside the opening of the head shell (clipped to the shell), shadow it, rim it. */
function faceWindow(r: Rig, hx: number, hy: number, R: number, sy: number, w: Win, shadowA: number, rim: string | null, glowEyes: boolean): void {
  const c = r.c;
  c.save();
  c.beginPath();
  c.arc(hx, sy, R - 0.9, 0, TAU);
  c.clip();
  c.beginPath();
  c.ellipse(w.ox, w.oy, w.orx, w.ory, 0, 0, TAU);
  c.clip();
  c.fillStyle = C(r, r.L.skin);
  c.fillRect(hx - R - 4, hy - R - 4, R * 2 + 8, R * 2 + 8);
  face(r, hx, hy, false);
  if (shadowA > 0) {
    c.fillStyle = r.flash ? '#ffffff' : `rgba(10,6,12,${shadowA})`;
    if (shadowA > 0.7) c.fillRect(hx - R - 4, hy - R - 4, R * 2 + 8, R * 2 + 8);
    c.beginPath();
    c.ellipse(w.ox, w.oy - w.ory * 0.55, w.orx * 1.6, w.ory * 1.05, 0, 0, TAU);
    c.fill();
  }
  if (glowEyes) face(r, hx, hy, true);
  // the inner edge of the opening
  c.lineWidth = 1.8;
  c.strokeStyle = OUTLINE;
  c.beginPath();
  c.ellipse(w.ox, w.oy, w.orx, w.ory, 0, 0, TAU);
  c.stroke();
  c.restore();
  if (rim) {
    c.save();
    c.beginPath();
    c.arc(hx, sy, R - 0.6, 0, TAU);
    c.clip();
    c.strokeStyle = rim;
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(w.ox, w.oy, w.orx + 0.9, w.ory + 0.9, 0, Math.PI * 0.9, Math.PI * 2.1);
    c.stroke();
    c.restore();
  }
}

/** Gear that covers the head: hoods, coifs, helms, great helms. The face shows through an opening. */
function headShell(r: Rig, hx: number, hy: number): void {
  const c = r.c;
  const L = r.L;
  const { fx, fy } = r;
  const hc = L.headColor;
  const trim = L.headTrim ?? L.trim;
  const st = L.headStyle;
  const faceOpen = fy > -0.3;
  switch (L.head) {
    case 'hood': {
      const style = st ?? 'pointed';
      // the peak
      if (style !== 'cowl') {
        const tx = hx - fx * 3.5;
        const ty = hy - HR - (style === 'deep' ? 5.5 : 4.5);
        polyF(c, [hx - 5.5, hy - 4, tx, ty, hx + 5.5, hy - 4], C(r, hc), 2);
      }
      const R = HR + 1.8;
      const sy = hy - 0.4;
      ell(c, hx, sy, R, R, C(r, hc), 2);
      lens(c, hx, sy, R - 1, hx + R * 0.5, hy + R * 0.45, R * 0.85, S(r, hc, 0.78));
      if (style === 'cowl') {
        for (const [a, d] of [[0.6, 0.6], [2.2, 0.75], [3.8, 0.55], [5.2, 0.7]] as const) dot(c, hx + Math.cos(a + r.f) * R * d, hy - 2 + Math.sin(a + r.f) * R * d * 0.6, 0.9, C(r, trim));
      }
      if (style === 'ranger' || style === 'pointed') line(c, hx - fx * 2, hy - R + 1.5, hx - fx * 5, hy + 3, S(r, hc, 0.7), 0.9);
      if (faceOpen) {
        const deep = style === 'deep';
        const w = faceWin(r, hx, hy, deep ? 0.52 : 0.64, deep ? 0.6 : 0.7, 1.8);
        faceWindow(r, hx, hy, R, sy, w, deep ? 0.82 : 0.5, style === 'pointed' ? S(r, hc, 1.25) : C(r, trim), !!L.eyeGlow || deep);
      }
      break;
    }
    case 'cap': {
      // coif: a mail hood with the face open
      const m = mix(hc, '#a7adb5', 0.6);
      const R = HR + 1.3;
      const sy = hy - 0.3;
      ell(c, hx, sy, R, R, C(r, m), 2);
      lens(c, hx, sy, R - 1, hx + R * 0.55, hy + R * 0.5, R * 0.85, S(r, m, 0.78));
      if (!r.flash) {
        c.save();
        c.beginPath();
        c.arc(hx, sy, R - 1, 0, TAU);
        c.clip();
        rings(c, shade(m, 0.72), hx - R, hx + R, hy - R, hy + R);
        c.restore();
      }
      if (faceOpen) {
        faceWindow(r, hx, hy, R, sy, faceWin(r, hx, hy, 0.68, 0.66, 1.6), 0, null, false);
        // a cloth band across the brow
        const a0 = onHead(r, hx, hy, r.f - 1.4, R - 0.2, -3);
        const a1 = onHead(r, hx, hy, r.f + 1.4, R - 0.2, -3);
        c.strokeStyle = C(r, hc);
        c.lineWidth = 1.8;
        c.beginPath();
        c.moveTo(a0.x, a0.y);
        c.quadraticCurveTo(hx + fx * R * 1.1, hy - 3 + fy * R * 0.5, a1.x, a1.y);
        c.stroke();
      }
      break;
    }
    case 'helm':
    case 'horned':
      helm(r, hx, hy, faceOpen);
      break;
    case 'greathelm':
      greathelm(r, hx, hy);
      break;
  }
}

function helm(r: Rig, hx: number, hy: number, faceOpen: boolean): void {
  const c = r.c;
  const L = r.L;
  const fx = r.fx;
  const hc = L.headColor;
  const st = L.headStyle ?? (L.head === 'horned' ? 'horns' : 'nasal');
  const R = HR + 1.3;
  const closed = !!L.visor;
  const open = faceOpen && !closed;
  const sy = hy - 0.3;
  const brimY = hy - 5;
  if (st === 'kettle') ell(c, hx, brimY, R + 4, (R + 4) * 0.42, S(r, hc, 1.08), 1.8);
  const shellPath = (): void => {
    c.beginPath();
    if (st === 'shell') c.ellipse(hx, hy - 1.5, R + 2.6, R - 0.4, 0, 0, TAU);
    else c.arc(hx, sy, R, 0, TAU);
  };
  shellPath();
  c.fillStyle = C(r, hc);
  c.fill();
  const needClip = st === 'shell' || (L.texture === 'scales' && !r.flash);
  if (needClip) {
    c.save();
    c.clip();
    c.fillStyle = S(r, hc, 0.72);
    c.beginPath();
    c.ellipse(hx + R * 0.55, hy + R * 0.5, R * 0.8, R * 0.85, 0, 0, TAU);
    c.fill();
  } else {
    lens(c, hx, sy, R - 0.6, hx + R * 0.55, hy + R * 0.5, R * 0.85, S(r, hc, 0.72));
  }
  // brow band
  c.strokeStyle = S(r, hc, 0.55);
  c.lineWidth = 1.1;
  c.beginPath();
  c.ellipse(hx, hy - 1.5, R, R * 0.38, 0, 0, Math.PI);
  c.stroke();
  if (st === 'shell') {
    c.fillStyle = C(r, L.headTrim ?? L.trim);
    for (const [a, d] of [[0.4, 0.55], [1.9, 0.7], [3.3, 0.45], [4.6, 0.65], [5.6, 0.3]] as const) {
      c.beginPath();
      c.arc(hx + Math.cos(a) * R * d, hy - 4 + Math.sin(a) * R * d * 0.55, 1.1, 0, TAU);
      c.fill();
    }
  }
  if (L.texture === 'scales' && !r.flash) scales(c, shade(hc, 1.3), shade(hc, 0.5), hx - R - 3, hx + R + 3, hy - R, hy + 2);
  if (needClip) c.restore();
  if (!r.flash) dot(c, hx - 3.4, hy - 5.2, 1.5, 'rgba(255,255,255,0.6)');
  shellPath();
  c.lineWidth = 2.2;
  c.strokeStyle = OUTLINE;
  c.stroke();
  if (open) faceWindow(r, hx, hy, R, sy, faceWin(r, hx, hy, 0.6, 0.56, 2.8), 0.25, null, false);
  if (st === 'shell') {
    // gills under the rim
    c.strokeStyle = S(r, hc, 0.5);
    c.lineWidth = 0.8;
    c.beginPath();
    for (let i = 0; i < 7; i++) {
      const a = Math.PI * (0.1 + i * 0.13);
      c.moveTo(hx + Math.cos(a) * (R + 1.8), hy - 1.5 + Math.sin(a) * (R - 1.4));
      c.lineTo(hx + Math.cos(a) * (R - 0.6), hy - 1.5 + Math.sin(a) * (R - 3.4));
    }
    c.stroke();
  }
  if (st === 'kettle') {
    // the front half of the wide brim (its back half went behind the dome)
    c.beginPath();
    c.ellipse(hx, brimY, R + 4, (R + 4) * 0.42, 0, 0, Math.PI);
    c.ellipse(hx, brimY, R - 0.6, (R - 0.6) * 0.42, 0, Math.PI, 0, true);
    c.closePath();
    c.fillStyle = S(r, hc, 1.08);
    c.fill();
    c.lineWidth = 1.8;
    c.strokeStyle = OUTLINE;
    c.stroke();
    if (L.texture === 'dents') {
      // a shovel-shaped dent in the dome
      c.strokeStyle = S(r, hc, 0.55);
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(hx + 1.2, hy - 8.4);
      c.lineTo(hx + 2.6, hy - 6.8);
      c.lineTo(hx + 4.2, hy - 7.6);
      c.stroke();
    }
  } else if (st === 'nasal' && faceOpen) {
    const n = onHead(r, hx, hy, r.f, R - 0.4, 0);
    line(c, n.x, hy - 2, n.x + fx * 0.3, hy + 3.4, OUTLINE, 3);
    line(c, n.x, hy - 2, n.x + fx * 0.3, hy + 3.4, S(r, hc, 1.2), 1.6);
  } else if (st === 'winged') {
    // little wings at the temples
    for (const side of [1, -1]) {
      const p = onHead(r, hx, hy, r.f + (Math.PI / 2) * side, R, -2);
      if (p.v < -0.6) continue;
      // wings sweep outward, and backward when seen from the side
      const o = clamp(Math.cos(r.f + (Math.PI / 2) * side) * 1.3 - fx * 0.75, -1, 1);
      const wc = C(r, L.headTrim ?? L.trim);
      for (let i = 2; i >= 0; i--) polyF(c, [p.x - o * 0.5, p.y + 2, p.x + o * (5.5 + i * 2), p.y - 9.5 + i * 3.4, p.x + o * (3.4 + i * 1.8), p.y + 1.6], i === 0 ? wc : S(r, L.headTrim ?? L.trim, 0.82), 1.2);
    }
  }
  if (closed && faceOpen) visorSlit(r, hx, hy, R, hy + 1);
}

function visorSlit(r: Rig, hx: number, hy: number, R: number, y: number): void {
  const c = r.c;
  const L = r.L;
  const v = L.visor ?? 'slit';
  const glowC = L.eyeGlow;
  // the front arc of the visor band, clipped to the half of the head facing the camera
  let c0 = r.f;
  while (c0 < -Math.PI / 2) c0 += TAU;
  while (c0 >= Math.PI * 1.5) c0 -= TAU;
  const half = 0.95;
  const lo = Math.max(c0 - half, 0.02);
  const hi = Math.min(c0 + half, Math.PI - 0.02);
  if (lo >= hi) return;
  const ry = R * 0.38;
  const slitC = glowC ? C(r, glowC) : r.flash ? '#ffffff' : OUTLINE;
  if (v === 'grille') {
    // a round porthole with bars
    const p = onHead(r, hx, hy, r.f, R - 1, y - hy);
    const pr = 3.6;
    ell(c, p.x, p.y + 0.5, pr * (0.5 + 0.5 * Math.abs(r.fy)), pr, C(r, '#1a1a20'), 1.6);
    c.strokeStyle = C(r, L.headTrim ?? L.trim);
    c.lineWidth = 0.9;
    c.beginPath();
    for (let i = -1; i <= 1; i++) {
      c.moveTo(p.x + i * 1.3 * Math.abs(r.fy), p.y - pr + 1);
      c.lineTo(p.x + i * 1.3 * Math.abs(r.fy), p.y + pr);
    }
    c.stroke();
    if (glowC && !r.flash) glow(c, p.x, p.y, 7, glowC, 0.6);
    return;
  }
  c.strokeStyle = slitC;
  c.lineWidth = v === 'cross' ? 1.6 : 1.9;
  c.beginPath();
  c.ellipse(hx, y, R - 0.2, ry, 0, lo, hi);
  c.stroke();
  if (v === 'cross') {
    // the vertical bar of a cross-shaped visor
    const p = onHead(r, hx, hy, r.f, R - 0.3, y - hy);
    if (p.v > -0.1) {
      line(c, p.x, p.y - 3.8, p.x, p.y + 4.4, slitC, 1.6);
      c.strokeStyle = C(r, L.headTrim ?? L.trim);
      c.lineWidth = 0.9;
      c.beginPath();
      c.moveTo(p.x - 1.2, p.y - 4.6);
      c.lineTo(p.x - 1.2, p.y + 5);
      c.moveTo(p.x + 1.2, p.y - 4.6);
      c.lineTo(p.x + 1.2, p.y + 5);
      c.stroke();
    }
  }
  if (glowC && !r.flash) {
    const p = onHead(r, hx, hy, r.f, R - 0.3, y - hy);
    glow(c, p.x, p.y, 8, glowC, 0.55);
  }
}

function greathelm(r: Rig, hx: number, hy: number): void {
  const c = r.c;
  const L = r.L;
  const { fx, fy } = r;
  const hc = L.headColor;
  const st = L.headStyle ?? 'bucket';
  const R = HR + 1.1;
  const top = hy - HR - 0.2;
  const bot = hy + HR + 1.4;
  // the cylinder body
  c.beginPath();
  c.moveTo(hx - R, top);
  c.lineTo(hx - R + 0.4, bot - 2.2);
  c.quadraticCurveTo(hx, bot + 2.2, hx + R - 0.4, bot - 2.2);
  c.lineTo(hx + R, top);
  c.closePath();
  c.fillStyle = C(r, hc);
  c.fill();
  c.save();
  c.clip();
  c.fillStyle = S(r, hc, 0.74);
  c.fillRect(hx + R * 0.35, top - 2, R, bot - top + 6);
  c.fillStyle = S(r, hc, 1.15);
  c.fillRect(hx - R, top, R * 0.45, bot - top);
  c.restore();
  c.lineWidth = 2.2;
  c.strokeStyle = OUTLINE;
  c.stroke();
  // the flat top seen from above
  ell(c, hx, top, R, 3.6, S(r, hc, st === 'spiked' ? 0.85 : 1.22), 2);
  const trim = C(r, L.headTrim ?? L.trim);
  if (fy > -0.3) {
    // a reinforcing strip down the front and the visor
    const p = onHead(r, hx, hy, r.f, R - 0.2, 0);
    if (p.v > -0.2 && L.visor !== 'grille') {
      c.strokeStyle = trim;
      c.lineWidth = 1.6 * Math.max(0.5, Math.abs(fy)) + 0.4;
      c.beginPath();
      c.moveTo(p.x, top + 2.2);
      c.lineTo(p.x, bot - 1.4);
      c.stroke();
    }
    visorSlit(r, hx, hy, R, hy - 0.6);
    // breaths: small holes below the slit on one cheek
    if (L.visor !== 'grille' && !r.flash) {
      const b = onHead(r, hx, hy, r.f + 0.55, R - 0.4, 3.8);
      if (b.v > 0) {
        c.fillStyle = OUTLINE;
        for (let i = 0; i < 3; i++) c.fillRect(b.x - 1.4 + i * 1.2 * Math.abs(fy), b.y + (i % 2) * 1.1, 0.8, 0.8);
      }
    }
  } else {
    // back: a seam and rivets
    line(c, hx - fx * R * 0.9, top + 2, hx - fx * R * 0.9, bot - 1, S(r, hc, 0.6), 1);
  }
  // rim band at the bottom
  c.strokeStyle = trim;
  c.lineWidth = 1.2;
  c.beginPath();
  c.moveTo(hx - R + 0.6, bot - 3.4);
  c.quadraticCurveTo(hx, bot + 0.8, hx + R - 0.6, bot - 3.4);
  c.stroke();
}

/** Gear on top of the head: crowns, caps, wizard hats, mitres, bandanas, bowlers, crests, plumes, horns. */
function headTop(r: Rig, hx: number, hy: number): void {
  const c = r.c;
  const L = r.L;
  const { fx, fy } = r;
  const hc = L.headColor;
  const trim = L.headTrim ?? L.trim;
  switch (L.head) {
    case 'cap':
      if (L.headStyle !== 'coif') cap(r, hx, hy);
      break;
    case 'bandana': {
      const st = L.headStyle ?? 'tied';
      if (st === 'mask') {
        // tied over the nose and mouth: the sewers smell
        if (fy > -0.4) {
          c.save();
          c.beginPath();
          c.arc(hx, hy, HR - 0.2, 0, TAU);
          c.clip();
          c.fillStyle = C(r, hc);
          c.beginPath();
          c.moveTo(hx - HR, hy + 2.6);
          c.lineTo(hx + HR, hy + 2.6);
          c.lineTo(hx + HR, hy + HR);
          c.lineTo(hx + fx * 3, hy + HR + 1);
          c.lineTo(hx - HR, hy + HR);
          c.closePath();
          c.fill();
          c.restore();
          line(c, hx - HR + 0.6, hy + 2.6, hx + HR - 0.6, hy + 2.6, OUTLINE, 1);
        }
        // and a sweatband on top
        c.strokeStyle = S(r, hc, 0.75);
        c.lineWidth = 1.6;
        c.beginPath();
        c.ellipse(hx, hy - 3.6, HR - 0.6, (HR - 0.6) * 0.36, 0, 0, TAU);
        c.stroke();
        break;
      }
      // a kerchief over the top of the head with a knot at the back
      c.save();
      c.beginPath();
      c.arc(hx, hy, HR + 0.3, 0, TAU);
      c.clip();
      c.fillStyle = C(r, hc);
      c.beginPath();
      c.ellipse(hx - fx * 1.5, hy - HR * 0.55 - fy * 1.2, HR * 1.25, HR * 0.78, 0, 0, TAU);
      c.fill();
      c.fillStyle = C(r, trim);
      for (const [a, d] of [[0.5, 0.5], [2.1, 0.6], [3.6, 0.45], [5, 0.6]] as const) {
        c.beginPath();
        c.arc(hx + Math.cos(a) * HR * d, hy - 5 + Math.sin(a) * HR * d * 0.4, 0.8, 0, TAU);
        c.fill();
      }
      c.restore();
      c.strokeStyle = OUTLINE;
      c.lineWidth = 1.4;
      c.beginPath();
      c.ellipse(hx - fx * 1.5, hy - HR * 0.55 - fy * 1.2, HR * 1.25, HR * 0.78, 0, 0.15, Math.PI - 0.15);
      c.stroke();
      ell(c, hx, hy, HR, HR, 'rgba(0,0,0,0)', 2.2);
      const k = onHead(r, hx, hy, r.f + Math.PI, HR * 0.95, -2.5);
      if (k.v > -0.9) ell(c, k.x, k.y, 2, 1.7, S(r, hc, 0.85), 1.3);
      break;
    }
    case 'crown':
      crown(r, hx, hy);
      break;
    case 'wizard': {
      // wide brim, a tall cone that flops backward and sways, a band and stars
      const by = hy - 3.4;
      ell(c, hx, by, 13, 5.2, C(r, hc), 2);
      c.fillStyle = S(r, hc, 0.7);
      c.beginPath();
      c.ellipse(hx, by + 0.4, 8, 2.9, 0, 0, TAU);
      c.fill();
      const tipX = hx - fx * 5 + Math.sin(r.t * 2.1) * 1.2 - 3;
      const tipY = by - 20 - fy * 1.2;
      const cone = (): void => {
        c.beginPath();
        c.moveTo(hx - 7.4, by);
        c.quadraticCurveTo(hx - 3.2, by - 11, tipX, tipY);
        c.quadraticCurveTo(hx + 4.8, by - 10, hx + 7.4, by);
      };
      cone();
      c.quadraticCurveTo(hx, by + 2.4, hx - 7.4, by);
      c.closePath();
      c.fillStyle = C(r, hc);
      c.fill();
      c.save();
      c.clip();
      c.fillStyle = S(r, hc, 0.78);
      c.beginPath();
      c.ellipse(hx + 6, by - 6, 5, 14, 0.3, 0, TAU);
      c.fill();
      // band
      c.fillStyle = C(r, trim);
      c.fillRect(hx - 10, by - 3.4, 20, 2.8);
      // stars
      emblem(r, 'star', hx - 1.5 - fx, by - 9, 1, trim, 0.55);
      emblem(r, 'moon', hx + 1.6 - fx * 2, by - 14.5, 1, trim, 0.4);
      c.restore();
      c.lineWidth = 2;
      c.lineJoin = 'round';
      c.strokeStyle = OUTLINE;
      cone();
      c.stroke();
      ell(c, tipX, tipY, 1.4, 1.4, C(r, trim), 1);
      // the front of the brim overlaps the cone base
      c.strokeStyle = C(r, shade(hc, 1.15));
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(hx, by, 12, 4.4, 0, 0.25, Math.PI - 0.25);
      c.stroke();
      break;
    }
    case 'mitre': {
      // tall and flat: wide from the front, narrow from the side
      const w = proj(6.8, 3.2, fx, fy);
      const by = hy - 4.2;
      const pts = [hx - w, by + 1, hx - w * 0.85, by - 11, hx - w * 0.15, by - 17.5, hx, by - 18.5, hx + w * 0.15, by - 17.5, hx + w * 0.85, by - 11, hx + w, by + 1];
      polyF(c, pts, C(r, hc), 2);
      c.save();
      c.beginPath();
      c.moveTo(pts[0]!, pts[1]!);
      for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i]!, pts[i + 1]!);
      c.closePath();
      c.clip();
      c.fillStyle = S(r, hc, 0.82);
      c.fillRect(hx + w * 0.3, by - 20, w, 22);
      c.fillStyle = C(r, trim);
      c.fillRect(hx - w - 1, by - 2, w * 2 + 2, 3);
      if (fy > -0.3) {
        const cx = hx + fx * 0.8;
        c.fillRect(cx - 0.9 * Math.abs(fy) - 0.3, by - 17, 1.8 * Math.abs(fy) + 0.6, 15);
        c.fillRect(cx - 3.4 * Math.abs(fy) - 0.4, by - 11.5, 6.8 * Math.abs(fy) + 0.8, 1.8);
        dot(c, cx, by - 0.5, 0.9, C(r, '#c03030'));
      }
      c.restore();
      break;
    }
    case 'bowler': {
      const by = hy - 3.2;
      ell(c, hx, by, HR + 2.6, 3.4, C(r, hc), 1.8);
      c.beginPath();
      c.moveTo(hx - 6.4, by);
      c.quadraticCurveTo(hx - 6.6, by - 8.6, hx, by - 8.8);
      c.quadraticCurveTo(hx + 6.6, by - 8.6, hx + 6.4, by);
      c.closePath();
      c.fillStyle = C(r, hc);
      c.fill();
      c.lineWidth = 2;
      c.strokeStyle = OUTLINE;
      c.stroke();
      c.fillStyle = C(r, trim);
      c.fillRect(hx - 6.3, by - 2.4, 12.6, 1.8);
      if (!r.flash) dot(c, hx - 2.5, by - 6, 1.1, 'rgba(255,255,255,0.35)');
      break;
    }
  }
  // crests, plumes and horns on helmets
  if (L.head === 'horned') horns(r, hx, hy);
  crest(r, hx, hy);
}

function cap(r: Rig, hx: number, hy: number): void {
  const c = r.c;
  const L = r.L;
  const { fx, fy } = r;
  const hc = L.headColor;
  const trim = L.headTrim ?? L.trim;
  const st = L.headStyle ?? 'soft';
  const dome = (rx: number, ry: number, y: number, fill: string): void => {
    c.beginPath();
    c.ellipse(hx, y, rx, ry, 0, Math.PI, TAU);
    c.quadraticCurveTo(hx, y + ry * 0.55, hx - rx, y);
    c.closePath();
    c.fillStyle = fill;
    c.fill();
    c.lineWidth = 2;
    c.strokeStyle = OUTLINE;
    c.stroke();
  };
  switch (st) {
    case 'mushroom': {
      // a broad mushroom cap with spots and gills
      ell(c, hx, hy - 4, 12.5, 5.8, S(r, hc, 0.7), 2);
      c.beginPath();
      c.ellipse(hx, hy - 5.2, 12.5, 8.4, 0, Math.PI, TAU);
      c.quadraticCurveTo(hx, hy - 1.6, hx - 12.5, hy - 5.2);
      c.closePath();
      c.fillStyle = C(r, hc);
      c.fill();
      c.lineWidth = 2;
      c.strokeStyle = OUTLINE;
      c.stroke();
      c.fillStyle = C(r, trim);
      for (const [x, y, rr] of [[-5.5, -8.5, 1.6], [0.5, -11, 1.9], [5.5, -8, 1.4], [-1.5, -6.8, 1.1], [8.5, -6, 1]] as const) {
        c.beginPath();
        c.arc(hx + x - fx, hy + y, rr, 0, TAU);
        c.fill();
      }
      break;
    }
    case 'flaps':
      // leather cap with ear flaps and a seam
      for (const side of [1, -1]) {
        const p = onHead(r, hx, hy, r.f + (Math.PI / 2) * side, HR, 1.5);
        if (p.v < -0.6) continue;
        ell(c, p.x, p.y + 1, 2.4, 3.8, S(r, hc, 0.85), 1.5);
      }
      dome(HR + 1, HR * 0.95, hy - 1.6, C(r, hc));
      line(c, hx - fx * 2, hy - HR - 0.2, hx + fx * 3, hy - 2.4, S(r, hc, 0.6), 0.9);
      dot(c, hx - fx * 2, hy - HR + 0.6, 1, C(r, trim));
      break;
    case 'feather': {
      // a peaked hunter's cap with a long feather
      const tip = { x: hx + fx * 9, y: hy - 4 + fy * 3 };
      dome(HR + 0.8, HR * 0.9, hy - 2, C(r, hc));
      polyF(c, [hx - fx * 7 - fy * 4, hy - 4, tip.x, tip.y, hx - fx * 7 + fy * 4, hy - 4.6, hx - fx * 8, hy - 7], C(r, hc), 1.6);
      const fb = { x: hx - fx * 4 + (fy >= 0 ? 4 : -4) * Math.abs(fy) + 2, y: hy - 6 };
      const ftx = fb.x - fx * 9 + 3;
      const fty = fb.y - 9 + Math.sin(r.t * 3) * 0.8;
      c.beginPath();
      c.moveTo(fb.x, fb.y);
      c.quadraticCurveTo(fb.x + 4, fb.y - 6, ftx, fty);
      c.quadraticCurveTo(fb.x - 1, fb.y - 4, fb.x, fb.y);
      c.fillStyle = C(r, L.crestColor ?? trim);
      c.fill();
      c.lineWidth = 1.2;
      c.strokeStyle = OUTLINE;
      c.stroke();
      line(c, hx - HR, hy - 3.2, hx + HR, hy - 3.2, C(r, trim), 1.2);
      break;
    }
    case 'goggles':
    case 'cogcap': {
      dome(HR + 0.9, HR * 0.95, hy - 1.8, C(r, hc));
      if (st === 'cogcap' && !r.flash) {
        c.fillStyle = shade(hc, 0.6);
        for (let i = -2; i <= 2; i++) dot(c, hx + i * 3, hy - 3.6 - (2 - Math.abs(i)) * 0.6, 0.6, shade(hc, 0.55));
      }
      // the goggle band and lenses on the brow
      c.strokeStyle = C(r, st === 'cogcap' ? shade(hc, 0.5) : '#3a2a1a');
      c.lineWidth = 1.6;
      c.beginPath();
      c.ellipse(hx, hy - 2.6, HR + 0.4, (HR + 0.4) * 0.36, 0, 0, Math.PI);
      c.stroke();
      for (const side of [1, -1]) {
        const p = onHead(r, hx, hy, r.f + 0.5 * side, HR + 0.3, -3);
        if (p.v < 0) continue;
        ell(c, p.x, p.y, 2.2 * (0.5 + 0.5 * Math.abs(fy)) + 0.4, 2.1, C(r, trim), 1.3);
        dot(c, p.x, p.y, 1.1, C(r, st === 'cogcap' ? shade(trim, 1.4) : '#6a4a10'));
        if (!r.flash) dot(c, p.x - 0.5, p.y - 0.6, 0.45, 'rgba(255,255,255,0.8)');
      }
      if (st === 'cogcap') {
        const side = onHead(r, hx, hy, r.f - Math.PI / 2, HR + 0.8, -3);
        if (side.v > -0.5) emblem(r, 'cog', side.x, side.y, 1, L.trim, 0.65);
      }
      break;
    }
    case 'soft':
    default: {
      // a cloth cap with a short bill at the front
      dome(HR + 0.8, HR * 0.9, hy - 2, C(r, hc));
      if (fy > -0.5) {
        const b = onHead(r, hx, hy, r.f, HR + 2, -2.6);
        ell(c, b.x, b.y + 0.4, 4 * (0.55 + 0.45 * Math.abs(fy)) + 1.2, 2.1, S(r, hc, 0.8), 1.6);
      }
      dot(c, hx - fx, hy - HR - 0.6, 1, C(r, trim));
      break;
    }
  }
}

function crown(r: Rig, hx: number, hy: number): void {
  const c = r.c;
  const L = r.L;
  const st = L.headStyle ?? 'gold';
  const gold = '#e6b84a';
  const by = hy - HR * 0.62;
  const rx = HR * 0.86;
  const ry = rx * 0.38;
  const n = 5;
  const spikes: { x: number; y: number; v: number }[] = [];
  for (let i = 0; i < n; i++) {
    const th = r.f + (i / n) * TAU;
    spikes.push({ x: hx + Math.cos(th) * rx, y: by + Math.sin(th) * ry, v: Math.sin(th) });
  }
  const spike = (p: { x: number; y: number; v: number }, fill: string): void => {
    polyF(c, [p.x - 1.9, p.y + 0.6, p.x, p.y - 5.2, p.x + 1.9, p.y + 0.6], fill, 1.3);
  };
  for (const p of spikes) if (p.v < 0) spike(p, S(r, gold, 0.75));
  // band
  c.beginPath();
  c.ellipse(hx, by, rx + 0.6, ry + 0.6, 0, 0, TAU);
  c.ellipse(hx, by, rx - 1.4, ry - 0.9, 0, TAU, 0, true);
  c.fillStyle = C(r, gold);
  c.fill('evenodd');
  c.lineWidth = 1.4;
  c.strokeStyle = OUTLINE;
  c.stroke();
  c.fillStyle = C(r, gold);
  c.beginPath();
  c.ellipse(hx, by + 1.2, rx + 0.4, ry + 0.4, 0, 0, Math.PI);
  c.lineTo(hx - rx - 0.4, by);
  c.closePath();
  c.fill();
  c.stroke();
  for (const p of spikes) if (p.v >= 0) spike(p, C(r, gold));
  // gems
  for (const p of spikes) if (p.v > 0.2) dot(c, p.x, p.y + 1.2, 0.9, C(r, L.headTrim ?? '#5fd3c0'));
  if (st === 'drowned' && !r.flash) {
    // seaweed draped over the band, a drip, a barnacle
    c.strokeStyle = '#3a7a4a';
    c.lineWidth = 1.2;
    c.beginPath();
    for (const ox of [-4, 3.5]) {
      const x = hx + ox;
      c.moveTo(x, by + 1);
      c.quadraticCurveTo(x + 1.5, by + 4, x - 0.5, by + 7 + Math.sin(r.t * 2 + ox) * 0.6);
    }
    c.stroke();
    dot(c, hx + 5, by - 0.4, 0.8, '#d8d0c0');
    const dk = (r.t * 0.7) % 1;
    dot(c, hx - 2, by + 2 + dk * 6, 0.7, 'rgba(150,210,255,' + (1 - dk).toFixed(2) + ')');
  }
}

function horns(r: Rig, hx: number, hy: number): void {
  const c = r.c;
  const L = r.L;
  const st = L.headStyle ?? 'horns';
  const bone = C(r, st === 'antlers' ? '#d8c8a0' : '#e8e1c8');
  const sides = [1, -1].map((side) => {
    const th = r.f + (Math.PI / 2) * side;
    const p = onHead(r, hx, hy, th, HR + 0.6, -3);
    const o = Math.cos(th);
    return { p, o, side };
  });
  sides.sort((a, b) => a.p.v - b.p.v);
  for (const { p, o } of sides) {
    const ox = o >= 0 ? 1 : -1;
    const spread = 0.4 + 0.6 * Math.abs(o);
    if (st === 'antlers') {
      const b1x = p.x + ox * 4 * spread;
      const b1y = p.y - 5;
      const tx = p.x + ox * 7 * spread;
      const ty = p.y - 12;
      c.lineCap = 'round';
      c.strokeStyle = OUTLINE;
      c.lineWidth = 3.8;
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(b1x, b1y);
      c.lineTo(tx, ty);
      c.moveTo(b1x, b1y);
      c.lineTo(b1x + ox * 4 * spread, b1y - 1.5);
      c.moveTo((b1x + tx) / 2, (b1y + ty) / 2);
      c.lineTo((b1x + tx) / 2 - ox * 1.5, (b1y + ty) / 2 - 3.6);
      c.stroke();
      c.strokeStyle = bone;
      c.lineWidth = 1.8;
      c.stroke();
    } else {
      // curved viking horns
      c.beginPath();
      c.moveTo(p.x - 1.8, p.y + 1.2);
      c.quadraticCurveTo(p.x + ox * 7 * spread, p.y + 1, p.x + ox * 7.5 * spread, p.y - 8);
      c.quadraticCurveTo(p.x + ox * 4 * spread, p.y - 2.5, p.x + 1.8, p.y - 1.8);
      c.closePath();
      c.fillStyle = bone;
      c.fill();
      c.lineWidth = 1.6;
      c.strokeStyle = OUTLINE;
      c.stroke();
      line(c, p.x + ox * 2.5 * spread, p.y + 0.4, p.x + ox * 3 * spread, p.y - 1.8, C(r, '#a89878'), 0.8);
    }
  }
}

function crest(r: Rig, hx: number, hy: number): void {
  const c = r.c;
  const L = r.L;
  const cr = L.crest ?? 'none';
  if (cr === 'none') return;
  const { fx, fy } = r;
  const col = L.crestColor ?? L.headTrim ?? L.trim;
  const greathelm = L.head === 'greathelm';
  const topY = greathelm ? hy - HR - 0.4 : hy - HR - 1;
  switch (cr) {
    case 'plume': {
      // a plume that streams backward and bobs
      const bx = hx;
      const by = topY;
      const tx = bx - fx * 8 + Math.sin(r.t * 4) * 0.8;
      const ty = by - 5 - fy * 3 + r.mv * 1.5;
      c.beginPath();
      c.moveTo(bx - 2, by + 1);
      c.quadraticCurveTo(bx - 1, by - 7, tx, ty);
      c.quadraticCurveTo(bx + 4 - fx * 3, by - 2, bx + 2, by + 1);
      c.closePath();
      c.fillStyle = C(r, col);
      c.fill();
      c.lineWidth = 1.5;
      c.strokeStyle = OUTLINE;
      c.stroke();
      line(c, bx, by - 0.5, (bx + tx) / 2, (by + ty) / 2 - 1.5, S(r, col, 1.3), 0.8);
      break;
    }
    case 'flame': {
      const fl = Math.sin(r.t * 9) * 0.8;
      polyF(c, [hx - 4, topY + 1, hx - 3 + fl, topY - 5, hx - 0.8, topY - 2.5, hx + fl, topY - 8.5, hx + 1.4, topY - 3, hx + 3.2 - fl, topY - 6, hx + 4, topY + 1], C(r, col), 1.4);
      polyF(c, [hx - 2, topY + 0.6, hx - 0.4 + fl, topY - 4.4, hx + 2, topY + 0.6], C(r, '#ffd27a'), 0);
      if (!r.flash) glow(c, hx, topY - 3, 10, col, 0.45);
      break;
    }
    case 'halo': {
      const y = topY - 4.5 + Math.sin(r.t * 2) * 0.6;
      c.strokeStyle = OUTLINE;
      c.lineWidth = 3.2;
      c.beginPath();
      c.ellipse(hx, y, 7, 2.4, 0, 0, TAU);
      c.stroke();
      c.strokeStyle = C(r, col);
      c.lineWidth = 1.7;
      c.stroke();
      if (!r.flash) glow(c, hx, y, 12, '#fff3b0', 0.35);
      break;
    }
    case 'spikes': {
      // a crown of iron spikes round the top, the far ones first
      const n = 7;
      const order: number[] = [];
      for (let i = 0; i < n; i++) order.push(i);
      const thOf = (i: number): number => r.f + (i / n) * TAU;
      order.sort((a, b) => Math.sin(thOf(a)) - Math.sin(thOf(b)));
      for (const i of order) {
        const th = thOf(i);
        const bx = hx + Math.cos(th) * (HR + 0.2);
        const by = topY + Math.sin(th) * 3.2;
        const tall = i === 0 ? 8 : 5.6;
        polyF(c, [bx - 1.5, by + 1, bx + Math.cos(th) * 1.2, by - tall, bx + 1.5, by + 1], Math.sin(th) < 0 ? S(r, col, 0.8) : C(r, col), 1.2);
      }
      break;
    }
    case 'pipes':
      // twin smokestacks with puffs
      for (const k of [-1, 1]) {
        const x = hx - fx * 3 + k * 4 * Math.max(0.4, Math.abs(fy));
        polyF(c, [x - 1.4, topY + 1, x + 1.4, topY + 1, x + 1.6, topY - 5, x - 1.6, topY - 5], C(r, col), 1.3);
        if (!r.flash) {
          const pk = (r.t * 0.9 + (k > 0 ? 0.5 : 0)) % 1;
          c.fillStyle = 'rgba(220,220,225,' + (0.5 * (1 - pk)).toFixed(2) + ')';
          c.beginPath();
          c.arc(x - fx * pk * 4, topY - 6 - pk * 7, 1.4 + pk * 2.2, 0, TAU);
          c.fill();
        }
      }
      break;
    case 'fin': {
      // a fin running front to back over the crown
      const fl = 8;
      const fw = 1.2 + 1.8 * Math.abs(fy);
      polyF(c, [hx + fx * fl * 0.8, topY + 2 + fy * 2, hx + fx * 1.5, topY - 7.5, hx - fx * fl, topY - 4.5 - fy * 2.5, hx - fx * fl * 0.7 - fw * 0.3, topY + 2 - fy * 2.4, hx - fw, topY + 2], C(r, col), 1.4);
      c.strokeStyle = S(r, col, 0.6);
      c.lineWidth = 0.7;
      c.beginPath();
      for (let i = -1; i <= 1; i++) {
        c.moveTo(hx + fx * i * 2.6, topY + 1);
        c.lineTo(hx + fx * (i * 2.6 - 1.5), topY - 4 - (1 - Math.abs(i)) * 1.5);
      }
      c.stroke();
      break;
    }
    case 'gem':
      polyF(c, [hx, topY - 4, hx + 2, topY - 1, hx, topY + 1.5, hx - 2, topY - 1], C(r, col), 1.2);
      break;
  }
}
