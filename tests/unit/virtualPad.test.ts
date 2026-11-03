import { describe, expect, it } from 'vitest';
import { mergePads, setVirtualButton, setVirtualPadActive, setVirtualStick, virtualGamepad, VIRTUAL_PAD_ID } from '../../src/engine/input/virtualPad';
import { padKindFromId } from '../../src/engine/input/input';
import { normalizeSettings } from '../../src/engine/settings';

// D143: the on-screen touch controller is one more standard gamepad.
describe('virtual touch pad (D143)', () => {
  it('reports nothing while hidden, and a standard Xbox-layout pad while shown', () => {
    setVirtualPadActive(false);
    expect(virtualGamepad()).toBeNull();
    setVirtualPadActive(true);
    setVirtualButton(0, true);
    setVirtualStick(0, 0.5, -1);
    const gp = virtualGamepad()!;
    expect(gp.mapping).toBe('standard');
    expect(gp.buttons.length).toBeGreaterThanOrEqual(16);
    expect(gp.buttons[0]!.pressed).toBe(true);
    expect([gp.axes[0], gp.axes[1]]).toEqual([0.5, -1]);
    expect(padKindFromId(VIRTUAL_PAD_ID)).toBe('xbox');
    setVirtualPadActive(false);
    expect(virtualGamepad()).toBeNull();
  });
  it('merges with a real pad: buttons from either, the further-pushed stick', () => {
    setVirtualPadActive(true);
    setVirtualButton(5, true);
    setVirtualStick(1, 0, 0.9);
    const real = { id: 'Xbox Wireless Controller', index: 0, connected: true, mapping: 'standard', timestamp: 0, axes: [0.3, 0, 0.1, 0], buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: i === 2, touched: i === 2, value: i === 2 ? 1 : 0 })) } as unknown as Gamepad;
    const m = mergePads(real, virtualGamepad())!;
    expect(m.buttons[2]!.pressed).toBe(true);
    expect(m.buttons[5]!.pressed).toBe(true);
    expect([m.axes[0], m.axes[1]]).toEqual([0.3, 0]);
    expect([m.axes[2], m.axes[3]]).toEqual([0, 0.9]);
    setVirtualPadActive(false);
    expect(mergePads(real, null)).toBe(real);
  });
  it('settings: touch controls default to auto and clamp size and opacity', () => {
    expect(normalizeSettings({}).controls.touch).toEqual({ mode: 'auto', size: 1, opacity: 0.75 });
    expect(normalizeSettings({ controls: { touch: { mode: 'nope', size: 9, opacity: 0 } } }).controls.touch).toEqual({ mode: 'auto', size: 1.4, opacity: 0.25 });
  });
});
