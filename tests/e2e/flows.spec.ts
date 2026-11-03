import { expect, test, type Page } from '@playwright/test';

// Regression flows (BUILD_BRIEF M15): create a character from the title, start in the tutorial hall, leave it,
// pause, then reload and continue the same character from its save.

type DJ = {
  scenes: { current?: { name: string; session?: { node: { kind: string }; localPlayer: { x: number; y: number }; save: { character: { name: string; classId: string } } } } };
};

async function scene(p: Page): Promise<string> {
  return p.evaluate(() => (window as unknown as { __dj?: DJ }).__dj?.scenes.current?.name ?? '');
}

test('create a character, play the tutorial hall, pause, save and continue after a reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('./');
  await expect(page.getByTestId('title')).toBeVisible();
  await page.getByRole('button', { name: 'New character' }).click();
  await page.getByRole('button', { name: 'Cleric' }).click();
  const name = page.getByTestId('create-name');
  await name.fill('E2E Joe');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect.poll(() => scene(page), { timeout: 10000 }).toBe('run');
  const where = (): Promise<string> => page.evaluate(() => (window as unknown as { __dj: DJ }).__dj.scenes.current!.session!.node.kind);
  expect(await where()).toBe('tutorial');
  // walk out through the hall's east door
  await page.evaluate(() => {
    const p = (window as unknown as { __dj: DJ }).__dj.scenes.current!.session!.localPlayer;
    p.x = 1180;
    p.y = 368;
  });
  await page.keyboard.down('KeyD');
  await expect.poll(where, { timeout: 8000 }).toBe('start');
  await page.keyboard.up('KeyD');
  // pause opens and closes
  await page.keyboard.press('KeyP');
  await expect(page.getByTestId('pause-menu')).toBeVisible();
  // Statistics from the pause menu: this character first, all characters a tab away, Esc back to the pause menu
  await page.getByRole('button', { name: 'Statistics' }).click();
  await expect(page.getByTestId('statistics')).toBeVisible();
  await expect(page.getByText('E2E Joe, Cleric')).toBeVisible();
  await page.getByTestId('stat-tab-all').click();
  await expect(page.getByText('Every character this browser has ever played')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('pause-menu')).toBeVisible();
  await page.getByRole('button', { name: 'Save and quit to title' }).click();
  await expect(page.getByTestId('title')).toBeVisible();
  // and from the title menu, with the saved character to pick
  await page.getByRole('button', { name: 'Statistics' }).click();
  await expect(page.getByTestId('statistics')).toBeVisible();
  await expect(page.getByText('E2E Joe, Cleric')).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByTestId('title')).toBeVisible();
  // reload: the save is still there and continues
  await page.reload();
  await expect(page.getByRole('button', { name: /Continue — E2E Joe/ })).toBeVisible();
  await page.getByRole('button', { name: /Continue — E2E Joe/ }).click();
  await expect.poll(() => scene(page), { timeout: 10000 }).toBe('run');
  const who = await page.evaluate(() => (window as unknown as { __dj: DJ }).__dj.scenes.current!.session!.save.character);
  expect(who.name).toBe('E2E Joe');
  expect(who.classId).toBe('cleric');
  expect(await where()).toBe('start');
  expect(errors).toEqual([]);
});

test('Host a game and Join a game from the main menu, with no characters yet (D74)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('./?net=bc');
  await page.getByRole('button', { name: 'Host a game' }).click();
  await page.getByTestId('create-name').fill('Hosty');
  await page.getByRole('button', { name: 'Create and host' }).click();
  await expect.poll(() => scene(page), { timeout: 10000 }).toBe('lobby');
  await expect(page.getByTestId('room-code')).toHaveText(/^[0-9]{6}$/);
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByTestId('title')).toBeVisible();
  // one character now: Join goes straight to the join screen with it
  await page.getByRole('button', { name: 'Join a game' }).click();
  await expect.poll(() => scene(page), { timeout: 10000 }).toBe('lobby');
  await expect(page.getByTestId('code-input')).toBeVisible();
  await expect(page.getByText('Joining as Hosty')).toBeVisible();
  expect(errors).toEqual([]);
});
