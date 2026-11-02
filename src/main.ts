// Boot: settings, audio unlock, scene manager, debug menu.
import './ui/theme.css';
import { createApp } from './app';
import { SandboxScene } from './game/scenes/sandbox';
import { installDebugMenu } from './ui/menus/debug';
import { uiRoot } from './ui/dom';

const canvasEl = document.getElementById('game') as HTMLCanvasElement;
const overlay = document.getElementById('overlay') as HTMLElement;
const a = createApp(canvasEl, overlay);
a.canvas.applyOverlayScale(uiRoot());
window.addEventListener('resize', () => a.canvas.applyOverlayScale(uiRoot()));
installDebugMenu();
a.scenes.set(new SandboxScene());
a.loop.start();
// Dev server only: expose the app for playtests and Playwright (stripped from production builds).
if (import.meta.env.DEV) (window as unknown as { __dj: unknown }).__dj = a;
