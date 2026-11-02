// Boot: settings, audio unlock, scene manager, debug menu, the title screen.
import './ui/theme.css';
import { createApp } from './app';
import { ArenaScene } from './game/scenes/arena';
import { RunScene, runHooks } from './game/scenes/run';
import { TitleScene, titleHooks } from './game/scenes/title';
import { CreditsScene } from './game/scenes/credits';
import { installDebugMenu } from './ui/menus/debug';
import { toast, uiRoot } from './ui/dom';
import { newSave } from './game/save/schema';
import { newCharacter } from './game/player/character';
import { Rng, randomSeedString } from './engine/rng';
import type { ClassId } from './game/types';

const canvasEl = document.getElementById('game') as HTMLCanvasElement;
const overlay = document.getElementById('overlay') as HTMLElement;
const a = createApp(canvasEl, overlay);
a.canvas.applyOverlayScale(uiRoot());
installDebugMenu();

const toTitle = (): void => a.scenes.go(new TitleScene());
titleHooks.start = (save, mode) => {
  if (mode === 'solo') a.scenes.go(new RunScene(save));
  else toast('Co-op hosting and joining arrive with the lobby (M9).');
};
titleHooks.credits = () => a.scenes.go(new CreditsScene(toTitle));
runHooks.toTitle = toTitle;

const params = new URLSearchParams(location.search);
if (params.has('arena')) a.scenes.set(new ArenaScene());
else if (params.has('new')) {
  // dev shortcut: straight into a fresh run in slot 10
  const seed = params.get('seed') ?? randomSeedString(Date.now());
  const cls = (params.get('class') ?? 'knight') as ClassId;
  const save = newSave(10, newCharacter(cls, 'Joe', `p-${seed}`, new Rng(seed)), seed);
  a.scenes.set(new RunScene(save));
} else a.scenes.set(new TitleScene());
a.loop.start();
// Dev server only: expose the app for playtests and Playwright (stripped from production builds).
if (import.meta.env.DEV) (window as unknown as { __dj: unknown }).__dj = a;
