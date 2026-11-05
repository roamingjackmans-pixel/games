import { expect, test } from '@playwright/test';

// D238: Respec with a Tear of Undoing asks first; Back and Escape keep the Tear, Respec spends it.

type Run = {
  name: string;
  showBonfire(p: unknown, id: string, first: boolean): void;
  session: { localPlayer: unknown; save: { character: { tears: number; stats: { hp: number } } } };
};

test('respec asks before spending a Tear of Undoing (D238)', async ({ page }) => {
  await page.goto('./?new&class=knight&seed=RESPEC1&nocut');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __dj?: { scenes: { current?: { name: string } } } }).__dj?.scenes.current?.name ?? ''), { timeout: 10000 }).toBe('run');
  await page.evaluate(() => {
    const r = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current;
    r.session.save.character.tears = 2;
    r.showBonfire(r.session.localPlayer, 'z1-start', false);
  });
  const tears = (): Promise<number> => page.evaluate(() => (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current.session.save.character.tears);
  await expect(page.getByTestId('bonfire-menu')).toBeVisible();
  await page.getByTestId('respec').click();
  await expect(page.getByTestId('respec-dialog')).toBeVisible();
  // Back is first and has the focus: a stray confirm does not spend the Tear
  await expect(page.getByTestId('respec-back')).toBeFocused();
  await page.getByTestId('respec-back').click();
  await expect(page.getByTestId('respec-dialog')).toHaveCount(0);
  expect(await tears()).toBe(2);
  // Escape closes the question, not the bonfire
  await page.getByTestId('respec').click();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('respec-dialog')).toHaveCount(0);
  await expect(page.getByTestId('bonfire-menu')).toBeVisible();
  expect(await tears()).toBe(2);
  // Respec spends one
  await page.getByTestId('respec').click();
  await page.getByTestId('respec-confirm').click();
  await expect(page.getByTestId('respec-dialog')).toHaveCount(0);
  expect(await tears()).toBe(1);
});
