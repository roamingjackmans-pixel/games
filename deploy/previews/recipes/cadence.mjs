// Cadence: the ambush on the Spans. A Grid Sentinel drops from its ledge behind you while a Mirror Duelist attacks
// from the front, each with its cadence pips sliding in overhead, and every strike is answered: ducks under red
// slashes, jumps over yellow sweeps, steps out of purple slams, deflects.
// Runs a static server from C:\dev\Cadence (plain ES modules, no build step), starts a new game through
// window.__cadence, puts the player at the Junction beacon's side of the Spans and turns on the game's own autoplay,
// which answers each strike through the same press() path the keys use, strikes in the openings and finishes with a
// lethal strike. A real key walks the player onto the bridge to spring the ambush.
import { serve, wait } from '../tools.mjs';

const PORT = 5193;
const URL = `http://127.0.0.1:${PORT}/`;

export default {
  url: URL,
  seconds: 5,
  still: 0.45,
  async before(ctx) {
    const stop = await serve({
      command: 'py',
      args: ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'],
      cwd: 'C:/dev/Cadence',
      url: URL,
    });
    ctx.onDone(stop);
  },
  async setup(page) {
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForFunction(() => window.__cadence);
    await page.evaluate(() => {
      const g = window.__cadence;
      g.newGame();
      g.world.spawn('b2');
      const w = g.world;
      w.areaName = null;
      w.autoplay = true;
      w.p.x = 160 * 32;
      w.p.y = 34 * 32;
    });
    await page.keyboard.down('KeyD');
    await wait(450);
    await page.keyboard.up('KeyD');
    await page.waitForFunction(() => window.__cadence.world.attackers().length === 2, null, { timeout: 15000 });
    await wait(700);
  },
};
