// Run modifiers (D452): the twists of a FlashGames daily run (src/flash, GAME_DESIGN §25). The systems a modifier
// touches read them here. Nothing sets them in the normal game, where every value is neutral (× 1, + 0, off), so the
// game plays exactly as it did; only the FlashGames boot (src/flash/setup.ts) ever calls setRunMods.

export interface RunMods {
  /** Glass Joe: every player's max HP is exactly this (null: what the stats and gear give) */
  playerMaxHp: number | null;
  /** max HP × (Tiny / Huge Joe) */
  playerHpMult: number;
  /** + damage % on every weapon hit (Huge Joe) */
  playerDmgPct: number;
  /** walking speed × */
  playerWalkMult: number;
  /** the player's drawn size and the hit circle at the feet (D262), × */
  playerSize: number;
  /** the player's body circle (walls, bodies, pickups), × */
  playerBody: number;
  /** melee reach ×, on top of proficiency (D178) */
  playerReach: number;
  /** Paper Horde: every room enemy (never a boss or a special NPC) has 1 HP */
  enemyOneHp: boolean;
  /** Paper Horde: a room's waves come this many times over */
  waveRepeat: number;
  /** Elite Squad: every planned enemy that can be an Elite is one */
  allElite: boolean;
  /** Mimic Mania: every chest is a mimic, and every combat room has one */
  allMimic: boolean;
  /** Bottomless Thermos: a drink uses no charge */
  flaskFree: boolean;
  /** Dry Spell: no Thermos at all */
  noFlask: boolean;
  /** Seeing Red: every plain enemy attack is Red (Piercing ones stay Piercing: nothing is both) */
  allRed: boolean;
  /** Piñata Party: every enemy killed drops an item */
  dropAll: boolean;
  /** spell cooldowns × */
  spellCooldownMult: number;
  /** Spells Only: no weapon can be equipped (staffs and talismans can) */
  noWeapons: boolean;
  /** Boss Rush Hour: every Nth combat room of a zone holds a challenger boss instead of waves (0: off) */
  bossEvery: number;
}

export function neutralRunMods(): RunMods {
  return {
    playerMaxHp: null,
    playerHpMult: 1,
    playerDmgPct: 0,
    playerWalkMult: 1,
    playerSize: 1,
    playerBody: 1,
    playerReach: 1,
    enemyOneHp: false,
    waveRepeat: 1,
    allElite: false,
    allMimic: false,
    flaskFree: false,
    noFlask: false,
    allRed: false,
    dropAll: false,
    spellCooldownMult: 1,
    noWeapons: false,
    bossEvery: 0,
  };
}

const NEUTRAL: Readonly<RunMods> = Object.freeze(neutralRunMods());
let current: Readonly<RunMods> = NEUTRAL;
const listeners: ((m: Readonly<RunMods>) => void)[] = [];

/** The modifiers in force (neutral unless a FlashGames run set them). */
export function runMods(): Readonly<RunMods> {
  return current;
}

/** Set the run's modifiers (null: back to neutral, for tests). */
export function setRunMods(m: RunMods | null): void {
  current = m ? Object.freeze({ ...m }) : NEUTRAL;
  for (const f of listeners) f(current);
}

/** Called now and whenever the modifiers change (the player module keeps its hit-circle constants in step). */
export function onRunModsChange(f: (m: Readonly<RunMods>) => void): void {
  listeners.push(f);
  f(current);
}
