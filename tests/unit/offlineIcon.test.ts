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
