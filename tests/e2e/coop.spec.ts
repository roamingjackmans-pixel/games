import { expect, test, type Page } from '@playwright/test';

// NETCODE §8: a host page and a guest page join the same room (same-browser BroadcastChannel transport,
// so the test does not depend on public relays), both see two players, and the guest's movement reaches
// the host's simulation.

async function sceneName(p: Page): Promise<string> {
  return p.evaluate(() => (window as unknown as { __dj?: { scenes: { current?: { name: string } } } }).__dj?.scenes.current?.name ?? '');
}

test('host and guest join by room code and see each other move', async ({ context }) => {
  const host = await context.newPage();
  const guest = await context.newPage();
  const errors: string[] = [];
  for (const p of [host, guest]) p.on('pageerror', (e) => errors.push(String(e)));
  await host.goto('./?net=bc&auto=host&code=424242');
  await guest.goto('./?net=bc&auto=guest&code=424242');
  await expect.poll(() => sceneName(host), { timeout: 15000 }).toBe('run');
  await expect.poll(() => sceneName(guest), { timeout: 15000 }).toBe('guestRun');
  await expect
    .poll(() => guest.evaluate(() => (window as unknown as { __dj: { scenes: { current: { net: { cw: { players: unknown[] } } } } } }).__dj.scenes.current.net.cw.players.length), { timeout: 10000 })
    .toBe(2);
  const hostX = (): Promise<number> =>
    host.evaluate(() => {
      const s = (window as unknown as { __dj: { scenes: { current: { session: { players: { local: boolean; entity: { x: number } }[] } } } } }).__dj.scenes.current.session;
      return s.players.find((p) => !p.local)!.entity.x;
    });
  const x0 = await hostX();
  await guest.bringToFront();
  await guest.keyboard.down('KeyD');
  await guest.waitForTimeout(800);
  await guest.keyboard.up('KeyD');
  await expect.poll(async () => (await hostX()) - x0, { timeout: 5000 }).toBeGreaterThan(60);
  // D149: the guest's dodge starts on its own screen at once, and both end in the same place
  const guestX = (): Promise<number> => guest.evaluate(() => (window as unknown as { __dj: { scenes: { current: { net: { me: { x: number } } } } } }).__dj.scenes.current.net.me.x);
  await guest.waitForTimeout(1500);
  const g0 = await guestX();
  await guest.keyboard.press('Space');
  await guest.waitForTimeout(60);
  expect((await guestX()) - g0).not.toBe(0);
  await guest.waitForTimeout(1200);
  expect(Math.abs((await guestX()) - (await hostX()))).toBeLessThan(6);
  expect(errors).toEqual([]);
});
