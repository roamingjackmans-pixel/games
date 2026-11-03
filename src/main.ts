// Boot: settings, audio unlock, scene manager, debug menu, the title screen.
import './ui/theme.css';
// first, so the browser's one-time install prompt is caught (D135)
import './ui/install';
import { createApp } from './app';
import { ArenaScene } from './game/scenes/arena';
import { RunScene, runHooks } from './game/scenes/run';
import { TitleScene, titleHooks } from './game/scenes/title';
import { CreditsScene } from './game/scenes/credits';
import { LobbyScene, lobbyHooks } from './game/scenes/lobby';
import { GuestRunScene, guestHooks } from './game/scenes/guestRun';
import { installDebugMenu } from './ui/menus/debug';
import { installAchievementToasts } from './ui/achievements';
import { h, uiRoot } from './ui/dom';
import { newSave } from './game/save/schema';
import { newCharacter } from './game/player/character';
import { Rng, randomSeedString } from './engine/rng';
import type { ClassId } from './game/types';

const params = new URLSearchParams(location.search);

if (params.get('net') === 'test') {
  // NETCODE §8: a host and a guest side by side in one tab (BroadcastChannel transport between the panes)
  const code = params.get('code') ?? '222222';
  document.body.innerHTML = '';
  document.body.style.cssText = 'margin:0;background:#0d0b12;display:flex;gap:6px;height:100vh';
  for (const role of ['host', 'guest']) {
    const f = h('iframe', { src: `${location.pathname}?net=bc&auto=${role}&code=${code}`, style: 'flex:1;border:0;height:100%' });
    document.body.appendChild(f);
  }
} else boot();

function boot(): void {
  const canvasEl = document.getElementById('game') as HTMLCanvasElement;
  const overlay = document.getElementById('overlay') as HTMLElement;
  const a = createApp(canvasEl, overlay);
  a.canvas.applyOverlayScale(uiRoot());
  installDebugMenu();
  installAchievementToasts();

  const toTitle = (): void => a.scenes.go(new TitleScene());
  titleHooks.start = (save, mode) => {
    if (mode === 'solo') a.scenes.go(new RunScene(save));
    else a.scenes.go(new LobbyScene(save, { role: mode === 'host' ? 'host' : 'guest' }));
  };
  titleHooks.credits = () => a.scenes.go(new CreditsScene(toTitle));
  runHooks.toTitle = toTitle;
  runHooks.toLobby = (save, net) => a.scenes.go(new LobbyScene(save, { role: 'host', host: net }));
  // after The Landlord: credits, then back at his empty arena where the NG+ fire waits
  runHooks.credits = (s) => a.scenes.go(new CreditsScene(() => a.scenes.go(new RunScene(s.save)), 'Back to the Abyss'));
  runHooks.newCycle = (save) => a.scenes.go(new RunScene(save));
  lobbyHooks.startHost = (save, net) => a.scenes.go(new RunScene(save, net));
  lobbyHooks.startGuest = (save, net) => a.scenes.go(new GuestRunScene(save, net));
  lobbyHooks.toTitle = toTitle;
  guestHooks.toTitle = toTitle;
  guestHooks.credits = () => a.scenes.go(new CreditsScene(toTitle));
  guestHooks.toLobby = (save, net) => a.scenes.go(new LobbyScene(save, { role: 'guest', guest: net }));

  const auto = params.get('auto');
  if (params.has('arena')) a.scenes.set(new ArenaScene());
  else if (auto === 'host' || auto === 'guest') {
    // the ?net=test panes and Playwright: a quick character each, then host / join automatically
    const host = auto === 'host';
    const seed = params.get('seed') ?? 'NETTEST';
    const ch = newCharacter(host ? 'knight' : 'brute', host ? 'Host Joe' : 'Guest Joe', host ? 'net-host' : `net-guest-${randomSeedString(Date.now())}`, new Rng(seed));
    ch.tutorialDone = true;
    const save = newSave(host ? 10 : 9, ch, seed);
    a.scenes.set(new LobbyScene(save, { role: host ? 'host' : 'guest', code: params.get('code') ?? '222222', auto: true }));
  } else if (params.has('new')) {
    // dev shortcut: straight into a fresh run in slot 10
    const seed = params.get('seed') ?? randomSeedString(Date.now());
    const cls = (params.get('class') ?? 'knight') as ClassId;
    const save = newSave(10, newCharacter(cls, 'Joe', `p-${seed}`, new Rng(seed)), seed);
    a.scenes.set(new RunScene(save));
  } else a.scenes.set(new TitleScene());
  a.loop.start();
  // Dev server only: expose the app for playtests and Playwright (stripped from production builds).
  if (import.meta.env.DEV) (window as unknown as { __dj: unknown }).__dj = a;
}
