import { expect, test, type Page } from '@playwright/test';

// D220: Reinforce shows the step's before → after first, with Reinforce and Back. On a controller, B backs out of
// that dialog to the item it came from; it used to close the whole bonfire (the pad's Escape reached the game too).

type Run = {
  showBonfire(p: unknown, id: string, first: boolean): void;
  session: { localPlayer: unknown; save: { character: { glowen: number; essence?: number[]; equipment: { main: { id: string; plus?: number } } } } };
};
type VPad = { setVirtualPadActive(on: boolean): void; setVirtualButton(i: number, down: boolean): void };

async function press(page: Page, i: number): Promise<void> {
  await page.evaluate(async (b) => {
    const path = '/games/dungeonjoe/src/engine/input/virtualPad.ts';
    const vp = (await import(/* @vite-ignore */ path)) as VPad;
    vp.setVirtualPadActive(true);
    vp.setVirtualButton(b, true);
  }, i);
  await page.waitForTimeout(90);
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
  await page.evaluate(async (b) => {
    const path = '/games/dungeonjoe/src/engine/input/virtualPad.ts';
    const vp = (await import(/* @vite-ignore */ path)) as VPad;
    vp.setVirtualButton(b, false);
  }, i);
  await page.waitForTimeout(260);
}
const focused = (page: Page): Promise<string> => page.evaluate(() => document.activeElement?.getAttribute('data-focus') ?? document.activeElement?.getAttribute('data-testid') ?? '');
const plus = (page: Page): Promise<number> => page.evaluate(() => (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current.session.save.character.equipment.main.plus ?? 0);

test('reinforce shows before → after with Back; the pad’s B returns to the item, not out of the bonfire (D220)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('./?new&class=knight&seed=REINFORCEPAD&nocut');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __dj?: { scenes: { current?: { name: string } } } }).__dj?.scenes.current?.name ?? ''), { timeout: 10000 }).toBe('run');
  const mainId = await page.evaluate(() => {
    const r = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current;
    r.session.save.character.glowen = 100000;
    r.session.save.character.essence = [6, 0, 0, 0, 0];
    r.showBonfire(r.session.localPlayer, 'z1-start', false);
    return r.session.save.character.equipment.main.id;
  });
  await expect(page.getByTestId('bonfire-menu')).toBeVisible();
  await page.locator('[data-tab="reinforce"]').click();
  await page.getByTestId(`reinforce-${mainId}`).focus();
  // A on the item: the preview, nothing spent yet
  await press(page, 0);
  await expect(page.getByTestId('reinforce-dialog')).toBeVisible();
  await expect(page.getByTestId('reinforce-dialog')).toContainText('Damage per hit');
  await expect(page.getByTestId('reinforce-back')).toBeVisible();
  expect(await plus(page)).toBe(0);
  // B: back to that item's button, the bonfire still open, nothing spent
  await press(page, 1);
  await expect(page.getByTestId('reinforce-dialog')).toHaveCount(0);
  await expect(page.getByTestId('bonfire-menu')).toBeVisible();
  await expect.poll(() => focused(page)).toBe(`reinforce-${mainId}`);
  expect(await plus(page)).toBe(0);
  // again, and A on Reinforce (the dialog's first button) takes the step
  await press(page, 0);
  await expect(page.getByTestId('reinforce-dialog')).toBeVisible();
  await expect.poll(() => focused(page)).toBe('reinforce-confirm');
  await press(page, 0);
  await expect(page.getByTestId('reinforce-dialog')).toHaveCount(0);
  await expect(page.getByTestId('bonfire-menu')).toBeVisible();
  expect(await plus(page)).toBe(1);
  // the mouse's Back button does the same as B
  await page.getByTestId(`reinforce-${mainId}`).click();
  await page.getByTestId('reinforce-back').click();
  await expect(page.getByTestId('reinforce-dialog')).toHaveCount(0);
  expect(await plus(page)).toBe(1);
  // and B with no dialog open still leaves the bonfire, as before
  await page.getByTestId(`reinforce-${mainId}`).focus();
  await press(page, 1);
  await expect(page.getByTestId('bonfire-menu')).toHaveCount(0);
  expect(errors).toEqual([]);
});
