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
