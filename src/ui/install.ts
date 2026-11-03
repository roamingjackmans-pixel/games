// "Install the app" (D135): Dungeon Joe as its own app from Chrome or Edge, like Alt Whisker Wars. Windows gets a Start
// menu shortcut with the game's name and icon, so Steam's "Add a Non-Steam Game" lists it ready to tick.
// The browser offers its install prompt once, early, so it is caught as soon as this module loads (main.ts imports it).

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let offer: InstallPrompt | null = null;
let justInstalled = false;
const listeners = new Set<() => void>();
const changed = (): void => {
  for (const f of listeners) {
    try {
      f();
    } catch (e) {
      console.error(e);
    }
  }
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    offer = e as InstallPrompt;
    changed();
  });
  window.addEventListener('appinstalled', () => {
    offer = null;
    justInstalled = true;
    changed();
  });
}

/** Run fn whenever the install state changes; returns a function that stops listening. */
export function onInstallChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Running as the installed app right now (or it was just installed). */
export function isInstalledApp(): boolean {
  if (justInstalled || (navigator as Navigator & { standalone?: boolean }).standalone) return true;
  const mm = (q: string): boolean => !!window.matchMedia && window.matchMedia(q).matches;
  return mm('(display-mode: standalone)') || mm('(display-mode: minimal-ui)') || (mm('(display-mode: fullscreen)') && !document.fullscreenElement);
}

/** The browser's own install prompt is ready to open. */
export const canPromptInstall = (): boolean => !!offer;

/**
 * Open the install prompt: 'accepted', 'dismissed', or 'manual' (no prompt here: show the steps instead). The browser
 * only offers its prompt once the page has been used for a little while, so a click that comes too early waits up to
 * `waitMs` for it before giving up.
 */
export async function promptInstall(waitMs = 3000): Promise<'accepted' | 'dismissed' | 'manual'> {
  if (!offer && waitMs > 0) {
    await new Promise<void>((done) => {
      const stop = onInstallChange(() => {
        if (!offer) return;
        stop();
        window.clearTimeout(t);
        done();
      });
      const t = window.setTimeout(() => {
        stop();
        done();
      }, waitMs);
    });
  }
  if (!offer) return 'manual';
  const p = offer;
  offer = null;
  try {
    await p.prompt();
    const { outcome } = await p.userChoice;
    if (outcome === 'accepted') justInstalled = true;
    changed();
    return outcome;
  } catch (e) {
    console.warn(e);
    changed();
    return 'manual';
  }
}

/** What to do when the browser has no prompt to open: a title and a few steps for this browser. */
export function installSteps(): { title: string; steps: string[] } {
  const ua = navigator.userAgent || '';
  const firefox = /Firefox|FxiOS/i.test(ua);
  const safari = /Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR|Firefox/.test(ua);
  if (firefox || safari) {
    return {
      title: 'Open this page in Edge or Chrome to install',
      steps: [`${firefox ? 'Firefox' : 'Safari'} cannot install web games as apps on Windows.`, 'Open josephjackman.com/games/dungeonjoe/ in Microsoft Edge or Google Chrome, then Settings → Game → Install the app.'],
    };
  }
  const edge = /Edg\//.test(ua);
  return {
    title: 'Your browser did not open its install box, so install it from the browser itself:',
    steps: [
      edge
        ? 'Click the Edge menu (… at the top right) → Apps → Install Dungeon Joe. Or click the small install icon (a grid with a +) at the right end of the address bar.'
        : 'Click the small install icon (a screen with a down arrow) at the right end of the address bar. Or click the Chrome menu (⋮ at the top right) → Cast, save, and share → Install Dungeon Joe…',
      'Click Install. Dungeon Joe opens in its own window and gets a Start menu and desktop shortcut.',
      `If the menu says Open in Dungeon Joe (or Open in app) instead, it is already installed: start it from the Start menu.`,
      // D137: an app installed from this site's old addresses can claim every page under it
      `If it says Open in another game from this site (such as Alt Whisker Wars), that app was installed from an older address and claims this page too. Uninstall it (in Chrome go to chrome://apps, right-click it → Remove from Chrome; leave "Also clear data" unticked, or every game here loses its saves), install Dungeon Joe, then install the other game again from its own page.`,
    ],
  };
}
