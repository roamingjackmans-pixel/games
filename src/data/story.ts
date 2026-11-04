// The story of Dungeon Joe (D14: grim world, cheeky text; Joe is an ordinary guy in over his head) and every
// line of it the game shows: the premise, the zone-entry and boss-defeat cutscenes, the Instructor's card, the
// credits epilogue, death-screen quips, bonfire lines and tips. Pure data: no ids or numbers live here that
// any system keys on except the cutscene ids (`zone-N`, `boss-intro-N`) stored in WorldState.cutscenesSeen.

/**
 * The premise, in order. Glowen is at the heart of it: why monsters drop it, why fires, shops and Gary trade
 * in it, why better-made gear holds more of it, and why the bosses and The Landlord want it.
 */
export const PREMISE: readonly string[] = [
  'Everything that lives, or is loved, or was made with care seeps a little Glowen: a pale, warm, faintly glowing ectoplasm.',
  'The harder somebody worked on a thing, the more Glowen soaked into it. A hand-forged sword holds a fortune. A plastic spoon holds a smell.',
  'Glowen is why a lamp feels cosy, a coat feels lucky and a grandmother’s ring feels heavier than it is.',
  'At the bottom of a very long staircase, The Landlord holds the deed to everything below the world. The small print says the world is a sublet.',
  'Rent is due. Rent is paid in Glowen. He is foreclosing on the living world, one glow at a time, and his staff collect it floor by floor.',
  'The lights went out in Joe’s building. Joe went down the stairs to find the fuse box. The stairs kept going.',
];

/** Why each part of the game deals in Glowen (for docs, tooltips and anyone who asks). */
export const GLOWEN_LORE = {
  what: 'Glowen: the warm ectoplasm that seeps out of everything alive or valuable. Rent, down here.',
  monsters: 'Every monster is full of Glowen it scraped off something else. Hit it hard enough and it seeps out.',
  gear: 'Well-made gear soaked up its maker’s sweat as Glowen. Rarer, harder-worked things sell for more.',
  gems: 'Gems are Glowen that set hard under pressure. Pour more in and they grow a tier.',
  bonfires: 'The fires were lit by the Joes who came down before. They burn what seeps out of the dark and remember who sat by them.',
  shops: 'Someone always opens a stall by a fire. Down here they only take Glowen: it is the one thing the Landlord wants.',
  gary: 'Gary pays no rent. Nobody knows how. He buys low, sells high and never says where anything came from.',
  hollow: 'When the last of a thing’s Glowen is taken, it goes hollow. Knights, forests, Joes. Anything.',
} as const;

export interface ZoneStory {
  /** 2–4 lines typed out when a character first reaches the zone in a cycle */
  lines: readonly string[];
  /** lines for New Game+ cycles, when they differ */
  ngLines?: readonly string[];
}

/** Zone-entry cutscenes, zones 1–8 (never in the Training Hall). */
export const ZONE_STORY: Record<number, ZoneStory> = {
  1: {
    lines: [
      'The lights went out in Joe’s building. Joe went down to find the fuse box.',
      'The stairs kept going. Past the basement. Past the basement’s basement.',
      'Down here everything leaks a warm, pale goo called Glowen. The dead leak it slowest.',
      'Somebody has been collecting it. Somebody has also been collecting the dead.',
    ],
    ngLines: [
      'Joe climbed out. The lights came back on. A week later, they went out again.',
      'Landlords always come back. It is in the lease.',
      'Joe sighs, picks up his Thermos and goes down the stairs. Again.',
    ],
  },
  2: {
    lines: [
      'Below the crypt, the Glowen pools in the dark, and things grow in it.',
      'Mushrooms the size of chapels. Spores that hum. A smell like a gym bag’s ghost.',
      'Every cap glows with borrowed Glowen. Mother Spore farms it, then sends it further down.',
      'Further down. Always further down. Joe is starting to notice a pattern.',
    ],
  },
  3: {
    lines: [
      'Everything that drains from the world above ends up here. Including the Glowen.',
      'Rent flows downhill. The Bloatking skims a little off the top. Then a lot.',
      'Joe holds his breath. Joe gives up holding his breath. It did not help.',
    ],
  },
  4: {
    lines: [
      'A forest. Under a sewer. Every tree is hollow: tapped for Glowen like maple.',
      'What is left of the forest’s Glowen beats in one lantern, in one stag’s chest.',
      'The wolves are thin. The leaves fall upward. Joe decides not to ask.',
    ],
  },
  5: {
    lines: [
      'The harder someone works on a thing, the more Glowen it holds. The Landlord knows this.',
      'So he built a forge. Shifts that never end, making fine things just to melt them down.',
      'Every sword Joe has looted was somebody’s overtime. Joe feels bad. Joe keeps the swords.',
    ],
  },
  6: {
    lines: [
      'A vault of relics: the most-loved things in the world, brimming with Glowen.',
      'Saint Aurelia froze herself at its door so the Landlord’s collectors could never get in.',
      'That was four hundred years ago. Nobody has told her Joe is not a collector.',
    ],
  },
  7: {
    lines: [
      'Somebody has to keep the books: every drop of Glowen owed, every second it is late.',
      'Archmagister Tock wound himself up to count the rent, and never once ran down.',
      'Joe has a ledger entry. It says OVERDUE, in very small and very angry handwriting.',
    ],
  },
  8: {
    lines: [
      'The bottom. No floor. No walls. No fuse box. Just a desk, and someone behind it.',
      'The Landlord owns everything under the stairs. The small print says above them, too.',
      'Every glow up there is his rent, and he is collecting all of it. Tonight.',
      'Joe has come a very long way to complain about the lights.',
    ],
  },
};

