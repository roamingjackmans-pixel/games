// Keyboard, mouse and Gamepad API input merged into one InputFrame per simulation tick.
import { ACTION_BIT, GAME_ACTIONS, type Action, type GameAction, type InputFrame, type LocalAction } from './actions';
import { HOLD, defaultGamepad, defaultKeyboard, type GamepadBindings, type KeyboardBindings } from './bindings';

export type Device = 'kbm' | 'pad';

const STICK_DEADZONE = 0.22;
const TRIGGER_THRESHOLD = 0.3;
const HOLD_S = 0.5;

function radialDeadzone(x: number, y: number, dz: number): [number, number] {
  const m = Math.hypot(x, y);
  if (m < dz) return [0, 0];
  const s = Math.min(1, (m - dz) / (1 - dz)) / m;
  return [x * s, y * s];
}

export class InputManager {
  kb: KeyboardBindings = defaultKeyboard();
  pad: GamepadBindings = defaultGamepad();
  aimAssist = 0.6;
  /** when false (a menu is open) gameplay buttons and movement read as zero */
  gameplayEnabled = true;
  /** toggle-block mode (settings): a block press latches the guard on and off */
  blockToggle = false;
  private blockLatched = false;
  lastDevice: Device = 'kbm';
  mouseX = 640;
  mouseY = 360;

  private down = new Set<string>();
  private edge = new Set<string>(); // codes that went down since last gameplay sample
  private localEdge = new Set<string>(); // codes that went down since last local poll
  private padDown = new Set<number>();
  private padPrev = new Set<number>();
  private padEdge = new Set<number>();
  private padLocalEdge = new Set<number>();
  /** tap-only buttons (ones that also have a hold action) released before the hold fired, for gameplay and menus */
  private padTaps = new Set<number>();
  private padLocalTaps = new Set<number>();
  private padHoldStart = new Map<number, number>();
  private padHoldFired = new Set<number>();
  private lastAimDir: [number, number] = [1, 0];
  private prevButtons = 0;
  private padAim: [number, number] = [0, 0];
  private padMove: [number, number] = [0, 0];
  /** listeners for raw key/pad presses (rebinding UI captures the next input) */
  captureKey: ((code: string) => void) | null = null;
  capturePad: ((button: number) => void) | null = null;

  constructor(private toLogical: (clientX: number, clientY: number) => [number, number]) {}

