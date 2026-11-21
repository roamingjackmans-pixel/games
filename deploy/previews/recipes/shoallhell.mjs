// A Knight's turn on the hex board. It opens on the hand of Knight cards with Shield Bash and Tabard of Faith picked and
// clicks Ready; then the bottom of Shield Bash (Move 3: blue hexes, the Knight walks up to a monster), the top of Tabard
// of Faith (Attack 2: the red-ringed monster is clicked, the swing and the damage sum, Holy infused), the monster hits
// back, and the next round's hand comes up.
// Live site, no account: "Play offline on this device", recruit a Knight, buy him a Hard Hat (+2 HP) with his starting
// gold, play the first scenario, and in setup walk towards the first monster (one round at most) until that turn works,
// or start the scenario again. The board is a canvas, so the recipe reads hexes and units from the game's own saved fight
// (localStorage 'shoallhell.resume') and the camera from the canvas transform the board sets every frame.
import { wait } from '../tools.mjs';

const SQ3 = Math.sqrt(3);
const LEAD = 'Shield Bash'; // initiative 15: the Knight acts before any monster that moves 2 or less
const SECOND = 'Tabard of Faith'; // Attack 2: a lucky ×2 still leaves a 5 HP monster standing to hit back
/** at most one round spent walking up (so most of the hand is still there): the top of the first card, the bottom of the second */
const WALKS = [['Hold the Stairs', 'Longsword Sweep']];

// ---------------------------------------------------------------- hex maths (the game's src/game/grid.ts: odd-r rows)
const toCube = (x, y) => {
  const q = x - (y - (y & 1)) / 2;
  return [q, -q - y, y];
};
const fromCube = ([q, , r]) => [q + (r - (r & 1)) / 2, r];
const dist = (ax, ay, bx, by) => {
  const a = toCube(ax, ay);
  const b = toCube(bx, by);
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
};
const DIRS = [
  [1, -1, 0],
  [1, 0, -1],
  [0, 1, -1],
  [-1, 1, 0],
  [-1, 0, 1],
  [0, -1, 1],
];
const neighbors = (x, y) => {
  const c = toCube(x, y);
  return DIRS.map((d) => fromCube([c[0] + d[0], c[1] + d[1], c[2] + d[2]]));
};
const tile = (map, x, y) => (x < 0 || y < 0 || x >= map.w || y >= map.h ? ' ' : (map.tiles[y][x] ?? ' '));
function pixelToHex(px, py) {
  const q = (SQ3 / 3) * px - py / 3;
  const r = (2 / 3) * py;
  const s = -q - r;
  let rx = Math.round(q);
  let ry = Math.round(s);
  let rz = Math.round(r);
  const dx = Math.abs(rx - q);
  const dy = Math.abs(ry - s);
  const dz = Math.abs(rz - r);
  if (dx > dy && dx > dz) rx = -ry - rz;
  else if (dy > dz) ry = -rx - rz;
  else rz = -rx - ry;
  return fromCube([rx, ry, rz]);
}
/** Plain floor reachable in up to n steps: [[x, y, steps], ...]. */
function reach(s, h, n) {
  const busy = new Set(s.units.filter((u) => !u.dead).map((u) => `${u.x},${u.y}`));
  const out = [];
  const seen = new Set([`${h.x},${h.y}`]);
  let front = [[h.x, h.y]];
  for (let d = 1; d <= n; d++) {
    const next = [];
    for (const [x, y] of front)
      for (const [nx, ny] of neighbors(x, y)) {
        const k = `${nx},${ny}`;
        if (seen.has(k) || busy.has(k) || tile(s.map, nx, ny) !== '.') continue;
        seen.add(k);
        next.push([nx, ny]);
        out.push([nx, ny, d]);
      }
    front = next;
  }
  return out;
}

// ---------------------------------------------------------------- reading the page
const readState = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('shoallhell.resume') || 'null')?.state ?? null);
/** the fight as saved (the game saves it 400 ms after each change) */
const settled = async (page) => (await page.waitForTimeout(700), readState(page));
const prompt = (page) =>
  page
    .locator('.handbar .prompt .what')
    .first()
    .innerText({ timeout: 300 })
    .catch(() => '');
const hero = (s) => s.units.find((u) => u.kind === 'hero');
const foes = (s) => s.units.filter((u) => u.kind === 'monster' && !u.dead);
const card = (page, name) => page.locator(`.handrow .card[title^="${name} —"]`).first();
const button = (page, text) => page.locator('.handbar button', { hasText: text }).first();