/** Boss-defeat cutscenes by boss id: who they were, what it means, where Joe goes next (2–3 lines). */
export const BOSS_DEFEAT: Record<string, readonly string[]> = {
  the_caretaker: [
    'The Caretaker lies down in one of his own graves. He always did like things tidy.',
    'His lantern drips its Glowen into a drain stamped RENT, and the drain runs down.',
    'Joe follows the drain. Joe is now a man who follows drains.',
  ],
  mother_spore: [
    'Mother Spore wilts. Her children go dark one cap at a time, like cheap fairy lights.',
    'The Glowen she farmed trickles away through the roots, still on its way to pay rent.',
    'Somebody down there is very well paid. Joe goes to have a word.',
  ],
  bloatking: [
    'The Bloatking bursts. Years of skimmed rent wash across the sewer in a warm, glowing wave.',
    'Most of it drains on, downward. Joe pockets what he can. Nobody audits a sewer.',
    'Long may he float. He doesn’t.',
  ],
  vexthorn: [
    'Vexthorn’s lantern-heart cracks. The forest’s last Glowen seeps back into the trees.',
    'The trees are not grateful. One drops a branch on Joe, which is nearly a thank-you.',
    'Below the roots, someone is hammering. On and on. Without a break.',
  ],
  foreman_ignatius: [
    'Foreman Ignatius clocks out for the first time in two hundred years.',
    'The cultists put down their hammers. Someone mentions a pension. Everyone laughs.',
    'The good stuff, the hard-worked stuff, was all shipped down. Joe follows the shipping.',
  ],
  saint_aurelia: [
    'The ice lets go. Saint Aurelia looks at Joe, then at her door. “Oh. You’re not him.”',
    '“Then go and get him,” she says, and is snow.',
    'The relics are safe. Behind her door, the stairs go down into ticking.',
  ],
  archmagister_tock: [
    'Tock winds down mid-sentence. His ledger falls open at a page headed JOE.',
    'Balance owing: everything. Due: always. Joe tears the page out and eats it.',
    'Below the citadel, the stairs stop being stairs and start being a lack of floor.',
  ],
  the_landlord: [
    'The Landlord comes apart like a shredded contract. The lease is void.',
    'Every drop of Glowen he collected goes home: to kettles, lamps, coats and good spoons.',
    'Far above, a fuse clicks back on. The stairs go up now.',
  ],
};

/** The Instructor's lighter intro card (his own room off the Training Hall, D75). */
export const INSTRUCTOR_INTRO = {
  title: 'THE INSTRUCTOR',
  sub: 'New-tenant orientation. Attendance is mandatory. Survival is optional.',
  label: 'OPTIONAL · NEARLY UNBEATABLE',
} as const;

/** Credits open with this, straight after The Landlord’s lines. */
export const CREDITS_EPILOGUE: readonly string[] = [
  'The lights came back on in Joe’s building at 4:12 in the morning.',
  'Kettles boiled. Lamps felt cosy again. The good spoons shone.',
  'Joe came up the stairs with a sword, a Thermos and a lot of explaining to do.',
  'Nobody believed him about the stag.',
];

/** The big line on the death screen (GAME_DESIGN §9.3), in turn by death count. */
export const DEATH_TITLES: readonly string[] = [
  'JOE DIED',
  'JOE HAS FALLEN DOWN THE STAIRS',
  'JOE IS LATE FOR WORK',
  'JOE DIED. AGAIN.',
  'JOE NEEDS A MINUTE',
  'JOE HAS BEEN EVICTED',
  'JOE IS HAVING A LIE-DOWN',
];

