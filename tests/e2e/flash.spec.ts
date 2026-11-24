import { expect, test, type Frame, type Page } from '@playwright/test';

// FlashGames mode (D452, GAME_DESIGN §25): ?flash=… boots straight into the day's run inside a FlashGames-like parent
// page, reports its score by postMessage, stops at the end, and leaves the browser's saves alone.

type Msg = { type: string; score?: number; detail?: string; reason?: string };
type Ent = { x: number; y: number; hp: { dead: boolean }; en: { state: string; def: { special?: boolean } } };
type Sess = { roomPhase: string; node: { id: string }; layout: { rooms: { id: string; kind: string; depth: number }[] }; localPlayer: { x: number; y: number; id: number }; w: { god: boolean; enemies: Ent[] }; enterRoom(id: string, entry: string): void };
type DJ = { scenes: { current?: { name: string; session?: Sess } } };

function flashCode(mods: string[], seed: number, limit: number): string {
  return Buffer.from(JSON.stringify({ v: 1, date: '2026-11-24', seed, mods, limit, run: 'e2e' }), 'utf8').toString('base64url');
}

async function gameFrame(page: Page): Promise<Frame> {
  await expect.poll(() => page.frames().some((f) => f.url().includes('flash='))).toBe(true);
  return page.frames().find((f) => f.url().includes('flash='))!;
}

const msgs = (page: Page): Promise<Msg[]> => page.evaluate(() => (window as unknown as { __msgs: Msg[] }).__msgs);

test('?flash= boots into the run, reports a score, ends frozen at the time and saves nothing', async ({ page, baseURL }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  // the game's origin, with a save and settings of the player's own
  await page.goto('./flash.json');
  const flashJson = JSON.parse((await page.locator('body').textContent()) ?? '{}') as { id: string; modifiers: unknown[] };
  expect(flashJson.id).toBe('dungeonjoe');
  await page.evaluate(() => {
    localStorage.setItem('dj.save.4', '{"mine":true}');
    localStorage.setItem('dj.settings', '{"audio":{"master":0.42,"sfx":1,"music":1}}');
  });
  const snapshot = (): Promise<string> => page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));
  const before = await snapshot();

  const src = new URL(`./?flash=${flashCode(['horde', 'turbo'], 2468, 600)}`, baseURL).href;
  await page.setContent(`<!doctype html><body style="margin:0"><div style="height:44px"></div>
    <iframe id="g" src="${src}" style="border:0;width:960px;height:540px"></iframe>
    <script>
      window.__msgs = [];
      const g = () => document.getElementById('g').contentWindow;
      addEventListener('message', (ev) => {
        if (ev.source !== g() || !ev.data || ev.data.flash !== 1) return;
        window.__msgs.push(ev.data);
        if (ev.data.type === 'ready') g().postMessage({ flash: 1, type: 'go' }, '*');
      });
      window.__end = () => g().postMessage({ flash: 1, type: 'end' }, '*');
    </script></body>`);
  const f = await gameFrame(page);
  await expect.poll(async () => (await msgs(page)).some((m) => m.type === 'ready'), { timeout: 20000 }).toBe(true);
  // straight into play: the run scene at zone 1's first bonfire, no title or creator
  await expect.poll(() => f.evaluate(() => (window as unknown as { __dj?: DJ }).__dj?.scenes.current?.name ?? '')).toBe('run');
  expect(await f.evaluate(() => (window as unknown as { __dj: DJ }).__dj.scenes.current!.session!.node.id)).toBe('z1-start');
  await expect.poll(async () => (await msgs(page)).some((m) => m.type === 'score'), { timeout: 10000 }).toBe(true);
  expect((await msgs(page)).find((m) => m.type === 'score')!.detail).toContain('Zone 1');

  // win a fight room (the debug hand knocks enemies down as they come): the score rises
  await f.evaluate(async () => {
    const s = (window as unknown as { __dj: DJ }).__dj.scenes.current!.session!;
    const path = '/games/dungeonjoe/src/game/combat/damage.ts';
    const dmg = (await import(/* @vite-ignore */ path)) as { rawDamage: (w: unknown, e: unknown, n: number, t: string, src: number) => void };
    const room = s.layout.rooms.filter((r) => r.kind === 'combat').sort((a, b) => a.depth - b.depth)[0]!;
    s.enterRoom(room.id, 'n');
    s.w.god = true;
    s.localPlayer.x = 640;
    s.localPlayer.y = 380;
    for (let i = 0; i < 200 && s.roomPhase !== 'cleared'; i++) {
      for (const e of [...s.w.enemies]) if (!e.hp.dead && !e.en.def.special && e.en.state !== 'spawning') dmg.rawDamage(s.w, e, 1e9, 'holy', s.localPlayer.id);
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  await expect.poll(async () => Math.max(0, ...(await msgs(page)).map((m) => m.score ?? 0)), { timeout: 5000 }).toBeGreaterThan(100);
  const scores = (await msgs(page)).filter((m) => m.type === 'score').map((m) => m.score!);
  for (let i = 1; i < scores.length; i++) expect(scores[i]!).toBeGreaterThanOrEqual(scores[i - 1]!);

  // FlashGames says the time is up: the run is over and stands still under its score
  await page.evaluate(() => (window as unknown as { __end: () => void }).__end());
  await expect.poll(async () => (await msgs(page)).find((m) => m.type === 'over')?.reason, { timeout: 5000 }).toBe('time');
  await expect(f.getByTestId('flash-end')).toBeVisible();
  const over = (await msgs(page)).find((m) => m.type === 'over')!;
  expect(over.score).toBe(Math.max(...scores));
  const t0 = await f.evaluate(() => (window as unknown as { __dj: { scenes: { current: { session: { w: { time: number } } } } } }).__dj.scenes.current.session.w.time);
  await page.waitForTimeout(500);
  const t1 = await f.evaluate(() => (window as unknown as { __dj: { scenes: { current: { session: { w: { time: number } } } } } }).__dj.scenes.current.session.w.time);
  expect(t1).toBe(t0);

  // nothing of the player's was touched
  await page.goto('./flash.json');
  expect(await snapshot()).toBe(before);
  expect(errors).toEqual([]);
});
