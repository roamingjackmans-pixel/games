import { expect, test } from '@playwright/test';

// D240: selling a bag item with gems in it asks first: Back keeps everything, "Keep the gems" sells the item alone,
// "Sell with the gems" sells both. An item without gems sells at once.

type Gem = { perks: { family: string; tier: number; level: number; q: number }[] };
type It = { id: string; sockets: (Gem | null)[] };
type Run = {
  showBonfire(p: unknown, id: string, first: boolean): void;
  session: { localPlayer: unknown; save: { character: { bag: It[]; gems: Gem[]; glowen: number; equipment: { main: It; body: It } } } };
};

test('selling an item with gems asks first (D240)', async ({ page }) => {
  await page.goto('./?new&class=knight&seed=SELLGEM1&nocut');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __dj?: { scenes: { current?: { name: string } } } }).__dj?.scenes.current?.name ?? ''), { timeout: 10000 }).toBe('run');
  const ids = await page.evaluate(() => {
    const r = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current;
    const c = r.session.save.character;
    const gem = { perks: [{ family: 'brutal', tier: 2, level: 10, q: 0 }] };
    const a = structuredClone(c.equipment.main);
    a.id = 'with-gem';
    a.sockets = [gem, null];
    const b = structuredClone(c.equipment.body);
    b.id = 'no-gem';
    b.sockets = [];
    const d = structuredClone(c.equipment.main);
    d.id = 'with-gem-2';
    d.sockets = [structuredClone(gem)];
    c.bag.push(a, b, d);
    c.gems = [];
    r.showBonfire(r.session.localPlayer, 'z1-start', false);
    return [a.id, b.id, d.id];
  });
  const state = (): Promise<{ bag: string[]; gems: number }> =>
    page.evaluate(() => {
      const c = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current.session.save.character;
      return { bag: c.bag.map((i) => i.id), gems: c.gems.length };
    });
  await page.locator('[data-tab="shop"]').click();
  // no gems: sells at once
  await page.getByTestId(`sell-${ids[1]}`).click();
  await expect.poll(async () => (await state()).bag.includes(ids[1]!)).toBe(false);
  await expect(page.getByTestId('sell-ask-dialog')).toHaveCount(0);
  // gems: asks; Back (focused first) keeps it
  await page.getByTestId(`sell-${ids[0]}`).click();
  await expect(page.getByTestId('sell-ask-dialog')).toBeVisible();
  await expect(page.getByTestId('sell-ask-back')).toBeFocused();
  await page.getByTestId('sell-ask-back').click();
  await expect(page.getByTestId('sell-ask-dialog')).toHaveCount(0);
  expect((await state()).bag).toContain(ids[0]);
  // Escape closes only the question
  await page.getByTestId(`sell-${ids[0]}`).click();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('sell-ask-dialog')).toHaveCount(0);
  await expect(page.getByTestId('bonfire-menu')).toBeVisible();
  // keep the gems: the item goes, its gem joins the loose gems
  await page.getByTestId(`sell-${ids[0]}`).click();
  await page.getByTestId('sell-ask-keep').click();
  let s = await state();
  expect(s.bag).not.toContain(ids[0]);
  expect(s.gems).toBe(1);
  // sell with the gems: both go
  await page.getByTestId(`sell-${ids[2]}`).click();
  await page.getByTestId('sell-ask-all').click();
  s = await state();
  expect(s.bag).not.toContain(ids[2]);
  expect(s.gems).toBe(1);
});
