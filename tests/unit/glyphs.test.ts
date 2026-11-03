// Button prompts (glyphs.ts): style resolution, text for the CURRENT bindings, shapes per style, templates;
// the rebinding capture in InputManager (tap vs Hold, swallowing); the offline download's zip and files.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HOLD, rebindSwap } from '../../src/engine/input/bindings';
import { InputManager, padKindFromId } from '../../src/engine/input/input';
import { defaultSettings, normalizeSettings, type Settings } from '../../src/engine/settings';
import {
  actionInputs,
  formatPrompts,
  glyphShape,
  glyphText,
  inputText,
  keyLabel,
  PAD_LSTICK,
  promptLabel,
  promptStyle,
  setGlyphSource,
  type GlyphPrim,
} from '../../src/ui/glyphs';
import { crc32, makeZip, readZip } from '../../scripts/zip.mjs';
import { inlineHtml, launcherCmd, readmeTxt } from '../../scripts/offline-files.mjs';

let settings: Settings;
let device: 'kbm' | 'pad' = 'kbm';
let padKind: 'xbox' | 'playstation' = 'xbox';

beforeEach(() => {
  settings = defaultSettings();
  device = 'kbm';
  padKind = 'xbox';
  setGlyphSource({ settings: () => settings, device: () => device, padKind: () => padKind });
});
afterEach(() => setGlyphSource(null));

function flat(prims: GlyphPrim[]): GlyphPrim[] {
  return prims.flatMap((p) => (p.t === 'group' ? flat(p.prims) : [p]));
}
function texts(prims: GlyphPrim[]): string[] {
  return flat(prims).flatMap((p) => (p.t === 'text' ? [p.s] : []));
}

describe('prompt style', () => {
  it('auto follows the last device and the pad brand; an explicit choice wins', () => {
    expect(promptStyle()).toBe('keyboard');
    device = 'pad';
    expect(promptStyle()).toBe('xbox');
    padKind = 'playstation';
    expect(promptStyle()).toBe('playstation');
    settings.controls.prompts = 'xbox';
    expect(promptStyle()).toBe('xbox');
    settings.controls.prompts = 'keyboard';
    expect(promptStyle()).toBe('keyboard');
  });

  it('old saved settings get prompts "auto" and default menu buttons; junk is replaced', () => {
    const old = JSON.parse(JSON.stringify(defaultSettings())) as Record<string, Record<string, unknown>>;
    delete old.controls!.prompts;
    delete old.controls!.menuPad;
    const n = normalizeSettings(old);
    expect(n.controls.prompts).toBe('auto');
    expect(n.controls.menuPad).toEqual({ confirm: 0, back: 1 });
    expect(normalizeSettings({ controls: { prompts: 'nintendo' } }).controls.prompts).toBe('auto');
    expect(normalizeSettings({ controls: { prompts: 'playstation' } }).controls.prompts).toBe('playstation');
    // the D-pad moves menu focus, so it can never be confirm/back; confirm and back never share a button
    expect(normalizeSettings({ controls: { menuPad: { confirm: 12, back: 1 } } }).controls.menuPad).toEqual({ confirm: 0, back: 1 });
    expect(normalizeSettings({ controls: { menuPad: { confirm: 2, back: 2 } } }).controls.menuPad).toEqual({ confirm: 2, back: 1 });
  });

  it('Sony pads are recognised from Gamepad.id', () => {
    expect(padKindFromId('DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)')).toBe('playstation');
    expect(padKindFromId('Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 09cc)')).toBe('playstation');
    expect(padKindFromId('Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)')).toBe('xbox');
    expect(padKindFromId('')).toBe('xbox');
  });
});

