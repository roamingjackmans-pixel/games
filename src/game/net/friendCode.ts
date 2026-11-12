// Friend codes and friend rooms (NETCODE §10, D339). A friend code is this browser's own id: 10 characters of
// Crockford base32 (9 random + 1 check), shown as XXXXX-XXXXX. Two friends meet in a room only they can name:
// its id and password are a hash of both codes, so nobody who lacks either code can find, join or read it.

/** Crockford base32: no I, L, O or U, so a code read aloud or typed is hard to get wrong. */
export const FRIEND_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const FRIEND_CODE_LENGTH = 10;

/**
 * The check character (D342): a weighted sum mod 32 with ODD weights (1, 3, 5, …). An odd weight shares no factor
 * with 32, so changing any one character by d (0 < |d| < 32) changes the sum by weight × d ≢ 0 (mod 32): every
 * single-character typo is caught. (D339's weights 1…9 included 2, 4, 6 and 8, which let some typos through.)
 */
function checkChar(body: string): string {
  let sum = 0;
  for (let i = 0; i < body.length; i++) sum += (2 * i + 1) * FRIEND_ALPHABET.indexOf(body[i]!);
  return FRIEND_ALPHABET[sum % 32]!;
}

/** Normalise case, spaces, dashes and look-alikes; the 10 characters if they are all in the alphabet, else null. */
function clean(s: string): string | null {
  const c = s
    .toUpperCase()
    .replace(/[\s\-_.]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1');
  if (c.length !== FRIEND_CODE_LENGTH) return null;
  for (const ch of c) if (!FRIEND_ALPHABET.includes(ch)) return null;
  return c;
}

/** A code already on a stored list: its shape only, since it was checked when it was added (D342). */
export function storedFriendCode(s: string): string | null {
  return clean(s);
}

/** A new random friend code (crypto, not the game RNG). */
export function newFriendCode(): string {
  const a = new Uint8Array(FRIEND_CODE_LENGTH - 1);
  globalThis.crypto.getRandomValues(a);
  const body = [...a].map((n) => FRIEND_ALPHABET[n % 32]!).join('');
  return body + checkChar(body);
}

/** Normalise what a player typed or pasted (spaces, dashes, lower case, O for 0, I or L for 1); null if it cannot be a code. */
export function parseFriendCode(s: string): string | null {
  const c = clean(s);
  if (!c) return null;
  const body = c.slice(0, -1);
  return checkChar(body) === c.slice(-1) ? c : null;
}

/** XXXXX-XXXXX */
export function formatFriendCode(c: string): string {
  return `${c.slice(0, 5)}-${c.slice(5)}`;
}

/** The room two friends share: the same for both whichever adds whom, and unguessable without both codes. */
export async function friendRoom(a: string, b: string): Promise<{ room: string; password: string }> {
  const [x, y] = [a, b].sort();
  const bytes = new TextEncoder().encode(`dungeon-joe-friends|${x}|${y}`);
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256', bytes));
  const hex = [...digest].map((n) => n.toString(16).padStart(2, '0')).join('');
  return { room: `f${hex.slice(0, 24)}`, password: hex.slice(24) };
}