  attach(target: HTMLElement): void {
    window.addEventListener('keydown', (e) => {
      if (this.captureKey) {
        e.preventDefault();
        const cb = this.captureKey;
        this.captureKey = null;
        cb(e.code);
        return;
      }
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return; // browser and debug shortcuts never drive the game
      if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && this.gameplayEnabled) e.preventDefault();
      if (e.code === 'Tab') e.preventDefault();
      this.lastDevice = 'kbm';
      if (!this.down.has(e.code)) {
        this.edge.add(e.code);
        this.localEdge.add(e.code);
      }
      this.down.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.down.delete(e.code);
    });
    window.addEventListener('blur', () => {
      this.down.clear();
    });
    target.addEventListener('mousemove', (e) => {
      [this.mouseX, this.mouseY] = this.toLogical(e.clientX, e.clientY);
      this.lastDevice = 'kbm';
    });
    target.addEventListener('mousedown', (e) => {
      const code = `Mouse${e.button}`;
      if (this.captureKey) {
        e.preventDefault();
        const cb = this.captureKey;
        this.captureKey = null;
        cb(code);
        return;
      }
      [this.mouseX, this.mouseY] = this.toLogical(e.clientX, e.clientY);
      this.lastDevice = 'kbm';
      if (!this.down.has(code)) {
        this.edge.add(code);
        this.localEdge.add(code);
      }
      this.down.add(code);
    });
    window.addEventListener('mouseup', (e) => {
      this.down.delete(`Mouse${e.button}`);
    });
    target.addEventListener('contextmenu', (e) => e.preventDefault());
    target.addEventListener(
      'wheel',
      (e) => {
        const code = e.deltaY < 0 ? 'WheelUp' : 'WheelDown';
        this.edge.add(code);
        this.localEdge.add(code);
      },
      { passive: true },
    );
  }

  setBindings(kb: KeyboardBindings, pad: GamepadBindings): void {
    this.kb = kb;
    this.pad = pad;
  }

  /** Poll the Gamepad API; called once per animation frame before sampling. */
  pollGamepad(now: number): void {
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    let gp: Gamepad | null = null;
    for (const p of pads) if (p && p.connected) {
      gp = p;
      break;
    }
    this.padPrev = new Set(this.padDown);
    this.padDown.clear();
    if (!gp) {
      this.padMove = [0, 0];
      this.padAim = [0, 0];
      return;
    }
    gp.buttons.forEach((b, i) => {
      const isTrigger = i === 6 || i === 7;
      if (b.pressed || (isTrigger && b.value > TRIGGER_THRESHOLD)) this.padDown.add(i);
    });
    this.padMove = radialDeadzone(gp.axes[0] ?? 0, gp.axes[1] ?? 0, STICK_DEADZONE);
    this.padAim = radialDeadzone(gp.axes[2] ?? 0, gp.axes[3] ?? 0, STICK_DEADZONE);
    for (const i of this.padDown) {
      if (!this.padPrev.has(i)) {
        if (this.capturePad) {
          const cb = this.capturePad;
          this.capturePad = null;
          cb(i);
          continue;
        }
        this.padEdge.add(i);
        this.padLocalEdge.add(i);
        this.padHoldStart.set(i, now);
        this.padHoldFired.delete(i);
      }
      const start = this.padHoldStart.get(i) ?? now;
      if (now - start >= HOLD_S && !this.padHoldFired.has(i)) {
        this.padHoldFired.add(i);
        this.padEdge.add(HOLD + i);
        this.padLocalEdge.add(HOLD + i);
      }
    }
    // a release before the hold fired is a tap; remember it until a logic step reads it
    for (const i of this.padPrev) {
      if (this.padDown.has(i) || this.padHoldFired.has(i)) continue;
      this.padTaps.add(i);
      this.padLocalTaps.add(i);
    }
    if (this.padDown.size > 0 || Math.hypot(...this.padMove) > 0 || Math.hypot(...this.padAim) > 0) this.lastDevice = 'pad';
  }

  /** A button bound with a hold variant only fires its tap action on release before the hold time. */
  private padTapSuppressed(i: number): boolean {
    for (const list of Object.values(this.pad)) if (list.includes(HOLD + i)) return true;
    return false;
  }

  private kbHeld(a: Action): boolean {
    for (const c of this.kb[a]) if (this.down.has(c)) return true;
    return false;
  }
  private kbEdge(a: Action, set: Set<string>): boolean {
    for (const c of this.kb[a]) if (set.has(c)) return true;
    return false;
  }
  private padHeld(a: Action): boolean {
    for (const b of this.pad[a]) if (b < HOLD && this.padDown.has(b)) return true;
    return false;
  }
  private padEdgeHit(a: Action, set: Set<number>): boolean {
    for (const b of this.pad[a]) {
      if (b >= HOLD) {
        if (set.has(b)) return true;
      } else if (this.padTapSuppressed(b)) {
        // fire on release if the hold never triggered
        if (this.padTaps.has(b)) return true;
      } else if (set.has(b)) return true;
    }
    return false;
  }

  /**
   * Build the InputFrame for this tick. `px, py` is the local player's world position (for stick aim).
   */
  sample(px: number, py: number): InputFrame {
    let mx = 0;
    let my = 0;
    let buttons = 0;
    let pressedBits = 0;
    if (this.gameplayEnabled) {
      if (this.kbHeld('moveLeft')) mx -= 1;
      if (this.kbHeld('moveRight')) mx += 1;
      if (this.kbHeld('moveUp')) my -= 1;
      if (this.kbHeld('moveDown')) my += 1;
      if (mx !== 0 && my !== 0) {
        mx *= Math.SQRT1_2;
        my *= Math.SQRT1_2;
      }
      if (Math.hypot(...this.padMove) > 0) [mx, my] = this.padMove;
      for (const a of GAME_ACTIONS) {
        const bit = ACTION_BIT[a as GameAction];
        if (this.kbHeld(a) || this.padHeld(a)) buttons |= bit;
        if (this.kbEdge(a, this.edge) || this.padEdgeHit(a, this.padEdge)) pressedBits |= bit;
      }
      // a press that started and ended between samples still counts as pressed this frame
      buttons |= pressedBits & ~ACTION_BIT.twoHand;
      if (this.blockToggle) {
        if (pressedBits & ACTION_BIT.block) this.blockLatched = !this.blockLatched;
        buttons = this.blockLatched ? buttons | ACTION_BIT.block : buttons & ~ACTION_BIT.block;
      }
    }
    this.edge.clear();
    this.padEdge.clear();
    this.padTaps.clear();
    // edges that happened via held state transitions (e.g. held key while another frame consumed edges)
    pressedBits |= buttons & ~this.prevButtons & ~ACTION_BIT.twoHand;
    this.prevButtons = buttons;

    let aimX = this.mouseX;
    let aimY = this.mouseY;
    let aimNeutral = false;
    let aimAssist = 0;
    if (this.lastDevice === 'pad') {
      aimAssist = this.aimAssist;
      if (Math.hypot(...this.padAim) > 0) {
        const m = Math.hypot(...this.padAim);
        this.lastAimDir = [this.padAim[0] / m, this.padAim[1] / m];
      } else {
        aimNeutral = true;
        if (Math.hypot(mx, my) > 0.3) {
          const m = Math.hypot(mx, my);
          this.lastAimDir = [mx / m, my / m];
        }
      }
      aimX = px + this.lastAimDir[0] * 240;
      aimY = py + this.lastAimDir[1] * 240;
    }
    return { moveX: mx, moveY: my, aimX, aimY, aimNeutral, aimAssist, buttons, pressed: pressedBits };
  }

  /** Edge-trigger for local (menu) actions, consumed per call. */
  consumeLocal(a: LocalAction | GameAction): boolean {
    let hit = false;
    for (const c of this.kb[a]) if (this.localEdge.has(c)) {
      this.localEdge.delete(c);
      hit = true;
    }
    for (const b of this.pad[a]) {
      if (b >= HOLD) {
        if (this.padLocalEdge.has(b)) {
          this.padLocalEdge.delete(b);
          hit = true;
        }
      } else if (this.padTapSuppressed(b)) {
        if (this.padLocalTaps.has(b)) {
          this.padLocalTaps.delete(b);
          hit = true;
        }
      } else if (this.padLocalEdge.has(b)) {
        this.padLocalEdge.delete(b);
        hit = true;
      }
    }
    return hit;
  }

  /** Clear local edges at the end of a frame so stale presses never leak into menus. */
  endFrame(): void {
    this.localEdge.clear();
    this.padLocalEdge.clear();
    this.padLocalTaps.clear();
  }

  isDown(code: string): boolean {
    return this.down.has(code);
  }
  padButtonDown(i: number): boolean {
    return this.padDown.has(i);
  }
  padButtonEdge(i: number): boolean {
    return this.padDown.has(i) && !this.padPrev.has(i);
  }
  padStick(): [number, number] {
    return [this.padMove[0], this.padMove[1]];
  }
}
