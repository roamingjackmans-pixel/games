// Seeded random streams (PROCGEN §1). xoshiro128** seeded via splitmix32 from a 32-bit string hash.
// Every gameplay random number comes from a named stream so host, guests and reloads agree.

/** 32-bit FNV-1a hash of a string, then avalanche-mixed. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function splitmix32(a: number): () => number {
  return () => {
    a = (a + 0x9e3779b9) | 0;
    let t = a ^ (a >>> 16);
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ (t >>> 15);
    t = Math.imul(t, 0x735a2d97);
    t = t ^ (t >>> 15);
    return t >>> 0;
  };
}

export type RngState = [number, number, number, number];

export class Rng {
  private s: Uint32Array = new Uint32Array(4);

  constructor(seed: number | string) {
    const n = typeof seed === 'string' ? hashString(seed) : seed >>> 0;
    const sm = splitmix32(n);
    this.s[0] = sm();
    this.s[1] = sm();
    this.s[2] = sm();
    this.s[3] = sm();
    if ((this.s[0]! | this.s[1]! | this.s[2]! | this.s[3]!) === 0) this.s[0] = 1;
  }

  /** Raw 32-bit unsigned output. */
  nextU32(): number {
    const s = this.s;
    const result = Math.imul(rotl(Math.imul(s[1]!, 5), 7), 9) >>> 0;
    const t = (s[1]! << 9) >>> 0;
    s[2]! ^= s[0]!;
    s[3]! ^= s[1]!;
    s[1]! ^= s[2]!;
    s[0]! ^= s[3]!;
    s[2]! ^= t;
    s[3] = rotl(s[3]!, 11);
    return result;
  }

  /** Uniform float in [0, 1). */
  next(): number {
    return this.nextU32() / 4294967296;
  }

  /** Uniform float in [lo, hi). */
  range(lo: number, hi: number): number {
    return lo + (hi - lo) * this.next();
  }

  /** Uniform integer in [lo, hi] inclusive. */
  int(lo: number, hi: number): number {
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error('Rng.pick on empty array');
    return arr[Math.floor(this.next() * arr.length)]!;
  }

  /** Index chosen by non-negative weights. Returns -1 if all weights are 0. */
  weighted(weights: readonly number[]): number {
    let total = 0;
    for (const w of weights) total += Math.max(0, w);
    if (total <= 0) return -1;
    let r = this.next() * total;
    for (let i = 0; i < weights.length; i++) {
      r -= Math.max(0, weights[i]!);
      if (r < 0) return i;
    }
    return weights.length - 1;
  }

  /** Fisher-Yates shuffle in place. */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = arr[i]!;
      arr[i] = arr[j]!;
      arr[j] = tmp;
    }
    return arr;
  }

  /** Signed angle in radians in [-a, a). */
  spread(a: number): number {
    return (this.next() * 2 - 1) * a;
  }

  getState(): RngState {
    return [this.s[0]!, this.s[1]!, this.s[2]!, this.s[3]!];
  }

  setState(st: RngState): void {
    this.s[0] = st[0];
    this.s[1] = st[1];
    this.s[2] = st[2];
    this.s[3] = st[3];
  }

  clone(): Rng {
    const r = new Rng(1);
    r.setState(this.getState());
    return r;
  }
}

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

/** Named stream derived from a seed string and a label, e.g. stream(seed, 'map:3'). */
export function stream(seed: string, label: string): Rng {
  return new Rng(hashString(`${seed}|${label}`));
}

/** Random seed string for new characters (not gameplay state; may use any entropy). */
export function randomSeedString(entropy: number): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const r = new Rng(entropy >>> 0);
  let s = '';
  for (let i = 0; i < 8; i++) s += alphabet[r.int(0, alphabet.length - 1)];
  return s;
}
