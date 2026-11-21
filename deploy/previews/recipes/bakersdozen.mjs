// The first order card flips over the candlelit bakery: the Inspector's lantern in the window, the shared tray and
// the four stations behind it.
// Live site, no account: "play offline" is remembered in the browser and the profile has the tutorial marked as
// seen, so Play goes straight to the play menu; a solo night with three AI rivals starts from the baker select.
export default {
  seconds: 4,
  still: 0.85,
  async setup(page) {
    await page.evaluate(() => {
      localStorage.setItem('bd.offlineMode', '1');
      localStorage.setItem('bd.offline', JSON.stringify({ v: 1, tutorialSeen: true }));
      sessionStorage.clear();
    });
    await page.reload();
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await page.getByRole('button', { name: /Solo night/ }).click();
    await page.getByRole('button', { name: 'Start the night' }).click();
    await page.waitForSelector('.big-order', { timeout: 15000 });
  },
};
