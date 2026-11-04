import { expect, test, type Page } from '@playwright/test';

// D169: menus loop. LB / RB wrap round the tabs (the bonfire and the inventory opened from it are one loop), and
// Up / Down past the last control wrap to the other end. Driven through the virtual pad (D143), like a controller.

type Run = { showBonfire(p: unknown, id: string, first: boolean): void; showPause(): void; closeOverlay(): void; session: { localPlayer: unknown; save: { character: { shards: number } } } };
type VPad = { setVirtualPadActive(on: boolean): void; setVirtualButton(i: number, down: boolean): void };

async function press(page: Page, i: number): Promise<void> {
  for (const down of [true, false]) {
    await page.evaluate(
      async ([b, d]) => {
        const path = '/games/dungeonjoe/src/engine/input/virtualPad.ts';
        const vp = (await import(/* @vite-ignore */ path)) as VPad;
        vp.setVirtualPadActive(true);
        vp.setVirtualButton(b as number, d as boolean);
      },
      [i, down],
    );
    await page.waitForTimeout(down ? 90 : 260);
  }
}
const LB = 4;
const RB = 5;
const UP = 12;
const DOWN = 13;
const activeTab = (page: Page): Promise<string> => page.evaluate(() => document.querySelector('#overlay .layer:last-child .tabs [data-tab].on')?.getAttribute('data-tab') ?? '');
const focusInfo = (page: Page): Promise<{ inTabs: boolean; y: number; text: string }> =>
  page.evaluate(() => {
    const a = document.activeElement as HTMLElement | null;
    return { inTabs: !!a?.closest('.tabs'), y: a ? a.getBoundingClientRect().top : -1, text: a?.textContent?.trim() ?? '' };
  });

test('LB / RB wrap round the bonfire and its inventory; Up / Down wrap round a menu (D169)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('./?new&class=knight&seed=MENULOOP&nocut');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __dj?: { scenes: { current?: { name: string } } } }).__dj?.scenes.current?.name ?? ''), { timeout: 10000 }).toBe('run');
  const openBonfire = (): Promise<void> =>
    page.evaluate(() => {
      const r = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current;
      r.session.save.character.shards = 100000;
      r.showBonfire(r.session.localPlayer, 'z1-start', false);
    });
  await openBonfire();
  await expect(page.getByTestId('bonfire-menu')).toBeVisible();
  expect(await activeTab(page)).toBe('level');

  // Up from the top of the Level up content reaches the tabs; Up again wraps to the bottom; Down wraps back to the open tab
  await expect.poll(() => page.evaluate(() => document.activeElement?.getAttribute('data-focus') ?? '')).toBe('lvl-plus-hp');
  await press(page, UP);
  expect((await focusInfo(page)).inTabs).toBe(true);
  await press(page, UP);
  const bottom = await focusInfo(page);
  expect(bottom.inTabs).toBe(false);
  // the lowest usable control in the menu
  const lowest = await page.evaluate(() => {
    const scope = [...document.querySelectorAll<HTMLElement>('#overlay .layer')].pop()!;
    const items = [...scope.querySelectorAll<HTMLElement>('button:not(:disabled), input, select, [tabindex="0"]')].filter((e) => e.offsetParent !== null);
    return Math.max(...items.map((e) => e.getBoundingClientRect().top));
  });
  expect(bottom.y).toBeGreaterThanOrEqual(lowest - 12);
  await press(page, DOWN);
  const back = await focusInfo(page);
  expect(back.inTabs).toBe(true);
  expect(back.text).toContain('Level up');

  // LB at Level up wraps to the Inventory
  await press(page, LB);
  await expect(page.getByTestId('inventory')).toBeVisible();
  expect(await activeTab(page)).toBe('items');
  // RB through the inventory's tabs, then past its last one: back to the bonfire's Level up
  await press(page, RB);
  expect(await activeTab(page)).toBe('Spells');
  await press(page, RB);
  await expect(page.getByTestId('bonfire-menu')).toBeVisible();
  await expect(page.getByTestId('inventory')).toHaveCount(0);
  expect(await activeTab(page)).toBe('level');
  // LB into the inventory again, then LB past its first tab: back to the bonfire's last tab before Inventory
  await press(page, LB);
  await expect(page.getByTestId('inventory')).toBeVisible();
  await press(page, LB);
  await expect(page.getByTestId('bonfire-menu')).toBeVisible();
  expect(await activeTab(page)).toBe('Spells');
  // RB from there opens the Inventory (its next stop), as before
  await press(page, RB);
  await expect(page.getByTestId('inventory')).toBeVisible();

  // a menu without tabs: Up from its top button wraps to its bottom one
  await page.evaluate(() => {
    const r = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current;
    r.closeOverlay();
    r.showPause();
  });
  await expect(page.getByTestId('pause-menu')).toBeVisible();
  await press(page, DOWN);
  const ys: number[] = [];
  for (let i = 0; i < 12; i++) {
    ys.push((await focusInfo(page)).y);
    await press(page, UP);
  }
  // going up, the focus climbs and then jumps back to the bottom at least once
  expect(ys.some((y, i) => i > 0 && y > ys[i - 1]! + 40)).toBe(true);
  expect(errors).toEqual([]);
});
