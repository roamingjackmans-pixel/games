// The action abstraction: devices map physical inputs to these actions; the game reads an InputFrame.

/** Gameplay actions that travel in the network input packet (bit index = position). Max 16. */
export const GAME_ACTIONS = [
  'attack',
  'block',
  'dodge',
  'skill1',
  'skill2',
  'skill3',
  'spell1',
  'spell2',
  'spell3',
  'flask',
  'quick',
  'interact',
  'twoHand',
  'swapWeapon',
] as const;
export type GameAction = (typeof GAME_ACTIONS)[number];

/** Movement and menu actions (local only). */
export const LOCAL_ACTIONS = ['moveUp', 'moveDown', 'moveLeft', 'moveRight', 'inventory', 'map', 'pause', 'cycleQuick'] as const;
export type LocalAction = (typeof LOCAL_ACTIONS)[number];

export type Action = GameAction | LocalAction;
export const ALL_ACTIONS: readonly Action[] = [...LOCAL_ACTIONS.slice(0, 4), ...GAME_ACTIONS, ...LOCAL_ACTIONS.slice(4)];

export const ACTION_BIT: Record<GameAction, number> = Object.fromEntries(GAME_ACTIONS.map((a, i) => [a, 1 << i])) as Record<
  GameAction,
  number
>;

export const ACTION_LABEL: Record<Action, string> = {
  moveUp: 'Move up',
  moveDown: 'Move down',
  moveLeft: 'Move left',
  moveRight: 'Move right',
  attack: 'Attack',
  block: 'Block / parry',
  dodge: 'Dodge',
  skill1: 'Weapon skill 1',
  skill2: 'Weapon skill 2',
  skill3: 'Weapon skill 3',
  spell1: 'Spell 1',
  spell2: 'Spell 2',
  spell3: 'Spell 3',
  flask: "Joe's Thermos",
  quick: 'Quick-use item',
  interact: 'Interact',
  twoHand: 'Two-hand toggle',
  swapWeapon: 'Swap weapon',
  inventory: 'Inventory',
  map: 'Map',
  pause: 'Pause',
  cycleQuick: 'Next quick-use item',
};

/** One simulation tick of input for one player. Aim is a world-space point. */
export interface InputFrame {
  moveX: number; // -1..1
  moveY: number; // -1..1
  aimX: number; // world px
  aimY: number; // world px
  /** true when a gamepad right stick is neutral: melee auto-targets the nearest enemy (GAME_DESIGN §4). */
  aimNeutral: boolean;
  /** gamepad aim assist strength 0..1 (0 for mouse). */
  aimAssist: number;
  buttons: number; // held GameAction bits
  pressed: number; // bits that went down since the previous frame
}

export function emptyInput(): InputFrame {
  return { moveX: 0, moveY: 0, aimX: 640, aimY: 360, aimNeutral: false, aimAssist: 0, buttons: 0, pressed: 0 };
}

export function held(f: InputFrame, a: GameAction): boolean {
  return (f.buttons & ACTION_BIT[a]) !== 0;
}
export function pressed(f: InputFrame, a: GameAction): boolean {
  return (f.pressed & ACTION_BIT[a]) !== 0;
}
