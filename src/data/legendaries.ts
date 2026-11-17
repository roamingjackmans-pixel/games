// CONTENT_ITEMS §9: legendary powers (one per Legendary item) and legendary proper names.

export type PowerSlot = 'weapon' | 'armor' | 'legs' | 'shield' | 'staff' | 'talisman' | 'tool';

export interface LegendaryPower {
  id: string;
  name: string;
  on: PowerSlot[];
  text: string;
}

export const LEGENDARY_POWERS: Record<string, LegendaryPower> = {
  mirror_face: { id: 'mirror_face', name: 'Mirror Face', on: ['shield'], text: 'Parried projectiles return with ×2 damage.' },
  warden: { id: 'warden', name: 'Warden', on: ['shield'], text: 'Each blocked hit heals allies within 120 px by 1% of their max HP.' },
  unyielding: { id: 'unyielding', name: 'Unyielding', on: ['shield'], text: 'Stability costs −40%; cannot be guard-broken by hits under 10% of your max HP.' },
  echo: { id: 'echo', name: 'Echo', on: ['staff', 'talisman'], text: '10% chance a cast repeats itself for free 0.4 s later.' },
  font: { id: 'font', name: 'Font', on: ['staff', 'talisman'], text: 'Spells cost no stamina while you are above 80% HP.' },
  litany: { id: 'litany', name: 'Litany', on: ['talisman'], text: 'Your heals also restore 10% stamina to their targets.' },
  overcharge: { id: 'overcharge', name: 'Overcharge', on: ['staff'], text: 'Spells deal +25% but you take +10% damage.' },
  thunderclap: { id: 'thunderclap', name: 'Thunderclap', on: ['weapon'], text: 'Every 4th hit chains Lightning to 3 enemies ×0.8.' },
  sunder: { id: 'sunder', name: 'Sunder', on: ['weapon'], text: 'Skills ignore 30% of enemy defense.' },
  second_wind: { id: 'second_wind', name: 'Second Wind', on: ['weapon'], text: 'A kill refunds 20 stamina.' },
  hungering: { id: 'hungering', name: 'Hungering', on: ['weapon'], text: 'Heal 1.6% of max HP a hit (lifesteal), −10% max HP.' },
  momentum: { id: 'momentum', name: 'Momentum', on: ['weapon'], text: 'Each consecutive hit without being hit: +3% damage (max 10).' },
  riposte_master: { id: 'riposte_master', name: 'Riposte Master', on: ['weapon'], text: 'Ripostes deal ×4 and heal 5%.' },
  spellsword: { id: 'spellsword', name: 'Spellsword', on: ['weapon'], text: 'Spells cast within 2 s after a light attack cost no stamina.' },
  timekeeper: { id: 'timekeeper', name: 'Timekeeper', on: ['weapon'], text: 'Dodge recharge −1 s (floor 3 s).' },
  mimics_tooth: { id: 'mimics_tooth', name: "Mimic's Tooth", on: ['weapon'], text: 'Chests have a 0% mimic chance; mimics you attack first take ×2.' },
  // D388: eleven more weapon powers, so each class's four legendaries carry four different ones
  executioner: { id: 'executioner', name: 'Executioner', on: ['weapon'], text: '+40% damage to enemies below 25% HP.' },
  giant_slayer: { id: 'giant_slayer', name: 'Giant Slayer', on: ['weapon'], text: '+25% damage to bosses and Elites.' },
  last_stand: { id: 'last_stand', name: 'Last Stand', on: ['weapon'], text: 'Below 30% of your HP: +30% damage.' },
  featherweight: { id: 'featherweight', name: 'Featherweight', on: ['weapon'], text: 'Swings cost 25% less stamina.' },
  quickdraw: { id: 'quickdraw', name: 'Quickdraw', on: ['weapon'], text: '+15% attack speed.' },
  shatterpoint: { id: 'shatterpoint', name: 'Shatterpoint', on: ['weapon'], text: '+50% poise damage.' },
  bloodletter: { id: 'bloodletter', name: 'Bloodletter', on: ['weapon'], text: 'Every hit builds Bleed 15.' },
  kindling: { id: 'kindling', name: 'Kindling', on: ['weapon'], text: 'Every hit builds Burn 12.' },
  frostbite: { id: 'frostbite', name: 'Frostbite', on: ['weapon'], text: 'Every hit builds Chill 12.' },
  static_charge: { id: 'static_charge', name: 'Static Charge', on: ['weapon'], text: 'Every hit builds Shock 12.' },
  bounty_hunter: { id: 'bounty_hunter', name: 'Bounty Hunter', on: ['weapon'], text: '+25% Shards from kills.' },
  // D439: ten more, so no power sits on more than four weapon classes
  backbreaker: { id: 'backbreaker', name: 'Backbreaker', on: ['weapon'], text: '+35% damage to staggered enemies.' },
  first_blood: { id: 'first_blood', name: 'First Blood', on: ['weapon'], text: '+50% damage to enemies at full HP.' },
  long_shot: { id: 'long_shot', name: 'Long Shot', on: ['weapon'], text: 'Your shots lose no damage with distance and deal +20% past 250 px.' },
  finisher: { id: 'finisher', name: 'Finisher', on: ['weapon'], text: 'The last hit of your attack chain deals +40%.' },
  counterstep: { id: 'counterstep', name: 'Counterstep', on: ['weapon'], text: 'Your first hit within 1.5 s of a dodge deals +40%.' },
  reapers_due: { id: 'reapers_due', name: "Reaper's Due", on: ['weapon'], text: 'A kill heals 4% of your max HP.' },
  smite: { id: 'smite', name: 'Smite', on: ['weapon'], text: '+30% damage to undead.' },
  drillmaster: { id: 'drillmaster', name: 'Drillmaster', on: ['weapon'], text: 'Weapon skills come back 20% faster.' },
  whirlwind: { id: 'whirlwind', name: 'Whirlwind', on: ['weapon'], text: '+15% damage for each other enemy within 150 px of you (up to +45%).' },
  venom: { id: 'venom', name: 'Venom', on: ['weapon'], text: 'Every hit builds Poison 12.' },
  moss_mantle: { id: 'moss_mantle', name: 'Moss Mantle', on: ['armor', 'legs'], text: 'Statuses build 40% slower.' },
  hollow_guard: { id: 'hollow_guard', name: 'Hollow Guard', on: ['armor', 'legs'], text: 'Below 30% HP: −30% damage taken.' },
  cowards_comfort: { id: 'cowards_comfort', name: "Coward's Comfort", on: ['armor', 'legs'], text: 'Dodging grants 1 s of +40% move speed.' },
  lucky_socks: { id: 'lucky_socks', name: "Joe's Lucky Socks", on: ['legs'], text: '+1 flask charge (not above 5).' },
};

