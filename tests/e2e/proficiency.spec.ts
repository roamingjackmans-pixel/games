import { expect, test } from '@playwright/test';

// D178: the inventory's Proficiency tab (help only when asked) and raising a weapon a rarity at a bonfire.

type Item = { id: string; rarity: string; xp?: number };
type Char = { glowen: number; proficiency?: Record<string, number>; equipment: { main: Item | null } };
type Run = { showInventory(): void; showBonfire(p: unknown, id: string, first: boolean): void; closeOverlay(): void; session: { localPlayer: unknown; save: { character: Char } } };

test('Proficiency tab with pop-out help; a full bar raises a weapon a rarity (D178)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('./?new&class=knight&seed=PROF&nocut');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __dj?: { scenes: { current?: { name: string } } } }).__dj?.scenes.current?.name ?? ''), { timeout: 10000 }).toBe('run');
  const id = await page.evaluate(() => {
    const r = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current;
    const c = r.session.save.character;
    c.proficiency = { longsword: 300 };
    c.glowen = 50000;
    c.equipment.main!.xp = 9999;
    r.showInventory();
    return c.equipment.main!.id;
  });
  await page.locator('[data-tab="proficiency"]').click();
  await expect(page.getByTestId('prof-longsword')).toContainText('OUT');
  await expect(page.getByTestId('prof-longsword')).toContainText(/Lv [1-9]/);
  // the explanation pops out only when asked
  await expect(page.getByTestId('prof-help-text')).toHaveCount(0);
  await page.getByTestId('prof-help').click();
  await expect(page.getByTestId('prof-help-text')).toBeVisible();
  await page.getByTestId('prof-help').click();
  await expect(page.getByTestId('prof-help-text')).toHaveCount(0);
  // the bonfire's Weapons tab raises the sword
  const before = await page.evaluate(() => (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current.session.save.character.equipment.main!.rarity);
  await page.evaluate(() => {
    const r = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current;
    r.closeOverlay();
    r.showBonfire(r.session.localPlayer, 'z1-start', false);
  });
  await page.locator('[data-tab="weapons"]').click();
  await page.getByTestId(`raise-${id}`).click();
  const after = await page.evaluate(() => (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current.session.save.character.equipment.main!.rarity);
  expect(after).not.toBe(before);
  expect(errors).toEqual([]);
});
