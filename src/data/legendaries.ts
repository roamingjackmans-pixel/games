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
  hungering: { id: 'hungering', name: 'Hungering', on: ['weapon'], text: 'Heal 0.4% of max HP a hit (lifesteal), −10% max HP.' },
  momentum: { id: 'momentum', name: 'Momentum', on: ['weapon'], text: 'Each consecutive hit without being hit: +3% damage (max 10).' },
  riposte_master: { id: 'riposte_master', name: 'Riposte Master', on: ['weapon'], text: 'Ripostes deal ×4 and heal 5%.' },
  spellsword: { id: 'spellsword', name: 'Spellsword', on: ['weapon'], text: 'Spells cast within 2 s after a light attack cost no stamina.' },
  timekeeper: { id: 'timekeeper', name: 'Timekeeper', on: ['weapon'], text: 'Dodge recharge −1 s (floor 3 s).' },
  mimics_tooth: { id: 'mimics_tooth', name: "Mimic's Tooth", on: ['weapon'], text: 'Chests have a 0% mimic chance; mimics you attack first take ×2.' },
  moss_mantle: { id: 'moss_mantle', name: 'Moss Mantle', on: ['armor', 'legs'], text: 'Statuses build 40% slower.' },
  hollow_guard: { id: 'hollow_guard', name: 'Hollow Guard', on: ['armor', 'legs'], text: 'Below 30% HP: −30% damage taken.' },
  cowards_comfort: { id: 'cowards_comfort', name: "Coward's Comfort", on: ['armor', 'legs'], text: 'Dodging grants 1 s of +40% move speed.' },
  lucky_socks: { id: 'lucky_socks', name: "Joe's Lucky Socks", on: ['legs'], text: '+1 flask charge (not above 5).' },
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
