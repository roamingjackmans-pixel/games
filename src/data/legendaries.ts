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
  moss_mantle: { id: 'moss_mantle', name: 'Moss Mantle', on: ['armor', 'legs'], text: 'Statuses build 40% slower.' },
  hollow_guard: { id: 'hollow_guard', name: 'Hollow Guard', on: ['armor', 'legs'], text: 'Below 30% HP: −30% damage taken.' },
  cowards_comfort: { id: 'cowards_comfort', name: "Coward's Comfort", on: ['armor', 'legs'], text: 'Dodging grants 1 s of +40% move speed.' },
  lucky_socks: { id: 'lucky_socks', name: "Joe's Lucky Socks", on: ['legs'], text: '+1 flask charge (not above 5).' },
};

/**
 * D388: every legendary weapon's name carries its own power (each class's four legendaries, four different powers).
 * A legendary weapon gets the power of the name it rolls; a name not listed here rolls a power as before.
 */
export const LEGENDARY_WEAPON_POWERS: Record<string, string> = {
  // Greathammer
  "Landlord's Gavel": 'sunder',
  'Noise Complaint': 'shatterpoint',
  'The Big One': 'giant_slayer',
  'Load-Bearing Wall': 'last_stand',
  // Greataxe
  'The Severance Package': 'executioner',
  'Lumberjack Retirement Plan': 'second_wind',
  Firewood: 'kindling',
  'Timber!': 'shatterpoint',
  // Colossal Sword
  Overcompensation: 'giant_slayer',
  'The Door': 'sunder',
  'Small Talk': 'momentum',
  'Big Energy': 'last_stand',
  // Crossbow
  'Second Opinion': 'executioner',
  'The Notary': 'mimics_tooth',
  Quarrelsome: 'quickdraw',
  'Bolt From the Blue': 'static_charge',
  // Club
  'Stick of Destiny': 'thunderclap',
  'Problem Solver': 'shatterpoint',
  'Original Recipe': 'bounty_hunter',
  'Club Membership': 'featherweight',
  // Twin Daggers
  'Paper Cut': 'bloodletter',
  'The Fine Print': 'mimics_tooth',
  'Mr. and Mrs. Stabby': 'riposte_master',
  Backstabbers: 'executioner',
  // Rapier
  'Strongly Worded Letter': 'riposte_master',
  'En Garde': 'timekeeper',
  'The Point': 'quickdraw',
  'Touché': 'bloodletter',
  // Katana
  'Moonlight Shift': 'frostbite',
  Overtime: 'momentum',
  'Folded Laundry': 'featherweight',
  'Paper Thin': 'executioner',
  // Bow
  'Long Distance Relationship': 'giant_slayer',
  'Return to Sender': 'spellsword',
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
  'Exactly As Long As It Needs To Be': 'second_wind',
  'Main Character': 'momentum',
  // Spear
  'Social Distancing': 'timekeeper',
  'The Ten-Foot Rule': 'thunderclap',
  'Personal Space': 'frostbite',
  'Point of No Return': 'executioner',
  // Battleaxe
  'Hostile Takeover': 'bounty_hunter',
  'Chopping Block': 'executioner',
  'Axe Me Anything': 'second_wind',
  'Splitting Hairs': 'bloodletter',
  // Mace
  'Sunday Best': 'shatterpoint',
  'Thoughts and Prayers': 'hungering',
  'The Sermon': 'sunder',
  'Blunt Truth': 'giant_slayer',
  // Halberd
  'Committee Decision': 'sunder',
  'Swiss Army Pole': 'mimics_tooth',
  'The Long Arm of the Law': 'executioner',
  'Red Tape': 'frostbite',
  // Twin Axes
  'Double Shift': 'second_wind',
  'Twice Shy': 'timekeeper',
  'The Twins': 'hungering',
  'Split Decision': 'quickdraw',
  // Hollow Maul
  'Dark Matter of Fact': 'shatterpoint',
  'Existential Dread': 'last_stand',
  'The Void Warranty': 'sunder',
  'Nothing Personal': 'giant_slayer',
  // Spellblade
  'Spell Check': 'spellsword',
  'Sharp Mind': 'static_charge',
  'Wizard of Odds': 'thunderclap',
  'Hex Appeal': 'momentum',
  // Censer Flail
  'Holy Smokes': 'kindling',
  'Fire and Brimstone Inc.': 'giant_slayer',
  'Smoke Alarm': 'timekeeper',
  'Hot Take': 'hungering',
  // Dawn Glaive
  'Morning Person': 'second_wind',
  'Sunday Service': 'spellsword',
  'Rise and Shine': 'last_stand',
  'First Light': 'kindling',
  // Chakrams
  'Return Policy': 'bounty_hunter',
  'Full Circle': 'momentum',
  'The Halo Effect': 'thunderclap',
  'Boomerang Theory': 'featherweight',
  // Cestus
  'Knuckle Sandwich': 'shatterpoint',
  'Hands Down': 'riposte_master',
  'Fist Impressions': 'momentum',
  'The Handshake': 'second_wind',
  // Rune Kris
  'Curse Word': 'static_charge',
  'Hex Key': 'spellsword',
  'Stab in the Dark': 'bloodletter',
  'Mind the Gap': 'timekeeper',
  // Hex Hammer
  'Mind Over Matter': 'sunder',
  'Thinking Cap': 'spellsword',
  Headache: 'shatterpoint',
  Brainstorm: 'thunderclap',
  // Harvest Sickle
  'Grim Reaping': 'executioner',
  'Harvest Moon': 'hungering',
  'Crop Circle': 'featherweight',
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
