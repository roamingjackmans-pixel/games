// Boot: settings, audio unlock, scene manager, debug menu.
import './ui/theme.css';
import { createApp } from './app';
import { ArenaScene } from './game/scenes/arena';
import { RunScene } from './game/scenes/run';
import { installDebugMenu } from './ui/menus/debug';
import { uiRoot } from './ui/dom';
import { getStore } from './engine/settings';
import { readSave } from './game/save/storage';
import { newSave } from './game/save/schema';
import { newCharacter } from './game/player/character';
import { Rng, randomSeedString } from './engine/rng';
import type { ClassId } from './game/types';

const canvasEl = document.getElementById('game') as HTMLCanvasElement;
const overlay = document.getElementById('overlay') as HTMLElement;
const a = createApp(canvasEl, overlay);
a.canvas.applyOverlayScale(uiRoot());
installDebugMenu();
const params = new URLSearchParams(location.search);
if (params.has('arena')) a.scenes.set(new ArenaScene());
else {
  const fresh = params.has('new');
  const existing = fresh ? null : readSave(getStore(), 1);
  const seed = params.get('seed') ?? randomSeedString(Date.now());
  const cls = (params.get('class') ?? 'knight') as ClassId;
  const save = existing ?? newSave(1, newCharacter(cls, 'Joe', `p-${seed}`, new Rng(seed)), seed);
  a.scenes.set(new RunScene(save));
}
a.loop.start();
// Dev server only: expose the app for playtests and Playwright (stripped from production builds).
if (import.meta.env.DEV) (window as unknown as { __dj: unknown }).__dj = a;
