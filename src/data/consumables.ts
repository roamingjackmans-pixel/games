// CONTENT_ITEMS §12: consumables (quick-use, max 10 each). Nothing here restores a Thermos charge (D38).
import type { ConsumableId, EffectDef } from '../game/types';

export interface ConsumableDef {
  id: ConsumableId;
  name: string;
  short: string;
  /** bonfire shop price in Glowen; null = drop-only */
  price: number | null;
  description: string;
  effect: EffectDef[];
  /** thrown items aim at the cursor */
  thrown: boolean;
  flavor: string;
}

export const MAX_CONSUMABLE = 10;

export const CONSUMABLES: Record<ConsumableId, ConsumableDef> = {
  throwing_knife: {
    id: 'throwing_knife',
    name: 'Throwing Knife',
    short: 'Knife',
    price: 15,
    description: 'Thrown: 16 physical (scales with item level), Bleed 20.',
    effect: [{ op: 'damage', pattern: { kind: 'projectile', speed: 650, r: 6, drawId: 'p_knife' }, base: 16, type: 'physical', status: { id: 'bleed', buildup: 20 } }],
    thrown: true,
    flavor: 'Pointy end first. Usually.',
  },
  firebomb: {
    id: 'firebomb',
    name: 'Firebomb',
    short: 'Bomb',
    price: 30,
    description: 'Lobbed: circle(90) 60 Fire, Burn 50, fire puddle 3 s.',
    effect: [
      {
        op: 'damage',
        pattern: { kind: 'projectile', speed: 520, r: 8, lob: true, onImpact: { kind: 'circle', r: 90, anchor: 'point', persist: { hazard: 'firePuddle', durationS: 3 } } },
        base: 60,
        type: 'fire',
        status: { id: 'burn', buildup: 50 },
      },
    ],
    thrown: true,
    flavor: 'Light the fuse. Throw. Do these in that order.',
  },
  frost_jar: {
    id: 'frost_jar',
    name: 'Frost Jar',
    short: 'Frost',
    price: 35,
    description: 'Lobbed: circle(100) Freeze 1.5 s on non-bosses; Chill 60 on bosses.',
    effect: [
      {
        op: 'damage',
        pattern: { kind: 'projectile', speed: 520, r: 8, lob: true, onImpact: { kind: 'circle', r: 100, anchor: 'point' } },
        base: 4,
        type: 'magic',
        status: { id: 'chill', buildup: 60 },
        control: { id: 'freeze', durationS: 1.5 },
      },
    ],
    thrown: true,
    flavor: 'Keep refrigerated. Keep away from face.',
  },
  holy_water: {
    id: 'holy_water',
    name: 'Holy Water',
    short: 'Holy',
    price: 40,
    description: 'You and allies within 120 px: clear all statuses; 40 Holy burst to undead and void.',
    effect: [
      { op: 'cleanse', what: ['statuses', 'controls'], target: 'party', r: 120 },
      { op: 'damage', pattern: { kind: 'circle', r: 120, anchor: 'self' }, base: 40, type: 'holy', undeadMult: 1 },
    ],
    thrown: false,
    flavor: 'Tap water, blessed by someone who meant it.',
  },
  stamina_tonic: {
    id: 'stamina_tonic',
    name: 'Stamina Tonic',
    short: 'Tonic',
    price: 25,
    description: '+60 stamina instantly, +50% stamina regen for 6 s.',
    effect: [
      { op: 'resource', stamina: 60 },
      { op: 'buff', stat: 'staminaRegenPct', amount: 0.5, durationS: 6, id: 'tonic' },
    ],
    thrown: false,
    flavor: 'Tastes like a battery licked a lemon.',
  },
  lure: {
    id: 'lure',
    name: 'Lure',
    short: 'Lure',
    price: 30,
    description: 'Throws a decoy that taunts enemies within 300 px for 4 s (bosses 2 s).',
    effect: [{ op: 'decoy', count: 1, durationS: 4, tauntR: 300 }],
    thrown: true,
    flavor: 'A cardboard Joe. Convincing from the back.',
  },
  shard_pouch: {
    id: 'shard_pouch',
    name: 'Shard Pouch',
    short: 'Pouch',
    price: null,
    description: 'Use: gain 150 × zone Shards.',
    effect: [{ op: 'resource', shards: 150 }],
    thrown: false,
    flavor: 'An earlier Joe’s savings. He won’t be needing them.',
  },
};

export const CONSUMABLE_IDS = Object.keys(CONSUMABLES) as ConsumableId[];
