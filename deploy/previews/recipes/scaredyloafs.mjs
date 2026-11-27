// Scaredy Loafs: Sunny Path in the middle of a run. Tall, wobbly stacks of critters stand beside the trail (a bunny on
// top throwing long ear-shadows, a raccoon lobbing pies, a puppy barking rings), boars and bears come round the bend,
// get scared off, and bolt back into the ones behind them: a stampede.
// Runs the built game locally (vite preview of C:\dev\ScaredyLoafs\dist on port 5196) with ?debug, which exposes the
// game's own handle (window.__sl): a fresh run on Sunny Path at wave 38 with a little extra power and a busy wave, the
// stacks set out by hand. The portrait field is shown 6× (a whole number, so pixels stay crisp) across the frame,
// on the bend where the stacks meet the path; the game's bars are hidden, its stampede toasts are not.
import { serve } from '../tools.mjs';

const SRC = 'C:/dev/ScaredyLoafs';
const PORT = 5196;
const URL = `http://localhost:${PORT}/games/scaredyloafs/?debug`;
const TOP = 2.1; // the first tile row in the frame: the bend in the trail and the stacks around it

export default {
  url: URL,
  seconds: 5,
  still: 0.6,
  async before(ctx) {
    const stop = await serve({ command: 'npx', args: ['vite', 'preview', '--port', String(PORT), '--strictPort'], cwd: SRC, url: URL });
    ctx.onDone(stop);
  },
  async setup(page) {
    await page.evaluate(() => localStorage.clear());
    await page.reload({ waitUntil: 'load' });
    await page.waitForFunction(() => !!window.__sl, null, { timeout: 20000 });
    await page.evaluate((top) => {
      const sl = window.__sl;
      sl.app.profile.settings.reducedMotion = false;
      sl.app.profile.settings.particles = 1;
      // keep the frame clear: no Field Journal notes, just the stampede calls
      const toast = sl.app.layers.toast.bind(sl.app.layers);
      sl.app.layers.toast = (text, ...rest) => (String(text).startsWith('Field Journal') ? undefined : toast(text, ...rest));
      const r = sl.startAt('l1', 38, 0, 5);
      r.s.setup.flash = ['crowd'];
      const stacks = {
        3: [['lamb', 2], ['quokka', 3]],
        4: [['puppy', 3], ['bunny', 3]],
        5: [['hedgehog', 3], ['raccoon', 3]],
        6: [['redpanda', 3]],
        7: [['puppy', 3], ['raccoon', 2], ['bunny', 3]],
        8: [['hedgehog', 2], ['quokka', 3], ['raccoon', 3]],
        9: [['otter', 2], ['otter', 3]],
        10: [['capybara', 2], ['lamb', 2], ['quokka', 3]],
        11: [['puppy', 2], ['cat', 3], ['puppy', 4]],
        12: [['babypanda', 3], ['hedgehog', 3], ['cat', 3]],
        13: [['fennec', 3], ['bunny', 2]],
      };
      for (const [spot, list] of Object.entries(stacks)) {
        r.s.stacks[Number(spot)] = { spot: Number(spot), members: list.map(([sp, lv]) => ({ uid: r.s.uid++, sp, lv })), target: 'first', cd: 0.3, gulp: 0 };
      }
      r.markDirty();
      const scr = sl.app.screen;
      scr.speed = 1;
      scr.paused = false;
      // the field at 6× across the frame
      scr.r.resize({ x: 64, y: -top * 16 * 6, w: 1152, h: 1536 }, 1);
      r.go();
    }, TOP);
    await page.addStyleTag({ content: '.topbar,.bottombar,.goals,.chip,button[aria-label="Debug"]{display:none!important} #scene{background:#5e8f50!important}' });
    // start recording as the first predators reach the stacks
    await page.waitForFunction(
      () => {
        const r = window.__sl.run();
        return r && r.s.preds.some((p) => p.state === 0 && p.x > 7 && p.y > 3.2);
      },
      null,
      { timeout: 90000, polling: 50 },
    );
    await page.waitForTimeout(300);
  },
};
