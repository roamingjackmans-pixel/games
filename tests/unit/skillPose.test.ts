// D234: every weapon skill moves the weapon in a way that fits it.
import { describe, expect, it } from 'vitest';
import { SKILLS } from '../../src/data/skills';
import { skillMotion, skillWeaponPose } from '../../src/render/skillPose';

describe('weapon motion during skills (D234)', () => {
  it('reads a fitting motion from each skill', () => {
    expect(skillMotion('colossal_guillotine').motion).toBe('chop');
    expect(skillMotion('greathammer_earthshaker').motion).toBe('chop');
    expect(skillMotion('greataxe_cleave_spin').motion).toBe('spin');
    expect(skillMotion('greathammer_meteor_lunge').motion).toBe('leap');
    expect(skillMotion('katana_iai_slash').motion).toBe('iai');
    expect(skillMotion('whip_crack').motion).toBe('crack');
    expect(skillMotion('bow_volley').motion).toBe('shoot');
    expect(skillMotion('greataxe_bloodlust').motion).toBe('raise');
  });

  it('the weapon moves: windup and strike differ from rest and from each other', () => {
    for (const id of Object.keys(SKILLS)) {
      const m = skillMotion(id);
      const rest = skillWeaponPose(m, 0, 0);
      const wound = skillWeaponPose(m, 1, 0);
      const struck = skillWeaponPose(m, 1, 1);
      const moved = (a: { rot: number; ext: number }, b: { rot: number; ext: number }): boolean => Math.abs(a.rot - b.rot) + Math.abs(a.ext - b.ext) > 0.2;
      expect(moved(rest, wound) || moved(wound, struck), id).toBe(true);
    }
  });
});
