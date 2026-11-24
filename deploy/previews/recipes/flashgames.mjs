// FlashGames: a day's run of Smash Your Bros on the moon with big heads, inside FlashGames' run screen. The bar shows
// the day's modifiers, the 15-minute clock ticking and the score; the bro runs at the foe by the ledge and smashes
// him off for a KO, and the bar's score jumps.
// Runs locally: Shoallhell's server (accounts and boards; a throwaway data folder and admin key) and FlashGames' dev
// server, which serves the built Smash Your Bros at /games/smashyourbros/ (LOCAL_GAMES in its vite.config.ts), so
// nothing signs in to the live site. The recipe uploads a test day, makes a test account, presses PLAY, waits out the
// 3-2-1, then (through the game's flash-mode handle window.sybFlash) puts the two bros by the right ledge with the
// foe at 160 % a smash apart, and plays the smash on the keyboard (the Right arrow charges a forward smash).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serve } from '../tools.mjs';

const SERVER = 3061;
const PORT = 5193;
const ADMIN = 'clip-admin';
const URL = `http://localhost:${PORT}/games/flashgames/`;
const API = `http://localhost:${SERVER}/games/shoallhell/api`;

const game = (page) => page.frames().find((f) => f.url().includes('/games/smashyourbros/'));

export default {
  url: URL,
  seconds: 5.5,
  still: 0.3,
  async before(ctx) {
    const data = fs.mkdtempSync(path.join(os.tmpdir(), 'fg-clip-'));
    const stopServer = await serve({
      command: 'node',
      args: ['server/index.js'],
      cwd: 'C:/dev/Shoallhell',
      url: `${API}/ping`,
      env: { PORT: String(SERVER), DATA_DIR: data, FG_ADMIN_TOKEN: ADMIN },
    });
    ctx.onDone(stopServer);
    const stopPage = await serve({
      command: 'node',
      args: ['node_modules/vite/bin/vite.js', '--port', String(PORT), '--strictPort'],
      cwd: 'C:/dev/FlashGames',
      url: URL,
      env: { SHOALLHELL_SERVER: `http://localhost:${SERVER}` },
    });
    ctx.onDone(stopPage);
    ctx.onDone(() => fs.rmSync(data, { recursive: true, force: true }));
    const today = (await (await fetch(`${API}/fg/today`)).json()).date;
    const res = await fetch(`${API}/fg/admin/plans`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Flash-Admin': ADMIN },
      body: JSON.stringify({
        plans: [
          {
            date: today,
            title: 'Big Heads, Low Gravity',
            game: { id: 'smashyourbros', name: 'Smash Your Bros', path: '/games/smashyourbros/', maxScore: 2000000 },
            mods: [
              { id: 'moon', name: 'Moon Bros', text: '' },
              { id: 'bighead', name: 'Big Head Mode', text: '' },
            ],
            seed: 7,
          },
        ],
      }),
    });
    if (!(await res.json()).stored?.length) throw new Error('could not upload the clip day');
  },
  async setup(page) {
    await page.getByRole('button', { name: 'New here? Make an account' }).click();
    await page.getByPlaceholder('Email').fill(`clip${Date.now()}@clip.test`);
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByPlaceholder('Name on the board').fill('Clip');
    await page.getByRole('button', { name: 'Make my account' }).click();
    await page.locator('.btn.play').click({ force: true });
    // the 3-2-1, then the fight
    await page.waitForFunction(() => document.querySelector('.overlay')?.hidden === true, null, { timeout: 60000 });
    await page.waitForFunction(() => document.querySelector('.run-bar') && true, null, { timeout: 5000 });
    const g = game(page);
    await g.waitForFunction(() => window.sybFlash?.match?.driver?.st?.intro === 0, null, { timeout: 15000 });
    // keys reach the game once the frame has focus (the game takes it on a click); wait out the round banner
    await page.mouse.click(640, 690);
    await page.waitForTimeout(1500);
  },
  async during(page) {
    const g = game(page);
    const k = page.keyboard;
    // the studio's floor runs from -640 to 640: both bros by the right ledge, a smash apart, the foe at 160 %
    // (bros pass through each other, so the bro doesn't run in: on the moon she'd slide right past)
    await g.evaluate(() => {
      const [a, b] = window.sybFlash.match.driver.st.fighters;
      Object.assign(a, { x: 400, y: 0, vx: 0, vy: 0, kx: 0, ky: 0, facing: 1 });
      // the foe stands still for the clip (a cpu of 0 is an empty controller slot)
      Object.assign(b, { x: 520, y: 0, vx: 0, vy: 0, kx: 0, ky: 0, facing: -1, dmg: 160, cpu: 0 });
    });
    await page.waitForTimeout(700);
    await k.down('ArrowRight');
    await g.waitForFunction(() => window.sybFlash.match.driver.st.fighters[0].charge >= 14, null, { polling: 'raf', timeout: 1500 }).catch(() => {});
    await k.up('ArrowRight');
  },
};
