// Every armor set has its fantasy dressing (src/data/armorLooks.ts), every set looks different from every
// other, and drawJoe renders every set and class from every facing without throwing.
import { describe, expect, it, vi } from 'vitest';
import { ARMOR_SETS } from '../../src/data/armor';
import { ARMOR_LOOKS } from '../../src/data/armorLooks';
import { CLASSES, CLASS_IDS } from '../../src/data/classes';
import { lookFor } from '../../src/render/entities';
import { drawJoe, type JoeLook } from '../../src/engine/draw/players';
import type { Character } from '../../src/game/types';

const charIn = (classId: Character['classId'], set: string | null): Character =>
  ({
    classId,
    equipment: set ? { head: { baseId: `${set}_head` }, body: { baseId: `${set}_body` }, legs: { baseId: `${set}_legs` } } : {},
  }) as unknown as Character;

/** a canvas context that accepts every call and does nothing */
function nullCtx(): CanvasRenderingContext2D {
  const grad = { addColorStop: () => undefined };
  const target: Record<string, unknown> = { globalAlpha: 1, globalCompositeOperation: 'source-over' };
  return new Proxy(target, {
    get: (t, k: string) => (k in t ? t[k] : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => grad : () => undefined),
    set: (t, k: string, v) => {
      t[k] = v;
      return true;
    },
  }) as unknown as CanvasRenderingContext2D;
}

describe('armor looks', () => {
  it('every armor set has a look spec, and nothing else does', () => {
    for (const s of ARMOR_SETS) expect(ARMOR_LOOKS[s.id], s.id).toBeDefined();
    for (const id of Object.keys(ARMOR_LOOKS)) expect(ARMOR_SETS.some((s) => s.id === id), id).toBe(true);
  });

  it('all 24 full sets look different from each other', () => {
    const sig = (l: JoeLook): string =>
      [l.head, l.headStyle, l.headColor, l.crest, l.visor, l.body, l.bodyColor, l.pauldrons, l.cape, l.over, l.emblem, l.texture, l.legs].join('|');
    const seen = new Map<string, string>();
    for (const s of ARMOR_SETS) {
      const k = sig(lookFor(charIn('knight', s.id)));
      expect(seen.get(k), `${s.id} looks like ${seen.get(k)}`).toBeUndefined();
      seen.set(k, s.id);
    }
  });

  it('class defaults stay distinct, and Nobody stays in his loincloth', () => {
    const sigs = new Set(CLASS_IDS.map((id) => { const l = lookFor(charIn(id, null)); return `${l.head}|${l.headColor}|${l.bodyColor}|${l.hairStyle}|${l.beard}`; }));
    expect(sigs.size).toBe(CLASS_IDS.length);
    const nobody = lookFor({ classId: 'nobody', equipment: { legs: { baseId: 'loincloth_legs' } } } as unknown as Character);
    expect(nobody.body).toBe('loincloth');
    expect(CLASSES.nobody.look.hairStyle).toBe('messy');
  });

  it('drawJoe renders every set and class from every facing and pose', () => {
    const ctx = nullCtx();
    // glow sprites are pre-rendered on an offscreen canvas
    vi.stubGlobal(
      'OffscreenCanvas',
      class {
        getContext(): CanvasRenderingContext2D {
          return nullCtx();
        }
      },
    );
    const looks = [...ARMOR_SETS.map((s) => lookFor(charIn('knight', s.id))), ...CLASS_IDS.map((id) => lookFor(charIn(id, null)))];
    for (const look of looks) {
      for (let f = -Math.PI; f < Math.PI; f += Math.PI / 4) {
        drawJoe(ctx, look, { x: 0, y: 0, facing: f, t: 1.3, moving: 1, main: { x: 8, y: 6, a: f + 0.7, draw: () => undefined } });
        drawJoe(ctx, look, { x: 0, y: 0, facing: f, t: 0.2, moving: 0, twoHanded: true, main: { x: 8, y: 6, a: f, draw: () => undefined } });
        drawJoe(ctx, look, { x: 0, y: 0, facing: f, t: 0.5, moving: 0, drink: 0.5, ghost: true, flash: true, tint: 'red' });
        drawJoe(ctx, look, { x: 0, y: 0, facing: f, t: 0.5, moving: 0, drawWeapon: () => undefined, drawOffhand: () => undefined });
      }
    }
    expect(looks.length).toBe(ARMOR_SETS.length + CLASS_IDS.length);
    vi.unstubAllGlobals();
  });
});
