// D429: Meteor deals its Fire and knockback but no longer builds Burn.
import { describe, expect, it } from 'vitest';
import { SPELLS } from '../../src/data/spells';

describe('Meteor has no Burn (D429)', () => {
  it('its blast carries no status and its card says no Burn', () => {
    const e = SPELLS.meteor!.effect[0]!;
    expect(e.op).toBe('damage');
    if (e.op === 'damage') {
      expect(e.status).toBeUndefined();
      expect(e.base).toBe(160);
      expect(e.knockback).toBe(120);
    }
    expect(SPELLS.meteor!.description).not.toMatch(/Burn/);
  });
});
