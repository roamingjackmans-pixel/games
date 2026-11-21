// The vote, on a player's screen: the question card and four answers (one of them the player's own lie), then the player
// taps one and it lights up purple as "Your pick", "Locked in!". Hosts a private game on the live site, adds two players
// with ctx.open() through the invite link (Maya leads, Theo is recorded), starts it, skips the round card, Maya picks the
// topic, both lock in one of the game's own "Get an idea" lies, and the vote comes up. Maya doesn't vote, so the vote stays
// open while Theo picks. The host screen shows the answers bigger but not who picked what, so the clip is Theo's screen,
// at a 960x540 window (133% zoom) so the phone layout fills the 16:9 frame.
import { wait } from '../tools.mjs';

const PLAYER = { viewport: { width: 960, height: 540 }, deviceScaleFactor: 4 / 3 };

export default {
  async setup(page, ctx) {
    await page.click('#hostBtn');
    await page.waitForFunction(() => /^\d{5}$/.test(document.querySelector('#tvCodeText').textContent), null, { timeout: 45000 });
    const code = await page.textContent('#tvCodeText');
    const players = [];
    for (const name of ['Maya', 'Theo']) {
      const p = await ctx.open(`${ctx.url}?room=${code}`, PLAYER);
      await p.fill('#nameInput', name);
      await p.click('#joinBtn');
      await p.waitForSelector('#phone:not([hidden]) .you-card', { timeout: 60000 });
      players.push(p);
    }
    const [lead, me] = players;
    await lead.click('[data-set="family"] button[data-v="true"]');
    await lead.waitForSelector('[data-set="family"] button.on[data-v="true"]', { timeout: 10000 });
    await lead.click('[data-start]');
    await page.waitForSelector('.stage-round', { timeout: 15000 });
    await page.click('#tvSkip');
    await lead.click('[data-topic]:not([disabled])', { timeout: 15000 });
    for (const [i, p] of players.entries()) {
      await p.click('[data-ideas]', { timeout: 15000 });
      const ideas = p.locator('[data-idea]');
      await ideas.first().waitFor({ timeout: 10000 });
      await ideas.nth(Math.min(i, (await ideas.count()) - 1)).click();
      await p.click('.lie-form button[type=submit]');
      await p.waitForSelector('.locked', { timeout: 10000 });
    }
    await me.waitForSelector('.ph-opts [data-opt]', { timeout: 15000 });
    await me.waitForTimeout(800);
    return { record: me };
  },
  async during(page) {
    await wait(1200);
    await page.locator('[data-opt]:not([disabled])').nth(1).click();
  },
  seconds: 4,
  still: 0.75,
};
