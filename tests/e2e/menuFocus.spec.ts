import { expect, test, type Page } from '@playwright/test';

// D144: a menu redraw keeps the focus where it was (a gamepad lives on the focus): equipping in the inventory, buying
// in the bonfire shop and picking a spell slot no longer throw it back to the first tab.

type Run = {
  showInventory(): void;
  showBonfire(p: unknown, id: string, first: boolean): void;
  session: { localPlayer: unknown; save: { character: { glowen: number; knownSpells: string[]; stats: { prayer: number } } } };
};
const focusKey = (page: Page): Promise<string> =>
  page.evaluate(() => {
    const a = document.activeElement as HTMLElement | null;
    return a?.getAttribute('data-focus') ?? a?.textContent?.trim().slice(0, 24) ?? '';
  });

test('menus keep the focus across a redraw: inventory equip, bonfire shop, spells (D144)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('./?new&class=knight&seed=FOCUS1&nocut');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __dj?: { scenes: { current?: { name: string } } } }).__dj?.scenes.current?.name ?? ''), { timeout: 10000 }).toBe('run');
  // ---- inventory: take the body armour off, then put it back on from the bag
  await page.evaluate(() => (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current.showInventory());
  await page.getByTestId('equip-body').focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => focusKey(page)).toBe('equip-body');
  await page.locator('[data-focus="bag-0"]').focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => focusKey(page)).toBe('bag-0');
  await page.getByRole('button', { name: /^Close/ }).click();
  // ---- bonfire shop: buying keeps the focus on that Buy button
  await page.evaluate(() => {
    const r = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current;
    r.session.save.character.glowen = 100000;
    r.session.save.character.knownSpells.push('heal');
    r.session.save.character.stats.prayer = 30;
    r.showBonfire(r.session.localPlayer, 'z1-start', false);
  });
  await page.getByRole('button', { name: 'Shop', exact: true }).click();
  const buy = page.getByRole('button', { name: 'Buy', exact: true }).nth(1);
  await buy.focus();
  const before = await page.evaluate(() => [...document.querySelectorAll('button')].indexOf(document.activeElement as HTMLButtonElement));
  await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('button')].indexOf(document.activeElement as HTMLButtonElement))).toBe(before);
  // ---- bonfire spells: picking a slot keeps the focus on the slots, not the tabs
  await page.getByRole('button', { name: 'Spells', exact: true }).click();
  const slot = page.getByRole('button', { name: /^2\. / }).first();
  await slot.focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => focusKey(page)).toMatch(/^2\. /);
  expect(errors).toEqual([]);
});
