// Roleplay20: Bram's play screen mid-session, with his character sheet, the torch-lit Saltmere Quay battle map and the
// story column with the chat box all open. Wren's table talk comes in, Bram drags his token three squares up the quay,
// then answers the Perception check the DM asked for with the number his real d20 showed ("I rolled it", the game's
// own real-dice box, so the result is the same every run): his d20 tumbles and lands on a natural 20 with the table's
// fanfare and confetti, and the roll goes into the story while the DM starts writing.
// The live site sits behind the owner's private password, so this runs the game locally from C:\dev\Roleplay20 on port
// 5195. It copies server/, shared/, site/ and client/dist/ to a temp folder WITHOUT the repo's .env, so no live keys are
// loaded. It uses the repo's own data-test campaign "The Drowned Lantern" (two test players, mid-session), with a made-up
// server secret, a gate token and sign-in tokens written straight into the copy (no password is typed anywhere), and the
// test DM (AI_PROVIDER=file: requests go to a local inbox file, nothing leaves the machine). Bram is recorded; Wren is a
// second browser at the table, because game actions wait until every player is there.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serve, wait } from '../tools.mjs';

const SRC = 'C:/dev/Roleplay20';
const PORT = 5195;
const BASE = `http://localhost:${PORT}/roleplay20/`;
const URL = `${BASE}#/c/c_EXqdU90x/play`;
const WORK = path.join(os.tmpdir(), 'rp20-preview');
const DATA = path.join(WORK, 'data');
const SERVER = path.join(WORK, 'app', 'server', 'index.js');
const LINK = path.join(WORK, 'app', 'node_modules');
const PAN = 210; // pixels the map view is dragged right, so the lit street fills it and Bram's token sits near its right edge
const CELL = 25.6; // "Find my token" zooms to 1.6x the fitted scale: 16 px squares on this 500 px wide map
const LINE = "Bram, that pale woman is still out on the water. Don't board alone!";
const keys = {};

