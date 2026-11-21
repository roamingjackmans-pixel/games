// Sending cats: in a Practice battle against the computer, the player drags from their home cottage to one stray cottage,
// then to another, and the two squads march up and down the roads and take both. Gets there with the home screen's
// Practice button and Start Battle, waits out the 3-2-1 countdown, then drags with the mouse like a player would.

/** Screen spots of my home building and the two cheapest nearby strays (runs in the page). */
function spots() {
  const m = window.__WW.match;
  const r = m.canvas.getBoundingClientRect();
  const at = (b) => {
    const s = m.renderer.toScreen(b.x, b.y - b.radius * 0.45);
    return { id: b.id, x: s.x + r.left, y: s.y + r.top };
  };
  const home = m.view.buildings.filter((b) => b.owner === m.me).sort((a, b) => b.count - a.count)[0];
  const strays = m.view.buildings
    .filter((b) => b.owner < 0 && b.type === 'cottage')
    .sort((a, b) => a.count - b.count || Math.hypot(a.x - home.x, a.y - home.y) - Math.hypot(b.x - home.x, b.y - home.y));
  return { home: at(home), targets: strays.slice(0, 2).map(at) };
}

/** Presses on one building and drags to another, slowly enough that the road arrow shows. */
async function drag(page, from, to) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  for (let i = 1; i <= 8; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / 8, from.y + ((to.y - from.y) * i) / 8);
    await page.waitForTimeout(35);
  }
  await page.waitForTimeout(180);
  await page.mouse.up();
}

export default {
  steps: ['t:skip it', 't:Claim', 't:Practice', 't:Start Battle'],
  async setup(page) {
    // the sim starts at GO!, and the countdown card goes away 0.7 s later
    const live = () => window.__WW?.match?.metro && document.querySelector('.countdown')?.classList.contains('hidden');
    await page.waitForFunction(live, null, { timeout: 20000 });
    await page.waitForTimeout(600); // and the GO! card fades out
    return { at: await page.evaluate(spots) };
  },
  async during(page, until, { at }) {
    await page.waitForTimeout(150);
    await drag(page, at.home, at.targets[0]); // half the home cats
    await page.keyboard.press('r'); // then all the rest
    await page.waitForTimeout(200);
    await drag(page, at.home, at.targets[1]);
    await page.mouse.move(at.home.x - 90, at.home.y + 120); // off the buildings, so no hover ring stays on the target
  },
  seconds: 6,
  still: 0.5,
  // the left half of the field, where the cats walk; the HUD is outside it
  crop: [0, 88, 896, 504],
};
