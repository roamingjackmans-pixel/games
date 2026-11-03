import { defineConfig, type Plugin } from 'vite';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { appIcons } from './scripts/icon.mjs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

/**
 * The version shown in the corner (and checked between co-op players): package.json's major.minor, then the number
 * of commits since package.json's version last changed (D132), so the bump commit itself is X.Y.0 and every pushed
 * change after it shows a new number without anyone touching it (CI checks out the full history for this). Falls
 * back to package.json's own patch number when git is not available.
 */
function gameVersion(): string {
  const [major = '1', minor = '0', patch = '0'] = pkg.version.split('.');
  try {
    // arguments as a list (no shell), so the quotes in the pattern survive on Windows and in CI alike
    const git = (...args: string[]): string => execFileSync('git', args, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    // the commit that last changed the version line in package.json (empty when it never did)
    const base = git('log', '-1', '--format=%H', '-G"version":', '--', 'package.json');
    const n = base ? git('rev-list', '--count', `${base}..HEAD`) : git('rev-list', '--count', 'HEAD');
    if (/^\d+$/.test(n)) return `${major}.${minor}.${n}`;
  } catch {
    // no git (a source zip): keep the package version
  }
  return `${major}.${minor}.${patch}`;
}

/**
 * The installable app's PNG icons (D135), drawn in code by scripts/icon.mjs: written into the build next to
 * manifest.webmanifest, and served by the dev server so installing works there too. Drawn once, on first use.
 */
function appIconsPlugin(): Plugin {
  let icons: Record<string, Buffer> | null = null;
  const all = (): Record<string, Buffer> => (icons ??= appIcons());
  return {
    name: 'dungeonjoe-app-icons',
    // the offline single-file copy cannot install, so it needs no icons
    apply: (_config, env) => env.mode !== 'offline',
    configureServer(server) {
      const base = server.config.base;
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0]!;
        if (!path.startsWith(base + 'icons/')) return next();
        const png = all()[path.slice(base.length)];
        if (!png) return next();
        res.setHeader('Content-Type', path.endsWith('.ico') ? 'image/x-icon' : 'image/png');
        res.end(png);
      });
    },
    generateBundle() {
      for (const [fileName, source] of Object.entries(all())) this.emitFile({ type: 'asset', fileName, source });
    },
  };
}

export default defineConfig({
  plugins: [appIconsPlugin()],
  base: '/games/dungeonjoe/',
  define: {
    __GAME_VERSION__: JSON.stringify(gameVersion()),
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
});
