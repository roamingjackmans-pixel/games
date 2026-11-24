// FlashRun SDK v1. Lets a game run as the FlashGames daily speedrun (josephjackman.com/games/flashgames/).
// Copy this file into a game unchanged (newest copy: roamingjackmans-pixel/flashgames, sdk/flash-run.js).
// The rules a game follows are in that repo's docs/PROTOCOL.md.
//
// FlashGames opens the game in an iframe at  <game>/?flash=<base64url JSON>  where the JSON is
//   { v: 1, date: '2026-11-24', seed: 123456789, mods: ['glass', 'turbo'], limit: 900, run: 'r_abc' }
// and this file reads it. Load it as a classic <script>, concatenate it into a bundle, or `import './flash-run.js'`
// from a module: it sets  window.FlashRun  either way. With no ?flash=… in the URL, FlashRun.active is false and
// nothing else here does anything.
(function (root) {
  'use strict';

  function decode(raw) {
    var b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  var cfg = null;
  try {
    var raw = new URLSearchParams(root.location.search).get('flash');
    if (raw) {
      cfg = decode(raw);
      if (!cfg || cfg.v !== 1 || !Array.isArray(cfg.mods)) cfg = null;
      else {
        cfg.seed = cfg.seed >>> 0;
        cfg.limit = Math.max(10, Math.min(3600, Number(cfg.limit) || 900));
        cfg.mods = cfg.mods.map(String);
      }
    }
  } catch (e) {
    cfg = null;
  }

  var parentWin = root.parent && root.parent !== root ? root.parent : null;
  var phase = 'loading'; // loading -> waiting (ready sent) -> running (go) -> over
  var goAt = 0;
  var best = 0;
  var bestDetail = '';
  var lastPost = 0;
  var pendingPost = 0;
  var endFns = [];
  var goFns = [];
  var localTimer = 0;

  function post(msg) {
    msg.flash = 1;
    if (parentWin) parentWin.postMessage(msg, '*');
  }

  function clean(n) {
    n = Math.floor(Number(n));
    return Number.isFinite(n) && n > 0 ? Math.min(n, 1e12) : 0;
  }

  function sendScore() {
    pendingPost = 0;
    lastPost = Date.now();
    post({ type: 'score', score: best, detail: bestDetail });
  }

  function startRunning(at) {
    if (phase === 'running' || phase === 'over') return;
    phase = 'running';
    goAt = at || Date.now();
    // the parent is the clock; this is only the fallback (and the clock when testing the game on its own)
    localTimer = setTimeout(function () {
      timeUp();
    }, cfg.limit * 1000 + (parentWin ? 3000 : 0));
    var fns = goFns.slice();
    goFns.length = 0;
    for (var i = 0; i < fns.length; i++) fns[i]();
  }

  function timeUp() {
    if (phase === 'over') return;
    for (var i = 0; i < endFns.length; i++) {
      try {
        endFns[i]();
      } catch (e) {
        console.error('[FlashRun] onEnd handler failed', e);
      }
    }
    if (phase !== 'over') api.over(best, bestDetail, 'time');
  }

  if (cfg) {
    root.addEventListener('message', function (ev) {
      if (!parentWin || ev.source !== parentWin) return;
      var m = ev.data;
      if (!m || m.flash !== 1) return;
      if (m.type === 'go') startRunning(Date.now());
      else if (m.type === 'end') timeUp();
    });
  }

  /** a small seeded random stream (mulberry32); the same seed and salt give the same numbers for everyone */
  function stream(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSalt(s) {
    var h = 2166136261 >>> 0;
    s = String(s);
    for (var i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
    return h;
  }

  var api = {
    /** true when this page was opened as a FlashGames run */
    active: !!cfg,
    /** { v, date, seed, mods, limit, run } or null */
    config: cfg,
    mods: cfg ? cfg.mods.slice() : [],
    seed: cfg ? cfg.seed : 0,
    date: cfg ? String(cfg.date || '') : '',
    /** seconds in the run (900) */
    limit: cfg ? cfg.limit : 0,
    /** is this modifier on today? */
    has: function (id) {
      return !!cfg && cfg.mods.indexOf(id) >= 0;
    },
    /**
     * Call once the run is set up and playable (assets loaded, map built). FlashGames counts in 3-2-1 and then
     * starts the clock; the promise resolves at that moment. Keep the game paused until then.
     * Opened on its own (no FlashGames around it), it resolves after a second so a run can be tested directly.
     */
    ready: function () {
      if (!cfg) return Promise.resolve();
      return new Promise(function (resolve) {
        if (phase === 'running') return resolve();
        goFns.push(resolve);
        if (phase === 'loading') {
          phase = 'waiting';
          post({ type: 'ready' });
          if (!parentWin)
            setTimeout(function () {
              startRunning(Date.now());
            }, 1000);
        }
      });
    },
    /** true between the go and the end of the run */
    running: function () {
      return phase === 'running';
    },
    isOver: function () {
      return phase === 'over';
    },
    /**
     * Report the run's score so far (a whole number that never goes down) and a short line that explains it,
     * e.g. "Zone 2 · 14 rooms · 112 kills". Call it whenever it changes; it is cheap.
     */
    score: function (n, detail) {
      if (!cfg || phase === 'over') return;
      var s = clean(n);
      if (s < best) s = best;
      var d = detail == null ? bestDetail : String(detail).slice(0, 120);
      if (s === best && d === bestDetail) return;
      best = s;
      bestDetail = d;
      var wait = 250 - (Date.now() - lastPost);
      if (wait <= 0) sendScore();
      else if (!pendingPost) pendingPost = setTimeout(sendScore, wait);
    },
    /** the best score reported so far */
    best: function () {
      return best;
    },
    /**
     * The run ended inside the game: reason 'won' (finished it all), 'dead' (the game's own rules ended the
     * run), or 'time'. Freeze the game after calling this. Only the first call counts.
     */
    over: function (n, detail, reason) {
      if (!cfg || phase === 'over') return;
      var s = Math.max(best, clean(n));
      best = s;
      if (detail != null) bestDetail = String(detail).slice(0, 120);
      if (pendingPost) clearTimeout(pendingPost);
      pendingPost = 0;
      clearTimeout(localTimer);
      phase = 'over';
      post({ type: 'over', score: best, detail: bestDetail, reason: reason === 'won' || reason === 'dead' ? reason : 'time' });
    },
    /**
     * Called when the 15 minutes are up. Freeze the game (stop the simulation, ignore input) and, if you like,
     * call over() with a final score; if you don't, the best score reported counts.
     */
    onEnd: function (fn) {
      endFns.push(fn);
    },
    /** milliseconds left on the clock (the full limit before the go, 0 after the end) */
    timeLeft: function () {
      if (!cfg) return 0;
      if (phase === 'loading' || phase === 'waiting') return cfg.limit * 1000;
      if (phase === 'over') return 0;
      return Math.max(0, cfg.limit * 1000 - (Date.now() - goAt));
    },
    /** milliseconds since the go */
    elapsed: function () {
      return phase === 'running' || phase === 'over' ? Date.now() - goAt : 0;
    },
    /** a seeded random function in [0, 1); pass a salt for independent streams (e.g. 'loot', 'map') */
    rng: function (salt) {
      return stream((cfg ? cfg.seed : 0) ^ hashSalt(salt == null ? '' : salt));
    },
  };

  root.FlashRun = api;
})(typeof window !== 'undefined' ? window : globalThis);
