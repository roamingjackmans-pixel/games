// The weapon skills an item has unlocked, for its card: skill 1, 2 and 3 of its weapon class in order, as many as the
// item has (its rolled count, D89, plus any bonus skill). Locked ones are not listed.
import { WEAPONS } from '../../data/weapons';
import { SKILLS } from '../../data/skills';
import { itemSkillCount } from '../combat/formulas';
import type { Item, SkillDef } from '../types';

export interface ItemSkill {
  /** 0, 1 or 2: skill 1, 2 or 3 */
  slot: number;
  def: SkillDef;
}

export function itemUnlockedSkills(item: Item): ItemSkill[] {
  const w = WEAPONS[item.baseId];
  if (!w) return [];
  const n = itemSkillCount(item);
  const out: ItemSkill[] = [];
  for (let i = 0; i < Math.min(n, w.skills.length); i++) {
    const def = SKILLS[w.skills[i] ?? ''];
    if (def) out.push({ slot: i, def });
  }
  return out;
}
