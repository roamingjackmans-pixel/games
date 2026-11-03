// Puts the other games on the /games/ site, each in its own folder next to dungeonjoe/.
//
//   node deploy/assemble.mjs build <dir>   copies every game in deploy/library.json into <dir>/<folder>/
//                                          and writes <dir>/library.json (which commit each game came from)
//   node deploy/assemble.mjs check         prints changed=true when a game has a newer commit than the
//                                          live site (used by .github/workflows/library-watch.yml)
//
// A game from another repo comes from that repo's `ready` branch: the newest commit that passed its own
// checks (its workflow moves `ready` forward). A repo with no `ready` branch yet uses `main`.
// A game with `local` set is kept in this repo (The Infinite Hive has no repo of its own).
//
// library.json fields: folder (where it goes under /games/), repo, publish (the folder in that repo to put
// online), fullHistory (clone every commit, for a version number that counts them), replace (text swaps
// made before publishing, skipped when the text isn't there), stamp (run the repo's tools/stamp-build.mjs).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LIVE = 'https://josephjackman.com/games/library.json';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const library = JSON.parse(fs.readFileSync(path.join(here, 'library.json'), 'utf8'));
const remote = library.games.filter((g) => g.repo);

const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
const url = (game) => `https://github.com/${library.owner}/${game.repo}.git`;

/** The branch and commit each remote game publishes from. */
function sources() {
  const out = {};
  for (const game of remote) {
    const heads = Object.fromEntries(
      run('git', ['ls-remote', url(game), 'refs/heads/ready', 'refs/heads/main'])
        .split('\n')
        .filter(Boolean)
        .map((line) => {
          const [sha, ref] = line.split('\t');
          return [ref.replace('refs/heads/', ''), sha];
        }),
    );
    const branch = heads.ready ? 'ready' : 'main';
    if (!heads[branch]) throw new Error(`${game.repo} has no main branch`);
    out[game.folder] = { repo: game.repo, branch, commit: heads[branch] };
  }
  return out;
}

async function check() {
  const want = sources();
  let have = {};
  try {
    const res = await fetch(`${LIVE}?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) have = (await res.json()).games ?? {};
  } catch {
    /* nothing live yet: everything counts as changed */
  }
  const changed = Object.keys(want).filter((folder) => have[folder]?.commit !== want[folder].commit);
  for (const folder of changed) console.error(`${folder}: ${have[folder]?.commit?.slice(0, 7) ?? 'none'} -> ${want[folder].commit.slice(0, 7)}`);
  if (!changed.length) console.error('Every game is up to date.');
  console.log(`changed=${changed.length > 0}`);
}

function build(dir) {
  if (!dir) throw new Error('usage: node deploy/assemble.mjs build <dir>');
  const out = path.resolve(dir);
  const from = sources();
  const record = {};
  for (const game of library.games) {
    const target = path.join(out, game.folder);
    if (fs.existsSync(target)) throw new Error(`${game.folder}/ is already taken in ${out}`);
    if (game.local) {
      fs.cpSync(path.join(root, game.local), target, { recursive: true });
      record[game.folder] = { repo: 'games', path: game.local };
      console.log(`${game.folder}: from ${game.local}`);
      continue;
    }
    const src = from[game.folder];
    const work = fs.mkdtempSync(path.join(os.tmpdir(), `${game.folder}-`));
    try {
      run('git', ['clone', '--quiet', ...(game.fullHistory ? [] : ['--depth', '1']), '--branch', src.branch, url(game), work]);
      const commit = run('git', ['rev-parse', 'HEAD'], work);
      for (const swap of game.replace ?? []) {
        const file = path.join(work, swap.file);
        const text = fs.readFileSync(file, 'utf8');
        if (text.includes(swap.from)) fs.writeFileSync(file, text.split(swap.from).join(swap.to));
        else console.log(`${game.folder}: "${swap.from}" not in ${swap.file}, left as is`);
      }
      if (game.stamp) console.log(`${game.folder}: ${run('node', ['tools/stamp-build.mjs', game.publish, commit.slice(0, 7)], work)}`);
      fs.cpSync(path.join(work, game.publish), target, { recursive: true });
      record[game.folder] = { repo: game.repo, branch: src.branch, commit };
      console.log(`${game.folder}: ${game.repo}@${src.branch} ${commit.slice(0, 7)}`);
    } finally {
      fs.rmSync(work, { recursive: true, force: true });
    }
  }
  fs.writeFileSync(path.join(out, 'library.json'), JSON.stringify({ built: new Date().toISOString(), games: record }, null, 2) + '\n');
}

const [command, arg] = process.argv.slice(2);
if (command === 'check') await check();
else if (command === 'build') build(arg);
else {
  console.error('usage: node deploy/assemble.mjs build <dir> | check');
  process.exit(1);
}
