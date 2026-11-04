import { expect, test } from '@playwright/test';

// D157: the spell loadout lets you pick slots 2 and 3 (and Prayer slots) and fill them; the pick used to snap back to
// Brain slot 1 on every redraw.
type Run = { showInventory(): void; session: { save: { character: { knownSpells: string[]; stats: { prayer: number; brain: number }; spellLoadout: { prayer: (string | null)[] } } } } };

test('spell loadout: pick Prayer slot 2, put a spell in it, then slot 3 (D157)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('./?new&class=cleric&seed=SPELLS1&nocut');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __dj?: { scenes: { current?: { name: string } } } }).__dj?.scenes.current?.name ?? ''), { timeout: 10000 }).toBe('run');
  await page.evaluate(() => {
    const r = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current;
    const c = r.session.save.character;
    c.stats.prayer = 40;
    c.knownSpells = ['heal', 'bless_weapon', 'regen_aura'];
    c.spellLoadout.prayer = [null, null, null];
    r.showInventory();
  });
  await page.getByRole('button', { name: 'Spells', exact: true }).click();
  const loadout = (): Promise<(string | null)[]> => page.evaluate(() => [...(window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current.session.save.character.spellLoadout.prayer]);
  // Prayer slot 2 (the second "2." button belongs to the Prayer column), then a known spell
  await page.getByRole('button', { name: /^2\. / }).nth(1).click();
  await expect(page.getByRole('button', { name: /^2\. .*◀/ })).toHaveCount(1);
  await page.getByRole('button', { name: /Bless Weapon/ }).click();
  await expect.poll(loadout).toEqual([null, 'bless_weapon', null]);
  await page.getByRole('button', { name: /^3\. / }).nth(1).click();
  await page.getByRole('button', { name: /Regen Aura/ }).click();
  await expect.poll(loadout).toEqual([null, 'bless_weapon', 'regen_aura']);
  expect(errors).toEqual([]);
});
