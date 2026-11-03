// Types for scripts/offline-files.mjs, so tests can import it.
export function inlineHtml(html: string, files: Map<string, string>, faviconSvg?: string | null): string;
export function launcherCmd(): string;
export function readmeTxt(version: string, built: string): string;
