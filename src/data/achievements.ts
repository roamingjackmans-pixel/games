// Achievements (GAME_DESIGN §20): account-wide, across all ten save slots. Each one reads the tracker's
// counters (src/game/achievements.ts keeps them in `dj.achievements`); none of them special-cases a save.
// Counter keys: kills, deaths, parries, riposteKills, level, glowen, party, encumberedS (longest unbroken
// stretch, seconds), credits, instructor, mimicKill, mimicDeath, legendary, fullSet, gemMax, flaskless,
// fists, revive, gary, garyGone, ng1, ng2, boss:<bossId>, class:<classId>, clean:<zone>.
import type { ClassId } from '../game/types';

/** What a check can see: the counters and the achievements already unlocked. */
export interface AchView {
  count(key: string): number;
  has(id: string): boolean;
}

/** Icons are drawn in code (src/ui/achievements.ts). */
export type AchIcon =
  | 'sword'
  | 'skull'
  | 'crown'
  | 'mortarboard'
  | 'stairs'
  | 'cycle'
  | 'helm'
  | 'chest'
  | 'star'
  | 'armor'
  | 'gem'
  | 'shield'
  | 'dagger'
  | 'flask'
  | 'broom'
  | 'fist'
  | 'heart'
  | 'party'
  | 'level'
  | 'coin'
  | 'weight'
  | 'cart'
  | 'shard';

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: AchIcon;
  /** shown as "???" until unlocked */
  hidden?: boolean;
  check(s: AchView): boolean;
  /** a progress bar: [current, target] */
  progress?(s: AchView): [number, number];
}

export const DARK_SHARD = 'dark_shard';

/** Reach `target` on a counter (with a progress bar when the target is above 1). */
function reach(id: string, name: string, desc: string, icon: AchIcon, key: string, target: number, hidden = false): AchievementDef {
  const d: AchievementDef = { id, name, desc, icon, check: (s) => s.count(key) >= target };
  if (target > 1) d.progress = (s) => [Math.min(target, s.count(key)), target];
  if (hidden) d.hidden = true;
  return d;
}

/** Something that happened at least once. */
function once(id: string, name: string, desc: string, icon: AchIcon, key: string, hidden = false): AchievementDef {
  return reach(id, name, desc, icon, key, 1, hidden);
}

const boss = (bossId: string, name: string, desc: string): AchievementDef => once(`boss_${bossId}`, name, desc, 'crown', `boss:${bossId}`);
const cls = (classId: ClassId, name: string, desc: string): AchievementDef => once(`class_${classId}`, name, desc, 'helm', `class:${classId}`);

const CLEAN_ZONES = [1, 2, 3, 4, 5, 6, 7, 8];
const cleanCount = (s: AchView): number => CLEAN_ZONES.filter((z) => s.count(`clean:${z}`) > 0).length;

