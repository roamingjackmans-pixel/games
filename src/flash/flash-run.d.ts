// Types for flash-run.js (FlashRun SDK v1). Copy next to flash-run.js in a TypeScript game.
export {};

declare global {
  interface FlashRunConfig {
    v: 1;
    /** the FlashGames day, YYYY-MM-DD (US Central) */
    date: string;
    /** the day's seed: everyone playing that day gets the same one */
    seed: number;
    /** the day's modifier ids, from the game's flash.json */
    mods: string[];
    /** seconds in the run (900) */
    limit: number;
    /** the server's run id (the game doesn't need it) */
    run?: string;
    /** free-form values from the day's plan, for modifiers that take a number or a choice */
    params?: Record<string, unknown>;
  }

  interface FlashRunApi {
    readonly active: boolean;
    readonly config: FlashRunConfig | null;
    readonly mods: string[];
    readonly seed: number;
    readonly date: string;
    readonly limit: number;
    has(id: string): boolean;
    ready(): Promise<void>;
    running(): boolean;
    isOver(): boolean;
    score(n: number, detail?: string): void;
    best(): number;
    over(n: number, detail?: string, reason?: 'won' | 'dead' | 'time'): void;
    onEnd(fn: () => void): void;
    timeLeft(): number;
    elapsed(): number;
    rng(salt?: string | number): () => number;
  }

  interface Window {
    FlashRun: FlashRunApi;
  }
  // eslint-disable-next-line no-var
  var FlashRun: FlashRunApi;
}
