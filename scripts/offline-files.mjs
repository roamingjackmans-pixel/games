// The pieces of the offline download (scripts/build-offline.mjs), as pure functions so tests can check them:
// the single-file HTML inliner, the Windows launcher and the README. Windows text files use CRLF line endings.

const crlf = (s) => s.replace(/\r?\n/g, '\r\n');

/** Keep inline code from closing its own tag early. */
function safeScript(js) {
  return js.replace(/<\/(script)/gi, '<\\/$1');
}
function safeStyle(css) {
  return css.replace(/<\/(style)/gi, '<\\/$1');
}

/**
 * Turn Vite's index.html into one self-contained file: every `<script src>` and stylesheet `<link>` that points at a
 * bundle file is replaced by its contents, modulepreload links are dropped and the favicon becomes a data URI.
 * `files` maps bundle file names (as in the HTML, without "./") to their text. Throws if anything still points at
 * a local file, so a broken offline build fails loudly instead of shipping.
 */
export function inlineHtml(html, files, faviconSvg) {
  const lookup = (ref) => {
    const key = ref.replace(/^\.?\//, '');
    const v = files.get(key);
    if (v === undefined) throw new Error(`offline build: ${ref} is not in the bundle`);
    return v;
  };
  let out = html.replace(/<link\b[^>]*\brel="modulepreload"[^>]*>\s*/gi, '');
  out = out.replace(/<script\b([^>]*)\bsrc="([^"]+)"([^>]*)><\/script>/gi, (_m, pre, src, post) => {
    const attrs = `${pre} ${post}`;
    const type = /\btype="module"/i.test(attrs) ? ' type="module"' : '';
    return `<script${type}>${safeScript(lookup(src))}</script>`;
  });
  out = out.replace(/<link\b[^>]*\brel="stylesheet"[^>]*\bhref="([^"]+)"[^>]*>/gi, (_m, href) => `<style>${safeStyle(lookup(href))}</style>`);
  out = out.replace(/<link\b[^>]*\brel="stylesheet"[^>]*>/gi, (m) => {
    const href = /\bhref="([^"]+)"/i.exec(m)?.[1];
    return href ? `<style>${safeStyle(lookup(href))}</style>` : m;
  });
  out = out.replace(/<link\b([^>]*)\brel="icon"([^>]*)>/gi, () =>
    faviconSvg ? `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${Buffer.from(faviconSvg, 'utf8').toString('base64')}" />` : '',
  );
  // check the page shell only (inlined code may well contain src="…" strings of its own)
  const shell = out.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '<script></script>').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '<style></style>');
  const left = /\b(?:src|href)="(?!data:|https?:|#)([^"]+)"/i.exec(shell);
  if (left) throw new Error(`offline build: ${left[1]} would need a separate file`);
  return out;
}

/**
 * "Dungeon Joe.cmd": opens DungeonJoe.html in its own full-screen app window (Edge, then Chrome, then the
 * default browser). Its own browser profile beside it keeps the saves, and `start /wait` keeps this process alive
 * while the game window is open, so Steam shows the game as running.
 */
export function launcherCmd() {
  return crlf(`@echo off
rem Dungeon Joe (offline copy): opens DungeonJoe.html in its own full-screen window.
rem The "profile" folder next to this file keeps your saves. This window stays open while you play so that
rem Steam knows the game is running; close the game (Alt+F4) and it closes too.
setlocal DisableDelayedExpansion
title Dungeon Joe
cd /d "%~dp0"
set "HERE=%~dp0"
set "GAME=%HERE%DungeonJoe.html"
set "PROFILE=%HERE%profile"
if not exist "%GAME%" goto missing

set "BROWSER="
if exist "%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\\Microsoft\\Edge\\Application\\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe" set "BROWSER=%ProgramFiles%\\Microsoft\\Edge\\Application\\msedge.exe"
if not defined BROWSER if exist "%LocalAppData%\\Microsoft\\Edge\\Application\\msedge.exe" set "BROWSER=%LocalAppData%\\Microsoft\\Edge\\Application\\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER=%ProgramFiles%\\Google\\Chrome\\Application\\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\\Google\\Chrome\\Application\\chrome.exe"
if not defined BROWSER if exist "%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe" set "BROWSER=%LocalAppData%\\Google\\Chrome\\Application\\chrome.exe"
if not defined BROWSER goto fallback

rem The page address: forward slashes; percent signs, hashes and spaces escaped (%%25, %%23, %%20).
set "URL=%GAME:\\=/%"
setlocal EnableDelayedExpansion
set "URL=!URL:%%=%%25!"
set "URL=!URL:#=%%23!"
set "URL=file:///!URL: =%%20!"
echo Dungeon Joe is running. Close the game window (Alt+F4) to quit.
start "" /wait "!BROWSER!" --app="!URL!" --start-fullscreen --user-data-dir="!PROFILE!" --no-first-run --no-default-browser-check --disable-background-mode --autoplay-policy=no-user-gesture-required --disable-features=Translate
endlocal
exit /b 0

:fallback
echo Microsoft Edge or Google Chrome was not found, so the game opens in your default browser.
start "" "%GAME%"
exit /b 0

:missing
echo DungeonJoe.html was not found. Keep "Dungeon Joe.cmd" in the same folder as DungeonJoe.html.
pause
exit /b 1
`);
}

/** README.txt: how to play, add it to Steam as a non-Steam game, and move saves. */
export function readmeTxt(version, built) {
  return crlf(`DUNGEON JOE - offline copy
==========================

Version ${version}, built ${built}.
For personal play: adding it to your own Steam library does not put it on the Steam store.
The newest version is always at https://josephjackman.com/games/dungeonjoe/


PLAY
----
1. Unzip this download into a folder you will keep, for example Documents\\Games\\Dungeon Joe
   (right-click the .zip > Extract All...). Do not play from inside the .zip.
2. Double-click "Dungeon Joe.cmd".
   It opens DungeonJoe.html full screen in its own window, using Microsoft Edge (or Google Chrome;
   if neither is installed, your default browser). A small black launcher window stays open while
   you play; leave it be. Alt+F4 quits. F11 leaves or enters full screen.

You can also double-click DungeonJoe.html to play in an ordinary browser tab, but that browser keeps
its saves apart from the launcher's.


ADD IT TO STEAM (your library only, not the Steam store)
----------------------------------------------------------
1. Open Steam.
2. Games menu > "Add a Non-Steam Game to My Library..."
3. Click "Browse..." and go to this folder. If "Dungeon Joe.cmd" is not listed, set the file
   type box at the bottom of the window to "All Files (*.*)".
4. Choose "Dungeon Joe.cmd", click Open, then click "Add Selected Programs".
   Steam lists it with a blank name and no icon: that is normal for a launcher that is not an .exe.
5. Name it and give it its icon: in your Library, right-click it > Properties. Type "Dungeon Joe" in
   the name box, click the blank icon square beside it and choose DungeonJoe.ico from this folder.
6. Optional: right-click > Manage > Set custom artwork for library images.
Tip: if your controller behaves oddly when the game is started from Steam, right-click it >
Properties > Controller > "Disable Steam Input".


SAVES
-----
- The launcher keeps this copy's saves in the "profile" folder next to it. They are separate from the
  website's saves.
- To move a character between the website and this copy: on the title screen open Load Character and
  press Export (it saves a .dungeonjoe.json file); on the other side choose "Import a .dungeonjoe.json".
- To update, unzip a newer download into the same folder. The "profile" folder (your saves) stays.


CO-OP
-----
Online co-op works just like on the website and needs an internet connection.
`);
}