/** A heavy hit asks whether to lose a card instead, then to confirm: always take the damage. */
async function takeHits(page) {
  const take = page.locator('.modal button.danger', { hasText: /^Take/ });
  for (let i = 0; i < 2 && (await take.count()); i++)
    await take
      .first()
      .click({ timeout: 1000 })
      .catch(() => {});
}

/** Keep the board camera from the canvas transform the board sets every frame. */
function hookCamera() {
  const P = CanvasRenderingContext2D.prototype;
  if (P.__camHook) return;
  P.__camHook = true;
  const set = P.setTransform;
  P.setTransform = function (...a) {
    if (a.length === 6 && (a[0] !== 1 || a[4] !== 0 || a[5] !== 0) && this.canvas.isConnected)
      window.__cam = { z: a[0], e: a[4], f: a[5], c: this.canvas };
    return set.apply(this, a);
  };
}

/** Screen pixel of a hex centre (the board's hexPx and camera). */
const hexScreen = (page, x, y) =>
  page.evaluate(
    ([x, y]) => {
      const { z, e, f, c } = window.__cam;
      const r = c.getBoundingClientRect();
      const dpr = c.width / r.width;
      const wx = 40 + Math.sqrt(3) * (x + 0.5 * (y & 1)) * 37 + (Math.sqrt(3) * 37) / 2;
      const wy = 40 + 1.5 * y * 37 + 37;
      return [r.left + (z * wx + e) / dpr, r.top + (z * wy + f) / dpr];
    },
    [x, y],
  );
async function clickHex(page, x, y) {
  const [sx, sy] = await hexScreen(page, x, y);
  await page.mouse.move(sx, sy, { steps: 5 });
  await page.waitForTimeout(120);
  await page.mouse.click(sx, sy);
}
const free = (page, sx, sy) => page.evaluate(([sx, sy]) => document.elementFromPoint(sx, sy) === window.__cam.c, [sx, sy]);
const onScreen = async (page, x, y) => free(page, ...(await hexScreen(page, x, y)));
/** The hex under a screen pixel (the board's inverse). */
const screenHex = async (page, sx, sy) => {
  const [wx, wy] = await page.evaluate(
    ([sx, sy]) => {
      const { z, e, f, c } = window.__cam;
      const r = c.getBoundingClientRect();
      const dpr = c.width / r.width;
      return [((sx - r.left) * dpr - e) / z, ((sy - r.top) * dpr - f) / z];
    },
    [sx, sy],
  );
  return pixelToHex((wx - 40 - (SQ3 * 37) / 2) / 37, (wy - 40 - 37) / 37);
};
/**
 * Where the mouse rests: a spot on the board (clear of the monster chips, the log, the hover panel and the hand) over empty
 * space, or else over plain floor, so no hover panel opens.
 */
async function restSpot(page, s) {
  const pts = [];
  for (let sy = 340; sy >= 150; sy -= 20) for (let sx = 290; sx <= 880; sx += 20) pts.push([sx, sy]);
  const open = await page.evaluate((pts) => pts.map(([x, y]) => document.elementFromPoint(x, y) === window.__cam.c), pts);
  const busy = new Set([...s.units.filter((u) => !u.dead), ...s.pickups].map((u) => `${u.x},${u.y}`));
  let best = null;
  for (let i = 0; i < pts.length; i++) {
    if (!open[i]) continue;
    const [x, y] = await screenHex(page, ...pts[i]);
    const around = [[x, y], ...neighbors(x, y)];
    const score = around.every(([a, b]) => tile(s.map, a, b) === ' ') ? 0 : tile(s.map, x, y) === '.' && !busy.has(`${x},${y}`) ? 1 : 9;
    if (!best || score < best.score) best = { score, at: pts[i] };
    if (score === 0) break;
  }
  return best?.at ?? [300, 340];
}

/** Waits until the prompt matches (or the time is up), taking any heavy hit on the way. */
async function waitPrompt(page, re, ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    await takeHits(page);
    const p = await prompt(page);
    if (re.test(p)) return p;
    await page.waitForTimeout(60);
  }
  return null;
}

// ---------------------------------------------------------------- setup: get to a good turn
/** The recorded turn: Move 3 to a hex next to a monster (all three steps, so the move ends by itself), then Attack 2. */
function planTurn(s) {
  const h = hero(s);
  let best = null;
  for (const m of foes(s)) {
    for (const [x, y, d] of reach(s, h, 3)) {
      if (dist(x, y, m.x, m.y) !== 1) continue;
      const others = foes(s).filter((o) => o !== m && dist(x, y, o.x, o.y) <= 1).length;
      // a monster that can take a hit can hit back
      const score = (d === 3 && dist(h.x, h.y, x, y) === 3 ? 0 : 3) + others * 5 + (m.hp <= 4 ? 2 : 0);
      if (!best || score < best.score) best = { score, to: [x, y], at: [m.x, m.y] };
    }
  }
  return best;
}

