import { expect, test } from '@playwright/test';

test('boots without console errors and draws the canvas', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  await page.goto('./');
  await expect(page.locator('canvas#game')).toBeVisible();
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

test("' / and a lone Alt never reach the browser (Firefox's Quick Find and menu bar, D235)", async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('canvas#game')).toBeVisible();
  const blocked = await page.evaluate(() =>
    ['Quote', 'Slash', 'AltLeft'].map((code) => {
      const ev = new KeyboardEvent('keydown', { code, key: code === 'Quote' ? "'" : code === 'Slash' ? '/' : 'Alt', altKey: code === 'AltLeft', bubbles: true, cancelable: true });
      document.body.dispatchEvent(ev);
      return ev.defaultPrevented;
    }),
  );
  expect(blocked).toEqual([true, true, true]);
});
