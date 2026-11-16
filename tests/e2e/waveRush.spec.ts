import { expect, test, type Page } from '@playwright/test';

// Wave Rush (GAME_DESIGN §24): start it from the title menu, clear room 1, take the stairs into room 2 (zone 2); and the
// same from a co-op host's lobby pick, with the guest following.

type Ent = { x: number; y: number; hp: { dead: boolean }; en: { state: string; def: { special?: boolean } }; it?: { kind: string } };
type Sess = {
  roomPhase: string;
  rush: { cycle: number; stage: number } | null;
  layout: { zone: number };
  localPlayer: { x: number; y: number };
  w: { god: boolean; enemies: Ent[]; entities: Map<number, Ent> };
};
type DJ = { scenes: { current?: { name: string; session?: Sess; persist?: () => void; save?: { character: { tutorialDone: boolean } } } } };

async function sceneName(p: Page): Promise<string> {
  return p.evaluate(() => (window as unknown as { __dj?: DJ }).__dj?.scenes.current?.name ?? '');
}

/** Clear the host's Wave Rush room (enemies are knocked down as they arrive), then stand on its stairs. */
async function clearAndStandOnStairs(p: Page): Promise<void> {
  await p.evaluate(async () => {
    const s = (window as unknown as { __dj: DJ }).__dj.scenes.current!.session!;
    s.w.god = true;
    const path = '/games/dungeonjoe/src/game/combat/damage.ts';
    const dmg = (await import(/* @vite-ignore */ path)) as { rawDamage: (w: unknown, e: unknown, n: number, t: string, src: number) => void };
    for (let i = 0; i < 240 && s.roomPhase !== 'cleared'; i++) {
      for (const e of [...s.w.enemies]) if (!e.hp.dead && !e.en.def.special && e.en.state !== 'spawning') dmg.rawDamage(s.w, e, 1e9, 'physical', 0);
      await new Promise((r) => setTimeout(r, 200));
    }
  });
  await expect.poll(() => p.evaluate(() => (window as unknown as { __dj: DJ }).__dj.scenes.current!.session!.roomPhase), { timeout: 5000 }).toBe('cleared');
  await p.evaluate(() => {
    const s = (window as unknown as { __dj: DJ }).__dj.scenes.current!.session!;
    const st = [...s.w.entities.values()].find((e) => e.it?.kind === 'stairs')!;
    s.localPlayer.x = st.x;
    s.localPlayer.y = st.y + 20;
  });
}

test('Wave Rush from the title menu: room 1 is zone 1, clear it, the stairs lead to room 2', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  // a saved character to take in
  await page.goto('./?new&seed=E2ERUSH');
  await expect.poll(() => sceneName(page), { timeout: 10000 }).toBe('run');
  await page.evaluate(() => {
    const sc = (window as unknown as { __dj: DJ }).__dj.scenes.current!;
    sc.save!.character.tutorialDone = true;
    sc.persist!();
  });
  await page.goto('./');
  await expect(page.getByTestId('title')).toBeVisible();
  await page.getByTestId('wave-rush-btn').click();
  // one character: straight to its starting cycle (D417)
  await expect(page.getByRole('heading', { name: 'Wave Rush — Joe' })).toBeVisible();
  await expect(page.getByTestId('rush-cycle')).toHaveText('Cycle 1');
  await page.getByTestId('rush-start').click();
  await expect.poll(() => sceneName(page), { timeout: 10000 }).toBe('run');
  const where = (): Promise<string> =>
    page.evaluate(() => {
      const s = (window as unknown as { __dj: DJ }).__dj.scenes.current!.session!;
      return `${s.rush?.cycle}:${s.rush?.stage}:${s.layout.zone}`;
    });
  expect(await where()).toBe('0:1:1');
  await clearAndStandOnStairs(page);
  // the stairs: press Interact on them
  await page.keyboard.press('KeyF');
  await expect.poll(where, { timeout: 5000 }).toBe('0:2:2');
  // the pause menu says where the run stands; the Statistics page has the Wave Rush section
  await page.keyboard.press('KeyP');
  await expect(page.getByTestId('pause-menu')).toContainText('Wave Rush · Cycle 1 · Room 2 of 8');
  await page.getByRole('button', { name: 'Statistics' }).click();
  await expect(page.getByTestId('stat-rush')).toContainText('Cycle 1, room 2 of 8');
  expect(errors).toEqual([]);
});