/**
 * Zoom in on the Knight, the hex he will walk to and the monster (pts), and drag the ground so they sit mid-board with
 * room above for the damage sums and the Knight's start clear of the hand.
 */
async function frameAction(page, pts) {
  const where = () => Promise.all(pts.map(([x, y]) => hexScreen(page, x, y)));
  let ps = await where();
  // each wheel notch zooms by 1.12: get to about 0.9 (hexes about 58 px wide)
  const z = await page.evaluate(() => window.__cam.z / (window.__cam.c.width / window.__cam.c.getBoundingClientRect().width));
  const notches = Math.round(Math.log(0.9 / z) / Math.log(1.12));
  for (let i = 0; i < Math.abs(notches); i++) {
    await page.mouse.move(ps[1][0], ps[1][1]);
    await page.mouse.wheel(0, notches > 0 ? -100 : 100);
    await page.waitForTimeout(200);
  }
  ps = await where();
  const xs = ps.map((p) => p[0]);
  const ys = ps.map((p) => p[1]);
  const dx = 580 - (Math.min(...xs) + Math.max(...xs)) / 2;
  let dy = 235 - (Math.min(...ys) + Math.max(...ys)) / 2;
  dy += Math.max(0, 140 - (Math.min(ps[1][1], ps[2][1]) + dy));
  dy -= Math.max(0, Math.max(...ys) + dy - 355);
  const [hx, hy] = ps[0];
  const [cx, cy] = [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  for (const [sx, sy] of [
    [cx + 90, cy + 60],
    [cx - 90, cy + 60],
    [cx + 90, cy - 60],
    [cx - 90, cy - 60],
  ]) {
    if (Math.hypot(sx - hx, sy - hy) < 50 || !(await free(page, sx, sy))) continue;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(sx + dx / 2, sy + dy / 2, { steps: 5 });
    await page.mouse.move(sx + dx, sy + dy, { steps: 5 });
    await page.mouse.up();
    break;
  }
  await page.waitForTimeout(200);
}

async function pick(page, a, b) {
  await card(page, a).click({ timeout: 3000 });
  await page.waitForTimeout(250);
  await card(page, b).click({ timeout: 3000 });
  await page.waitForTimeout(250);
}

/** One round spent walking up to the monsters: the top of `a` (skipping any target) and the bottom of `b`. */
async function walkRound(page, [a, b]) {
  await pick(page, a, b);
  await page.locator('.handbar button.primary', { hasText: 'Ready' }).click({ timeout: 3000 });
  if (!(await waitPrompt(page, /^Your turn/, 25000))) throw new Error('no turn');
  await card(page, b).locator('.half.bot').click({ timeout: 3000 });
  for (let i = 0; i < 30; i++) {
    await takeHits(page);
    const st = await settled(page);
    const p = await prompt(page);
    const h = hero(st);
    if (/^Move up to/.test(p)) {
      // stop four hexes away: a monster that moves 2 cannot reach the Knight yet, and next round he can reach it
      const near = (x, y) => Math.min(...foes(st).map((m) => dist(x, y, m.x, m.y)));
      const n = Number(/Move up to (\d+)/.exec(p)[1]);
      const spots = reach(st, h, n).filter(([x, y]) => near(x, y) >= 2);
      spots.sort((p1, p2) => Math.abs(near(...p1) - 4) - Math.abs(near(...p2) - 4) || near(...p1) - near(...p2));
      const to = spots[0];
      if (to && near(...to) < near(h.x, h.y) && (await onScreen(page, to[0], to[1]))) await clickHex(page, to[0], to[1]);
      await page.waitForTimeout(700);
      if (/^Move up to/.test(await prompt(page))) await button(page, 'Done moving').click({ timeout: 2000 });
      await page.waitForTimeout(500);
    } else if (/^Now play the top/.test(p)) {
      await card(page, a).locator('.half.top').click({ timeout: 3000 });
      await page.waitForTimeout(500);
    } else if (/^Now play the bottom/.test(p)) {
      await card(page, b).locator('.half.bot').click({ timeout: 3000 });
      await page.waitForTimeout(500);
    } else if (/spend/i.test(p)) {
      await button(page, 'Keep it').click({ timeout: 2000 });
    } else if (/click an ally/.test(p)) {
      await clickHex(page, h.x, h.y);
      await page.waitForTimeout(500);
      if ((await prompt(page)) === p) await button(page, 'Skip').click({ timeout: 2000 });
    } else if (/red-ringed|aim the|click an enemy|Teleport up to|Push /.test(p)) {
      await button(page, 'Skip').click({ timeout: 2000 });
      await page.waitForTimeout(400);
    } else if (/^Pick two cards/.test(p)) return;
    else await page.waitForTimeout(400);
  }
  if (!(await waitPrompt(page, /^Pick two cards/, 25000))) throw new Error('the round did not end');
}

/** In a fresh fight: pick the start hex nearest the monsters and walk up to them until the planned turn works. */
async function prepare(page) {
  let s = await settled(page);
  // only monsters that move 2 or less (so the Knight's initiative 15 comes first) and hit for 2 (so even a ×2 is not a
  // big enough hit on 12 HP to stop the clip with the lose-a-card question)
  if (!s || !foes(s).length || foes(s).some((m) => (m.stat?.move ?? 0) > 2 || (m.stat?.atk ?? 0) > 2)) return null;
  const nearest = ([x, y]) => Math.min(...foes(s).map((m) => dist(x, y, m.x, m.y)));
  const start = [...(s.starts ?? [])].sort((p, q) => nearest(p) - nearest(q))[0];
  const h0 = hero(s);
  if (start && (start[0] !== h0.x || start[1] !== h0.y)) await clickHex(page, start[0], start[1]);
  for (const pair of [...WALKS, null]) {
    s = await settled(page);
    if (!s || s.phase !== 'select' || hero(s).hp < 6) return null;
    const plan = planTurn(s);
    if (plan) {
      const h = hero(s);
      await frameAction(page, [[h.x, h.y], plan.to, plan.at]);
      for (const p of [[h.x, h.y], plan.to, plan.at]) if (!(await onScreen(page, ...p))) return null;
      await pick(page, LEAD, SECOND);
      return plan;
    }
    if (pair) await walkRound(page, pair);
  }
  return null;
}

async function intoFight(page) {
  await page.getByRole('button', { name: 'Play', exact: true }).first().click({ timeout: 6000 });
  // the Depth's story and the scenario's: Enter shows all the lines, Enter again goes on
  for (let i = 0; i < 20 && !(await page.locator('.handbar').count()); i++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
  }
  await page.locator('.handbar .card').first().waitFor({ timeout: 10000 });
  await page.waitForTimeout(800);
}

export default {
  seconds: 6,
  still: 0.64,
  async setup(page) {
    await page.evaluate(hookCamera);
    await page.getByRole('button', { name: 'Play offline on this device' }).click();
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }
    await page.getByRole('button', { name: '+ Recruit a tenant' }).click();
    await page.locator('.classtile', { hasText: 'Knight' }).first().click();
    await page.getByRole('button', { name: 'Recruit Knight' }).click();
    await page.waitForTimeout(800);
    // a Hard Hat (+2 HP) from Gary's stall with the starting gold, then back to the campaign
    await page.getByRole('button', { name: /^Gary/ }).click();
    await page.locator('.shopitem', { hasText: 'Hard Hat' }).getByRole('button', { name: /^Buy/ }).click();
    await page.getByRole('button', { name: 'Campaign', exact: true }).click();
    await page.waitForTimeout(500);
    for (let attempt = 0; attempt < 10; attempt++) {
      await intoFight(page);
      const plan = await prepare(page).catch((e) => console.log(`shoallhell: ${e.message.split('\n')[0]}`));
      if (plan) {
        const rest = await restSpot(page, await readState(page));
        await page.mouse.move(...rest);
        await page.waitForTimeout(600);
        return { plan, rest };
      }
      console.log('shoallhell: this map did not work out, starting the scenario again');
      await takeHits(page);
      await page.getByRole('button', { name: '☰ Leave' }).click();
      await page.locator('.modal button.danger', { hasText: 'Leave' }).click();
      await page.waitForTimeout(1200);
    }
    throw new Error('no good turn found');
  },
  async during(page, until, { plan, rest }) {
    await wait(700);
    await page.locator('.handbar button.primary', { hasText: 'Ready' }).click();
    if (!(await waitPrompt(page, /^Your turn/, 3000))) return;
    await wait(400);
    await card(page, LEAD).locator('.half.bot').click();
    await wait(450);
    await clickHex(page, ...plan.to);
    // a shorter walk leaves moves over: end the move
    await wait(150);
    if (/^Move up to/.test(await prompt(page))) await button(page, 'Done moving').click();
    await waitPrompt(page, /^Now play the top/, 2500);
    await wait(350);
    await card(page, SECOND).locator('.half.top').click();
    await wait(450);
    await clickHex(page, ...plan.at);
    await wait(60);
    await page.mouse.move(...rest);
    while (Date.now() < until) {
      await takeHits(page);
      await wait(60);
    }
  },
};
