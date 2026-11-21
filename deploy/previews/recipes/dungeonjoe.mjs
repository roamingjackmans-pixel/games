// Dungeon Joe: an Occultist fighting The Caretaker, the Mossy Crypt's boss, with his name and health bar on screen.
// Runs the dev server locally (a boss is a long run in on the live site), opens the dev shortcut ?new (a fresh
// character, no cutscenes), steps through the dev-only window.__dj into the boss room, then plays the fight with real
// keyboard and mouse input: it reads the boss's telegraphs each tick, walks or dodges out of them, and otherwise
// closes in and slashes, circling while stamina comes back and casting Sunray when it is ready. The game's cutscene
// camera follows the two at 1.6x so they read on a small card, with the HUD unscaled on top. For a clean card the
// achievement toast is hidden and Blind (a dark screen) is switched off; no owner code or debug menu is used.
import { serve, wait } from '../tools.mjs';

const PORT = 5191;
const ZOOM = 1.6;
const URL = `http://localhost:${PORT}/games/dungeonjoe/?new&seed=CLIPJOE&class=occultist&nocut`;

/** In the page: what the player should do this tick (move, dodge, attack, cast), from the boss and its telegraphs. */
function think() {
  const P = window.__clipPatterns;
  const sc = window.__dj?.scenes.current;
  const w = sc?.session?.w;
  const me = sc?.local;
  const b = w?.get(w.bossId);
  if (!P || !me || !b || b.hp.dead || !me.hp || me.hp.dead) return null;
  const now = w.time;
  const threats = [];
  for (const e of w.entities.values()) {
    const t = e.tg;
    if (e.type !== 'telegraph' || !t || t.team === me.team || t.hidden || now > t.end) continue;
    if (t.mode !== 'tick' && t.fired) continue;
    threats.push(t);
  }
  const r = me.radius + 18;
  // would standing at (x, y) be hit by any telegraph over the next 1.2 s (sweeps and rings move after impact)?
  const hitTime = (x, y) => {
    let first = Infinity;
    for (const t of threats) {
      const from = Math.max(now, t.impact);
      const to = Math.max(from, Math.min(t.end, now + 1.2));
      for (let at = from; at <= to && at < first; at += 0.1) {
        if (t.shapes.some((s) => P.shapeHit(s, at - t.impact, x, y, r, w.room))) first = at;
      }
    }
    return first;
  };
  const hitAt = (x, y) => hitTime(x, y) < Infinity;
  const aim = [b.x, b.y - 10];
  const toBoss = Math.hypot(b.x - me.x, b.y - me.y);
  const stam = me.stam?.cur ?? 100;
  const pl = me.pl;
  const free = pl.state === 'idle' || pl.state === 'attack';
  // the clip must not end on a death screen: a last-ditch safety net that never shows
  if (me.hp.hp < me.hp.max * 0.15) w.god = true;
  const hitMe = hitTime(me.x, me.y);
  if (hitMe < Infinity) {
    // the nearest safe spot, not too far from the boss
    let best = null;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      for (const d of [70, 120, 180, 250, 330]) {
        const x = me.x + Math.cos(a) * d;
        const y = me.y + Math.sin(a) * d;
        if (x < 80 || x > 1200 || y < 90 || y > 640 || w.room.circleBlocked(x, y, me.radius)) break;
        if (hitAt(x, y)) continue;
        const score = d + Math.abs(Math.hypot(x - b.x, y - b.y) - 150) * 0.4;
        if (!best || score < best.score) best = { x, y, score };
        break;
      }
    }
    const move = best ? [best.x - me.x, best.y - me.y] : [me.x - b.x, me.y - b.y];
    const dodge = hitMe - now < 0.4 && pl.dodgeReadyAt <= now && stam >= 12;
    return { move, aim, dodge, attack: false, cast: null };
  }
  // low: a swig from the Thermos (C) while nothing is coming; otherwise Sunray (1) whenever it is ready
  const drink = pl.state === 'idle' && me.hp.hp < me.hp.max * 0.35 && pl.char.flaskCur > 0;
  const cast = drink ? 'KeyC' : free && pl.spellReadyAt[0] <= now && toBoss < 380 && stam > 40 ? 'Digit1' : null;
  const reach = b.radius + 46;
  if (!cast && stam < 14) {
    // out of stamina: circle the boss at a step's distance while it comes back
    const [ux, uy] = [(me.x - b.x) / (toBoss || 1), (me.y - b.y) / (toBoss || 1)];
    const out = Math.max(-1, Math.min(1, (reach + 50 - toBoss) / 40));
    return { move: [-uy + ux * out, ux + uy * out], aim, dodge: false, attack: false, cast: null };
  }
  // close in to slashing range, then slash
  const move = toBoss > reach ? [b.x - me.x, b.y - me.y] : null;
  const attack = !cast && free && toBoss <= reach + 20;
  return { move, aim, dodge: false, attack, cast };
}

