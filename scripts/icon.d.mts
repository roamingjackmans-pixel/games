// Types for scripts/icon.mjs (the offline download's and the installable app's icons).
export function renderIcon(size: number, full?: boolean): Buffer;
export function encodePng(size: number, rgba: Buffer): Buffer;
export function iconIco(sizes?: number[]): Buffer;
export function appIcons(): Record<string, Buffer>;