/**
 * D388: every legendary weapon's name carries its own power (each class's four legendaries, four different powers).
 * D439: no power is on more than four weapon classes, each chosen for how those classes play.
 * A legendary weapon gets the power of the name it rolls; a name not listed here rolls a power as before.
 */
export const LEGENDARY_WEAPON_POWERS: Record<string, string> = {
  // Greathammer
  "Landlord's Gavel": 'sunder',
  'Noise Complaint': 'shatterpoint',
  'The Big One': 'giant_slayer',
  'Load-Bearing Wall': 'backbreaker',
  // Greataxe
  'The Severance Package': 'executioner',
  'Lumberjack Retirement Plan': 'reapers_due',
  Firewood: 'kindling',
  'Timber!': 'whirlwind',
  // Colossal Sword
  Overcompensation: 'giant_slayer',
  'The Door': 'backbreaker',
  'Small Talk': 'reapers_due',
  'Big Energy': 'last_stand',
  // Crossbow
  'Second Opinion': 'first_blood',
  'The Notary': 'mimics_tooth',
  Quarrelsome: 'long_shot',
  'Bolt From the Blue': 'static_charge',
  // Club
  'Stick of Destiny': 'thunderclap',
  'Problem Solver': 'shatterpoint',
  'Original Recipe': 'bounty_hunter',
  'Club Membership': 'featherweight',
  // Twin Daggers
  'Paper Cut': 'bloodletter',
  'The Fine Print': 'venom',
  'Mr. and Mrs. Stabby': 'finisher',
  Backstabbers: 'first_blood',
  // Rapier
  'Strongly Worded Letter': 'riposte_master',
  'En Garde': 'counterstep',
  'The Point': 'quickdraw',
  'Touché': 'finisher',
  // Katana
  'Moonlight Shift': 'frostbite',
  Overtime: 'momentum',
  'Folded Laundry': 'counterstep',
  'Paper Thin': 'bloodletter',
  // Bow
  'Long Distance Relationship': 'long_shot',
  'Return to Sender': 'first_blood',
  'Cupid Retired': 'hungering',
  'Arrow Minded': 'quickdraw',
  // Whip
  'Middle Management': 'momentum',
  'The Long Reach': 'static_charge',
  'Snap Decision': 'quickdraw',
  'Crack of Dawn': 'kindling',
  // Longsword
  'Employee of the Month': 'bounty_hunter',
  'Plot Armor': 'last_stand',
  'Exactly As Long As It Needs To Be': 'drillmaster',
  'Main Character': 'momentum',
  // Spear
  'Social Distancing': 'timekeeper',
  'The Ten-Foot Rule': 'drillmaster',
  'Personal Space': 'frostbite',
  'Point of No Return': 'executioner',
  // Battleaxe
  'Hostile Takeover': 'bounty_hunter',
  'Chopping Block': 'executioner',
  'Axe Me Anything': 'whirlwind',
  'Splitting Hairs': 'bloodletter',
  // Mace
  'Sunday Best': 'shatterpoint',
  'Thoughts and Prayers': 'smite',
  'The Sermon': 'sunder',
  'Blunt Truth': 'backbreaker',
  // Halberd
  'Committee Decision': 'whirlwind',
  'Swiss Army Pole': 'drillmaster',
  'The Long Arm of the Law': 'executioner',
  'Red Tape': 'frostbite',
  // Twin Axes
  'Double Shift': 'second_wind',
  'Twice Shy': 'finisher',
  'The Twins': 'hungering',
  'Split Decision': 'whirlwind',
  // Hollow Maul
  'Dark Matter of Fact': 'shatterpoint',
  'Existential Dread': 'last_stand',
  'The Void Warranty': 'sunder',
  'Nothing Personal': 'giant_slayer',
  // Spellblade
  'Spell Check': 'spellsword',
  'Sharp Mind': 'static_charge',
  'Wizard of Odds': 'thunderclap',
  'Hex Appeal': 'drillmaster',
  // Censer Flail
  'Holy Smokes': 'kindling',
  'Fire and Brimstone Inc.': 'smite',
  'Smoke Alarm': 'timekeeper',
  'Hot Take': 'hungering',
  // Dawn Glaive
  'Morning Person': 'second_wind',
  'Sunday Service': 'smite',
  'Rise and Shine': 'last_stand',
  'First Light': 'kindling',
  // Chakrams
  'Return Policy': 'long_shot',
  'Full Circle': 'momentum',
  'The Halo Effect': 'smite',
  'Boomerang Theory': 'featherweight',
  // Cestus
  'Knuckle Sandwich': 'finisher',
  'Hands Down': 'riposte_master',
  'Fist Impressions': 'counterstep',
  'The Handshake': 'second_wind',
  // Rune Kris
  'Curse Word': 'static_charge',
  'Hex Key': 'spellsword',
  'Stab in the Dark': 'first_blood',
  'Mind the Gap': 'timekeeper',
  // Hex Hammer
  'Mind Over Matter': 'sunder',
  'Thinking Cap': 'spellsword',
  Headache: 'backbreaker',
  Brainstorm: 'thunderclap',
  // Harvest Sickle
  'Grim Reaping': 'reapers_due',
  'Harvest Moon': 'hungering',
  'Crop Circle': 'venom',
  'Sickle Day': 'bounty_hunter',
};

