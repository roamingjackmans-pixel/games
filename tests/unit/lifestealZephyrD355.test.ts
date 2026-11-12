import { describe, expect, it } from 'vitest';
import { LIFESTEAL_MULT, lifestealShown } from '../../src/data/roles';
import { GEMS, gemText } from '../../src/data/gems';
import { affixText } from '../../src/data/affixes';
import { setEffectText } from '../../src/data/setPerks';
import { LEGENDARY_POWERS } from '../../src/data/legendaries';

// D355: lifesteal heals 4× (the cards show it); D356: the Zephyr gem is 30% weaker
describe('lifesteal ×4 (D355)', () => {
  it('is 4 and the cards read the multiplied numbers', () => {
    expect(LIFESTEAL_MULT).toBe(4);
    expect(lifestealShown(0.004)).toBeCloseTo(0.016, 9);
    expect(gemText('leech')).toBe('1.6% of max HP healed a hit (lifesteal)');
    expect(affixText('leeching', 0.2)).toBe('0.8% of max HP healed a hit (lifesteal)');
    expect(setEffectText({ lifestealPct: 0.0025 })).toContain('1% of max HP healed a hit (lifesteal)');
    expect(LEGENDARY_POWERS.hungering!.text).toContain('1.6% of max HP');
  });
});

describe('Zephyr gem (D356)', () => {
  it('gives 30% less stamina regeneration (16 became 11.2)', () => {
    expect(GEMS.zephyr.value).toBeCloseTo(16 * 0.7, 9);
    expect(gemText('zephyr')).toBe('+11% stamina regeneration');
  });
});
