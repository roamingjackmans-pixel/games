import { expect, test } from '@playwright/test';

// D168: a gem comes out of any item, worn or in the bag, from the inventory at any time; the Gem bench marks worn gear.

type Item = { id: string; name: string; rarity: string; sockets: (object | null)[] };
type Char = { bag: Item[]; altMain: Item | null; gems: object[]; equipment: { main: Item | null } };
type Run = { showInventory(): void; showBonfire(p: unknown, id: string, first: boolean): void; closeOverlay(): void; session: { localPlayer: unknown; save: { character: Char } } };

test('remove a gem from an unequipped weapon in the inventory; the Gem bench shows what is equipped (D168)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('./?new&class=knight&seed=GEMRM&nocut');
  await expect.poll(() => page.evaluate(() => (window as unknown as { __dj?: { scenes: { current?: { name: string } } } }).__dj?.scenes.current?.name ?? ''), { timeout: 10000 }).toBe('run');
  await page.evaluate(async () => {
    const r = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current;
    const c = r.session.save.character;
    const genPath = '/games/dungeonjoe/src/game/items/generate.ts';
    const rngPath = '/games/dungeonjoe/src/engine/rng.ts';
    const gen = (await import(/* @vite-ignore */ genPath)) as { randomGem(rng: unknown, t: number, cy: number, k: string): object };
    const { Rng } = (await import(/* @vite-ignore */ rngPath)) as { Rng: new (s: string) => unknown };
    const rng = new Rng('gems');
    const mk = (id: string): Item => ({ ...structuredClone(c.equipment.main!), id, name: 'Longsword', rarity: 'rare', sockets: [gen.randomGem(rng, 1, 0, 'weapon'), null] });
    c.equipment.main = mk('worn-w');
    c.bag.unshift(mk('bag-w'));
    r.showInventory();
  });
  // the unequipped weapon's gem comes out from the inventory
  await page.getByTestId('inv-unsocket-bag-w-0').click();
  const after = await page.evaluate(() => {
    const c = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current.session.save.character;
    return { bagGem: !!c.bag.find((i) => i.id === 'bag-w')?.sockets[0], wornGem: !!c.equipment.main?.sockets[0], loose: c.gems.length };
  });
  expect(after).toEqual({ bagGem: false, wornGem: true, loose: 1 });
  await expect(page.getByTestId('inv-unsocket-bag-w-0')).toHaveCount(0);
  // the Gem bench: the worn weapon is tagged Equipped · Weapon, the bag one is not
  await page.evaluate(() => {
    const r = (window as unknown as { __dj: { scenes: { current: Run } } }).__dj.scenes.current;
    r.closeOverlay();
    r.showBonfire(r.session.localPlayer, 'z1-start', false);
  });
  await page.locator('[data-tab="gems"]').click();
  await expect(page.getByTestId('gem-card-worn-w')).toContainText('Equipped · Weapon');
  await expect(page.getByTestId('gem-card-bag-w')).not.toContainText('Equipped');
  expect(errors).toEqual([]);
});
