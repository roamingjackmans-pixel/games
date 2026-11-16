// The self-buff spells active on a player (D373): every buff a player's spell gave carries the spell's id, so the HUD
// can show one icon a spell by the HP bar (Haste's two buffs are one icon) and the stats panel can say what each does.
// Headless: the icons are drawn in src/ui/buffIcons.ts.
import { SPELLS } from '../../data/spells';
import { shapeHit } from './patterns';
import { PLAYER_DOT_DY, PLAYER_DOT_R } from '../player/player';
import type { Buff, Entity, World } from '../world';

export interface ActiveSpellBuff {
  spell: string;
  name: string;
  /** when its last buff ends (s, world time) */
  until: number;
  buffs: Buff[];
}

/** The spells whose buffs are on this entity now, in the order they were cast. */
export function spellBuffsOn(e: Entity, now: number): ActiveSpellBuff[] {
  const out: ActiveSpellBuff[] = [];
  for (const b of e.buffs ?? []) {
    if (!b.spell || b.until <= now) continue;
    let a = out.find((x) => x.spell === b.spell);
    if (!a) out.push((a = { spell: b.spell, name: SPELLS[b.spell]?.name ?? b.spell, until: b.until, buffs: [] }));
    a.until = Math.max(a.until, b.until);
    a.buffs.push(b);
  }
  return out;
}

/**
 * Every spell icon for this player's HUD (D400): its spell buffs (D373), a spell's barrier on it (Spirit Shield, given
 * by an ally too), and each helpful spell zone it stands in or cast (Sanctuary, Regen Aura), each with when it ends.
 */
export function hudSpellIcons(w: World, e: Entity, now: number): ActiveSpellBuff[] {
  const out = spellBuffsOn(e, now);
  const add = (spell: string, until: number): void => {
    const a = out.find((x) => x.spell === spell);
    if (a) a.until = Math.max(a.until, until);
    else out.push({ spell, name: SPELLS[spell]?.name ?? spell, until, buffs: [] });
  };
  const hp = e.hp;
  if (hp && hp.barrierSpell && hp.barrier > 0 && hp.barrierUntil > now) add(hp.barrierSpell, hp.barrierUntil);
  for (const h of w.entities.values()) {
    const hz = h.hz;
    if (h.type !== 'hazard' || h.removed || !hz?.spellIcon || hz.team !== 0 || !(hz.until > now)) continue;
    const inside = (hz.shapes ?? []).some((s) => shapeHit(s, 0, e.x, e.y + PLAYER_DOT_DY, PLAYER_DOT_R, w.room));
    if (inside || hz.ownerId === e.id) add(hz.spellIcon, hz.until);
  }
  return out;
}

const pct = (x: number): string => `${x > 0 ? '+' : '−'}${Math.round(Math.abs(x) * 100)}%`;

/** What one buff does, in a few words ("+30 defense to all types"). */
export function buffText(b: Buff): string {
  const a = b.amount * Math.max(1, b.stacks);
  switch (b.stat) {
    case 'defenseAll':
      return `${a > 0 ? '+' : '−'}${Math.round(Math.abs(a))} defense to all types`;
    case 'attackSpeedPct':
      return `${pct(a)} attack speed`;
    case 'castSpeedPct':
      return `${pct(a)} cast speed`;
    case 'moveSpeedPct':
      return `${pct(a)} walking speed`;
    case 'physicalTakenPct':
      return `${pct(a)} physical damage taken`;
    case 'damageTakenPct':
      return `${pct(a)} damage taken`;
    case 'damagePct':
      return `${pct(a)} damage`;
    case 'holyConvertPct':
      return `${pct(a)} of your weapon's hit added as Holy`;
    case 'holyDamagePct':
      return `${pct(a)} Holy damage`;
    case 'staminaRegenPct':
      return `${pct(a)} stamina regeneration`;
    case 'staminaCostPct':
      return `${pct(a)} stamina costs`;
    case 'cooldownPct':
      return `${pct(a)} cooldowns`;
    case 'spellCooldownPct':
      return `${pct(a)} spell cooldowns`;
    case 'poiseThreshold':
      return 'hyper armor: hits do not stagger you';
    case 'flaskBoostPct':
      return `next Thermos drink heals ${pct(a)} and clears statuses`;
    case 'marker':
      return SPELLS[b.spell ?? '']?.description ?? '';
    default:
      if (b.stat.startsWith('defense:')) return `${a > 0 ? '+' : '−'}${Math.round(Math.abs(a))} ${b.stat.slice(8)} defense`;
      return '';
  }
}
