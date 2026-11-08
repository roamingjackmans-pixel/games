import { afterEach, describe, expect, it } from 'vitest';
import { defaultSettings } from '../../src/engine/settings';
import { adoptGlobalPad, diskSettings, padOwnerName, releasePad, resetPadProfile, shareAsGlobalPad, syncPad, usePadOf, type PadOwnerChar } from '../../src/engine/padProfile';
import { normalizeSave, newSave } from '../../src/game/save/schema';
import { newCharacter } from '../../src/game/player/character';

afterEach(() => resetPadProfile());

describe('per-character controller layouts', () => {
  it('a character without a layout copies the global one when it plays, and the global one comes back after', () => {
    const s = defaultSettings();
    s.controls.gamepad.skill1 = [7];
    s.controls.aimAssist = 0.3;
    const caster: PadOwnerChar = { name: 'Merla' };
    let saves = 0;
    usePadOf(s, caster, () => saves++);
    expect(caster.pad!.gamepad.skill1).toEqual([7]);
    expect(caster.pad!.aimAssist).toBe(0.3);
    expect(saves).toBe(1);
    expect(padOwnerName()).toBe('Merla');
    // editing while playing changes the character's copy (and saves it), never the global one on disk
    s.controls.gamepad.spell1 = [4];
    s.controls.aimAssist = 1;
    syncPad(s);
    expect(caster.pad!.gamepad.spell1).toEqual([4]);
    expect(saves).toBe(2);
    expect(diskSettings(s).controls.aimAssist).toBe(0.3);
    expect(diskSettings(s).controls.gamepad.spell1).not.toEqual([4]);
    // nothing changed: no extra save
    syncPad(s);
    expect(saves).toBe(2);
    releasePad(s, caster as PadOwnerChar);
    expect(padOwnerName()).toBeNull();
    expect(s.controls.aimAssist).toBe(0.3);
    expect(s.controls.gamepad.spell1).not.toEqual([4]);
  });

  it('two characters keep different layouts', () => {
    const s = defaultSettings();
    const caster: PadOwnerChar = { name: 'Caster' };
    const knight: PadOwnerChar = { name: 'Knight' };
    usePadOf(s, caster, () => undefined);
    s.controls.gamepad.spell1 = [5];
    s.controls.menuPad = { confirm: 2, back: 3 };
    syncPad(s);
    releasePad(s);
    usePadOf(s, knight, () => undefined);
    expect(s.controls.gamepad.spell1).not.toEqual([5]);
    expect(s.controls.menuPad).toEqual({ confirm: 0, back: 1 });
    s.controls.gamepad.block = [9];
    syncPad(s);
    releasePad(s);
    usePadOf(s, caster, () => undefined);
    expect(s.controls.gamepad.spell1).toEqual([5]);
    expect(s.controls.menuPad).toEqual({ confirm: 2, back: 3 });
    expect(s.controls.gamepad.block).not.toEqual([9]);
  });

  it('a character can take the default layout, or make its own the default', () => {
    const s = defaultSettings();
    const a: PadOwnerChar = { name: 'A' };
    usePadOf(s, a, () => undefined);
    s.controls.gamepad.dodge = [6];
    syncPad(s);
    expect(adoptGlobalPad(s)).toBe(true);
    syncPad(s);
    expect(a.pad!.gamepad.dodge).not.toEqual([6]);
    s.controls.gamepad.dodge = [6];
    syncPad(s);
    shareAsGlobalPad(s);
    expect(diskSettings(s).controls.gamepad.dodge).toEqual([6]);
    releasePad(s);
    expect(s.controls.gamepad.dodge).toEqual([6]);
  });

  it('a saved layout survives normalizeSave; a broken one is dropped', () => {
    const c = newCharacter('knight', 'Sir', 'p1');
    const save = newSave(0, c, 'seed');
    const s = defaultSettings();
    s.controls.gamepad.skill2 = [11];
    usePadOf(s, save.character, () => undefined);
    releasePad(s);
    const back = normalizeSave(JSON.parse(JSON.stringify(save)));
    expect(back.character.pad!.gamepad.skill2).toEqual([11]);
    const bad = JSON.parse(JSON.stringify(save));
    bad.character.pad = 'nope';
    expect(normalizeSave(bad).character.pad).toBeUndefined();
    const old = JSON.parse(JSON.stringify(save));
    delete old.character.pad;
    expect(normalizeSave(old).character.pad).toBeUndefined();
  });
});
