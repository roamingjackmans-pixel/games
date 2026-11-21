// A live PvP duel: one player plays a poker hand and it scores on the board while the rival plays theirs.
// Two players on the live site: the recorded page names itself and makes a private duel room; a second player
// (ctx.open) opens that room's own ?room= link, readies up, and both summon a starter monster. In round 1 the host
// discards (off camera) to dig for a better hand, then on camera picks five cards one by one and plays them: they fly
// up, each scoring card pops its Chips, the monster chips in, Chips x Mult totals up and YOUR ATK climbs. The rival
// plays a hand too, so the Rival ATK at the top jumps. If time is left, the host starts lining up the next hand.
import { wait } from '../tools.mjs';

/** Runs in the page: hand positions (left to right) of the five cards to play, and which to toss to dig for better. */
async function plan() {
  const url = performance
    .getEntriesByType('resource')
    .map((e) => e.name)
    .find((n) => n.includes('/js/cards.js'));
  const { bestFive, evalHand, handRank } = await import(url || new URL('js/cards.js', location.href).href);
  const hand = window.bcApp.duel.run.hand;
  const five = bestFive(hand).slice();
  // fill up to five cards with the highest others (more cards never makes a poker hand worse)
  for (const c of hand.slice().sort((a, b) => b.rank - a.rank)) if (five.length < 5 && !five.includes(c)) five.push(c);
  const ev = evalHand(five);
  // keep the scoring cards, or four of a suit as a flush draw; toss up to five of the rest, lowest first
  const bySuit = {};
  for (const c of hand) (bySuit[c.suit] = bySuit[c.suit] || []).push(c);
  const draw = Object.values(bySuit).find((s) => s.length === 4);
  const keep = draw && handRank(ev.type) < 3 ? draw : ev.scoring;
  const toss = hand
    .filter((c) => !keep.includes(c))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 5);
  const pos = (cs) => cs.map((c) => hand.indexOf(c)).sort((a, b) => a - b);
  return { play: pos(five), toss: pos(toss), rank: handRank(ev.type), type: ev.type };
}

async function pickCards(page, positions, gap) {
  for (const i of positions) {
    await page.keyboard.press(String(i + 1));
    await page.waitForTimeout(gap);
  }
}

async function nameAndHome(page, name) {
  await page.locator('input.field').fill(name);
  await page.getByRole('button', { name: "LET'S DUEL!" }).click();
  // the first visit pops up the how-to-play box after a moment
  await page
    .locator('.x-close')
    .click({ timeout: 4000 })
    .catch(() => {});
}

export default {
  seconds: 5.5,
  still: 0.6,
  async setup(page, ctx) {
    await nameAndHome(page, 'Ace');
    await page.getByRole('button', { name: '🏟️ Make a duel room' }).click();
    const code = (await page.locator('.lb-code b').textContent()).trim();

    const guest = await ctx.open(`${ctx.url}?room=${code}`);
    await nameAndHome(guest, 'Lucky');
    const ready = guest.getByRole('button', { name: "✋ I'M READY" });
    await ready.waitFor({ timeout: 30000 });
    await ready.click();
    // the start button wiggles, so it never counts as stable
    await page.getByRole('button', { name: '⚔️ START THE DUEL!' }).click({ force: true, timeout: 20000 });

    for (const p of [page, guest]) await p.getByRole('button', { name: 'Summon!' }).first().click({ timeout: 25000 });
    await page.waitForFunction(() => window.bcApp.duel?.phase === 'battle', null, { timeout: 20000 });
    await wait(1600);

    // off camera: discard to dig for a straight or better (or at least trips), then sort so the hand reads well
    for (let i = 0; i < 3; i++) {
      const p = await page.evaluate(plan);
      if (p.rank >= 5 || !p.toss.length) break;
      await pickCards(page, p.toss, 60);
      await page.keyboard.press('d');
      await wait(1100);
    }
    const p = await page.evaluate(plan);
    await page.getByRole('button', { name: p.type === 'flush' || p.type === 'straightflush' ? 'Suit' : 'Rank', exact: true }).click();
    await page.mouse.move(640, 300);
    await wait(1200);
    return { guest };
  },
  async during(page, until, { guest }) {
    // the rival plays first, so their score lands at the top while ours is counting
    const rival = (async () => {
      await wait(700);
      const g = await guest.evaluate(plan);
      await pickCards(guest, g.play, 80);
      await guest.keyboard.press('Enter');
    })();
    await wait(150);
    const p = await page.evaluate(plan);
    await pickCards(page, p.play, 190);
    await wait(250);
    await page.locator('#playbtn').click();
    await rival;
    // once the hand has scored and the new cards are in, start lining up the next hand
    await page.waitForFunction(() => !window.bcApp.duel.busy, null, { timeout: Math.max(1, until - Date.now()) }).catch(() => {});
    await wait(500);
    if (until - Date.now() < 800) return;
    const next = await page.evaluate(plan);
    for (const i of next.play) {
      if (Date.now() > until - 150) break;
      await page.keyboard.press(String(i + 1));
      await page.waitForTimeout(240);
    }
  },
};
