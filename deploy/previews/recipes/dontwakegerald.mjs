// A goblin walks across Gerald's bed at night toward a piece of loot (its "$" tag and the "L-Click grab" prompt show),
// grabs it on the move, then carries it overhead back toward its bottle cap (HUD: "Carrying Pajama Button $24"), and
// drops it in for the "+$" pop if it gets there in time. Practice vs bots on the bedroom map (?map=bedroom), with the
// bots turned down to 0 in the lobby (bots jump a lot, and at headless frame rates the game's squash-and-stretch
// spring blows jumping goblins up into giant spikes), then Start the heist. A small in-page pilot plays our goblin with
// W/S and left clicks: it turns the camera toward level loot out on the mattress (toward Gerald), sets off so the
// goblin is 8 steps away just as the GO! splash has gone (when recording starts), clicks as the loot comes into reach,
// then backs home with the camera still, so the goblin faces it. It runs in the page because headless frames are slow
// (100-200 ms): it times the click from the goblin's speed and the frame time.

/** Runs in the page. Plays our goblin through the first seconds of night 1. */
function pilot() {
  const g = window.dwg.game;
  const sim = g.sim;
  const canvas = document.getElementById('c');
  const st = { d: 99, go: false, ready: false, banked: false };
  window.__pilot = st;
  const held = new Set();
  const key = (code, down) => {
    if (held.has(code) === down) return;
    if (down) held.add(code);
    else held.delete(code);
    window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, bubbles: true }));
  };
  let clickT = 0;
  const click = (now) => {
    if (now - clickT < 220) return;
    clickT = now;
    canvas.dispatchEvent(new MouseEvent('mousedown', { button: 0, bubbles: true }));
    setTimeout(() => window.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true })), 40);
  };
  const home = sim.stashOf(g.my);
  /**
   * How good a target this loot is: -1 not reachable on foot; 0 on the mattress with nothing to climb on the way;
   * 1 also level all the way (so the goblin never leaves the ground), big enough to see and a walk from home; 2 also
   * toward Gerald, away from the bed's edge, with no other loot on the way to kick about; 3 also far enough that the
   * opening shot is clear of our own bottle cap.
   */
  const grade = (me, l) => {
    if (l.st !== 0 || l.y > me.y + 1.2) return -1;
    const dx = l.x - me.x;
    const dz = l.z - me.z;
    let level = true;
    for (let k = 1; k <= 16; k++) {
      const h = sim.world.heightAt(me.x + (dx * k) / 16, me.z + (dz * k) / 16);
      if (h > me.y + 0.8) return -1;
      if (Math.abs(h - me.y) > 0.3) level = false;
    }
    const far = Math.hypot(l.x - home.x, l.z - home.z);
    if (!level || far < 9 || l.type === 'crumb' || l.type === 'sprinkle') return 0;
    if (l.x - home.x < 0.8 * Math.abs(l.z - home.z) || Math.abs(l.z) > 70 || far > 30) return 1;
    const len2 = dx * dx + dz * dz;
    for (const o of sim.loot.values()) {
      const u = Math.max(0, Math.min(1, ((o.x - me.x) * dx + (o.z - me.z) * dz) / len2));
      if (o !== l && Math.hypot(me.x + dx * u - o.x, me.z + dz * u - o.z) < 2.5) return 1;
    }
    return far < 16 ? 2 : 3;
  };
  let id = 0;
  let nightT = 0;
  let last = performance.now();
  let frame = 0.1;
  const tick = () => {
    if (window.dwg.game !== g) return;
    requestAnimationFrame(tick);
    const now = performance.now();
    frame += (Math.min(0.3, (now - last) / 1000) - frame) * 0.3;
    last = now;
    const me = g.my;
    if (!me) return;
    if (sim.phase === 'night' && !nightT) nightT = now;
    const night = nightT ? (now - nightT) / 1000 : -1;
    // how far the goblin gets before the game reads the next input
    const ahead = Math.hypot(me.vx, me.vz) * frame * 1.1;
    let tx, tz;
    let back = 0;
    if (st.banked && !me.carry) {
      key('KeyS', false);
      return;
    }
    if (me.carry) {
      // home to the bottle cap, and drop it in. The camera keeps looking the same way, so the goblin walks toward it
      // over the open mattress (turning around would drag the camera into the blanket behind)
      tx = home.x;
      tz = home.z;
      back = Math.PI;
      st.d = Math.hypot(tx - me.x, tz - me.z);
      key('KeyW', false);
      key('KeyS', st.d - ahead > 2.4);
      if (st.d - ahead < 2.4) {
        click(now);
        st.banked = true;
      }
    } else {
      let l = sim.loot.get(id);
      if (!l || l.st !== 0) {
        // the best grade, then the nearest
        let best = -1;
        l = null;
        for (const c of sim.loot.values()) {
          const k = grade(me, c);
          if (k > best || (k === best && k >= 0 && Math.hypot(c.x - me.x, c.z - me.z) < Math.hypot(l.x - me.x, l.z - me.z))) {
            best = k;
            l = c;
          }
        }
        id = l ? l.id : 0;
      }
      if (!l) return;
      tx = l.x;
      tz = l.z;
      st.d = Math.hypot(tx - me.x, tz - me.z);
      // set off so the goblin is 8 steps away when GO! has faded
      if (night >= 0 && st.d > 8.5 + Math.max(0, 3.3 - night) * 6.2) st.go = true;
      if (night > 3.3 && st.d < 9) st.ready = st.go = true;
      key('KeyW', st.go);
      if (st.go && st.d - ahead < 1.6 && st.d > 0.4) click(now);
    }
    let turn = Math.atan2(tx - me.x, tz - me.z) + back - g.cam.yaw;
    while (turn > Math.PI) turn -= Math.PI * 2;
    while (turn < -Math.PI) turn += Math.PI * 2;
    g.cam.yaw += Math.max(-3.2 * frame, Math.min(3.2 * frame, turn));
    // high enough to clear our flag pole on the way out, rising over the bottle cap on the way home
    g.cam.pitch += ((back ? 0.95 : 0.72) - g.cam.pitch) * Math.min(1, frame * (back ? 2 : 6));
  };
  requestAnimationFrame(tick);
}

export default {
  url: 'https://josephjackman.com/games/dontwakegerald/?map=bedroom',
  // "Fill with bots up to" 6 -> 0
  steps: ['s:#ok', 's:#practice', 'w:600', ...Array(3).fill('s:.cycler[data-mod="bots"] [data-d="-1"]'), 's:#start'],
  seconds: 4,
  still: 0.7,
  async setup(page) {
    // a real click on the game (Start already took the pointer lock, or this one does)
    await page.mouse.down();
    await page.mouse.up();
    await page.evaluate(pilot);
    await page.waitForFunction(() => window.__pilot.ready, null, { timeout: 25000, polling: 'raf' });
    return {};
  },
};
