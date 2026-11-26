// Relentless Tear: a fight on the Selvage cliffs under the Tear. Ash, Corin, Wick and Orrin (level 15) strike first
// against two Seamharpies and a Gale Shroud; Ash opens with Running Stitch and lands every timed strike (Perfect!,
// Stitches sewn), her friends follow up, and the party parries what comes back.
// Runs the game locally from C:\dev\RelentlessTear's built dist/ (vite preview on port 5193), offline, from a fixed
// mid-game save written straight into localStorage (no account, no live server). The fight starts through the game's
// own battle call; a small in-page "player" presses Space on each timing ring and Parry on each incoming blow.
import { serve, wait } from '../tools.mjs';

const SRC = 'C:/dev/RelentlessTear';
const PORT = 5193;
const URL = `http://localhost:${PORT}/games/RelentlessTear/`;
const TUTORIALS = ['move', 'battle_basics', 'defense', 'timing', 'aim', 'skills', 'waystitch', 'patches', 'classes', 'weave', 'camp', 'worldmap'];

const ROSTER = ['ash', 'corin', 'wick', 'orrin', 'maudra', 'rook'];
const SKILLS = {
  ash: ['ash_running_stitch', 'ash_pull_taut', 'ash_backstitch', 'ash_hemline', 'ash_cross_stitch', 'ash_thimble_ward'],
  corin: ['cor_shield_bash', 'cor_interpose', 'cor_bulwark', 'cor_last_wall', 'cor_second_helping', 'cor_millstone'],
  wick: ['wick_tangle', 'wick_spool_up', 'wick_fray', 'wick_red_string', 'wick_unspool', 'wick_knot'],
  orrin: ['orr_measured_cut', 'orr_great_shear', 'orr_snap', 'orr_old_lesson', 'orr_tea_break', 'orr_unpick'],
  maudra: ['mau_bell_of_hope', 'mau_toll', 'mau_censure', 'mau_hymn', 'mau_sanctuary', 'mau_last_rites'],
  rook: ['rook_quickdraw', 'rook_fan', 'rook_vent', 'rook_flare', 'rook_ricochet', 'rook_deadeye'],
};

/** A save at the Selvage: every cutscene seen (so nothing interrupts), the party at level 15 with their second weapons. */
function profile() {
  const chars = {};
  for (const id of [...ROSTER, 'tess']) {
    const sk = SKILLS[id] ?? ['tess_twin_cut', 'tess_take_it', 'tess_absolution', 'tess_scissor_rite', 'tess_sever'];
    chars[id] = { id, level: 15, xp: 0, attrs: { vit: 12, might: 16, agi: 8, def: 6, luck: 0 }, attrPts: 0, sp: 0, learned: sk, equipped: sk, weapon: id === 'tess' ? 'w_tess_1' : `w_${id}_2`, patches: [], embroideries: [], cls: null, classBattles: {}, outfit: null, hpFrac: 1, bond: 2, bondSeen: [] };
  }
  const weapons = {};
  for (const id of ROSTER) weapons[`w_${id}_2`] = 10;
  weapons.w_tess_1 = 1;
  const flags = { pro_done: true, ch4_start: true };
  for (let k = 0; k < 4; k++) flags[`ch${k}_done`] = flags[`ch${k}_start`] = true;
  const save = {
    v: 1, created: 0, updated: 0, playtime: 15120000, chapter: 4, chapterName: 'The Selvage', scene: 'sv_windstair', x: 300,
    way: { scene: 'sv_windstair', x: 300, name: 'The Windstair' }, roster: ROSTER, active: ['ash', 'corin', 'wick', 'orrin'], chars,
    inv: { mothers_thimble: 1, honey_bun: 2 }, weapons, patchWins: {}, learnedPatches: [],
    tinct: { tincture_heal: 3, tincture_revive: 2, tincture_spirit: 2 }, tinctMax: { tincture_heal: 3, tincture_revive: 2, tincture_spirit: 2 },
    glim: 2400, flags, journals: [], songs: [], patterns: [], weaves: ['weave_measure'], bestiary: {}, cleared: [],
    regions: ['hollowmere', 'thimble_fields', 'lanternmere', 'cindermill', 'selvage'], tp: 4, ng: 0, difficulty: 'story', commandAll: false,
  };
  return { v: 1, slots: [save, null, null], tasks: {}, classes: [], settings: { master: 0.8, music: 0.7, sfx: 0.9, timingAid: true, shake: true, textSpeed: 0, autoAdvance: false, reducedFlash: false, quality: 'high' }, lastSlot: 0 };
}

/** In the page: mark every cutscene seen (from the game's own list), and remember the save and the tutorials. */
function prepare([p, tuts]) {
  localStorage.setItem('rt.offline', '1');
  localStorage.setItem('rt.profile', p);
  localStorage.setItem('rt.tutSeen', JSON.stringify(tuts));
}

/** In the page: a player who hits every timing ring and parries every blow. */
function player() {
  const input = window.rtInput;
  const pressAt = (action, t) =>
    setTimeout(() => {
      input.press(action, performance.now());
      setTimeout(() => input.release(action), 50);
    }, Math.max(0, t - performance.now() - 4));
  const planned = new WeakSet();
  setInterval(() => {
    const B = window.rt.battleScr;
    if (!B) return;
    for (const b of B.qte?.beats ?? []) {
      if (b.q || planned.has(b) || b.t - performance.now() > 400) continue;
      planned.add(b);
      pressAt('confirm', b.t);
    }
    for (const hh of B.def?.local.length ? B.def.hits : []) {
      if (planned.has(hh) || hh.t - performance.now() > 400) continue;
      planned.add(hh);
      pressAt(hh.kind === 'jump' ? 'jump' : hh.kind === 'unblockable' ? 'dodge' : 'parry', hh.t);
    }
  }, 30);
}

export default {
  url: URL,
  async before(ctx) {
    const stop = await serve({ command: `npx vite preview --port ${PORT} --strictPort`, cwd: SRC, url: URL });
    ctx.onDone(stop);
  },
  async setup(page) {
    await page.evaluate(prepare, [JSON.stringify(profile()), TUTORIALS]);
    await page.reload({ waitUntil: 'load' });
    await page.evaluate(() => {
      const p = JSON.parse(localStorage.getItem('rt.profile'));
      for (const id of Object.keys(window.rtCutscenes ?? {})) p.slots[0].flags[`seen:${id}`] = true;
      localStorage.setItem('rt.profile', JSON.stringify(p));
    });
    await page.reload({ waitUntil: 'load' });
    await page.getByRole('button', { name: /Continue/ }).click({ timeout: 15000 });
    await page.waitForFunction(() => window.rt?.mode === 'explore' && window.rt.explore && window.rt.busy === 0, null, { timeout: 30000 });
    await page.waitForTimeout(800);
    await page.evaluate(() => void window.rt.battle('e_selvage_5', { first: 'party' }));
    await page.evaluate(player);
    // wait for Ash's turn: her command menu
    await page.locator('.b-cmd').waitFor({ timeout: 30000 });
    await page.waitForTimeout(500);
  },
  async during(page, until) {
    await page.getByRole('button', { name: 'Skills' }).click();
    await wait(450);
    await page.locator('.b-sub .item-row', { hasText: 'Running Stitch' }).click();
    await wait(350);
    await page.keyboard.press('Space');
    while (Date.now() < until) await wait(100);
  },
  seconds: 6,
  still: 0.4,
};
