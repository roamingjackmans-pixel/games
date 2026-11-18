// Co-op protocol (NETCODE §3): message names and shapes, room codes, the version check and the per-frame input
// packet. Snapshots live in snapshot.ts, character sync in charSync.ts.
import type { InputFrame } from '../../engine/input/actions';
import type { Appearance, Character, ClassId, Rarity } from '../types';

export const MAX_GUESTS = 3;
// 30 snapshots a second (D149; was 20): more samples to interpolate between, so less to guess on a jittery link
export const SNAP_HZ = 30;
export const FULL_EVERY_S = 2;
export const GUEST_TIMEOUT_S = 10;

/** Channel names (short: Trystero namespaces travel with every packet). */
export const CH = {
  hello: 'hello',
  lobby: 'lobby',
  welcome: 'welcome',
  reject: 'reject',
  input: 'input',
  snap: 'snap',
  event: 'event',
  cmd: 'cmd',
  char: 'char',
  charop: 'charop',
  ping: 'ping',
  pong: 'pong',
  /** a guest's own body, every frame (D338) */
  body: 'body',
  /** what a guest's own body did to the shared world (D338) */
  act: 'act',
} as const;

/** Room codes are 6 digits (D76): easy to read out loud and to type on any keyboard. */
export const CODE_LENGTH = 6;

export function newRoomCode(): string {
  const a = new Uint32Array(CODE_LENGTH);
  globalThis.crypto.getRandomValues(a);
  return [...a].map((n) => String(n % 10)).join('');
}

/** Normalise what a player typed (spaces and dashes are fine, O reads as 0); null when it cannot be a code. */
export function parseRoomCode(s: string): string | null {
  const c = s.toUpperCase().replace(/O/g, '0').replace(/[\s-]/g, '');
  return /^[0-9]{6}$/.test(c) ? c : null;
}

export function gameVersion(): string {
  return __GAME_VERSION__;
}

export function versionMismatch(host: string, guest: string): string | null {
  return host === guest ? null : `Host is on ${host}, you are on ${guest}.`;
}

/** What a guest tells the host about itself (NETCODE §3 hello). */
export interface Hello {
  version: string;
  playerId: string;
  name: string;
  classId: ClassId;
  level: number;
  char: Character;
}

export interface PublicPlayer {
  peerId: string;
  playerId: string;
  name: string;
  classId: ClassId;
  level: number;
  host: boolean;
  cycle: number;
  /** the creator look, so the lobby shows each player as they made themselves */
  appearance?: Appearance | undefined;
  /** what they wear and hold now, so the lobby draws them as they are (D170) */
  gear?: LobbyGear | undefined;
}

/** One worn item, as much as a picture needs: base id, rarity, and a legendary's name (its weapon art). */
export interface LobbyGearItem {
  b: string;
  r: Rarity;
  n?: string;
}

export const LOBBY_GEAR_SLOTS = ['main', 'off', 'head', 'body', 'legs'] as const;

/** The worn slots (null = empty) and whether the weapon is held in both hands. */
export type LobbyGear = { [K in (typeof LOBBY_GEAR_SLOTS)[number]]?: LobbyGearItem | null } & { two?: boolean };

export interface LobbyState {
  code: string;
  players: PublicPlayer[];
  /** the host's zone, so guests can see where they are going */
  zone: number;
  /** the host's friendly-fire percent (0–200), which the whole party plays by (D115; absent from older hosts: 100) */
  ff?: number;
  /** the host's pick (D401): a Wave Rush from this 0-based cycle; absent: the campaign in the host's world */
  rush?: number;
}

/** Where a Wave Rush stands, for a guest to build the same map (one room, or the boss's arena). */
export interface RushWhere {
  stage: number;
  boss: string;
}

/** Everything a guest needs to enter the host's world. */
export interface Welcome {
  you: string;
  seed: string;
  cycle: number;
  zone: number;
  layoutOpts: { tutorial: boolean; fewSpells: boolean };
  time: number;
  slot: number;
  /** a Wave Rush (D401): its stage and boss; absent in the campaign */
  rush?: RushWhere;
  /** the host's Hardcore campaign (D440): the mirror's enemies hit harder and have more HP, as the host's do */
  hardcore?: boolean;
}

/** Guest commands that touch the shared world (NETCODE §3 cmd). */
export type Cmd = { op: 'leave' } | { op: 'fullPlease' } | { op: 'chat'; text: string };

/** Reliable host → guest events beyond the per-snapshot world events. */
export type NetEvent =
  | { t: 'bonfire'; id: string; first: boolean }
  | { t: 'zone'; zone: number; seed: string; cycle: number; layoutOpts: { tutorial: boolean; fewSpells: boolean }; rush?: RushWhere }
  | { t: 'died' }
  | { t: 'wipe' }
  | { t: 'toLobby' }
  | { t: 'hostLeft' }
  | { t: 'chat'; from: string; text: string }
  | { t: 'credits' }
  /** a zone's boss fell in the host's world: each guest's own world decides what it keeps (D195) */
  | { t: 'zoneBeaten'; zone: number; cycle: number }
  /** this guest opened Gary's cart in the host's world (D396): its own cart, from its own world, for its own Glowen */
  | { t: 'gary'; zone: number; cycle: number }
  /** Wave Rush (D408): what happened, so each guest keeps its own record and its own browser's unlock */
  | { t: 'rush'; kind: 'try' | 'stage' | 'room' | 'cleared' | 'death'; cycle: number; stage: number; sec?: number };

// ---------------------------------------------------------------- input packet (NETCODE §3)
// seq u16, moveX i8, moveY i8, aimX i16, aimY i16, buttons u16, pressed u16, tick u32, flags u8 = 17 bytes

export interface InputPacket {
  seq: number;
  tick: number;
  frame: InputFrame;
}

export function encodeInput(p: InputPacket): ArrayBuffer {
  const b = new ArrayBuffer(17);
  const v = new DataView(b);
  const f = p.frame;
  v.setUint16(0, p.seq & 0xffff);
  v.setInt8(2, Math.round(Math.max(-1, Math.min(1, f.moveX)) * 127));
  v.setInt8(3, Math.round(Math.max(-1, Math.min(1, f.moveY)) * 127));
  v.setInt16(4, Math.round(Math.max(-16000, Math.min(16000, f.aimX))));
  v.setInt16(6, Math.round(Math.max(-16000, Math.min(16000, f.aimY))));
  v.setUint16(8, f.buttons & 0xffff);
  v.setUint16(10, f.pressed & 0xffff);
  v.setUint32(12, p.tick >>> 0);
  v.setUint8(16, (f.aimNeutral ? 1 : 0) | (Math.round(Math.max(0, Math.min(1, f.aimAssist)) * 7) << 1));
  return b;
}

export function decodeInput(b: ArrayBuffer): InputPacket {
  const v = new DataView(b);
  const fl = v.getUint8(16);
  return {
    seq: v.getUint16(0),
    tick: v.getUint32(12),
    frame: {
      moveX: v.getInt8(2) / 127,
      moveY: v.getInt8(3) / 127,
      aimX: v.getInt16(4),
      aimY: v.getInt16(6),
      buttons: v.getUint16(8),
      pressed: v.getUint16(10),
      aimNeutral: (fl & 1) !== 0,
      aimAssist: (fl >> 1) / 7,
    },
  };
}

/** seq comparison with u16 wrap-around */
export function seqNewer(a: number, b: number): boolean {
  return ((a - b) & 0xffff) < 0x8000 && a !== b;
}
