import { expect, test, type Page } from '@playwright/test';

// D181: on a pad, a quick tap of D-pad down uses the quick item; holding it switches items and uses nothing.

type Char = { consumables: Record<string, number>; quickSlot: string | null };
type Run = { session: { save: { character: Char } } };
type VPad = { setVirtualPadActive(on: boolean): void; setVirtualButton(i: number, down: boolean): void };

async function hold(page: Page, i: number, ms: number): Promise<void> {
  await page.evaluate(async (b) => {
    const path = '/games/dungeonjoe/src/engine/input/virtualPad.ts';
    const vp = (await import(/* @vite-ignore */ path)) as VPad;
    vp.setVirtualPadActive(true);
    vp.setVirtualButton(b, true);
  }, i);
  await page.waitForTimeout(ms);
  await page.evaluate(async (b) => {
    const path = '/games/dungeonjoe/src/engine/input/virtualPad.ts';
    const vp = (await import(/* @vite-ignore */ path)) as VPad;
    vp.setVirtualButton(b, false);
  }, i);
  await page.waitForTimeout(400);
}
const char = (page: Page): Promise<Char> => page.evaluate(() => JSON.parse(JSON.stringify((window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current.session.save.character)) as Char);

test('D-pad down: a tap uses the quick item, a hold switches without using one (D181)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('./?new&class=knight&seed=QUICK&nocut');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __dj?: { scenes: { current?: { name: string } } } }).__dj?.scenes.current?.name ?? ''), { timeout: 10000 }).toBe('run');
  await page.evaluate(() => {
    const c = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current.session.save.character;
    c.consumables = { throwing_knife: 3, firebomb: 2 };
    c.quickSlot = 'throwing_knife';
  });
  await page.waitForTimeout(300);
  // hold: switch to the next item, nothing used
  await hold(page, 13, 900);
  let c = await char(page);
  expect(c.quickSlot).toBe('firebomb');
  expect(c.consumables).toEqual({ throwing_knife: 3, firebomb: 2 });
  // tap: one used
  await hold(page, 13, 80);
  c = await char(page);
  expect((c.consumables.firebomb ?? 0) + (c.consumables.throwing_knife ?? 0)).toBe(4);
  expect(errors).toEqual([]);
});
