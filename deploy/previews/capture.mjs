// Records the still and the short looping clip on each /games/ card.
//
//   node deploy/previews/capture.mjs [folder ...] [--jobs=N]   records every game (N at a time, default 3), or only those named
//   py -I deploy/previews/to_webp.py [folder ...]              turns the recordings into deploy/previews/*.webp
//
// Each game has a recipe in recipes/<folder>.mjs (the fields are listed in tools.mjs). The game is opened at 1280x720
// in headless Chromium (Playwright, already a dev dependency), walked into the moment the card shows, then recorded
// through Chrome's screencast. Frames go to <temp>/games-previews/<folder>/ for to_webp.py. Nothing signs in to a live
// site or joins a stranger's match: multiplayer recipes open their own extra players in private rooms, and games that
// need an account (Roleplay20) or a long run (Dungeon Joe) run locally from their source with test data.
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { steps } from './tools.mjs';

const FPS = 12;
const OUT = path.join(os.tmpdir(), 'games-previews');
const here = path.dirname(fileURLToPath(import.meta.url));
const VIEWPORT = { width: 1280, height: 720 };

async function record(browser, game) {
  const file = path.join(here, 'recipes', `${game}.mjs`);
  if (!fs.existsSync(file)) throw new Error(`no recipe at ${file}`);
  const recipe = (await import(pathToFileURL(file).href)).default;
  const seconds = recipe.seconds ?? 4;
  const contexts = [];
  const done = [];
  // every player gets its own browser context, so each is a separate person to the game
  const open = async (url, options = {}) => {
    const context = await browser.newContext({ viewport: VIEWPORT, ...options });
    contexts.push(context);
    const page = await context.newPage();
    if (url) await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    return page;
  };
  try {
    const page = await open(null);
    const url = recipe.url ?? `https://josephjackman.com/games/${game}/`;
    const ctx = { browser, open, onDone: (fn) => done.push(fn), game, url };
    await recipe.before?.(ctx);
    await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(2000);
    await steps(page, recipe.steps ?? [], game);
    const state = (await recipe.setup?.(page, ctx)) ?? {};
    const target = state.record ?? page;

    const cdp = await target.context().newCDPSession(target);
    const frames = [];
    cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
      frames.push({ t: metadata.timestamp, data });
      cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: VIEWPORT.width, maxHeight: VIEWPORT.height });
    const start = Date.now() / 1000;
    const until = Date.now() + seconds * 1000 + 300;
    await Promise.all([recipe.during?.(target, until, state), target.waitForTimeout(seconds * 1000 + 300)]);
    await cdp.send('Page.stopScreencast');
    if (!frames.length) throw new Error('no frames painted');

    // resample to a steady frame rate: each tick shows the newest frame painted by then
    const dir = path.join(OUT, game);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const t0 = Math.max(frames[0].t, start);
    for (let i = 0; i < FPS * seconds; i++) {
      const frame = frames.filter((f) => f.t <= t0 + i / FPS).pop() ?? frames[0];
      fs.writeFileSync(path.join(dir, `${String(i).padStart(3, '0')}.jpg`), Buffer.from(frame.data, 'base64'));
    }
    fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ fps: FPS, crop: recipe.crop ?? null, still: recipe.still ?? 0.5 }));
    console.log(`${game}: ${frames.length} frames painted`);
  } finally {
    for (const context of contexts) await context.close().catch(() => {});
    for (const fn of done) await Promise.resolve(fn()).catch(() => {});
  }
}

const args = process.argv.slice(2);
const jobs = Number(args.find((a) => a.startsWith('--jobs='))?.slice(7) ?? 3);
const only = args.filter((a) => !a.startsWith('--'));
const games = only.length
  ? only
  : fs
      .readdirSync(path.join(here, 'recipes'))
      .filter((f) => f.endsWith('.mjs'))
      .map((f) => f.slice(0, -4));
// draw on the real graphics card (headless Chromium falls back to slow software WebGL otherwise)
const gpu = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required', ...gpu] });
// a few at a time: each one renders a whole game in software, and a busy machine makes a choppy clip
for (let i = 0; i < games.length; i += jobs) {
  await Promise.all(games.slice(i, i + jobs).map((g) => record(browser, g).catch((e) => console.log(`${g}: FAILED ${e.message}`))));
}
await browser.close();
console.log(`Frames are in ${OUT}. Next: py -I deploy/previews/to_webp.py`);
