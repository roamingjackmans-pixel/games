// Balance harness (BUILD_BRIEF M15): scripted bots (greathammer, daggers, caster, cleric) play new characters
// through all eight zones: every combat room (re-fighting after a death), treasure chests, the anteroom
// bonfire, then the boss until it falls. They level up at bonfires and wear better drops. The report goes to
// docs/balance/campaigns.md (docs/BALANCE_REPORT.md is the curated write-up). `npm run balance` (RUNS=n bots per class, default 3; the brief's full pass is 50).
import { describe, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { GameSession } from '../../src/game/session';
import { newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';
import { Rng } from '../../src/engine/rng';
import { stepWorld } from '../../src/game/sim';
import { refreshDerived } from '../../src/game/player/player';
import { levelUp, equip } from '../../src/game/items/inventory';
import { itemRequirements, meetsRequirements } from '../../src/game/items/bases';
import { ZONES } from '../../src/data/zones';
import { newBot, botInput, type BotStyle } from './bot';
import type { ClassId, Item, StatId } from '../../src/game/types';
import type { Entity } from '../../src/game/world';

const RUNS = Number(process.env.RUNS ?? 5);
const MAX_ZONE = Number(process.env.MAX_ZONE ?? 8);
const ONLY = process.env.BOT ?? '';
const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const rarityIndex = (r: string): number => RARITIES.indexOf(r);
const ROOM_TIMEOUT_S = 150;
const BOSS_TIMEOUT_S = 300;
const MAX_ROOM_TRIES = 4;
const MAX_BOSS_TRIES = 12;

interface BotDef {
  name: string;
  cls: ClassId;
  style: BotStyle;
  stats: StatId[];
}
const BOTS: BotDef[] = [
  { name: 'greathammer', cls: 'brute', style: 'melee', stats: ['bonk', 'hp', 'bonk', 'endurance'] },
  { name: 'daggers', cls: 'duelist', style: 'melee', stats: ['slicey', 'endurance', 'hp', 'slicey'] },
  { name: 'caster', cls: 'scholar', style: 'caster', stats: ['brain', 'hp', 'brain', 'endurance'] },
  { name: 'cleric', cls: 'cleric', style: 'melee', stats: ['prayer', 'bonk', 'hp', 'prayer'] },
];

interface ZoneStats {
  deaths: number;
  roomS: number;
  bossTries: number;
  bossS: number;
  bossKilled: boolean;
  shards: number;
  drops: Record<string, number>;
  levelAtBoss: number;
  levelAtKill: number;
  grinds: number;
}

function spendShards(s: GameSession, p: Entity, order: StatId[]): void {
  const c = p.pl!.char;
  for (let i = 0; i < 400; i++) {
    const r = levelUp(c, order[i % order.length]!);
    if (!r.ok) break;
  }
  refreshDerived(p);
}

/** Wear anything better that fits: same weapon base, armor and off-hands by rarity and item level. */
function gearUp(p: Entity): void {
  const c = p.pl!.char;
  const score = (it: Item | null): number => (it ? rarityIndex(it.rarity) * 100 + it.ilvl : -1);
  for (const it of [...c.bag]) {
    if (!meetsRequirements(itemRequirements(it), c.stats, c.twoHanded)) continue;
    if (it.slot === 'main') {
      if (c.equipment.main && it.baseId === c.equipment.main.baseId && score(it) > score(c.equipment.main)) equip(c, it.id, 'main');
    } else if (it.slot === 'ring') {
      if (!c.equipment.ring1) equip(c, it.id, 'ring1');
      else if (!c.equipment.ring2) equip(c, it.id, 'ring2');
    } else if (it.slot === 'head' || it.slot === 'body' || it.slot === 'legs') {
      if (score(it) > score(c.equipment[it.slot])) equip(c, it.id, it.slot);
    }
  }
  if (c.bag.length > 50) c.bag.splice(0, c.bag.length - 50);
  refreshDerived(p);
}

function collectAll(s: GameSession, p: Entity, z: ZoneStats): void {
  for (const e of [...s.w.entities.values()]) {
    if (e.type !== 'pickup' || e.removed || !e.pk) continue;
    if (e.pk.forPlayer && e.pk.forPlayer !== p.pl!.playerId) continue;
    if (e.pk.kind === 'item' && e.pk.item) z.drops[e.pk.item.rarity] = (z.drops[e.pk.item.rarity] ?? 0) + 1;
    if (s.collect(p, e)) s.w.remove(e);
  }
}

/** Fight until the room is clear, the player dies, or time runs out. */
function fight(s: GameSession, bot: ReturnType<typeof newBot>, limitS: number, done: () => boolean): 'won' | 'died' | 'timeout' {
  for (let i = 0; i < limitS * 60; i++) {
    const p = s.localPlayer!;
    if (s.dead) return 'died';
    p.pl!.input = botInput(s.w, p, bot);
    stepWorld(s.w);
    s.w.events.length = 0;
    if (s.dead) return 'died';
    if (done()) return 'won';
  }
  return 'timeout';
}

function enterSide(s: GameSession, id: string): 'n' | 's' | 'e' | 'w' {
  return s.layout.byId[id]!.doors[0] ?? 's';
}

function playZone(s: GameSession, def: BotDef, z: number): ZoneStats {
  const st: ZoneStats = { deaths: 0, roomS: 0, bossTries: 0, bossS: 0, bossKilled: false, shards: 0, drops: {}, levelAtBoss: 0, levelAtKill: 0, grinds: 0 };
  const c = s.save.character;
  const shards0 = c.shards;
  let spent = 0;
  const bot = newBot(def.style);
  const rest = (bonfire: string): void => {
    const p = s.localPlayer!;
    const before = c.shards;
    s.rest(p, bonfire);
    spendShards(s, p, def.stats);
    spent += before - c.shards;
    gearUp(p);
  };
  rest(`z${z}-start`);
  const clearRooms = (): void => {
  for (const node of s.layout.rooms) {
    if (node.kind !== 'combat' && node.kind !== 'ambush' && node.kind !== 'treasure') continue;
    for (let tries = 0; tries < MAX_ROOM_TRIES; tries++) {
      s.enterRoom(node.id, enterSide(s, node.id));
      // walk in so the room arms
      const p = s.localPlayer!;
      p.x = 640;
      p.y = 368;
      const t0 = s.w.time;
      const r = fight(s, bot, ROOM_TIMEOUT_S, () => s.roomPhase === 'cleared' || (s.roomPhase === 'peace' && s.w.time - t0 > 2));
      st.roomS += s.w.time - t0;
      if (r === 'died') {
        st.deaths++;
        s.respawn();
        continue;
      }
      collectAll(s, s.localPlayer!, st);
      // open chests
      for (const e of [...s.w.entities.values()]) if (e.it?.kind === 'chest' && !e.it.used) s.interact(s.localPlayer!, e);
      collectAll(s, s.localPlayer!, st);
      break;
    }
  }
  };
  clearRooms();
  s.enterRoom(s.layout.anteroomId, 'bonfire');
  rest(`z${z}-boss`);
  st.levelAtBoss = c.level;
  for (let tries = 0; tries < MAX_BOSS_TRIES && !st.bossKilled; tries++) {
    st.bossTries++;
    s.enterRoom(s.layout.bossId, enterSide(s, s.layout.bossId));
    const t0 = s.w.time;
    const r = fight(s, bot, BOSS_TIMEOUT_S, () => s.roomPhase === 'cleared');
    st.bossS += s.w.time - t0;
    if (r === 'won') {
      st.bossKilled = true;
      st.levelAtKill = c.level;
      collectAll(s, s.localPlayer!, st);
    } else if (r === 'died') {
      st.deaths++;
      s.respawn();
      rest(`z${z}-boss`);
      // stuck: like a player would, go back through the zone for Shards and levels, then try again
      if (st.bossTries % 4 === 0 && st.bossTries < MAX_BOSS_TRIES) {
        st.grinds++;
        clearRooms();
        s.enterRoom(s.layout.anteroomId, 'bonfire');
        rest(`z${z}-boss`);
      }
    } else {
      // timed out: count as a failed attempt and reset
      s.die(s.localPlayer!);
      s.respawn();
    }
  }
  st.shards = c.shards - shards0 + spent;
  return st;
}

function median(xs: number[]): number {
  const a = [...xs].sort((x, y) => x - y);
  return a.length ? a[Math.floor(a.length / 2)]! : 0;
}

describe('balance harness', () => {
  it('bots play all zones and the report is written', () => {
    const rows: Record<string, Record<number, ZoneStats[]>> = {};
    for (const def of BOTS) {
      rows[def.name] = {};
      if (ONLY && def.name !== ONLY) continue;
      for (let run = 0; run < RUNS; run++) {
        const ch = newCharacter(def.cls, def.name, `bot-${def.name}-${run}`, new Rng(`${def.name}${run}`));
        ch.tutorialDone = true;
        const save = newSave(1, ch, `BAL-${def.name}-${run}`);
        const s = new GameSession(save);
        s.start();
        for (let z = 1; z <= MAX_ZONE; z++) {
          if (z > 1) s.gotoZone(z);
          const zs = playZone(s, def, z);
          (rows[def.name]![z] ??= []).push(zs);
          // a bot that cannot win after 12 attempts is carried on to the next zone (marked not cleared)
          if (z < 8) save.character.tutorialDone = true;
        }
      }
    }
    // ---- report
    const lines: string[] = [];
    lines.push('# Balance report (M15)', '');
    lines.push(`Generated by \`npm run balance\` (tests/sim/balance.sim.ts) with ${RUNS} campaign(s) per bot. Each bot starts a new`);
    lines.push('character of its class and plays zones 1–8 in order: every combat, ambush and treasure room (a death sends it');
    lines.push('back to the bonfire and it fights the room again, up to 4 times), rests at the anteroom, then fights the boss');
    lines.push('until it falls (up to 12 attempts). It levels up at every rest with its Shards and wears better drops.');
    lines.push('Bots react to telegraphs after 0.25 s, dodge Red hits, step out of Piercing areas and use pockets.');
    lines.push('Times are simulated seconds of fighting (no walking, menus or reading), so real play is longer.', '');
    lines.push('Targets (GAME_DESIGN §2.3, BUILD_BRIEF M15): deaths per zone rising gently; bosses 2–5 attempts; first clear ~3–4 h.', '');
    for (const def of BOTS) {
      lines.push(`## ${def.name} (${def.cls})`, '');
      lines.push('| Zone | Boss beaten | Deaths (median) | Level at boss | Level at kill | Re-clears | Room fighting (min) | Boss attempts (median) | Boss time per attempt (s) | Shards earned | Drops (C/U/R/E/L) |');
      lines.push('|---|---|---|---|---|---|---|---|---|---|---|');
      for (let z = 1; z <= 8; z++) {
        const list = rows[def.name]![z] ?? [];
        if (!list.length) {
          lines.push(`| ${z} ${ZONES[z - 1]!.name} | not reached | | | | | | | | | |`);
          continue;
        }
        const dr = (k: string): number => Math.round(list.reduce((a, b) => a + (b.drops[k] ?? 0), 0) / list.length);
        lines.push(
          `| ${z} ${ZONES[z - 1]!.name} | ${list.filter((x) => x.bossKilled).length}/${list.length} | ${median(list.map((x) => x.deaths))} | ${median(list.map((x) => x.levelAtBoss))} | ${median(list.filter((x) => x.bossKilled).map((x) => x.levelAtKill)) || '—'} | ${median(list.map((x) => x.grinds))} | ${(median(list.map((x) => x.roomS)) / 60).toFixed(1)} | ${median(list.map((x) => x.bossTries))} | ${Math.round(median(list.map((x) => x.bossS / Math.max(1, x.bossTries))))} | ${Math.round(median(list.map((x) => x.shards)))} | ${dr('common')}/${dr('uncommon')}/${dr('rare')}/${dr('epic')}/${dr('legendary')} |`,
        );
      }
      lines.push('');
    }
    mkdirSync('docs/balance', { recursive: true });
    writeFileSync(process.env.REPORT ?? 'docs/balance/campaigns.md', lines.join('\n') + '\n');
  });
});
