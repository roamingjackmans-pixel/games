// D206: Steam Controller reports (hid-steam layouts) read as a standard-layout gamepad.
import { describe, expect, it } from 'vitest';
import { applySteamState, parseSteamReport, steamGamepad, STEAM_PAD_ID } from '../../src/engine/input/steamController';

const put16 = (d: Uint8Array, i: number, v: number): void => {
  const u = v < 0 ? v + 0x10000 : v;
  d[i] = u & 0xff;
  d[i + 1] = (u >> 8) & 0xff;
};
const report = (type: number): Uint8Array => {
  const d = new Uint8Array(64);
  d[0] = 0x01;
  d[1] = 0x00;
  d[2] = type;
  d[3] = 0x3c;
  return d;
};

describe('Steam Controller over WebHID (D206)', () => {
  it('the original controller: face buttons, bumpers, menu buttons, triggers, stick and right pad', () => {
    const d = report(0x01);
    d[8] = 0b1000_1000; // A (bit 7) and LB (bit 3)
    d[9] = 0b0100_0001; // Menu (bit 6) and the left pad's up corner (bit 0)
    d[10] = 0b0001_0000; // right pad touched (bit 4)
    d[11] = 255; // left trigger full
    d[12] = 64;
    put16(d, 16, 32767); // stick right
    put16(d, 18, 32767); // stick up (raw up is positive)
    put16(d, 20, -16384); // right pad: left half
    put16(d, 22, 0);
    const s = parseSteamReport(d)!;
    expect(s.buttons[0]).toBe(true); // A
    expect(s.buttons[1]).toBe(false);
    expect(s.buttons[4]).toBe(true); // LB
    expect(s.buttons[9]).toBe(true); // Menu
    expect(s.buttons[12]).toBe(true); // D-pad up
    expect(s.buttons[6]).toBe(true); // LT past half
    expect(s.buttons[7]).toBe(false);
    expect(s.lt).toBe(1);
    expect(s.axes[0]).toBeCloseTo(1, 3);
    expect(s.axes[1]).toBeCloseTo(-1, 3); // the Gamepad API's up is negative
    expect(s.axes[2]).toBeCloseTo(-0.5, 2);
  });

  it('the left pad touched alone does not move Joe; a right pad not touched does not aim', () => {
    const d = report(0x01);
    d[10] = 0b0000_1000; // left pad touched, not with the stick
    put16(d, 16, 20000);
    put16(d, 20, 30000);
    const s = parseSteamReport(d, [0.3, 0.3])!;
    expect(s.axes[0]).toBe(0);
    expect(s.axes[1]).toBe(0);
    expect(s.axes[2]).toBe(0);
    // both at once: the stick holds its last value while this report carries the pad
    d[10] = 0b1000_1000;
    expect(parseSteamReport(d, [0.3, 0.4])!.axes.slice(0, 2)).toEqual([0.3, 0.4]);
  });

  it('the Steam Deck layout: sticks at 48–55, 16-bit triggers', () => {
    const d = report(0x09);
    d[8] = 0b0010_0000; // B
    put16(d, 44, 32767);
    put16(d, 48, -32767);
    put16(d, 50, 0);
    put16(d, 52, 0);
    put16(d, 54, -32767); // right stick down
    const s = parseSteamReport(d)!;
    expect(s.buttons[1]).toBe(true);
    expect(s.lt).toBeCloseTo(1, 3);
    expect(s.axes[0]).toBeCloseTo(-1, 3);
    expect(s.axes[3]).toBeCloseTo(1, 3);
  });

  it('connection and battery reports are ignored; a parsed report becomes a standard gamepad that goes quiet after 2 s', () => {
    expect(parseSteamReport(report(0x03))).toBeNull();
    expect(parseSteamReport(new Uint8Array(64))).toBeNull();
    const d = report(0x01);
    d[8] = 0b1000_0000;
    applySteamState(parseSteamReport(d)!, 1000);
    const g = steamGamepad(1500)!;
    expect(g.id).toBe(STEAM_PAD_ID);
    expect(g.mapping).toBe('standard');
    expect(g.buttons[0]!.pressed).toBe(true);
    expect(steamGamepad(3500)).toBeNull();
  });
});

describe('the new Steam Controller through its Puck (28de:1304, report 66)', () => {
  // the owner's controller at rest, as Settings → Gamepad showed it (report 66 without its id byte, 53 bytes)
  const atRest = (): Uint8Array => {
    const r = new Uint8Array(53);
    r.set([0xfd, 0, 0, 0, 0, 0, 0, 0, 0, 0xb0, 0x01, 0x7b, 0xff, 0xbd, 0x01, 0x49, 0x01]);
    r.set([0x61, 0xa9, 0x81], 31);
    return r;
  };

  it('reads the sticks at rest as near the middle, no buttons, no triggers', async () => {
    const { parseTritonReport } = await import('../../src/engine/input/steamController');
    const s = parseTritonReport(atRest())!;
    expect(s.buttons.some(Boolean)).toBe(false);
    for (const a of s.axes) expect(Math.abs(a)).toBeLessThan(0.02);
    expect(s.axes[0]).toBeCloseTo(432 / 32767, 4);
    expect(s.axes[1]).toBeCloseTo(133 / 32767, 4); // raw −133, up positive on the wire
    expect(s.lt).toBe(0);
  });

  it('a full stick and a pressed A read through', async () => {
    const { parseTritonReport } = await import('../../src/engine/input/steamController');
    const r = atRest();
    r[1] = 0b0000_0001; // A (D214: byte 1 bit 0)
    r[2] = 0b0010_0100; // D-pad up (bit 5) and down (bit 2)
    r[3] = 0b0000_1000; // LB (byte 3 bit 3)
    put16(r, 9, 32767); // left stick right
    put16(r, 11, 32767); // left stick up
    put16(r, 5, 32767); // left trigger (bytes 5–6)
    put16(r, 7, 16000); // right trigger part way (bytes 7–8)
    const s = parseTritonReport(r)!;
    expect(s.buttons[0]).toBe(true);
    expect(s.buttons[1]).toBe(false);
    expect(s.buttons[12]).toBe(true);
    expect(s.buttons[13]).toBe(true);
    expect(s.buttons[4]).toBe(true);
    expect(s.buttons[5]).toBe(false);
    expect(s.axes[0]).toBeCloseTo(1, 3);
    expect(s.axes[1]).toBeCloseTo(-1, 3);
    expect(s.lt).toBeCloseTo(1, 3);
    expect(s.buttons[6]).toBe(true);
    expect(s.rt).toBeCloseTo(16000 / 32767, 3);
    expect(s.buttons[7]).toBe(false);
  });

  it('every button sits where the fixed build reads it (D214)', async () => {
    const { parseTritonReport } = await import('../../src/engine/input/steamController');
    const where: [number, number, number][] = [
      [0, 1, 0], [1, 1, 1], [2, 1, 2], [3, 1, 3], [4, 3, 3], [5, 2, 1], [8, 2, 6], [9, 1, 6],
      [10, 2, 7], [11, 1, 5], [12, 2, 5], [13, 2, 2], [14, 2, 4], [15, 2, 3], [16, 3, 0],
    ];
    for (const [btn, byte, b] of where) {
      const r = atRest();
      r[byte] = 1 << b;
      const s = parseTritonReport(r)!;
      expect(s.buttons.map((x, i) => (x ? i : -1)).filter((i) => i >= 0), `button ${btn}`).toEqual([btn]);
    }
  });
});
