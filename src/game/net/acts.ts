// Guest-owned bodies (D338, NETCODE §5–§6): the messages a co-op guest's own body sends the host about what it did
// to the shared world (its hits on enemies, its revives, its friendly fire, how each enemy hit on it went, its shots),
// and the hits the host hands the guest to decide. Types only: world.ts and damage.ts import them without a cycle.
import type { Shape } from '../combat/patterns';
import type { ControlId, DamageType, EffectDef, StatusId } from '../types';
import type { DamageSpec } from '../world';

/** Where a hit landed, so the guest can test its own body against it at the same moment (D338). */
export interface HitArea {
  s: Shape;
  /** the moment inside the shape's own timeline (sweeps), s */
  tau: number;
  /** the area catches the dot at a player's feet (D262), not the whole body */
  dot?: boolean;
}

/** A hit on a guest's body that the host found and the guest decides (D338). */
export interface IncomingHit {
  /** the host's id for this hit, quoted back in the guest's `took` */
  h: number;
  /** the host's world time when it landed: the guest decides it when its own clock gets there */
  at: number;
  attackerId: number;
  /** the attack, already scaled by the attacker's own buffs, the late fee and the enrage */
  spec: DamageSpec;
  fx: number;
  fy: number;
  /** the projectile that hit, if one did */
  projId?: number;
  area?: HitArea;
}

/** What the guest's own body did (guest → host, reliable, batched each frame). */
export type NetAct =
  /** a hit on an enemy, resolved on the guest's screen: the host applies the outcome to the real enemy */
  | {
      t: 'hit';
      id: number;
      dmg: number;
      type: DamageType;
      crit: boolean;
      aff?: 'weak' | 'resist';
      /** poise damage after the attacker's own multipliers (bosses' pool multiplier included) */
      poise: number;
      /** a guaranteed stagger (spec.guaranteedStagger) */
      gs?: boolean;
      heavy?: boolean;
      status?: [StatusId, number][];
      control?: { id: ControlId; durationS: number };
      root?: number;
      kb?: number;
      pull?: boolean;
      holy?: boolean;
      /** the hit struck an illusion (it pops) */
      ill?: boolean;
      kill?: EffectDef[];
      tag?: string;
      fx: number;
      fy: number;
    }
  | { t: 'gary'; id: number }
  /** a hit on a downed ally's ghost: revive progress (the host owns revives) */
  | { t: 'revive'; id: number; v: number }
  /** friendly fire on another player (D115): the unscaled spec; the host scales it and the victim's own side decides */
  | { t: 'ff'; id: number; spec: DamageSpec; fx: number; fy: number }
  /** how an incoming hit went on the guest's screen */
  | { t: 'took'; h: number; res: string; dmg: number; grab?: boolean }
  /** a ranged weapon swing fired: the host spawns the real shot (its hits stay the host's) */
  | { t: 'shot'; idx: number; off?: boolean; mult: number; pierce: number; a: number; x: number; y: number };

/** The guest's side of a world copy (World.netGuest): what its own body did this frame, for the host. */
export interface NetGuestLink {
  out: NetAct[];
}

/** The host's side (World.netHost): a hit on a guest's body goes to that guest to decide. */
export interface NetHostLink {
  divert(p: import('../world').Entity, hit: Omit<IncomingHit, 'h' | 'at'>): void;
}