test('Wave Rush asks for the character first, then offers only the cycles that character has opened (D416, D417)', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByTestId('title')).toBeVisible();
  // a veteran who has cleared Cycle 4 and a brand-new character, plus an old browser-wide unlock that must not count
  await page.evaluate(async () => {
    const base = '/games/dungeonjoe/src/';
    type Fn = (...a: unknown[]) => unknown;
    const imp = (m: string): Promise<Record<string, Fn>> => import(/* @vite-ignore */ base + m);
    const writeSave = (await imp('game/save/storage.ts')).writeSave!;
    const getStore = (await imp('engine/settings.ts')).getStore!;
    const newSave = (await imp('game/save/schema.ts')).newSave!;
    const newCharacter = (await imp('game/player/character.ts')).newCharacter!;
    const { Rng } = (await import(/* @vite-ignore */ base + 'engine/rng.ts')) as { Rng: new (s: string) => unknown };
    const st = getStore();
    for (const [slot, name, best] of [[1, 'Veteran', 3], [2, 'Rookie', -1]] as const) {
      const c = newCharacter('knight', name, 'p-' + name, new Rng(name)) as { tutorialDone: boolean };
      c.tutorialDone = true;
      const sv = newSave(slot, c, 'S' + name) as { rush: { bestCycle: number } };
      sv.rush.bestCycle = best;
      writeSave(st, sv);
    }
    (st as Storage).setItem('dj.waveRush', JSON.stringify({ best: 6 }));
  });
  await page.reload();
  await page.getByTestId('wave-rush-btn').click();
  await expect(page.getByRole('heading', { name: 'Wave Rush — with which character?' })).toBeVisible();
  // no cycle on offer until a character is chosen
  await expect(page.getByTestId('rush-cycle')).toHaveCount(0);
  await page.getByTestId('rush-pick-2').getByRole('button', { name: 'Choose' }).click();
  await expect(page.getByTestId('rush-cycle')).toHaveText('Cycle 1');
  // the last open cycle: the arrow on is dimmed and does nothing
  await expect(page.getByRole('button', { name: 'Later cycle' })).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByTestId('rush-open')).toContainText('Only Cycle 1 is open for Rookie');
  await page.getByRole('button', { name: 'Back' }).click();
  await page.getByTestId('rush-pick-1').getByRole('button', { name: 'Choose' }).click();
  await expect(page.getByTestId('rush-cycle')).toHaveText('Cycle 5');
  await expect(page.getByRole('button', { name: 'Later cycle' })).toHaveAttribute('aria-disabled', 'true');
  await page.getByRole('button', { name: 'Earlier cycle' }).click();
  await expect(page.getByTestId('rush-cycle')).toHaveText('Cycle 4');
});

test('co-op: the host picks Wave Rush in the lobby, the guest follows into room 2', async ({ context }) => {
  const host = await context.newPage();
  const guest = await context.newPage();
  const errors: string[] = [];
  for (const p of [host, guest]) p.on('pageerror', (e) => errors.push(String(e)));
  await host.goto('./?net=bc&auto=host&code=636363&rush=0');
  await guest.goto('./?net=bc&auto=guest&code=636363');
  await expect.poll(() => sceneName(host), { timeout: 15000 }).toBe('run');
  await expect.poll(() => sceneName(guest), { timeout: 15000 }).toBe('guestRun');
  type GuestScene = { net: { rush: { stage: number } | null; layout: { zone: number } | null }; save: { rush?: { roomsCleared: number } } };
  const guestWhere = (): Promise<string> =>
    guest.evaluate(() => {
      const g = (window as unknown as { __dj: { scenes: { current: GuestScene } } }).__dj.scenes.current;
      return `${g.net.rush?.stage}:${g.net.layout?.zone}`;
    });
  await expect.poll(guestWhere, { timeout: 10000 }).toBe('1:1');
  await host.bringToFront();
  await clearAndStandOnStairs(host);
  await host.keyboard.press('KeyF');
  await expect.poll(guestWhere, { timeout: 10000 }).toBe('2:2');
  // the guest keeps its own record of the run
  expect(await guest.evaluate(() => (window as unknown as { __dj: { scenes: { current: GuestScene } } }).__dj.scenes.current.save.rush?.roomsCleared)).toBe(1);
  expect(errors).toEqual([]);
});