describe('glyph text follows the current bindings', () => {
  it('skills read Q/E/R, LB/RB/Y, L1/R1/△ by style', () => {
    expect(['skill1', 'skill2', 'skill3'].map((a) => glyphText(a as 'skill1', 'keyboard'))).toEqual(['Q', 'E', 'R']);
    expect(['skill1', 'skill2', 'skill3'].map((a) => glyphText(a as 'skill1', 'xbox'))).toEqual(['LB', 'RB', 'Y']);
    expect(['skill1', 'skill2', 'skill3'].map((a) => glyphText(a as 'skill1', 'playstation'))).toEqual(['L1', 'R1', '△']);
    expect(glyphText('spell2', 'xbox')).toBe('D-pad ↑');
    expect(glyphText('attack', 'keyboard')).toBe('LMB');
    expect(glyphText('twoHand', 'keyboard')).toBe('Shift');
    expect(glyphText('inventory', 'keyboard')).toBe('Tab');
    expect(glyphText('map', 'xbox')).toBe('Hold View');
    expect(glyphText('map', 'playstation')).toBe('Hold Create');
    expect(glyphText('pause', 'playstation')).toBe('Options');
  });

  it('a remap shows up at once, not the default', () => {
    rebindSwap(settings.controls.gamepad, 'skill2', 3); // Y: skill 3 takes RB in exchange
    rebindSwap(settings.controls.keyboard, 'skill1', 'KeyV');
    expect(glyphText('skill2', 'xbox')).toBe('Y');
    expect(glyphText('skill3', 'xbox')).toBe('RB');
    expect(glyphText('skill2', 'playstation')).toBe('△');
    expect(glyphText('skill1', 'keyboard')).toBe('V');
    device = 'pad';
    expect(glyphText('skill2')).toBe('Y');
    settings.controls.gamepad.flask = [];
    expect(glyphText('flask', 'xbox')).toBe('—');
  });

  it('menu confirm / back, movement and labels', () => {
    expect(glyphText('menuConfirm', 'xbox')).toBe('A');
    expect(glyphText('menuBack', 'playstation')).toBe('○');
    expect(glyphText('menuBack', 'keyboard')).toBe('Esc');
    settings.controls.menuPad = { confirm: 2, back: 3 };
    expect(glyphText('menuConfirm', 'playstation')).toBe('□');
    expect(actionInputs('moveUp', 'xbox')).toEqual([PAD_LSTICK]);
    expect(inputText(HOLD + 13, 'xbox')).toBe('Hold D-pad ↓');
    expect(keyLabel('Digit3')).toBe('3');
    expect(keyLabel('Numpad7')).toBe('Num 7');
    expect(keyLabel('Space')).toBe('Space');
    expect(keyLabel('WheelDown')).toBe('Wheel ↓');
  });

  it('templates and labels use the current style', () => {
    expect(formatPrompts('Ow. Drink from the Thermos ({flask}).')).toBe('Ow. Drink from the Thermos (C).');
    expect(promptLabel('interact', 'Rest')).toBe('F  Rest');
    expect(promptLabel('inventory', 'Close', 'suffix')).toBe('Close (Tab)');
    device = 'pad';
    expect(formatPrompts('Drink ({flask}), {unknown} stays')).toBe('Drink (X), {unknown} stays');
    padKind = 'playstation';
    expect(promptLabel('interact', 'Rest')).toBe('✕  Rest'); // D122: ✕ (A) interacts
  });
});

describe('glyph shapes', () => {
  it('Xbox face buttons are coloured circles with letters', () => {
    const colours = [0, 1, 2, 3].map((n) => {
      const s = glyphShape(n, 'xbox', 20);
      const circle = flat(s.prims).find((p) => p.t === 'circle');
      return [circle && 'fill' in circle ? circle.fill : '', texts(s.prims)[0]];
    });
    expect(colours.map((c) => c[1])).toEqual(['A', 'B', 'X', 'Y']);
    expect(new Set(colours.map((c) => c[0])).size).toBe(4);
  });

  it('PlayStation face buttons are drawn symbols, not letters', () => {
    for (const n of [0, 1, 2, 3]) {
      const s = glyphShape(n, 'playstation', 20);
      expect(texts(s.prims)).toEqual([]);
      expect(flat(s.prims).some((p) => p.t !== 'text' && 'stroke' in p && p.stroke !== undefined && p.stroke !== '#08070b')).toBe(true);
    }
    expect(texts(glyphShape(4, 'playstation', 20).prims)).toEqual(['L1']);
    expect(texts(glyphShape(7, 'playstation', 20).prims)).toEqual(['R2']);
    expect(texts(glyphShape(11, 'playstation', 20).prims)).toEqual(['R3']);
  });

  it('keycaps grow with their text; Hold adds a tag; unbound has a placeholder', () => {
    const q = glyphShape('KeyQ', 'keyboard', 20);
    const space = glyphShape('Space', 'keyboard', 20);
    expect(texts(q.prims)).toEqual(['Q']);
    expect(space.w).toBeGreaterThan(q.w);
    const hold = glyphShape(HOLD + 8, 'xbox', 20);
    expect(texts(hold.prims)[0]).toBe('HOLD');
    expect(hold.w).toBeGreaterThan(glyphShape(8, 'xbox', 20).w);
    expect(hold.label).toBe('Hold View');
    expect(glyphShape(null, 'xbox', 20).label).toBe('—');
    expect(glyphShape('Mouse0', 'keyboard', 20).label).toBe('LMB');
    expect(glyphShape(14, 'xbox', 20).label).toBe('D-pad ←');
  });
});

