import { devices, expect, test } from '@playwright/test';

// D143: on a phone the on-screen controller appears, its left stick walks Joe and its Menu button pauses.
test.use({ ...devices['Pixel 7 landscape'] });

type DJ = { scenes: { current?: { name: string; session?: { localPlayer: { x: number } } } } };

test('phone: touch controls show, the left stick moves, Menu pauses and B backs out (D143)', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('./?new&class=knight&seed=TOUCHE2E&nocut');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __dj?: DJ }).__dj?.scenes.current?.name ?? ''), { timeout: 10000 }).toBe('run');
  await expect(page.getByTestId('touch-controls')).toBeVisible();
  const x = (): Promise<number> => page.evaluate(() => (window as unknown as { __dj: DJ }).__dj.scenes.current!.session!.localPlayer.x);
  const x0 = await x();
  const cdp = await context.newCDPSession(page);
  const vp = page.viewportSize()!;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 70, y: vp.height - 70, id: 1 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 120, y: vp.height - 70, id: 1 }] });
  await expect.poll(x, { timeout: 4000 }).toBeGreaterThan(x0 + 60);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const tap = async (i: number): Promise<void> => {
    const b = (await page.locator(`[data-pad="${i}"]`).boundingBox())!;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: b.x + b.width / 2, y: b.y + b.height / 2, id: 2 }] });
    await page.waitForTimeout(120);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  await tap(9);
  await expect(page.locator('#overlay .layer .panel')).toHaveCount(1);
  await tap(1);
  await expect(page.locator('#overlay .layer .panel')).toHaveCount(0);
  expect(errors).toEqual([]);
});
