// The client application shell: canvas, input, loop, scenes, settings, particles. Browser only.
import { GameCanvas } from './engine/canvas';
import { InputManager } from './engine/input/input';
import { Loop } from './engine/loop';
import { Particles } from './engine/particles';
import { SceneManager } from './engine/scene';
import { loadSettings, saveSettings, type Settings } from './engine/settings';
import { Tweens } from './engine/tween';
import { mixer } from './engine/audio/mixer';
import { pollMenuPad } from './ui/menuPad';

export interface App {
  canvas: GameCanvas;
  input: InputManager;
  loop: Loop;
  scenes: SceneManager;
  settings: Settings;
  particles: Particles;
  tweens: Tweens;
  applySettings(): void;
  saveSettings(): void;
}

let appRef: App | null = null;

export function app(): App {
  if (!appRef) throw new Error('App not created');
  return appRef;
}

export function createApp(canvasEl: HTMLCanvasElement, overlay: HTMLElement): App {
  const canvas = new GameCanvas(canvasEl, overlay);
  const input = new InputManager((x, y) => canvas.toLogical(x, y));
  input.attach(canvasEl);
  const scenes = new SceneManager();
  const particles = new Particles();
  const tweens = new Tweens();
  const settings = loadSettings();
  const loop = new Loop({
    frame: (now) => {
      input.pollGamepad(now / 1000);
      pollMenuPad(input, now / 1000);
    },
    update: (dt) => {
      scenes.update(dt);
    },
    render: (alpha, realDt) => {
      tweens.update(realDt);
      particles.update(realDt);
      const ctx = canvas.begin();
      scenes.render(ctx, alpha, realDt);
      input.endFrame();
    },
  });
  const a: App = {
    canvas,
    input,
    loop,
    scenes,
    settings,
    particles,
    tweens,
    applySettings() {
      const s = a.settings;
      input.setBindings(s.controls.keyboard, s.controls.gamepad);
      input.aimAssist = s.controls.aimAssist;
      input.blockToggle = !s.controls.holdToBlock;
      mixer.setVolumes(s.audio.master, s.audio.sfx, s.audio.music);
      loop.frameCap = s.video.frameCap;
      if (Math.abs(canvas.resolutionScale - s.video.scale) > 0.01) canvas.setResolutionScale(s.video.scale);
    },
    saveSettings() {
      saveSettings(a.settings);
    },
  };
  appRef = a;
  a.applySettings();
  // the first input anywhere unlocks audio (autoplay rule)
  const unlock = (): void => mixer.unlock();
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  window.addEventListener('gamepadconnected', unlock);
  return a;
}