/**
 * In the page: the game's cutscene camera (view.camera, null in normal play) follows the fight every frame, zoomed in
 * on the point between the player and the boss, eased so it glides, and held inside the room as cutscene.ts holds it.
 * Only the world is zoomed: the HUD, boss bar and hotbar draw after it, unscaled. Mouse aim is unaffected, because the
 * game reads the mouse as a world point without the camera, and fight() already aims at world points.
 */
function followCamera(zoom) {
  const hw = 640 / zoom;
  const hh = 360 / zoom;
  let cam = null;
  let last = performance.now();
  const frame = (t) => {
    const sc = window.__dj?.scenes.current;
    const w = sc?.session?.w;
    const me = sc?.local;
    const b = w?.get(w.bossId);
    if (sc?.view && me && b && !sc.cut) {
      // the midpoint sits a little above the screen's centre, clear of the boss bar and hotbar
      const tx = (me.x + b.x) / 2;
      const ty = (me.y + b.y) / 2 + 40 / zoom;
      const k = cam ? 1 - Math.exp(-Math.min(0.1, (t - last) / 1000) * 3) : 1;
      cam = cam ? { x: cam.x + (tx - cam.x) * k, y: cam.y + (ty - cam.y) * k } : { x: tx, y: ty };
      sc.view.camera = { x: Math.max(hw, Math.min(1280 - hw, cam.x)), y: Math.max(hh, Math.min(720 - hh, cam.y)), zoom };
    }
    last = t;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** Plays the fight with real input until `until` (ms), holding movement keys across calls in `held`. */
async function fight(page, until, held) {
  while (Date.now() < until) {
    const d = await page.evaluate(think).catch(() => null);
    const want = new Set();
    if (d?.move) {
      const len = Math.hypot(d.move[0], d.move[1]) || 1;
      const [x, y] = [d.move[0] / len, d.move[1] / len];
      if (x > 0.38) want.add('KeyD');
      if (x < -0.38) want.add('KeyA');
      if (y > 0.38) want.add('KeyS');
      if (y < -0.38) want.add('KeyW');
    }
    for (const k of [...held]) {
      if (want.has(k)) continue;
      held.delete(k);
      await page.keyboard.up(k);
    }
    for (const k of want) {
      if (held.has(k)) continue;
      held.add(k);
      await page.keyboard.down(k);
    }
    if (d) {
      await page.mouse.move(d.aim[0], d.aim[1]);
      if (d.dodge) await page.keyboard.press('Space');
      else if (d.cast) await page.keyboard.press(d.cast);
      else if (d.attack) {
        await page.mouse.down();
        await page.waitForTimeout(30);
        await page.mouse.up();
      }
    }
    await page.waitForTimeout(40);
  }
}

export default {
  url: URL,
  seconds: 5,
  still: 0.6,
  async before(ctx) {
    const stop = await serve({
      command: 'npx',
      args: ['vite', '--port', String(PORT), '--strictPort'],
      cwd: 'C:/dev/DungeonJoe',
      url: URL,
    });
    ctx.onDone(stop);
    // the first load compiles every module; do it once here, with time to spare
    const warm = await ctx.browser.newPage();
    await warm.goto(URL, { waitUntil: 'load', timeout: 180000 });
    await warm.close();
  },
  async setup(page) {
    await page.waitForFunction(() => window.__dj?.scenes.current?.name === 'run', null, { timeout: 30000 });
    // the first shambler down unlocks an achievement; its toast would sit over the arena
    await page.addStyleTag({ content: '.ach-toasts{visibility:hidden!important}' });
    await page.evaluate(async () => {
      window.__clipPatterns = await import('/games/dungeonjoe/src/game/combat/patterns.ts');
      const { neighbourId } = await import('/games/dungeonjoe/src/game/procgen/zone.ts');
      const s = window.__dj.scenes.current.session;
      const L = s.layout;
      s.save.character.tutorialDone = true;
      s.titlePending = false;
      const side = ['n', 's', 'e', 'w'].find((d) => neighbourId(L, L.anteroomId, d)?.id === L.bossId);
      s.enterRoom(L.bossId, neighbourId(L, L.anteroomId, side).entry);
      // Dirt Sweep's Blind turns the whole screen dark for a second, which would black out the card
      s.localPlayer.st.immune.add('blind');
    });
    await page.evaluate(followCamera, ZOOM);
    // the intro holds input for a moment; then Bless Weapon (2), and a few seconds of the fight before recording, so
    // the name card has gone and the boss is already hurt
    const held = new Set();
    await wait(1800);
    await page.keyboard.press('Digit2');
    await fight(page, Date.now() + 2500, held);
    return { held };
  },
  async during(page, until, state) {
    await fight(page, until, state.held);
    for (const k of state.held) await page.keyboard.up(k);
  },
};
