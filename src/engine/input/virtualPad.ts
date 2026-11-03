// The on-screen touch controller's state (D143). The touch UI (src/ui/touchControls.ts) writes it; the input manager
// reads it like one more gamepad in the standard layout (buttons 0–15, axes 0–3), so every binding, button prompt
// and menu works with it exactly as with a real controller.

export const VIRTUAL_PAD_ID = 'Dungeon Joe touch controls (Xbox layout)';
const BUTTONS = 17;

const pressed: boolean[] = new Array<boolean>(BUTTONS).fill(false);
const axes: [number, number, number, number] = [0, 0, 0, 0];
let active = false;

/** Turn the virtual pad on (touch controls showing) or off (hidden: it then reports nothing). */
export function setVirtualPadActive(on: boolean): void {
  active = on;
  if (!on) {
    pressed.fill(false);
    axes.fill(0);
  }
}

export function setVirtualButton(i: number, down: boolean): void {
  if (i >= 0 && i < BUTTONS) pressed[i] = down;
}

/** A stick, 0 = left (move), 1 = right (aim); x and y in −1…1, y down. */
export function setVirtualStick(stick: 0 | 1, x: number, y: number): void {
  axes[stick * 2] = x;
  axes[stick * 2 + 1] = y;
}

/** The pad as the Gamepad API would show it, or null while the touch controls are hidden. */
export function virtualGamepad(): Gamepad | null {
  if (!active) return null;
  return {
    id: VIRTUAL_PAD_ID,
    index: 99,
    connected: true,
    mapping: 'standard',
    timestamp: 0,
    axes: [...axes],
    buttons: pressed.map((p) => ({ pressed: p, touched: p, value: p ? 1 : 0 })),
    hapticActuator: null,
    vibrationActuator: null,
  } as unknown as Gamepad;
}

/** True while any button or stick of the virtual pad is in use. */
export function virtualPadInUse(): boolean {
  return active && (pressed.some(Boolean) || axes.some((a) => Math.abs(a) > 0.05));
}

/**
 * A real pad and the virtual one at once: buttons are down on either, and each stick takes whichever is pushed
 * further. Either may be missing.
 */
export function mergePads(real: Gamepad | null, virt: Gamepad | null): Gamepad | null {
  if (!real || !virt) return real ?? virt;
  const n = Math.max(real.buttons.length, virt.buttons.length);
  const buttons = Array.from({ length: n }, (_, i) => {
    const a = real.buttons[i];
    const b = virt.buttons[i];
    const value = Math.max(a?.value ?? 0, b?.value ?? 0);
    const p = !!a?.pressed || !!b?.pressed;
    return { pressed: p, touched: p, value };
  });
  const pick = (s: number): [number, number] => {
    const ra = [real.axes[s * 2] ?? 0, real.axes[s * 2 + 1] ?? 0] as [number, number];
    const va = [virt.axes[s * 2] ?? 0, virt.axes[s * 2 + 1] ?? 0] as [number, number];
    return Math.hypot(...va) > Math.hypot(...ra) ? va : ra;
  };
  // which brand the prompts show follows whichever was used last; the real pad's id wins when both are idle
  const id = virtualPadInUse() ? virt.id : real.id;
  return { ...real, id, buttons, axes: [...pick(0), ...pick(1)] } as unknown as Gamepad;
}
