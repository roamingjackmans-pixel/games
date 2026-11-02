// CONTENT_ITEMS §6: staffs (Brain) and talismans (Prayer). toolMult = grade × (1 + 0.35 (ilvl − 1)).
import type { CastingToolDef } from '../game/types';

export const CASTING_TOOLS: Record<string, CastingToolDef> = {
  apprentice_staff: { id: 'apprentice_staff', name: 'Apprentice Staff', school: 'brain', req: 8, grade: 0.9, gradeLetter: 'C', castSpeed: 1.0, flavor: "Scholar's start. Still has the price tag.", draw: 't_staff' },
  arcane_staff: { id: 'arcane_staff', name: 'Arcane Staff', school: 'brain', req: 14, grade: 1.0, gradeLetter: 'B', castSpeed: 1.0, flavor: 'Hums when nobody is listening.', draw: 't_staff_arcane' },
  void_staff: { id: 'void_staff', name: 'Void Staff', school: 'brain', req: 12, grade: 1.0, gradeLetter: 'B', castSpeed: 1.0, bonus: { element: 'void', pct: 0.2 }, flavor: 'Found in a dumpster. It found him back.', draw: 't_staff_void' },
  storm_staff: { id: 'storm_staff', name: 'Storm Staff', school: 'brain', req: 16, grade: 1.0, gradeLetter: 'B', castSpeed: 1.1, bonus: { element: 'lightning', pct: 0.2 }, flavor: 'Do not hold it during weather.', draw: 't_staff_storm' },
  archmagister_rod: { id: 'archmagister_rod', name: "Archmagister's Rod", school: 'brain', req: 24, grade: 1.25, gradeLetter: 'S', castSpeed: 1.15, flavor: 'Tock left it on the counter.', draw: 't_rod' },
  wooden_talisman: { id: 'wooden_talisman', name: 'Wooden Talisman', school: 'prayer', req: 8, grade: 0.9, gradeLetter: 'C', castSpeed: 1.0, flavor: "Cleric's start. Whittled during a sermon.", draw: 't_talisman_wood' },
  silver_talisman: { id: 'silver_talisman', name: 'Silver Talisman', school: 'prayer', req: 14, grade: 1.0, gradeLetter: 'B', castSpeed: 1.0, flavor: 'Tarnishes near liars. Always tarnished.', draw: 't_talisman_silver' },
  sunlight_talisman: { id: 'sunlight_talisman', name: 'Sunlight Talisman', school: 'prayer', req: 20, grade: 1.1, gradeLetter: 'A', castSpeed: 1.05, bonus: { element: 'holy', pct: 0.2 }, flavor: 'Praise it. It likes that.', draw: 't_talisman_sun' },
  saints_relic: { id: 'saints_relic', name: "Saint's Relic", school: 'prayer', req: 26, grade: 1.25, gradeLetter: 'S', castSpeed: 1.15, bonus: { pct: 0.15, heals: true }, flavor: 'A finger bone. Whose, nobody says.', draw: 't_relic' },
};

export const CASTING_TOOL_IDS = Object.keys(CASTING_TOOLS);
