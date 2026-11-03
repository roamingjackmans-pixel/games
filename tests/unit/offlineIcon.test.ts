import { describe, expect, it } from 'vitest';
import { inflateSync } from 'node:zlib';
import { iconIco, renderIcon } from '../../scripts/icon.mjs';

// D133: the offline download ships DungeonJoe.ico (drawn in code) for Steam's Properties icon.
describe('offline download icon (D133)', () => {
  it('is a valid .ico of PNG images at 256, 48, 32 and 16 px', () => {
    const ico = iconIco();
    expect(ico.readUInt16LE(0)).toBe(0);
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(4);
    const sizes: number[] = [];
    for (let i = 0; i < 4; i++) {
      const e = 6 + 16 * i;
      sizes.push(ico[e] || 256);
      const len = ico.readUInt32LE(e + 8);
      const off = ico.readUInt32LE(e + 12);
      expect(off + len).toBeLessThanOrEqual(ico.length);
      const png = ico.subarray(off, off + len);
      expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(png.readUInt32BE(16)).toBe(sizes[i]);
      // the image data inflates to one filter byte + RGBA per row
      const idat = png.indexOf('IDAT');
      const idatLen = png.readUInt32BE(idat - 4);
      expect(inflateSync(png.subarray(idat + 4, idat + 4 + idatLen)).length).toBe(sizes[i]! * (sizes[i]! * 4 + 1));
    }
    expect(sizes).toEqual([256, 48, 32, 16]);
  });
  it('draws Joe: transparent rounded corners, a dark tile, a skin-coloured face', () => {
    const s = 64;
    const px = renderIcon(s);
    const at = (x: number, y: number): number[] => [...px.subarray((y * s + x) * 4, (y * s + x) * 4 + 4)];
    expect(at(0, 0)[3]).toBe(0);
    expect(at(4, 32)).toEqual([0x14, 0x12, 0x1a, 255]);
    expect(at(32, 36)).toEqual([0xe8, 0xc9, 0xa0, 255]);
  });
});

// D135: the installable app (Chrome / Edge "Install", which Steam then lists by name and icon)
describe('installable app icons and manifest (D135)', () => {
  it('draws the manifest icons at their sizes; maskable ones fill the whole square', async () => {
    const { appIcons } = await import('../../scripts/icon.mjs');
    const icons = appIcons();
    const want: Record<string, number> = { 'icons/icon-192.png': 192, 'icons/icon-512.png': 512, 'icons/icon-maskable-192.png': 192, 'icons/icon-maskable-512.png': 512, 'icons/apple-touch-icon.png': 180 };
    expect(Object.keys(icons).sort()).toEqual(Object.keys(want).sort());
    for (const [k, size] of Object.entries(want)) expect(icons[k]!.readUInt32BE(16)).toBe(size);
    const full = renderIcon(32, true);
    for (let i = 3; i < full.length; i += 4) expect(full[i]).toBe(255);
  }, 20000);
  it('the manifest names the game and lists every icon the build writes', async () => {
    const { readFileSync } = await import('node:fs');
    const man = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8')) as { name: string; display: string; start_url: string; icons: { src: string; sizes: string; purpose: string }[] };
    expect(man.name).toBe('Dungeon Joe');
    expect(man.start_url).toBe('./');
    expect(man.display).toBe('standalone');
    const { appIcons } = await import('../../scripts/icon.mjs');
    const built = Object.keys(appIcons());
    for (const i of man.icons) expect(built).toContain(i.src);
    expect(man.icons.some((i) => i.sizes === '512x512' && i.purpose === 'any')).toBe(true);
    expect(readFileSync('index.html', 'utf8')).toContain('rel="manifest"');
  }, 20000);
  it('the offline single-file page drops the manifest and touch icon links', async () => {
    const { inlineHtml } = await import('../../scripts/offline-files.mjs');
    const out = inlineHtml('<head><link rel="manifest" href="./manifest.webmanifest" /><link rel="apple-touch-icon" href="./icons/apple-touch-icon.png" /></head>', new Map(), null);
    expect(out).not.toContain('manifest');
    expect(out).not.toContain('apple-touch-icon');
  });
});
