// For the FlashGames card's grid (montage.py), not a card of its own: Geode Gobbler's Gobble Saloon as FlashGames plays
// it, a ?flash= run on the live site with Wild Wild West and Big Mitts (every card wild, a bigger hand), five cards
// picked and played: the hand scores and the Snack craving fills. Opened on its own, a FlashGames run
// starts a second after the game is ready, with no account and nothing saved.
const flash = Buffer.from(
  JSON.stringify({ v: 1, date: '2026-11-25', seed: 2525, mods: ['wild', 'bigmitts'], limit: 900, run: 'clip' }),
  'utf8',
).toString('base64url');

export default {
  url: `https://josephjackman.com/games/geodegobbler/?flash=${flash}`,
  seconds: 5,
  async setup(page) {
    // the run opens on the cravings: take the Snack
    await page.getByRole('button', { name: 'Draw, partner!' }).click({ timeout: 30000 });
    await page.waitForSelector('#tb-hand .card', { timeout: 30000 });
    await page.waitForTimeout(2500);
  },
  async during(page, until) {
    while (Date.now() < until) {
      await play(page);
      await page.waitForTimeout(1900);
    }
  },
};

async function play(page) {
  const cards = page.locator('#tb-hand .card:not(.sel)');
  for (let i = 0; i < 5; i++) {
    await cards.first().click({ timeout: 1500 }).catch(() => {});
    await page.waitForTimeout(90);
  }
  // off the cards, so no card tip stays up
  await page.mouse.move(900, 120);
  await page.keyboard.press('Enter');
}
