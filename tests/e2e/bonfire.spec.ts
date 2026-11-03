import { expect, test } from '@playwright/test';

// D142: at a bonfire, +1 / −1 only plan points; Confirm spends them; the pressed button keeps the focus; leaving with
// planned points asks to lock them in; the right side shows the numbers before and after.

type Run = {
  name: string;
  showBonfire(p: unknown, id: string, first: boolean): void;
  session: { localPlayer: unknown; save: { character: { stats: { hp: number }; shards: number; level: number } } };
};

test('bonfire level up: plan with +1 / −1, keep focus, confirm, and the lock-in question on leaving (D142)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('./?new&class=knight&seed=BONFIRE1&nocut');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __dj?: { scenes: { current?: { name: string } } } }).__dj?.scenes.current?.name ?? ''), { timeout: 10000 }).toBe('run');
  const hp0 = await page.evaluate(() => {
    const r = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current;
    r.session.save.character.shards = 100000;
    r.showBonfire(r.session.localPlayer, 'z1-start', false);
    return r.session.save.character.stats.hp;
  });
  const stat = (): Promise<number> => page.evaluate(() => (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current.session.save.character.stats.hp);
  await expect(page.getByTestId('bonfire-menu')).toBeVisible();
  const plus = page.getByRole('button', { name: 'HP plus one' });
  await plus.click();
  await plus.click();
  // still focused on the same +1, and nothing spent yet
  await expect(page.getByRole('button', { name: 'HP plus one' })).toBeFocused();
  expect(await stat()).toBe(hp0);
  await expect(page.getByTestId('lvl-row-hp')).toContainText(`${hp0} → ${hp0 + 2}`);
  await expect(page.getByTestId('lvl-compare')).toContainText('Max HP');
  await page.getByRole('button', { name: 'HP minus one' }).click();
  await expect(page.getByTestId('lvl-row-hp')).toContainText(`${hp0} → ${hp0 + 1}`);
  // leaving asks; Keep editing stays; Lock in spends the point and leaves
  await page.getByRole('button', { name: 'Leave', exact: true }).click();
  await expect(page.getByTestId('lvl-leave-dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Keep editing' }).click();
  await expect(page.getByTestId('lvl-leave-dialog')).toHaveCount(0);
  expect(await stat()).toBe(hp0);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('lvl-leave-dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Lock in' }).click();
  await expect(page.getByTestId('bonfire-menu')).toHaveCount(0);
  expect(await stat()).toBe(hp0 + 1);
  // Confirm spends without leaving
  await page.evaluate(() => {
    const r = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current;
    r.showBonfire(r.session.localPlayer, 'z1-start', false);
  });
  await page.getByRole('button', { name: 'HP plus one' }).click();
  await page.getByTestId('lvl-confirm').click();
  expect(await stat()).toBe(hp0 + 2);
  await expect(page.getByTestId('bonfire-menu')).toBeVisible();
  expect(errors).toEqual([]);
});
