import { expect, test } from '@playwright/test';

// D183: the creator's Body row picks Male or Female; Female swaps the hair list, hides facial hair, and is saved.

type DJ = { scenes: { current?: { name: string; session?: { save: { character: { appearance?: { sex?: string; beard: string; hairStyle: string } } } } } } };

test('choosing Female changes the options and the saved character (D183)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('./');
  await expect(page.getByTestId('title')).toBeVisible();
  await page.getByRole('button', { name: 'New character' }).click();
  await page.getByRole('button', { name: 'Brute' }).click();
  await expect(page.getByTestId('ap-sex')).toContainText('Male');
  await expect(page.getByTestId('ap-beard')).toBeVisible();
  await page.getByRole('button', { name: 'Next body type' }).click();
  await expect(page.getByTestId('ap-sex')).toContainText('Female');
  // no facial hair row for her, and a hair style from her list (the Brute's bald head becomes a ponytail)
  await expect(page.getByTestId('ap-beard')).toBeHidden();
  await expect(page.getByTestId('ap-hairStyle')).toContainText('Ponytail');
  await page.getByRole('button', { name: 'Next hair style' }).click();
  await expect(page.getByTestId('ap-hairStyle')).toContainText('Braids');
  await page.getByTestId('create-name').fill('Jo');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __dj: DJ }).__dj.scenes.current?.name ?? ''), { timeout: 10000 }).toBe('run');
  const ap = await page.evaluate(() => (window as unknown as { __dj: DJ }).__dj.scenes.current!.session!.save.character.appearance);
  expect(ap?.sex).toBe('female');
  expect(ap?.beard).toBe('none');
  expect(ap?.hairStyle).toBe('braids');
  expect(errors).toEqual([]);
});