export const ACHIEVEMENTS: AchievementDef[] = [
  // ---- killing things
  once('first_blood', 'Tenant Dispute', 'Kill your first enemy. Training dummies do not count; they never fought back.', 'sword', 'kills'),
  reach('kills_100', 'Pest Control', 'Kill 100 enemies.', 'sword', 'kills', 100),
  reach('kills_1000', 'Eviction Officer', 'Kill 1,000 enemies.', 'sword', 'kills', 1000),
  reach('kills_5000', 'Rent Collector', 'Kill 5,000 enemies. The Landlord would like a word about your methods.', 'skull', 'kills', 5000),

  // ---- the eight bosses and the Instructor
  boss('the_caretaker', 'Plot Twist', 'Defeat The Caretaker.'),
  boss('mother_spore', 'Fungicide', 'Defeat Mother Spore.'),
  boss('bloatking', 'Plumbing Emergency', 'Defeat The Bloatking.'),
  boss('vexthorn', 'Oh Deer', 'Defeat Vexthorn, the Hollow Stag.'),
  boss('foreman_ignatius', 'Health and Safety Violation', 'Defeat Foreman Ignatius.'),
  boss('saint_aurelia', 'Defrosted', 'Defeat Saint Aurelia the Unthawed.'),
  boss('archmagister_tock', 'Out of Time', 'Defeat Archmagister Tock.'),
  boss('the_landlord', 'Lease Terminated', 'Defeat The Landlord.'),
  once('instructor', "Teacher's Pet", 'Beat The Instructor. He did not let you win. He says.', 'mortarboard', 'instructor'),

  // ---- the end, and the end again
  once('beat_game', 'Fuse Box Found', 'Climb out of the Abyss and sit through the credits.', 'stairs', 'credits'),
  once('ng_plus', 'Sublet', 'Defeat The Landlord on New Game+ (Cycle 2).', 'cycle', 'ng1'),
  once('ng_plus_2', 'Month-to-Month Forever', 'Defeat The Landlord on New Game+2 (Cycle 3). Three clears. Go outside.', 'cycle', 'ng2'),

  // ---- every class finishes a zone
  cls('knight', 'Knight Shift', 'Finish a zone (beat its boss) as a Knight.'),
  cls('brute', 'Blunt Instrument', 'Finish a zone as a Brute.'),
  cls('duelist', 'En Garde, En Route', 'Finish a zone as a Duelist.'),
  cls('scholar', 'Required Reading', 'Finish a zone as a Scholar.'),
  cls('cleric', 'Thoughts and Pyres', 'Finish a zone as a Pyre Priest.'),
  cls('spearman', 'Hit the Books', 'Finish a zone as a Battlemage.'),
  cls('hunter', 'Long-Distance Relationship', 'Finish a zone as a Hunter.'),
  cls('nobody', 'Nobody Did It', 'Finish a zone as a Nobody.'),
  cls('berserker', 'Anger Management', 'Finish a zone as a Berserker.'),
  cls('occultist', 'Early Riser', 'Finish a zone as a Zealot.'),

  // ---- dying, which is most of it
  once('die_1', 'First Eviction Notice', 'Die. It happens.', 'skull', 'deaths'),
  reach('die_25', 'Repeat Tenant', 'Die 25 times.', 'skull', 'deaths', 25),
  reach('die_100', "Squatter's Rights", 'Die 100 times. At this point you live here.', 'skull', 'deaths', 100),
  once('mimic_death', 'Read the Small Print', 'Be killed by a mimic.', 'chest', 'mimicDeath', true),
  once('mimic_kill', 'Chest Day', 'Kill a mimic.', 'chest', 'mimicKill'),

  // ---- loot
  once('legendary', 'Glows Orange', 'Find a legendary item.', 'star', 'legendary'),
  once('full_set', 'Matching Outfit', 'Wear a full armor set from below the Crypt: head, body and legs of one set. The starter rags do not count.', 'armor', 'fullSet'),
  once('gem_max', 'Hard Pressed', 'Own a Tier 5 gem: a gem perk at its maximum.', 'gem', 'gemMax'),

  // ---- getting good
  reach('parry_50', 'Not Today', 'Parry 50 attacks.', 'shield', 'parries', 50),
  reach('riposte_10', 'Rebuttal', 'Kill 10 enemies with a riposte.', 'dagger', 'riposteKills', 10),
  once('flaskless', 'Dry January', "Defeat a boss without drinking from Joe's Thermos.", 'flask', 'flaskless'),
  {
    id: 'clean_zone',
    name: 'Spotless',
    desc: 'Clear a zone, from the stairs down to its boss, without dying.',
    icon: 'broom',
    check: (s) => cleanCount(s) >= 1,
  },
  {
    id: 'clean_all',
    name: 'Damage Deposit Returned',
    desc: 'Clear each of the 8 zones without dying in it (one zone at a time is fine).',
    icon: 'broom',
    check: (s) => cleanCount(s) >= 8,
    progress: (s) => [cleanCount(s), 8],
  },
  once('fists', 'Bare-Knuckle Tenant', 'Defeat a boss with nothing in your weapon hand. The Nobody has a head start: nothing.', 'fist', 'fists', true),

  // ---- co-op
  once('revive', 'Get Up, Joe', 'Revive a fallen friend in co-op.', 'heart', 'revive'),
  reach('party_4', 'Full House', 'Play in a four-player party.', 'party', 'party', 4),

  // ---- getting big
  reach('level_50', 'Middle Management', 'Reach level 50.', 'level', 'level', 50),
  reach('level_100', 'Senior Tenant', 'Reach level 100.', 'level', 'level', 100),
  reach('glowen_10k', 'Hoarder', 'Hold 10,000 Glowen at once.', 'coin', 'glowen', 10000),
  reach('encumbered', 'Pack Mule', 'Stay Encumbered for a whole minute. Slowly.', 'weight', 'encumberedS', 60, true),

  // ---- Gary
  once('gary_found', 'Gary!', 'Find Gary.', 'cart', 'gary'),
  once('gary_gone', "Banned from Gary's", 'Hit Gary until he packs up and leaves. He will remember this.', 'cart', 'garyGone', true),

  // ---- everything
  {
    id: DARK_SHARD,
    name: 'The Dark Shard',
    desc: 'Unlock every other achievement. It is dark. It is a shard. It does nothing. You earned it.',
    icon: 'shard',
    check: (s) => ACHIEVEMENTS.every((a) => a.id === DARK_SHARD || s.has(a.id)),
    progress: (s) => [ACHIEVEMENTS.filter((a) => a.id !== DARK_SHARD && s.has(a.id)).length, ACHIEVEMENTS.length - 1],
  },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
