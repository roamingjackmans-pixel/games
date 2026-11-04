// The character creator's appearance (Character.appearance): optional on old saves, survives the save
// and export round trip, reaches drawJoe through lookFor, travels to co-op partners, and every option
// draws from every facing with a weapon in hand or not.
import { describe, expect, it, vi } from 'vitest';
import { newSave, validateSave } from '../../src/game/save/schema';
import { exportText, parseImport } from '../../src/game/save/exportImport';
import { listSaves, readSave, writeSave } from '../../src/game/save/storage';
import { MemoryStore } from '../../src/engine/settings';
import { newCharacter } from '../../src/game/player/character';
import { CLASSES, CLASS_IDS } from '../../src/data/classes';
import { Rng } from '../../src/engine/rng';
import {
  ARM_FEATURES, BEARDS, BROWS, EYE_SHAPES, HAIR_STYLES, LEG_FEATURES, MARKS, NOSES,
  defaultAppearance, randomAppearance, sanitizeAppearance,
} from '../../src/data/appearance';
import { lookFor } from '../../src/render/entities';
import { drawJoe } from '../../src/engine/draw/players';
import { publicChar } from '../../src/game/net/snapshot';
import type { Appearance, Character } from '../../src/game/types';

const PIRATE: Appearance = {
  sex: 'male',
  skin: '#8ab06a',
  hair: '#c4602a',
  hairStyle: 'afro',
  beard: 'mutton',
  eyes: '#3a7ad0',
  eyeShape: 'round',
  nose: 'hooked',
  brows: 'angry',
  mark: 'eyepatch',
  armL: 'missing',
  armR: 'hook',
  legL: 'peg',
  legR: 'clockwork',
};

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

describe('character appearance', () => {
  it('survives the save, storage and export / import round trip', () => {
    const c = newCharacter('duelist', 'Peg', 'p-peg', new Rng('kit'));
    c.appearance = { ...PIRATE };
    const save = newSave(3, c, 'seed');
    expect(validateSave(save)).toEqual([]);
    const store = new MemoryStore();
    writeSave(store, save);
    expect(readSave(store, 3)?.character.appearance).toEqual(PIRATE);
    expect(listSaves(store)[2]?.character.appearance).toEqual(PIRATE);
    const back = parseImport(exportText(save), 7);
    if (typeof back === 'string') throw new Error(back);
    expect(back.character.appearance).toEqual(PIRATE);
  });

  it('is optional: an old save without one validates and keeps the class look', () => {
    const c = newCharacter('cleric', 'Old', 'p-old');
    delete c.appearance;
    const back = parseImport(exportText(newSave(1, c, 's')), 1);
    if (typeof back === 'string') throw new Error(back);
    expect(back.character.appearance).toBeUndefined();
    const look = lookFor(back.character);
    expect(look.skin).toBe(CLASSES.cleric.look.skin);
    expect(look.hairStyle).toBe(CLASSES.cleric.look.hairStyle);
    expect(look.armL).toBeUndefined();
  });

  it('cleans up junk values from edited files and peers', () => {
    const junk = { ...PIRATE, skin: 'url(evil)', hairStyle: 'tentacles', armR: 'laser', legL: 7 };
    const a = sanitizeAppearance(junk, 'knight');
    const d = defaultAppearance('knight');
    expect(a.skin).toBe(d.skin);
    expect(a.hairStyle).toBe(d.hairStyle);
    expect(a.armR).toBe('none');
    expect(a.legL).toBe('none');
    expect(a.mark).toBe('eyepatch');
    expect(sanitizeAppearance('nope', 'brute')).toEqual(defaultAppearance('brute'));
  });

  it('lookFor feeds it into drawJoe', () => {
    const c = newCharacter('knight', 'Joe', 'p');
    c.appearance = { ...PIRATE };
    const look = lookFor(c);
    expect(look.skin).toBe(PIRATE.skin);
    expect(look.hair).toBe(PIRATE.hair);
    expect(look.hairStyle).toBe('afro');
    expect(look.beard).toBe('mutton');
    expect(look.eyes).toBe(PIRATE.eyes);
    expect(look.mark).toBe('eyepatch');
    expect(look.armR).toBe('hook');
    expect(look.legL).toBe('peg');
    // the armour still dresses the person
    expect(look.body).not.toBe('shirt');
  });

  it('travels to co-op partners in the player meta', () => {
    const c = newCharacter('hunter', 'Joe', 'p');
    c.appearance = { ...PIRATE };
    const pub = JSON.parse(JSON.stringify(publicChar(c))) as Character;
    expect(pub.appearance).toEqual(PIRATE);
    expect(lookFor(pub).legR).toBe('clockwork');
  });

  it('randomize is seeded and only picks real options', () => {
    expect(randomAppearance(new Rng('a'))).toEqual(randomAppearance(new Rng('a')));
    for (let i = 0; i < 50; i++) {
      const a = randomAppearance(new Rng(`r${i}`));
      expect(sanitizeAppearance(a, 'nobody')).toEqual(a);
    }
  });

  it('every option draws from every facing, armed or empty-handed, without throwing', () => {
    const ctx = nullCtx();
    // glow sprites (glowing eyes) are pre-rendered on an offscreen canvas
    vi.stubGlobal('OffscreenCanvas', class {
      getContext(): CanvasRenderingContext2D {
        return nullCtx();
      }
    });
    const lists = [HAIR_STYLES, BEARDS, EYE_SHAPES, NOSES, BROWS, MARKS, ARM_FEATURES, LEG_FEATURES] as const;
    const keys = ['hairStyle', 'beard', 'eyeShape', 'nose', 'brows', 'mark', 'armL', 'legL'] as const;
    for (const classId of CLASS_IDS) {
      const c = newCharacter(classId, 'Joe', 'p');
      for (let li = 0; li < lists.length; li++) {
        for (const o of lists[li]!) {
          const ap = { ...defaultAppearance(classId), [keys[li]!]: o.id } as Appearance;
          if (keys[li] === 'armL') ap.armR = ap.armL;
          if (keys[li] === 'legL') ap.legR = ap.legL;
          c.appearance = ap;
          const look = lookFor(c);
          for (let f = 0; f < 8; f++) {
            const facing = (f / 8) * Math.PI * 2;
            drawJoe(ctx, look, { x: 0, y: 0, facing, t: f * 0.3, moving: 1 });
            drawJoe(ctx, look, { x: 0, y: 0, facing, t: f * 0.3, moving: 0, twoHanded: true, main: { x: 8, y: 6, a: 0.5, draw: () => undefined } });
            drawJoe(ctx, look, { x: 0, y: 0, facing, t: f * 0.3, moving: 0.5, drink: 0.5 });
          }
        }
      }
    }
    vi.unstubAllGlobals();
  });
});
