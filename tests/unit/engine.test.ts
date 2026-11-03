import { describe, expect, it } from 'vitest';
import { Rng, hashString, stream } from '../../src/engine/rng';
import { angleDiff, circleHit, coneHit, lineHit, ringHit, segCircle, wrapAngle, DEG } from '../../src/engine/math';
import {
  defaultGamepad,
  defaultKeyboard,
  deserializeBindings,
  findConflicts,
  rebind,
  serializeBindings,
} from '../../src/engine/input/bindings';
import { checkDebugCode, sha256Hex, DEBUG_CODE_SHA256 } from '../../src/game/debug/hash';
import { MemoryStore, defaultSettings, loadSettings, normalizeSettings, saveSettings } from '../../src/engine/settings';
import { renderSfx } from '../../src/engine/audio/synth';
import { SFX } from '../../src/engine/audio/sfx';

describe('rng', () => {
  it('is deterministic per seed and label', () => {
    const a = stream('JOE', 'map:1');
    const b = stream('JOE', 'map:1');
    const c = stream('JOE', 'map:2');
    const xs = Array.from({ length: 20 }, () => a.next());
    const ys = Array.from({ length: 20 }, () => b.next());
    const zs = Array.from({ length: 20 }, () => c.next());
    expect(xs).toEqual(ys);
    expect(xs).not.toEqual(zs);
  });
  it('produces values in [0,1) with a sane mean', () => {
    const r = new Rng(12345);
    let sum = 0;
    for (let i = 0; i < 100000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      sum += v;
    }
    expect(sum / 100000).toBeCloseTo(0.5, 2);
  });
  it('int is inclusive and weighted respects weights', () => {
    const r = new Rng('w');
    const counts = [0, 0, 0];
    for (let i = 0; i < 30000; i++) counts[r.weighted([1, 2, 7])]!++;
    expect(counts[2]! / 30000).toBeCloseTo(0.7, 1);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) seen.add(r.int(1, 3));
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });
  it('state round-trips', () => {
    const r = new Rng('s');
    r.next();
    const st = r.getState();
    const v1 = r.next();
    r.setState(st);
    expect(r.next()).toBe(v1);
  });
  it('hashString is stable', () => {
    expect(hashString('Dungeon Joe')).toBe(hashString('Dungeon Joe'));
    expect(hashString('a')).not.toBe(hashString('b'));
  });
});

describe('math', () => {
  it('wraps angles', () => {
    expect(wrapAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
    expect(angleDiff(170 * DEG, -170 * DEG)).toBeCloseTo(20 * DEG);
  });
  it('circle, ring, cone, line tests', () => {
    expect(circleHit(0, 0, 50, 60, 0, 12)).toBe(true);
    expect(circleHit(0, 0, 50, 70, 0, 12)).toBe(false);
    expect(ringHit(0, 0, 100, 150, 120, 0, 5)).toBe(true);
    expect(ringHit(0, 0, 100, 150, 50, 0, 5)).toBe(false);
    expect(ringHit(0, 0, 100, 150, 200, 0, 5)).toBe(false);
    expect(coneHit(0, 0, 0, 35 * DEG, 100, 80, 0, 10)).toBe(true);
    expect(coneHit(0, 0, 0, 35 * DEG, 100, 0, 80, 10)).toBe(false);
    expect(coneHit(0, 0, 0, 35 * DEG, 100, -50, 0, 10)).toBe(false);
    expect(lineHit(0, 0, 0, 40, 160, 150, 10, 5)).toBe(true);
    expect(lineHit(0, 0, 0, 40, 160, 150, 40, 5)).toBe(false);
    expect(lineHit(0, 0, Math.PI / 2, 40, 160, 0, 100, 5)).toBe(true);
    expect(segCircle(0, 0, 100, 0, 50, 5, 6)).toBe(true);
    expect(segCircle(0, 0, 100, 0, 50, 20, 6)).toBe(false);
  });
});

describe('bindings', () => {
  it('serialise and deserialise', () => {
    const kb = defaultKeyboard();
    const pad = defaultGamepad();
    kb.attack = ['KeyJ'];
    const s = serializeBindings(kb, pad);
    const back = deserializeBindings(s);
    expect(back.keyboard.attack).toEqual(['KeyJ']);
    expect(back.gamepad.dodge).toEqual([1]); // D122: B dodges, A interacts
  });
  it('fills missing actions from defaults', () => {
    const back = deserializeBindings(JSON.stringify({ keyboard: { attack: ['KeyK'] } }));
    expect(back.keyboard.attack).toEqual(['KeyK']);
    expect(back.keyboard.dodge).toEqual(['Space']);
  });
  it('defaults have no conflicts and rebind removes duplicates', () => {
    expect(findConflicts(defaultKeyboard())).toEqual([]);
    expect(findConflicts(defaultGamepad())).toEqual([]);
    const kb = defaultKeyboard();
    const displaced = rebind(kb, 'attack', 'Space');
    expect(displaced).toEqual(['dodge']);
    expect(kb.dodge).toEqual([]);
    expect(kb.attack).toEqual(['Space']);
    expect(findConflicts(kb)).toEqual([]);
  });
});

describe('debug hash', () => {
  it('sha256 matches a known vector', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
  it('refuses wrong codes', async () => {
    expect(await checkDebugCode('')).toBe(false);
    expect(await checkDebugCode('password')).toBe(false);
    expect(DEBUG_CODE_SHA256).toHaveLength(64);
  });
});

describe('settings', () => {
  it('round-trips through a store and clamps bad values', () => {
    const store = new MemoryStore();
    const s = defaultSettings();
    s.audio.music = 0.25;
    s.controls.keyboard.dodge = ['KeyV'];
    saveSettings(s, store);
    const back = loadSettings(store);
    expect(back.audio.music).toBe(0.25);
    expect(back.controls.keyboard.dodge).toEqual(['KeyV']);
    const bad = normalizeSettings({ video: { shake: 9, scale: -1 }, audio: { master: 'loud' } });
    expect(bad.video.shake).toBe(1);
    expect(bad.video.scale).toBe(0.5);
    expect(bad.audio.master).toBe(0.8);
  });
});

describe('audio synthesis', () => {
  it('every sound renders finite samples', () => {
    for (const [id, def] of Object.entries(SFX)) {
      const d = renderSfx(def, 22050, 1);
      expect(d.length, id).toBeGreaterThan(10);
      let peak = 0;
      for (const v of d) {
        expect(Number.isFinite(v)).toBe(true);
        peak = Math.max(peak, Math.abs(v));
      }
      expect(peak, id).toBeGreaterThan(0.001);
    }
  });
});

describe('gamepad layout (D122)', () => {
  it('A interacts and confirms, B dodges and backs out; old saved layouts move over', async () => {
    const { defaultGamepad: dg, defaultMenuPad, normalizeGamepad } = await import('../../src/engine/input/bindings');
    expect(dg().interact).toEqual([0]);
    expect(dg().dodge).toEqual([1]);
    expect(defaultMenuPad()).toEqual({ confirm: 0, back: 1 });
    const old = { ...dg(), dodge: [0], interact: [1] };
    const n = normalizeGamepad(old as unknown as Record<string, unknown>);
    expect(n.interact).toEqual([0]);
    expect(n.dodge).toEqual([1]);
  });
});
