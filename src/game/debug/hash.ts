// The debug menu gate (D29): the owner's code is only ever compared by SHA-256, never stored in plain text.
export const DEBUG_CODE_SHA256 = '1bdbba686a80685b2d3e388d26fb8067c33b4392d8029716f32f4c61af2fb24e';

export async function sha256Hex(s: string): Promise<string> {
  const data = new TextEncoder().encode(s);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function checkDebugCode(code: string): Promise<boolean> {
  if (!code) return false;
  return (await sha256Hex(code.trim())) === DEBUG_CODE_SHA256;
}
