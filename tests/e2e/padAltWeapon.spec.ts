import { expect, test, type Page } from '@playwright/test';

// D166: with a controller, X (□ on PlayStation) on a bag weapon makes it the 2nd weapon; A still equips it in hand.

type Item = { id: string; slot?: string; kind: string };
type Char = { bag: (Item | null)[]; altMain: Item | null; equipment: { main: Item | null } };
type Run = { showInventory(): void; session: { save: { character: Char } } };
type VPad = { setVirtualPadActive(on: boolean): void; setVirtualButton(i: number, down: boolean): void };

async function press(page: Page, i: number): Promise<void> {
  await page.evaluate(async (b) => {
    const path = '/games/dungeonjoe/src/engine/input/virtualPad.ts';
    const vp = (await import(/* @vite-ignore */ path)) as VPad;
    vp.setVirtualPadActive(true);
    vp.setVirtualButton(b, true);
  }, i);
  await page.waitForTimeout(90);
  // keep it down until two frames have read it (a slow frame must not swallow the press)
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
  await page.evaluate(async (b) => {
    const path = '/games/dungeonjoe/src/engine/input/virtualPad.ts';
    const vp = (await import(/* @vite-ignore */ path)) as VPad;
    vp.setVirtualButton(b, false);
  }, i);
  await page.waitForTimeout(260);
}

test('X / □ on a bag weapon makes it the 2nd weapon (D166)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('./?new&class=knight&seed=PADALT&nocut');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __dj?: { scenes: { current?: { name: string } } } }).__dj?.scenes.current?.name ?? ''), { timeout: 10000 }).toBe('run');
  // a weapon in bag slot 1 and an empty 2nd weapon slot
  const id = await page.evaluate(() => {
    const r = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current;
    const c = r.session.save.character;
    const w = c.altMain ?? { ...structuredClone(c.equipment.main!), id: 'padalt-test-weapon' };
    c.altMain = null;
    c.bag.unshift(w);
    r.showInventory();
    return w.id;
  });
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-focus') ?? '')).toBe('bag-0');
  await press(page, 2);
  const after = await page.evaluate(() => {
    const c = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current.session.save.character;
    return { alt: c.altMain?.id ?? null, bag0: c.bag[0]?.id ?? null };
  });
  expect(after.alt).toBe(id);
  expect(after.bag0).not.toBe(id);
  // the focus stays on the bag slot, and the inventory is still open
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-focus') ?? '')).toBe('bag-0');
  await expect(page.getByTestId('equip-altMain')).toHaveAttribute('aria-label', /2nd|Weapon|:/);
  expect(errors).toEqual([]);
});