describe('rebinding capture (InputManager)', () => {
  const buttons = new Array<number>(17).fill(0);
  beforeEach(() => {
    buttons.fill(0);
    vi.stubGlobal('navigator', {
      getGamepads: () => [{ id: 'Xbox Wireless Controller', connected: true, axes: [0, 0, 0, 0], buttons: buttons.map((v) => ({ pressed: v > 0.5, value: v })) }],
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('a tap captures on release; a 0.5 s hold captures as Hold; an analog trigger counts', () => {
    const inp = new InputManager(() => [0, 0]);
    const got: [number, boolean][] = [];
    // the button that opened the capture is still held: it must be released and pressed again
    buttons[0] = 1;
    inp.pollGamepad(0);
    inp.capturePad = (n, held) => got.push([n, held]);
    inp.pollGamepad(0.1);
    expect(got).toEqual([]);
    buttons[0] = 0;
    inp.pollGamepad(0.2);
    buttons[5] = 1;
    inp.pollGamepad(0.3);
    expect(inp.capturing).toBe(true);
    buttons[5] = 0;
    inp.pollGamepad(0.4);
    expect(got).toEqual([[5, false]]);
    expect(inp.capturing).toBe(false);

    inp.capturePad = (n, held) => got.push([n, held]);
    buttons[7] = 0.6; // RT half pulled
    inp.pollGamepad(1);
    inp.pollGamepad(1.3);
    expect(inp.padCaptureProgress()).toBeGreaterThan(0.5);
    inp.pollGamepad(1.6);
    expect(got[1]).toEqual([7, true]);
    // still held after the capture: swallowed, so the game and menus never see it
    inp.pollGamepad(1.7);
    expect(inp.padButtonDown(7)).toBe(false);
    buttons[7] = 0;
    inp.pollGamepad(1.8);
    buttons[7] = 1;
    inp.pollGamepad(1.9);
    expect(inp.padButtonDown(7)).toBe(true);
  });

  it('a captured tap never reaches the menus as a press', () => {
    const inp = new InputManager(() => [0, 0]);
    inp.capturePad = () => undefined;
    buttons[0] = 1;
    inp.pollGamepad(0);
    expect(inp.padButtonEdge(0)).toBe(false);
    buttons[0] = 0;
    inp.pollGamepad(0.1);
    expect(inp.padButtonEdge(0)).toBe(false);
  });
});

describe('offline download files', () => {
  it('the zip writer round-trips and its CRC matches the standard check value', () => {
    expect(crc32(Buffer.from('123456789'))).toBe(0xcbf43926);
    const big = 'Dungeon Joe '.repeat(500);
    const zip = makeZip([
      { name: 'DungeonJoe.html', data: big },
      { name: 'Play Dungeon Joe.cmd', data: '@echo off\r\n' },
      { name: 'bytes.bin', data: new Uint8Array([0, 1, 2, 255]) },
    ]);
    expect(zip.readUInt32LE(0)).toBe(0x04034b50);
    const back = readZip(zip);
    expect([...back.keys()]).toEqual(['DungeonJoe.html', 'Play Dungeon Joe.cmd', 'bytes.bin']);
    expect(back.get('DungeonJoe.html')!.toString('utf8')).toBe(big);
    expect([...back.get('bytes.bin')!]).toEqual([0, 1, 2, 255]);
    expect(zip.length).toBeLessThan(big.length);
  });

  it('the page is inlined into one file with no local references left', () => {
    const html =
      '<!doctype html><html><head><link rel="icon" type="image/svg+xml" href="./favicon.svg" />' +
      '<script type="module" crossorigin src="./assets/index-1.js"></script>' +
      '<link rel="modulepreload" href="./assets/x.js"><link rel="stylesheet" crossorigin href="./assets/index-2.css"></head><body></body></html>';
    const files = new Map([
      ['assets/index-1.js', 'const s = "</script>"; console.log(`$&`, s);'],
      ['assets/index-2.css', 'body{color:red}'],
    ]);
    const out = inlineHtml(html, files, '<svg/>');
    expect(out).toContain('<script type="module">const s = "<\\/script>"; console.log(`$&`, s);</script>');
    expect(out).toContain('<style>body{color:red}</style>');
    expect(out).toContain('href="data:image/svg+xml;base64,');
    expect(out).not.toMatch(/src="\.\//);
    expect(out).not.toContain('modulepreload');
    expect(() => inlineHtml('<img src="./a.png">', new Map(), null)).toThrow(/separate file/);
  });

  it('the launcher and README are Windows text and say how to add the game to Steam', () => {
    const cmd = launcherCmd();
    expect(cmd).toContain('\r\n');
    expect(cmd.replace(/\r\n/g, '')).not.toContain('\n');
    expect(cmd).toMatch(/msedge\.exe/);
    expect(cmd).toMatch(/chrome\.exe/);
    expect(cmd).toContain('--app="!URL!"');
    expect(cmd).toContain('--start-fullscreen');
    expect(cmd).toContain('--user-data-dir="!PROFILE!"');
    expect(cmd).toContain('start "" /wait');
    const readme = readmeTxt('1.2.3', '2026-11-02');
    expect(readme).toContain('Add a Non-Steam Game to My Library');
    expect(readme).toContain('Dungeon Joe.cmd');
    expect(readme).toContain('DungeonJoe.png');
    expect(readme).toContain('Properties');
    expect(readme).toContain('All Files');
    expect(readme).toContain('Export');
    expect(readme).toContain('internet');
    expect(readme).toContain('1.2.3');
  });
});