/** Removes the temp copy (the node_modules junction first, so the repo's own node_modules is never touched). */
function cleanup() {
  try {
    if (fs.lstatSync(LINK).isSymbolicLink()) fs.unlinkSync(LINK);
  } catch {
    /* no link */
  }
  fs.rmSync(WORK, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
}

/** A fresh copy of the game and its test data, a random server secret, and tokens that let both test players in. */
function prepare() {
  cleanup();
  for (const p of ['package.json', 'server', 'shared', 'site', 'client/dist'])
    fs.cpSync(path.join(SRC, p), path.join(WORK, 'app', p), { recursive: true });
  fs.symlinkSync(path.join(SRC, 'node_modules'), LINK, 'junction');
  fs.cpSync(path.join(SRC, 'data-test'), DATA, {
    recursive: true,
    filter: (f) => !/ai-inbox[\\/].|\.wren_token|TEST_ACCOUNTS|ai-calls/.test(f),
  });
  keys.secret = crypto.randomBytes(32).toString('base64url');
  // the site password is a random one nobody knows: the gate is passed with a token signed by the secret above
  const salt = crypto.randomBytes(16).toString('base64url');
  const hash = crypto.scryptSync(crypto.randomBytes(24).toString('hex'), salt, 32, { N: 16384, r: 8, p: 1 }).toString('base64url');
  keys.gateHash = `scrypt$${salt}$${hash}`;
  const body = Buffer.from(JSON.stringify({ g: 1, exp: Date.now() + 3600000 })).toString('base64url');
  keys.gate = `${body}.${crypto.createHmac('sha256', keys.secret).update(body).digest('base64url')}`;
  const users = JSON.parse(fs.readFileSync(path.join(DATA, 'users.json'), 'utf8')).users;
  const sessions = {};
  for (const u of Object.values(users)) {
    keys[u.displayName] = crypto.randomBytes(32).toString('base64url');
    sessions[crypto.createHash('sha256').update(keys[u.displayName]).digest('base64url')] = {
      userId: u.id,
      exp: Date.now() + 3600000,
      created: Date.now(),
    };
  }
  fs.writeFileSync(path.join(DATA, 'sessions.json'), JSON.stringify(sessions));
  fs.writeFileSync(path.join(DATA, 'gate.json'), JSON.stringify({ ips: {}, devices: {} }));
}

/** In the page: remember the gate pass and this player's sign-in, as the password page and the sign-in screen would. */
function signIn([gate, token, device]) {
  localStorage.setItem('rp20.gate', gate);
  localStorage.setItem('rp20.token', token);
  localStorage.setItem('rp20.device', device);
}

/** Waits until this player's table (story column and battle map) is on screen. */
async function seated(page) {
  await page.locator('.feed').waitFor({ timeout: 30000 });
  await page.locator('canvas.rp-map-canvas').waitFor({ timeout: 15000 });
}

export default {
  url: URL,
  async before(ctx) {
    prepare();
    const env = { PORT: String(PORT), DATA_DIR: DATA, GATE_PASSWORD_HASH: keys.gateHash, SERVER_SECRET: keys.secret };
    Object.assign(env, { AI_PROVIDER: 'file', EMAIL_PROVIDER: 'off', TUNNEL: 'off' });
    const stop = await serve({ command: `node "${SERVER}" --no-tunnel`, cwd: path.dirname(SERVER), env, url: `${BASE}api/ping` });
    ctx.onDone(() => {
      stop();
      cleanup();
    });
  },
  async setup(page, ctx) {
    const wren = await ctx.open(null);
    await wren.context().addInitScript(signIn, [keys.gate, keys.Wren, 'clipwren0000000001']);
    await wren.goto(URL, { waitUntil: 'load', timeout: 45000 });
    await seated(wren);
    await page.evaluate(signIn, [keys.gate, keys.Bram, 'clipbram0000000001']);
    await page.reload({ waitUntil: 'load' });
    await seated(page);
    await page.getByRole('button', { name: 'Roll for me' }).waitFor({ timeout: 15000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => {
      const f = document.querySelector('.feed');
      f.scrollTop = f.scrollHeight;
    });
    // the sheet: Bram lights a torch, which lights the night quay around his token
    await page.getByRole('button', { name: /Light a torch/ }).click();
    await page.getByRole('button', { name: /Torch lit/ }).waitFor({ timeout: 10000 });
    // the map: find Bram's token, then drag the view right so the lit street fills the map
    await page.getByTitle('Find my token').click();
    await page.waitForTimeout(700);
    const map = await page.locator('canvas.rp-map-canvas').boundingBox();
    const from = [map.x + 40, map.y + map.height - 60];
    await page.mouse.move(...from);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(from[0] + (PAN * i) / 10, from[1]);
    await page.mouse.up();
    // Wren types her table talk now and sends it once recording starts
    await wren.getByRole('button', { name: /Table talk/ }).click();
    await wren.getByPlaceholder(/Out-of-character chat/).fill(LINE);
    // Bram's real d20 showed a 20: typed into the check's box, sent with "I rolled it" during the clip
    await page.locator('.roll-req input.rr-input').fill('20');
    await page.waitForTimeout(1200);
    return { wren, token: [map.x + map.width / 2 + PAN, map.y + map.height / 2] };
  },
  async during(page, until, { wren, token }) {
    await wait(300);
    await wren.getByPlaceholder(/Out-of-character chat/).press('Enter');
    await wait(700);
    // Bram drags his token three squares up the quay, toward Oswin and the Kittiwake
    const [x, y] = token;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(x - (3 * CELL * i) / 12, y + (CELL * i) / 12);
      await wait(35);
    }
    await page.mouse.up();
    await wait(400);
    await page.getByRole('button', { name: 'I rolled it' }).click();
    while (Date.now() < until) await wait(100);
  },
  seconds: 6,
  still: 0.65,
};
