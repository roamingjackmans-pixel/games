// How the weapon moves while a weapon skill plays (D234). Each skill's motion is read from its own data, the first
// hit it lands and its animation id (PatternCommon.vfx): an overhead chop for slams and guillotines, a full turn for
// spins, a lunge for thrusts, a sweep for cones, a whip crack, a hooked yank, a draw-and-cut, a bow's draw and loose,
// the weapon raised for buffs, held high through a leap. The pose is relative to the facing, like a combo swing's
// (rot: radians off the facing, ext: px pushed out along the blade). Cosmetic only.
import { SKILLS } from '../data/skills';
import type { EffectDef, PatternDef } from '../game/types';

export type SkillMotion = 'chop' | 'spin' | 'thrust' | 'sweep' | 'crack' | 'hook' | 'iai' | 'shoot' | 'raise' | 'lunge' | 'leap';

export interface WeaponPose {
  rot: number;
  ext: number;
}

/** idle carry angle (render/entities.ts weaponPose) */
const REST = 0.7;
const TAU = Math.PI * 2;

const CHOP_LOOKS = new Set(['guillotine', 'execute', 'smash', 'judgment', 'ground_slam', 'holy_smite', 'holy_nova', 'void_implode', 'fire_burst', 'frost_burst', 'meteor']);
const SWEEP_LOOKS = new Set(['slash', 'cleave', 'dawn_arc', 'shadow_cut']);

interface Found {
  pattern: PatternDef | null;
  dash: 'dash' | 'leap' | null;
  channel: boolean;
  charge: boolean;
}

function scan(effects: readonly EffectDef[], out: Found): void {
  for (const e of effects) {
    if (out.pattern) return;
    const r = e as unknown as Record<string, unknown>;
    if (e.op === 'dash') out.dash ??= r.leap ? 'leap' : 'dash';
    if (e.op === 'channel') out.channel = true;
    if (r.pattern && (e.op === 'damage' || e.op === 'zone')) out.pattern = r.pattern as PatternDef;
    if (e.op === 'charge') out.charge = true;
    const steps = r.steps;
    if (Array.isArray(steps)) scan(steps.map((st) => (st as { effect: EffectDef }).effect).filter(Boolean), out);
    for (const k of ['hitOnLand', 'hitOnEntry', 'hitOnExit', 'release', 'effect', 'tick', 'then', 'onHit']) {
      const v = r[k];
      if (Array.isArray(v)) scan(v as EffectDef[], out);
      else if (v && typeof v === 'object' && (v as { op?: string }).op) scan([v as EffectDef], out);
    }
  }
}

function lookOf(p: PatternDef | null): string {
  if (!p) return '';
  const v = (p as { vfx?: string }).vfx;
  if (v) return v;
  const imp = (p as { onImpact?: PatternDef }).onImpact;
  return imp ? lookOf(imp) : '';
}

const cache = new Map<string, { motion: SkillMotion; half: number; reach: number }>();

/** The motion a skill plays, and for a sweep its half-angle, for a thrust how far the blade goes out. */
export function skillMotion(id: string): { motion: SkillMotion; half: number; reach: number } {
  const hit = cache.get(id);
  if (hit) return hit;
  const def = SKILLS[id];
  const f: Found = { pattern: null, dash: null, channel: false, charge: false };
  if (def) scan(def.effect, f);
  const p = f.pattern;
  const look = lookOf(p);
  const kind = p?.kind ?? '';
  let motion: SkillMotion;
  let half = 1.3;
  let reach = 14;
  if (f.dash === 'leap') motion = 'leap';
  else if (f.dash) motion = 'lunge';
  else if (look === 'spin') motion = 'spin';
  else if (look === 'iai') motion = 'iai';
  else if (look === 'hook') motion = 'hook';
  else if (look === 'whip' || look === 'whip_crack') motion = 'crack';
  else if (look === 'arrow_rain' || kind === 'projectile' || look === 'bolt') motion = 'shoot';
  else if (CHOP_LOOKS.has(look)) motion = 'chop';
  else if (look === 'thrust' || look === 'ice_lance' || kind === 'line') motion = 'thrust';
  else if (SWEEP_LOOKS.has(look) || kind === 'cone') motion = 'sweep';
  else if (kind === 'ring' || kind === 'expandingRing') motion = 'chop';
  else if (kind === 'circle') motion = (p as { anchor?: string }).anchor === 'self' ? 'spin' : 'chop';
  else if (f.channel) motion = 'spin';
  else motion = 'raise';
  if (p?.kind === 'cone') half = Math.min(Math.PI * 0.95, ((p.angleDeg ?? 120) * Math.PI) / 360);
  if (p?.kind === 'line') reach = Math.min(40, Math.max(12, (typeof p.l === 'number' ? p.l : 120) * 0.18));
  const out = { motion, half, reach };
  cache.set(id, out);
  return out;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));
