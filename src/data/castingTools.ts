// CONTENT_ITEMS §6: staffs (Brain) and talismans (Prayer). toolMult = grade × (1 + 0.35 (ilvl − 1)).
import type { CastingToolDef, WeaponDef } from '../game/types';

export const CASTING_TOOLS: Record<string, CastingToolDef> = {
  apprentice_staff: { id: 'apprentice_staff', name: 'Apprentice Staff', weight: 2.5, school: 'brain', req: 8, grade: 0.9, gradeLetter: 'C', castSpeed: 1.0, flavor: "Scholar's start. Still has the price tag.", draw: 't_staff' },
  arcane_staff: { id: 'arcane_staff', name: 'Arcane Staff', weight: 3, school: 'brain', req: 14, grade: 1.0, gradeLetter: 'B', castSpeed: 1.0, flavor: 'Hums when nobody is listening.', draw: 't_staff_arcane' },
  void_staff: { id: 'void_staff', name: 'Void Staff', weight: 3, school: 'brain', req: 12, grade: 1.0, gradeLetter: 'B', castSpeed: 1.0, bonus: { element: 'void', pct: 0.2 }, flavor: 'Found in a dumpster. It found him back.', draw: 't_staff_void' },
  storm_staff: { id: 'storm_staff', name: 'Storm Staff', weight: 3.5, school: 'brain', req: 16, grade: 1.0, gradeLetter: 'B', castSpeed: 1.1, bonus: { element: 'magic', pct: 0.2 }, flavor: 'Do not hold it during weather.', draw: 't_staff_storm' },
  archmagister_rod: { id: 'archmagister_rod', name: "Archmagister's Rod", weight: 2, school: 'brain', req: 24, grade: 1.25, gradeLetter: 'S', castSpeed: 1.15, flavor: 'Tock left it on the counter.', draw: 't_rod' },
  wooden_talisman: { id: 'wooden_talisman', name: 'Wooden Talisman', weight: 0.5, school: 'prayer', req: 8, grade: 0.9, gradeLetter: 'C', castSpeed: 1.0, flavor: "Pyre Priest's start. Whittled during a sermon, then lightly singed.", draw: 't_talisman_wood' },
  silver_talisman: { id: 'silver_talisman', name: 'Silver Talisman', weight: 0.8, school: 'prayer', req: 14, grade: 1.0, gradeLetter: 'B', castSpeed: 1.0, flavor: 'Tarnishes near liars. Always tarnished.', draw: 't_talisman_silver' },
  sunlight_talisman: { id: 'sunlight_talisman', name: 'Sunlight Talisman', weight: 1, school: 'prayer', req: 20, grade: 1.1, gradeLetter: 'A', castSpeed: 1.05, bonus: { element: 'holy', pct: 0.2 }, flavor: 'Praise it. It likes that.', draw: 't_talisman_sun' },
  saints_relic: { id: 'saints_relic', name: "Saint's Relic", weight: 1.5, school: 'prayer', req: 26, grade: 1.25, gradeLetter: 'S', castSpeed: 1.15, bonus: { pct: 0.15, heals: true }, flavor: 'A finger bone, still warm with Glowen. Whose, nobody says.', draw: 't_relic' },
};

export const CASTING_TOOL_IDS = Object.keys(CASTING_TOOLS);

/**
 * A staff or talisman held in the weapon hand (D117) swings like this: a modest bash with no weapon skills
 * and it casts its spells on Q/E/R, the weapon-skill keys (D201).
 * A staff is a long stick (Bonk D, Brain E); a talisman is a short smack (Bonk E, Prayer D, 25% of it Holy).
 */
export function toolBash(t: CastingToolDef): WeaponDef {
  const staff = t.school === 'brain';
  return {
    id: t.id,
    name: t.name,
    weight: t.weight,
    grades: staff ? { bonk: 'D', slicey: '-', brain: 'E' } : { bonk: 'E', slicey: '-', prayer: 'D' },
    req: staff ? { bonk: 0, slicey: 0, brain: t.req } : { bonk: 0, slicey: 0, prayer: t.req },
    speedClass: staff ? 'medium' : 'fast',
    combo: staff
      ? [
          { windupMs: 260, activeMs: 100, recoverMs: 260, mult: 1, hitbox: { shape: 'arc', angleDeg: 90, r: 85 }, step: 10 },
          { windupMs: 300, activeMs: 110, recoverMs: 320, mult: 1.15, hitbox: { shape: 'thrust', w: 26, l: 110 }, step: 14 },
        ]
      : [
          { windupMs: 180, activeMs: 80, recoverMs: 200, mult: 1, hitbox: { shape: 'arc', angleDeg: 70, r: 60 }, step: 8 },
          { windupMs: 180, activeMs: 80, recoverMs: 260, mult: 1.1, hitbox: { shape: 'arc', angleDeg: 70, r: 60 }, step: 8 },
        ],
    // a casting tool is a poor club: 65% less than it used to hit (D128; was 20 / 16)
    base1: staff ? 7 : 5.6,
    stamina: staff ? 12 : 9,
    poiseDmg: staff ? 16 : 10,
    reviveValue: 1.5,
    skills: ['', '', ''],
    ...(staff ? {} : { holyPct: 0.25 }),
    flavor: t.flavor,
    draw: t.draw,
    legendaryNames: [],
  };
}

/** Is this base id a staff or talisman (which may go in either hand, D117)? */
export function isCastingTool(baseId: string): boolean {
  return !!CASTING_TOOLS[baseId];
}
