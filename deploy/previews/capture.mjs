// Records the still and the short looping clip on each /games/ card, from the live games.
//
//   node deploy/previews/capture.mjs [folder ...]     records every game, or only the ones named
//   py -I deploy/previews/to_webp.py                  turns the recordings into deploy/previews/*.webp
//
// Each game is opened at 1280x720 in headless Chromium (Playwright, already a dev dependency), walked past its
// menus by the steps in RECIPES, then recorded for SECONDS through Chrome's screencast. Frames go to
// <temp>/games-previews/<folder>/ for to_webp.py. Nothing signs in or joins a public match: the recipes use
// practice, offline and solo modes, or hide the menu so the title screen behind it shows.
import { chromium } from 'playwright';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const FPS = 12;
const SECONDS = 4;
const OUT = path.join(os.tmpdir(), 'games-previews');

// hide the biggest box around the element holding this text that is still narrower than the window
function hidePanel(text) {
  const el = [...document.querySelectorAll('button, a, h1, h2, p, div, span')].find(
    (e) => e.offsetParent !== null && e.textContent.trim().startsWith(text),
  );
  if (!el) throw new Error('no element with ' + text);
  let box = el;
  while (box.parentElement && box.parentElement !== document.body && box.parentElement.getBoundingClientRect().width < innerWidth * 0.9)
    box = box.parentElement;
  box.style.setProperty('display', 'none', 'important');
}

const clickEvery = (sel, ms) => async (page, until) => {
  while (Date.now() < until) {
    await page
      .locator(sel)
      .first()
      .click({ timeout: 1000 })
      .catch(() => {});
    await page.waitForTimeout(ms);
  }
};
const holdKeys = (seq) => async (page, until) => {
  while (Date.now() < until) {
    for (const [key, ms] of seq) {
      if (Date.now() >= until) break;
      await page.keyboard.down(key);
      await page.waitForTimeout(ms);
      await page.keyboard.up(key);
    }
  }
};

// Steps: "t:Text" clicks visible text, "b:Name" clicks the button with exactly that name, "s:css" clicks a
// selector, "f:css=value" fills an input, "x:Text" hides the panel holding that text, "h:css" hides an
// element, "w:ms" waits. `during` runs while recording; `crop` is [x, y, w, h] (16:9) of the 1280x720 page.
const RECIPES = {
  altwhiskerwars: { steps: ['t:skip it', 't:Claim', 't:Practice', 't:Start Battle', 'w:7000'] },
  battlecards: { steps: ['w:1500'] },
  dontwakegerald: { steps: ['s:#ok', 'w:1500', 'x:🛏️ Play with friends', 'h:#rename', 'w:1000'] },
  dungeonjoe: {
    steps: ['t:Wave Rush', 'b:Start', 'w:2500'],
    during: holdKeys([
      ['d', 700],
      ['s', 500],
      ['a', 700],
      ['w', 500],
    ]),
  },
  geodegobbler: { steps: ['t:YEEHAW', 'w:1200'], during: clickEvery('#geode', 110) },
  horserace: { steps: ['f:#nameInput=Joe', 's:#createBtn', 's:.horse-card', 't:Start the race', 'w:3500'] },
  infinitehive: { steps: ['t:Got it', 'w:800'], during: clickEvery('#hex-btn', 140) },
  lieage: { steps: ['t:Host a game', 'w:2500'] },
  roleplay20: { steps: ['w:1500'] },
  shoallhell: { steps: ['x:Sign in', 'w:2500'] },
  smashyourbros: { steps: ['x:Sign in', 'w:2500'] },
  thedeck: {
    steps: ['f:#name-input=Joe', 's:#solo-btn', 'w:800', 's:#draw-button', 'w:900'],
    during: clickEvery('#draw-button', 1300),
    crop: [320, 0, 640, 360],
  },
};

async function step(page, s) {
  const [kind, ...rest] = s.split(':');
  const arg = rest.join(':');
  const visible = (l) => l.locator('visible=true').first();
  if (kind === 't') await visible(page.getByText(arg)).click({ timeout: 6000 });
  else if (kind === 'b') await visible(page.getByRole('button', { name: arg, exact: true })).click({ timeout: 6000 });
  else if (kind === 's') await visible(page.locator(arg)).click({ timeout: 6000 });
  else if (kind === 'f') {
    const [sel, val] = arg.split('=');
    await page.locator(sel).first().fill(val);
  } else if (kind === 'x') await page.evaluate(hidePanel, arg);
  else if (kind === 'h') await page.addStyleTag({ content: `${arg}{visibility:hidden!important}` });
  else if (kind === 'w') return page.waitForTimeout(Number(arg));
  await page.waitForTimeout(900);
}

async function record(browser, game) {
  const recipe = RECIPES[game];
  if (!recipe) throw new Error(`no recipe for ${game}`);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`https://josephjackman.com/games/${game}/`, { waitUntil: 'load', timeout: 45000 });
  await page.waitForTimeout(2000);
  for (const s of recipe.steps) await step(page, s).catch((e) => console.log(`${game}: step ${s} failed: ${e.message.split('\n')[0]}`));

  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    frames.push({ t: metadata.timestamp, data });
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1280, maxHeight: 720 });
  const start = Date.now() / 1000;
  const until = Date.now() + SECONDS * 1000 + 300;
  await Promise.all([recipe.during?.(page, until), page.waitForTimeout(SECONDS * 1000 + 300)]);
  await cdp.send('Page.stopScreencast');
  await page.close();
  if (!frames.length) throw new Error('no frames painted');

  // resample to a steady frame rate: each tick shows the newest frame painted by then
  const dir = path.join(OUT, game);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const t0 = Math.max(frames[0].t, start);
  for (let i = 0; i < FPS * SECONDS; i++) {
    const frame = frames.filter((f) => f.t <= t0 + i / FPS).pop() ?? frames[0];
    fs.writeFileSync(path.join(dir, `${String(i).padStart(3, '0')}.jpg`), Buffer.from(frame.data, 'base64'));
  }
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ fps: FPS, crop: recipe.crop ?? null }));
  console.log(`${game}: ${frames.length} frames painted`);
}

const only = process.argv.slice(2);
const games = only.length ? only : Object.keys(RECIPES);
const browser = await chromium.launch({ args: ['--mute-audio', '--autoplay-policy=no-user-gesture-required'] });
// four at a time: each one renders a whole game in software
for (let i = 0; i < games.length; i += 4) {
  await Promise.all(games.slice(i, i + 4).map((g) => record(browser, g).catch((e) => console.log(`${g}: FAILED ${e.message}`))));
}
await browser.close();
console.log(`Frames are in ${OUT}. Next: py -I deploy/previews/to_webp.py`);