export function powersFor(kind: PowerSlot): string[] {
  return Object.values(LEGENDARY_POWERS)
    .filter((p) => p.on.includes(kind))
    .map((p) => p.id);
}

/** Legendary proper names for non-weapon items (weapons carry their own lists in weapons.ts). */
export const LEGENDARY_NAMES: Record<string, string[]> = {
  shield: ['The Landlord Deposit', 'Plan B', 'The Wall That Talks Back', 'A Very Firm No'],
  staff: ['Tenure', 'The Long Explanation', 'Footnote Seven', 'Rod of Correct Answers'],
  talisman: ['Answered Prayer', 'The Second Opinion', 'Saint of Lost Keys', 'Grandma’s Locket'],
  head: ['Crown of Mild Concern', 'The Thinking Cap', 'Helm of Plausible Deniability'],
  body: ['The Good Coat', 'Hauberk of Hindsight', 'Sunday Armour'],
  legs: ['Trousers of Destiny', 'The Comfortable Ones', 'Greaves of the Long Walk'],
};

/** Dry flavor lines for legendary items (CONTENT_ITEMS §14). */
export const LEGENDARY_FLAVOR = [
  'Someone important owned this. They are not around to complain.',
  'It hums when you are about to make a mistake. It hums a lot.',
  'Comes with a lifetime guarantee. The lifetime is not specified.',
  'Smells faintly of victory and slightly of cabbage.',
  'The previous owner left a note. It just says “sorry”.',
  'You feel like the main character. You are not.',
  'Somebody poured a lifetime into this. The Glowen hasn’t settled yet.',
  'The Landlord has it down as a fixture. He would like it back.',
  'Warm to the touch. Somebody loved this once.',
  'It has had many owners. It has outlived every one of them.',
  'Holds a year’s rent in Glowen. Keep that to yourself.',
  'Comes with a certificate of authenticity, signed by Gary.',
  'Too good for Joe. Joe is keeping it anyway.',
  'Every scratch on it has a story. None of them end well.',
  'Not insured. Not insurable.',
  'Fits like it was made for someone else. It was.',
];
