// Weapon skills and spells (filled in at M6). The player controller calls these hooks.
import type { Entity, World } from '../world';

export function tryUseSkill(_w: World, _e: Entity, _index: number): boolean {
  return false;
}

export function tryCastSpell(_w: World, _e: Entity, _index: number): boolean {
  return false;
}

export function updatePlayerAction(_w: World, _e: Entity, _dt: number): void {}

export function tryUseConsumable(_w: World, _e: Entity): boolean {
  return false;
}
