import { describe, expect, it } from 'vitest';
import { validateTemplate } from '../../src/game/procgen/templates';
import { ROOM_TEMPLATES } from '../../src/data/rooms';

describe('room templates (PROCGEN §3)', () => {
  for (const [zone, list] of Object.entries(ROOM_TEMPLATES)) {
    it(`zone ${zone} templates are valid`, () => {
      if (list.length === 0) return;
      expect(list.length).toBe(10);
      expect(list.flatMap(validateTemplate).map((i) => `${i.id}: ${i.msg}`)).toEqual([]);
      expect(new Set(list.map((t) => t.id)).size).toBe(10);
    });
  }
});
