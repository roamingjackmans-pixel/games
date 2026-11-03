// Types for scripts/icon.mjs (the offline download's icon), so tests can import it.
export function renderIcon(size: number): Buffer;
export function encodePng(size: number, rgba: Buffer): Buffer;
export function iconIco(sizes?: number[]): Buffer;
