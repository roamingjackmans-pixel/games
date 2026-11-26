// She's A Keeper: Mirror Lake at dusk, a fish on the line. The catch bar fights it out, the fish comes up into the
// angler's hands, the catch card pops, and the next cast goes out for the bubbles.
// Runs the dev server locally: the dev-only ?bot lets a bot do the fishing (the live build leaves it out), and
// window.__sak.run() shows when a fish is nearly landed so recording starts just before the catch. No account: "play
// offline" is remembered in the browser, with the first-run tips marked as seen. A solo run's seed comes from
// Math.random when the run starts, so it is held at 0.42 for that click, a seed whose first hole is Mirror Lake at dusk.
import { serve } from '../tools.mjs';

const PORT = 5193;
const URL = `http://localhost:${PORT}/games/shesakeeper/?bot=0.97`;

export default {
  url: URL,
  seconds: 5,
  still: 0.45,
  async before(ctx) {
    const stop = await serve({
      command: 'npx',
      args: ['vite', '--port', String(PORT), '--strictPort'],
      cwd: 'C:/dev/ShesAKeeper',
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
      localStorage.setItem('sak.offlineMode', '1');
      localStorage.setItem('sak.offline', JSON.stringify({ v: 1, tips: ['aim', 'bubble', 'bite', 'reel', 'mission'] }));
    });
    await page.reload();
    await page.getByRole('button', { name: 'Go fishing', exact: true }).click({ timeout: 30000 });
    await page.evaluate(() => {
      const random = Math.random;
      Math.random = () => 0.42;
      setTimeout(() => (Math.random = random), 1000);
    });
    await page.getByText('Go fishing', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Skip ▶' }).click({ timeout: 15000 });
    await page.getByRole('button', { name: 'Start fishing!' }).click({ timeout: 15000 });
    // record from the moment a hooked fish is close to landed
    await page.waitForFunction(
      () => {
        const f = window.__sak?.run()?.fishing;
        return f?.angler.phase === 'reeling' && f.angler.bar && f.angler.bar.progress > 0.62 && !f.angler.bar.done;
      },
      null,
      { timeout: 120000, polling: 50 },
    );
  },
};
