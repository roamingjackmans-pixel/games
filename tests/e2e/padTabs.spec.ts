import { expect, test, type Page } from '@playwright/test';

// D145: LB / RB step through the bonfire's and the inventory's tabs; left / right inside a tab stay in its content
// and only Up goes back to the tab bar. Driven through the virtual pad (D143), exactly like a real controller.

type Run = {
  showInventory(): void;
  showBonfire(p: unknown, id: string, first: boolean): void;
  session: { localPlayer: unknown; save: { character: { glowen: number; shards: number } } };
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
  await page.evaluate(async (b) => {
    const path = '/games/dungeonjoe/src/engine/input/virtualPad.ts';
    const vp = (await import(/* @vite-ignore */ path)) as VPad;
    vp.setVirtualButton(b, false);
  }, i);
  await page.waitForTimeout(260);
}
const activeTab = (page: Page): Promise<string> => page.evaluate(() => document.querySelector('#overlay .tabs [data-tab].on')?.getAttribute('data-tab') ?? '');
const inTabs = (page: Page): Promise<boolean> => page.evaluate(() => !!(document.activeElement as HTMLElement | null)?.closest('.tabs'));

test('LB / RB switch tabs; left / right stay inside the tab content (D145)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('./?new&class=knight&seed=PADTABS&nocut');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __dj?: { scenes: { current?: { name: string } } } }).__dj?.scenes.current?.name ?? ''), { timeout: 10000 }).toBe('run');
  await page.evaluate(() => {
    const r = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current;
    r.session.save.character.glowen = 100000;
    r.session.save.character.shards = 100000;
    r.showBonfire(r.session.localPlayer, 'z1-start', false);
  });
  await expect(page.getByTestId('bonfire-menu')).toBeVisible();
  expect(await activeTab(page)).toBe('level');
  // D148: it opens inside the Level up content (HP +1, the first usable control), not on the tabs
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-focus') ?? '')).toBe('lvl-plus-hp');
  await press(page, 5);
  expect(await activeTab(page)).toBe('gems');
  expect(await inTabs(page)).toBe(true); // the Gem bench has nothing to press yet with an empty bag
  await press(page, 5);
  expect(await activeTab(page)).toBe('weapons'); // D178: the Weapons tab sits between the Gem bench and the Shop
  await press(page, 5);
  expect(await activeTab(page)).toBe('shop');
  // D148: a bumper switch lands on the new tab's first control
  expect(await inTabs(page)).toBe(false);
  await press(page, 4);
  await press(page, 5);
  expect(await activeTab(page)).toBe('shop');
  // into the shop's buttons, then left / right many times: never back on the tab bar
  await press(page, 13);
  await press(page, 13);
  expect(await inTabs(page)).toBe(false);
  for (const b of [14, 15, 15, 14, 14, 15]) {
    await press(page, b);
    expect(await inTabs(page)).toBe(false);
  }
  // Up climbs back to the tabs
  for (let i = 0; i < 12 && !(await inTabs(page)); i++) await press(page, 12);
  expect(await inTabs(page)).toBe(true);
  // inventory: LB / RB between Items and Spells
  await page.getByRole('button', { name: 'Leave', exact: true }).click();
  await page.evaluate(() => (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current.showInventory());
  expect(await activeTab(page)).toBe('items');
  // D148: the inventory opens on the first bag slot
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-focus') ?? '')).toBe('bag-0');
  await press(page, 5);
  expect(await activeTab(page)).toBe('Spells');
  await press(page, 4);
  expect(await activeTab(page)).toBe('items');
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-focus') ?? '')).toBe('bag-0');
  expect(errors).toEqual([]);
});

test('closing a menu with B does not dodge; the next press of B does (D147)', async ({ page }) => {
  await page.goto('./?new&class=knight&seed=PADB&nocut');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __dj?: { scenes: { current?: { name: string } } } }).__dj?.scenes.current?.name ?? ''), { timeout: 10000 }).toBe('run');
  const setBtn = (i: number, down: boolean): Promise<void> =>
    page.evaluate(
      async ([b, d]) => {
        const path = '/games/dungeonjoe/src/engine/input/virtualPad.ts';
        const vp = (await import(/* @vite-ignore */ path)) as VPad;
        vp.setVirtualPadActive(true);
        vp.setVirtualButton(b as number, d as boolean);
      },
      [i, down],
    );
  const dodges = (): Promise<number> =>
    page.evaluate(() => {
      const w = window as unknown as { __dodges?: number; __dj: { scenes: { current: { session: { localPlayer: { pl: { state: string } } } } } } };
      return w.__dodges ?? 0;
    });
  // count every frame Joe is in his dodge
  await page.evaluate(() => {
    const w = window as unknown as { __dodges?: number; __dj: { scenes: { current: { session: { localPlayer: { pl: { state: string } } } } } } };
    w.__dodges = 0;
    const tick = (): void => {
      if (w.__dj.scenes.current.session.localPlayer.pl.state === 'dodge') w.__dodges! += 1;
      requestAnimationFrame(tick);
    };
    tick();
  });
  // Menu opens the pause menu
  await setBtn(9, true);
  await page.waitForTimeout(100);
  await setBtn(9, false);
  await expect(page.locator('#overlay .layer .panel')).toHaveCount(1);
  // B closes it and stays held: no dodge
  await setBtn(1, true);
  await expect(page.locator('#overlay .layer .panel')).toHaveCount(0);
  await page.waitForTimeout(600);
  expect(await dodges()).toBe(0);
  await setBtn(1, false);
  await page.waitForTimeout(150);
  // a fresh press dodges
  await setBtn(1, true);
  await page.waitForTimeout(120);
  await setBtn(1, false);
  await expect.poll(dodges, { timeout: 2000 }).toBeGreaterThan(0);
});

test('a controller changes a settings slider with left / right (D153)', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('title')).toBeVisible();
  await page.getByRole('button', { name: 'Settings' }).click();
  await press(page, 13); // any pad press: the menus are now driven by the pad
  const slider = page.locator('input[type=range]').first();
  await slider.focus();
  const before = Number(await slider.inputValue());
  await press(page, 14);
  await expect.poll(async () => Number(await slider.inputValue())).toBeLessThan(before);
  await press(page, 15);
  await expect.poll(async () => Number(await slider.inputValue())).toBeCloseTo(before, 5);
});
