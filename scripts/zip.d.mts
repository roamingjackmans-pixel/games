// Types for scripts/zip.mjs (the offline download's zip writer), so tests can import it.
export function crc32(buf: Uint8Array): number;
export function makeZip(files: { name: string; data: Uint8Array | string }[], date?: Date): Buffer;
export function readZip(buf: Uint8Array): Map<string, Buffer>;
