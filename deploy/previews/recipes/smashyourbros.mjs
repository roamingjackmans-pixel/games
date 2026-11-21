// Sir Clank runs at Kit Cadet by the right ledge and smashes him off the stage: the hit, Kit flying off past the
// blast zone, the KO blast, then the game's slow-motion replay of the winning hit and GAME!.
// Live site, no account: the game's own quick match vs a bro (?quick, P2 has no controller so stands still). The page
// exposes the match as window.syb; the recipe moves both fighters near the ledge, sets Kit to 125 %, then plays P1
// on the keyboard (D runs, the Right arrow is the smash stick: hold it to charge a forward smash).
const QUICK = '?quick&p1=clank&p2=kit&cpu2=0&stage=studio&items=0&stocks=1';

export default {
  url: `https://josephjackman.com/games/smashyourbros/${QUICK}`,
  seconds: 5.5,
  still: 0.23,
  async setup(page) {
    await page.waitForFunction(() => window.syb?.driver.st.intro === 0, null, { timeout: 15000 });
    await page.evaluate(() => {
      const [a, b] = window.syb.driver.st.fighters;
      Object.assign(a, { x: 60, y: 0, vx: 0, vy: 0, kx: 0, ky: 0, facing: 1 });
      Object.assign(b, { x: 500, y: 0, vx: 0, vy: 0, kx: 0, ky: 0, facing: -1, dmg: 125 });
    });
    await page.waitForTimeout(1200);
  },
  async during(page) {
    const k = page.keyboard;
    await page.waitForTimeout(100);
    // run until in range (checked every frame, so the run always stops at the same spot), then charge the smash
    await k.down('KeyD');
    await page
      .waitForFunction(
        () => {
          const [a, b] = window.syb.driver.st.fighters;
          return b.x - a.x < 150;
        },
        null,
        { polling: 'raf', timeout: 3000 },
      )
      .catch(() => {});
    await k.up('KeyD');
    await page.waitForTimeout(60);
    await k.down('ArrowRight');
    await page
      .waitForFunction(() => window.syb.driver.st.fighters[0].charge >= 14, null, { polling: 'raf', timeout: 1500 })
      .catch(() => {});
    await k.up('ArrowRight');
  },
};