/** Death-screen quips, under the big JOE DIED line. */
export const DEATH_QUIPS: readonly string[] = [
  'Joe has been temporarily evicted from being alive.',
  'The dungeon thanks you for your contribution.',
  'Joe is fine. Joe is lying down on purpose.',
  'Your Glowen is safe. Your Shards are on the floor. So are you.',
  'The Landlord has noted the stain on the carpet.',
  'That was a red attack. The red means “no”.',
  'Blue means move. Joe did not move.',
  'Death is just the dungeon’s way of saying “again”.',
  'Joe would like to speak to the manager. The manager did this.',
  'You died. On the bright side, the Thermos is full again.',
  'Somewhere, Gary is slowly shaking his head.',
  'The Caretaker will tidy that up later.',
  'Joe has fallen, and can, in fact, get up.',
  'Respawning is free. The Shards you dropped are not.',
  'A good death. Bit messy. Seven out of ten.',
  'Every hollow Joe down here started exactly like this.',
  'The floor came up to meet Joe. It was very enthusiastic.',
  'Joe’s home insurance does not cover this.',
  'Your bonfire missed you. It’s been ages. Forty seconds.',
  'The item level was fine. The Joe level was the problem.',
  'Joe has learned something. Joe has forgotten it.',
  'The rent collectors send their regards.',
  'You were doing so well. Relatively speaking.',
  'Joe lies very still and pretends this was the plan.',
  'Rolling earlier is the secret. Rolling later is also the secret.',
  'Joe is having a little sit-down. A long one.',
  'Nobody saw that. Except everything down here.',
  'Joe died as he lived: mildly surprised.',
];

/** Lines shown when a bonfire’s menu opens after a first rest (HP and Thermos restored). */
export const BONFIRE_LINES: readonly string[] = [
  'The fire is warm. Joe’s feet are not. You can’t have everything.',
  'Joe rests. Somewhere far below, a ledger notices.',
  'The fire crackles with Glowen from all the Joes who sat here first.',
  'You sit. You breathe. You drink from the Thermos. It is mostly tea.',
  'For a moment, nothing is trying to kill you. Savour it.',
  'The flames lean toward you like they’ve heard a rumour.',
  'Joe toasts a crust over the fire. It is the best meal of his life.',
  'Someone carved “J WUZ ERE” into a stone by the fire. Several someones.',
  'The fire hums the first bar of a song you almost remember.',
  'Joe takes his boots off. The monsters in the next room take a step back.',
];

/** Lines shown at a fire you have rested at before (it still heals and refills, D150; it used to restore nothing, D38). */
export const EMBER_LINES: readonly string[] = [
  'Embers. Still warm, if you squint.',
  'The fire has burnt low. It still has enough for one more Joe.',
  'Joe pokes the embers. They flare up, just enough to warm his tea.',
  'Embers mend you all the same. They are just quieter about it.',
  'The monsters are back. So is your Thermos. Fair trade.',
];

/** Tips shown on the death screen and while a guest joins. Short, true, and only slightly smug. */
export const TIPS: readonly string[] = [
  'Red attacks can’t be blocked or parried. Roll through them.',
  'Blue attacks ignore rolls. Walk out of the marked area instead.',
  'Your Thermos refills every time you rest at a fire, and when you die. Nowhere else.',
  'Dying drops your Shards, never your Glowen. Spend Shards at a fire before a boss.',
  'Better-made gear holds more Glowen. Sell what you don’t need; the fire pays by quality.',
  'Gems are hardened Glowen. Upgrade them at the gem bench to the next tier.',
  'Two-handing a weapon counts your Bonk one and a half times.',
  'Hit Gary three times and he leaves for good. He has feelings, and stock.',
  'A chest that breathes is not a chest.',
  'Heavy weapons stagger big enemies. Daggers stagger rats. Choose accordingly.',
  'In co-op, hit a downed friend to revive them. It is weird. It works.',
  'A boss staggers after two parries close together.',
  'Your dodge recharges in five seconds. Don’t spend it on vibes.',
  'Resting at a fire brings the monsters back. They were only resting too.',
  'Ember fires still save, level you up and warp. They just won’t heal you.',
  'Spells come from reliquaries, never shops. Gary has tried.',
  'Weapon skills unlock with item level: Worn, Fine, Masterwork, Mythic.',
  'Falling off the edge of the Abyss costs half your HP and all of your pride.',
  'A Tear of Undoing resets your stats at a fire. Cry responsibly.',
  'Elites glow and drop better loot. They also hit like a rent increase.',
];

/** The cutscene id stored in WorldState.cutscenesSeen when a zone’s entry cutscene has played. */
export function zoneCutsceneId(zone: number): string {
  return `zone-${zone}`;
}

/** The id stored once a zone’s boss intro has played in full (later attempts get the short version). */
export function bossIntroId(zone: number): string {
  return `boss-intro-${zone}`;
}

/** Zone-entry lines for a cycle (NG+ cycles use the zone’s ngLines when it has them). */
export function zoneLines(zone: number, cycle: number): readonly string[] {
  const z = ZONE_STORY[zone];
  if (!z) return [];
  return cycle > 0 && z.ngLines ? z.ngLines : z.lines;
}
