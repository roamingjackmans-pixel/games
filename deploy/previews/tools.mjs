// Helpers for the recipes in recipes/. Each recipe file is named after the game's folder and exports:
//
//   export default {
//     url,                    page to open (default https://josephjackman.com/games/<folder>/)
//     before(ctx),            runs before the page opens (start a local server with serve(), stop it with ctx.onDone)
//     steps,                  simple steps run first (see step() below)
//     setup(page, ctx),       custom code run after the steps; may open more players with ctx.open(url)
//                             and may return a state object (state.record = another page records that page)
//     during(page, until, state), runs while recording, until Date.now() >= until
//     seconds,                clip length (default 4)
//     still,                  where the still frame comes from, 0..1 through the clip (default 0.5)
//     crop,                   [x, y, w, h] (16:9) of the 1280x720 page
//   };
import { spawn, spawnSync } from 'node:child_process';

/** Hides the biggest box around the element holding this text that is still narrower than the window (runs in the page). */
export function hidePanel(text) {
  const el = [...document.querySelectorAll('button, a, h1, h2, p, div, span')].find(
    (e) => e.offsetParent !== null && e.textContent.trim().startsWith(text),
  );
  if (!el) throw new Error('no element with ' + text);
  let box = el;
  while (box.parentElement && box.parentElement !== document.body && box.parentElement.getBoundingClientRect().width < innerWidth * 0.9)
    box = box.parentElement;
  box.style.setProperty('display', 'none', 'important');
}

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** A `during` that clicks a selector every `ms`. */
export const clickEvery = (sel, ms) => async (page, until) => {
  while (Date.now() < until) {
    await page
      .locator(sel)
      .first()
      .click({ timeout: 1000 })
      .catch(() => {});
    await page.waitForTimeout(ms);
  }
};

/** A `during` that holds each [key, ms] in turn, over and over. */
export const holdKeys = (seq) => async (page, until) => {
  while (Date.now() < until) {
    for (const [key, ms] of seq) {
      if (Date.now() >= until) break;
      await page.keyboard.down(key);
      await page.waitForTimeout(ms);
      await page.keyboard.up(key);
    }
  }
};

/**
 * One simple step: "t:Text" clicks visible text, "b:Name" clicks the button with exactly that name, "s:css" clicks a
 * selector, "f:css=value" fills an input, "x:Text" hides the panel holding that text, "h:css" hides an element,
 * "k:Key" presses a key, "w:ms" waits.
 */
export async function step(page, s) {
  const [kind, ...rest] = s.split(':');
  const arg = rest.join(':');
  const visible = (l) => l.locator('visible=true').first();
  if (kind === 't') await visible(page.getByText(arg)).click({ timeout: 6000 });
  else if (kind === 'b') await visible(page.getByRole('button', { name: arg, exact: true })).click({ timeout: 6000 });
  else if (kind === 's') await visible(page.locator(arg)).click({ timeout: 6000 });
  else if (kind === 'f') {
    const [sel, val] = arg.split('=');
    await page.locator(sel).first().fill(val);
  } else if (kind === 'x') await page.evaluate(hidePanel, arg);
  else if (kind === 'h') await page.addStyleTag({ content: `${arg}{visibility:hidden!important}` });
  else if (kind === 'k') await page.keyboard.press(arg);
  else if (kind === 'w') return page.waitForTimeout(Number(arg));
  await page.waitForTimeout(900);
}

/** Runs simple steps in order; a failed step is reported and skipped. */
export async function steps(page, list, label) {
  for (const s of list) await step(page, s).catch((e) => console.log(`${label}: step ${s} failed: ${e.message.split('\n')[0]}`));
}

/** Starts a local server and waits until `url` answers. Returns a function that stops it. */
export async function serve({ command, args = [], cwd, url, env, timeout = 90000 }) {
  // on Windows npx and npm are .cmd files, so go through the shell (with one command line, not separate args)
  const win = process.platform === 'win32';
  const options = { cwd, env: { ...process.env, ...env }, shell: win, stdio: 'ignore' };
  const child = win ? spawn([command, ...args].join(' '), options) : spawn(command, args, options);
  const stop = () => {
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/t', '/f'], { stdio: 'ignore' });
    else child.kill();
  };
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return stop;
    } catch {
      /* not up yet */
    }
    await wait(500);
  }
  stop();
  throw new Error(`${url} did not come up`);
}
