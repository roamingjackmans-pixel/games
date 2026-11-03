import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

/**
 * The version shown in the corner (and checked between co-op players): package.json's major.minor, then the git
 * commit count, so every pushed change shows a new number without anyone bumping it by hand (CI checks out the
 * full history for this). Falls back to package.json's own patch number when git is not available.
 */
function gameVersion(): string {
  const [major = '1', minor = '0', patch = '0'] = pkg.version.split('.');
  try {
    const n = execSync('git rev-list --count HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (/^\d+$/.test(n)) return `${major}.${minor}.${n}`;
  } catch {
    // no git (a source zip): keep the package version
  }
  return `${major}.${minor}.${patch}`;
}

export default defineConfig({
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
