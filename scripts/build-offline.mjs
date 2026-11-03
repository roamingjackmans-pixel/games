// `npm run build`, step 2 (after `vite build`): the offline download for a personal Steam library.
// A second Vite build in memory (mode "offline", relative base, no code splitting, so Trystero's dynamically
// imported strategies are inlined too) becomes one self-contained DungeonJoe.html that runs from file://. It is
// zipped with a Windows launcher and a README into dist/dungeonjoe-offline.zip, which GitHub Pages serves next to
// the game (the Settings → Game tab links to it). Node built-ins only for the zip (scripts/zip.mjs).
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { inlineHtml, launcherCmd, readmeTxt } from './offline-files.mjs';
import { makeZip } from './zip.mjs';
import { encodePng, iconIco, renderIcon } from './icon.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const ZIP_NAME = 'dungeonjoe-offline.zip';

const t0 = Date.now();
const result = await build({
  root,
  configFile: resolve(root, 'vite.config.ts'),
  mode: 'offline',
  base: './',
  logLevel: 'warn',
  build: {
    write: false,
    outDir: resolve(root, 'node_modules/.cache/dj-offline'),
    emptyOutDir: false,
    copyPublicDir: false,
    sourcemap: false,
    modulePreload: false,
    cssCodeSplit: false,
    assetsInlineLimit: () => true,
    reportCompressedSize: false,
    rolldownOptions: { output: { codeSplitting: false } },
  },
});

const outputs = (Array.isArray(result) ? result : [result]).flatMap((r) => r.output ?? []);
const files = new Map();
let html = null;
for (const o of outputs) {
  if (o.type === 'chunk') files.set(o.fileName, o.code);
  else if (o.fileName === 'index.html') html = typeof o.source === 'string' ? o.source : Buffer.from(o.source).toString('utf8');
  else files.set(o.fileName, typeof o.source === 'string' ? o.source : Buffer.from(o.source).toString('utf8'));
}
if (!html) throw new Error('offline build: Vite produced no index.html');
const chunks = outputs.filter((o) => o.type === 'chunk');
// one chunk = every dynamic import() was inlined (a file:// page cannot fetch a second module)
if (chunks.length !== 1) throw new Error(`offline build: expected one script chunk, got ${chunks.length} (${chunks.map((c) => c.fileName).join(', ')})`);

const faviconPath = resolve(root, 'public/favicon.svg');
const favicon = existsSync(faviconPath) ? readFileSync(faviconPath, 'utf8') : null;
const page = inlineHtml(html, files, favicon);

const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const built = new Date().toISOString().slice(0, 10);
const zip = makeZip([
  { name: 'DungeonJoe.html', data: page },
  { name: 'Dungeon Joe.cmd', data: launcherCmd() },
  // Steam reads no name or icon from a .cmd, so the icon comes beside it to pick in Properties (D133)
  { name: 'DungeonJoe.ico', data: iconIco() },
  // Steam's Properties icon box takes .png, not .ico (D139)
  { name: 'DungeonJoe.png', data: encodePng(256, renderIcon(256)) },
  { name: 'README.txt', data: readmeTxt(pkg.version, built) },
]);
mkdirSync(dist, { recursive: true });
const zipPath = resolve(dist, ZIP_NAME);
writeFileSync(zipPath, zip);
const kb = (n) => `${(n / 1024).toFixed(0)} kB`;
console.log(`offline build: dist/${ZIP_NAME} (${kb(statSync(zipPath).size)}; DungeonJoe.html ${kb(Buffer.byteLength(page))}) in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
