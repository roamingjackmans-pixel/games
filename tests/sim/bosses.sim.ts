// Boss sweep (part of the M15 harness): each bot, at the expected level for the zone plus 0/10/20/30 and with
// Rare gear at the zone's item level, fights each boss several times. The bots are weaker than a competent
// player, so the absolute numbers mean little; what matters is that every boss needs about the same margin
// over its expected level. Writes docs/balance/bosses.md (summarised in docs/BALANCE_REPORT.md).
import { it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { refreshDerived } from '../../src/game/player/player';
import { levelUp } from '../../src/game/items/inventory';
import { generateItem } from '../../src/game/items/generate';
import { ZONES } from '../../src/data/zones';
import { BOSSES } from '../../src/data/bosses';
import { newBot, botInput, type BotStyle } from './bot';
import type { ClassId, StatId } from '../../src/game/types';

const EXPECTED = [12, 22, 32, 42, 52, 62, 72, 80];
const TRIES = Number(process.env.TRIES ?? 4);
const BOTS: { name: string; cls: ClassId; style: BotStyle; stats: StatId[] }[] = [
  { name: 'greathammer', cls: 'brute', style: 'melee', stats: ['bonk', 'hp', 'bonk', 'stamina'] },
  { name: 'daggers', cls: 'duelist', style: 'melee', stats: ['slicey', 'stamina', 'hp', 'slicey'] },
  { name: 'caster', cls: 'scholar', style: 'caster', stats: ['brain', 'hp', 'brain', 'stamina'] },
  { name: 'cleric', cls: 'cleric', style: 'melee', stats: ['prayer', 'bonk', 'hp', 'prayer'] },
];

function fightOnce(cls: ClassId, style: BotStyle, stats: StatId[], zone: number, level: number, seed: string): { won: boolean; bossLeft: number; s: number } {
  const c = newCharacter(cls, 'bot', `b-${seed}`, new Rng(seed));
  c.tutorialDone = true;
  c.shards = 1e9;
  while (c.level < level) if (!levelUp(c, stats[c.level % stats.length]!).ok) break;
  c.shards = 0;
  c.flaskMax = Math.min(5, 1 + Math.floor((zone - 1) / 2));
  c.flaskCur = c.flaskMax;
  // Rare gear of the same bases at the zone's item level
  for (const slot of ['main', 'off', 'head', 'body', 'legs'] as const) {
    const it = c.equipment[slot];
    if (it) c.equipment[slot] = generateItem(new Rng(`${seed}${slot}`), { source: 'boss', ilvl: zone, zone, rarity: 'rare', baseId: it.baseId });
  }
  const save = newSave(1, c, `SWEEP-${seed}`);
  save.world.zone = zone;
  save.world.respawnBonfireId = `z${zone}-start`;
  const s = new GameSession(save);
  s.start();
  refreshDerived(s.localPlayer!);
  s.enterRoom(s.layout.bossId, s.layout.byId[s.layout.bossId]!.doors[0]!);
  const bot = newBot(style);
  const t0 = s.w.time;
  for (let i = 0; i < 300 * 60; i++) {
    const p = s.localPlayer!;
    p.pl!.input = botInput(s.w, p, bot);
    stepWorld(s.w);
    s.w.events.length = 0;
    if (s.dead || s.roomPhase === 'cleared') break;
  }
  const b = s.w.get(s.w.bossId);
  return { won: s.roomPhase === 'cleared', bossLeft: b?.hp ? b.hp.hp / b.hp.max : 0, s: s.w.time - t0 };
}

it('boss sweep', () => {
  const lines = ['| Boss | Bot | +0 | +10 | +20 | +30 |', '|---|---|---|---|---|---|'];
  for (let z = 1; z <= 8; z++) {
    const boss = BOSSES[ZONES[z - 1]!.boss]!;
    for (const b of BOTS) {
      const cells: string[] = [];
      for (const extra of [0, 10, 20, 30]) {
        let wins = 0;
        let left = 0;
        for (let k = 0; k < TRIES; k++) {
          const r = fightOnce(b.cls, b.style, b.stats, z, Math.min(250, EXPECTED[z - 1]! + extra), `${z}${b.name}${extra}${k}`);
          if (r.won) wins++;
          left += r.bossLeft;
        }
        cells.push(`${wins}/${TRIES} (${Math.round((left / TRIES) * 100)}% left)`);
      }
      lines.push(`| ${boss.name} (lv ${EXPECTED[z - 1]}) | ${b.name} | ${cells.join(' | ')} |`);
    }
  }
  mkdirSync('docs/balance', { recursive: true });
  writeFileSync(process.env.REPORT ?? 'docs/balance/bosses.md', lines.join('\n') + '\n');
});
