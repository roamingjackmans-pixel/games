// Baker's Dozen: the night's first order, Decorate, piped cake after cake along the icing line while the three AI
// rivals' progress fills in beside it.
// Runs the dev server locally: the bot reads the mini game through the dev-only window.__mini, which the live build
// leaves out. No account: "play offline" is remembered in the browser and the profile has the tutorial marked as seen,
// so Play goes straight to the play menu. A solo night's seed comes from Math.random when the night starts, so it is
// held at 0.6 for that click, a seed whose first order is Decorate. The bot traces the line by calling the mini game's
// own down / move / up, the way tests/mini.test.ts does in the game's repo.
import { serve } from '../tools.mjs';

const PORT = 5192;
const URL = `http://localhost:${PORT}/games/bakersdozen/`;

/** In the page: pipe along each cake's line, a few points a frame, until `until` (Date.now()). */
function pipe(until) {
  let i = -1;
  const frame = () => {
    if (Date.now() >= until) return;
    const M = window.__mini;
    const g = M?.cur();
    const p = M?.started() ? g?.peek?.() : null;
    if (p?.pts) {
      if (p.slide > 0.05) i = -1;
      else if (i < 0) {
        i = 0;
        g.down(p.cx + p.pts[0][0], p.cy + p.pts[0][1]);
      } else {
        i = Math.min(p.pts.length - 1, i + 3);
        g.move(p.cx + p.pts[i][0], p.cy + p.pts[i][1], true);
        if (i >= p.pts.length - 1) g.up(0, 0);
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

export default {
  url: URL,
  seconds: 5,
  still: 0.55,
  async before(ctx) {
    const stop = await serve({
      command: 'npx',
      args: ['vite', '--port', String(PORT), '--strictPort'],
      cwd: 'C:/dev/BakersDozen',
      url: URL,
    });
    ctx.onDone(stop);
    // the first load compiles every module; do it once here, with time to spare
    const warm = await ctx.browser.newPage();
    await warm.goto(URL, { waitUntil: 'load', timeout: 180000 });
    await warm.close();
  },
  async setup(page) {
    await page.evaluate(() => {
      localStorage.setItem('bd.offlineMode', '1');
      localStorage.setItem('bd.offline', JSON.stringify({ v: 1, tutorialSeen: true }));
      sessionStorage.clear();
    });
    await page.reload();
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.getByRole('button', { name: /Solo night/ }).click();
    await page.evaluate(() => {
      const random = Math.random;
      Math.random = () => 0.6;
      setTimeout(() => (Math.random = random), 1000);
    });
    await page.getByRole('button', { name: 'Start the night' }).click();
    // the order card, then the countdown; start piping a moment before recording so the clip opens mid-cake
    await page.waitForFunction(() => window.__mini?.started() && window.__mini.cur().peek?.().pts, null, { timeout: 60000 });
    await page.evaluate(pipe, Date.now() + 30000);
    await page.waitForTimeout(1500);
  },
};