/** fast out of the gate, settling at the end: a strike */
const strike = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);
const ease = (t: number): number => {
  const k = clamp01(t);
  return k * k * (3 - 2 * k);
};

/**
 * The weapon's pose at one moment of a skill. `wind` is the windup's progress (0 → 1 up to the moment it fires),
 * `hit` the progress after it fires (0 → 1 over the recovery); a sweep alternates `dir` so repeats go back and forth.
 */
export function skillWeaponPose(m: { motion: SkillMotion; half: number; reach: number }, wind: number, hit: number, dir = 1): WeaponPose {
  const fired = hit > 0;
  const w = ease(wind);
  const s = strike(hit);
  switch (m.motion) {
    case 'chop':
      // raised up and back over the shoulder, then brought down hard in front
      if (!fired) return { rot: lerp(REST, -2.5, w), ext: lerp(0, -5, w) };
      return { rot: lerp(-2.5, 0.12, s), ext: lerp(-5, 10, s) };
    case 'spin':
      // drawn back to the side, then a full turn round the body
      if (!fired) return { rot: lerp(REST, 1.9, w), ext: 0 };
      return { rot: 1.9 - s * TAU, ext: 6 };
    case 'thrust':
      if (!fired) return { rot: lerp(REST, 0.05, w), ext: lerp(0, -12, w) };
      return { rot: 0, ext: lerp(-12, m.reach, s) };
    case 'sweep': {
      const back = -(m.half + 0.35) * dir;
      if (!fired) return { rot: lerp(REST * dir, back, w), ext: 0 };
      return { rot: lerp(back, (m.half + 0.15) * dir, s), ext: 5 };
    }
    case 'crack':
      // cocked back behind the shoulder, then snapped straight out
      if (!fired) return { rot: lerp(REST, 2.2, w), ext: lerp(0, -6, w) };
      return { rot: lerp(2.2, -0.1, s), ext: lerp(-6, 16, s) };
    case 'hook':
      // thrust out, then the hook yanked back across
      if (!fired) return { rot: lerp(REST, 0.1, w), ext: lerp(0, -8, w) };
      if (hit < 0.45) return { rot: 0.1, ext: lerp(-8, 20, strike(hit / 0.45)) };
      return { rot: lerp(0.1, -0.9, ease((hit - 0.45) / 0.55)), ext: lerp(20, -4, ease((hit - 0.45) / 0.55)) };
    case 'iai':
      // held low at the hip, then one fast cut across
      if (!fired) return { rot: lerp(REST, 1.6, w), ext: lerp(0, -4, w) };
      return { rot: lerp(1.6, -1.4, strike(hit * 1.3)), ext: 6 };
    case 'shoot':
      // drawn back, loosed, a little kick
      if (!fired) return { rot: lerp(REST, 0, w), ext: lerp(0, -7, w) };
      return { rot: lerp(0, 0.12, s), ext: lerp(-7, 2, s) };
    case 'lunge':
      // pointed ahead and driven forward
      if (!fired) return { rot: lerp(REST, 0.05, w), ext: lerp(0, -8, w) };
      return { rot: 0.05, ext: lerp(-8, 14, s) };
    case 'leap':
      // raised high for the jump; the landing brings it down (see airborne below)
      if (!fired) return { rot: lerp(REST, -2.4, w), ext: lerp(0, -4, w) };
      return { rot: -2.4, ext: -4 };
    case 'raise':
    default:
      // held up in front: a war cry, a stance, a buff
      if (!fired) return { rot: lerp(REST, -1.45, w), ext: lerp(0, 4, w) };
      return { rot: lerp(-1.45, -1.25, Math.sin(hit * Math.PI)), ext: 4 + 3 * Math.sin(hit * Math.PI) };
  }
}

/** Through a leap (0 → 1 of its flight): held high, coming down hard at the end. */
export function leapPose(k: number): WeaponPose {
  if (k < 0.7) return { rot: -2.4, ext: -4 };
  const s = strike((k - 0.7) / 0.3);
  return { rot: lerp(-2.4, 0.12, s), ext: lerp(-4, 10, s) };
}

/** Through a dash (0 → 1): pointed ahead, out at full reach. */
export function dashPose(): WeaponPose {
  return { rot: 0.05, ext: 14 };
}

/** A channelled skill: a spin goes round and round, a sweep (Flurry) cuts back and forth once a tick. */
export function channelPose(m: { motion: SkillMotion; half: number }, t: number, tickS: number): WeaponPose {
  if (m.motion === 'sweep') return { rot: (m.half + 0.15) * Math.sin((t * Math.PI) / Math.max(0.05, tickS)), ext: 5 };
  if (m.motion === 'spin') return { rot: 1.9 - ((t * 9) % TAU), ext: 6 };
  return skillWeaponPose(m as { motion: SkillMotion; half: number; reach: number }, 1, 1);
}
