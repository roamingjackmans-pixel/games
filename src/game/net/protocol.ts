// Co-op protocol (NETCODE §3): message names and shapes, room codes, the version check and the 60 Hz input
// packet. Snapshots live in snapshot.ts, character sync in charSync.ts.
import type { InputFrame } from '../../engine/input/actions';
import type { Character, ClassId } from '../types';

export const MAX_GUESTS = 3;
export const SNAP_HZ = 20;
export const FULL_EVERY_S = 2;
export const GUEST_TIMEOUT_S = 10;
export const INTERP_DELAY_S = 0.1;

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
} as const;

export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function newRoomCode(): string {
  const a = new Uint8Array(6);
  globalThis.crypto.getRandomValues(a);
  return [...a].map((b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
}

/** Normalise what a player typed; null when it cannot be a room code. */
export function parseRoomCode(s: string): string | null {
  const c = s.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/O/g, '0');
  if (c.length !== 6) return null;
  for (const ch of c) if (!CODE_ALPHABET.includes(ch)) return null;
  return c;
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
}

export interface LobbyState {
  code: string;
  players: PublicPlayer[];
  /** the host's zone, so guests can see where they are going */
  zone: number;
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
}

/** Guest commands that touch the shared world (NETCODE §3 cmd). */
export type Cmd = { op: 'leave' } | { op: 'fullPlease' } | { op: 'chat'; text: string };

/** Reliable host → guest events beyond the per-snapshot world events. */
export type NetEvent =
  | { t: 'bonfire'; id: string; first: boolean }
  | { t: 'zone'; zone: number; seed: string; cycle: number; layoutOpts: { tutorial: boolean; fewSpells: boolean } }
  | { t: 'died' }
  | { t: 'wipe' }
  | { t: 'toLobby' }
  | { t: 'hostLeft' }
  | { t: 'chat'; from: string; text: string }
  | { t: 'credits' };

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
