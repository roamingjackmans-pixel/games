import { defineConfig } from 'vitest/config';

// The balance simulation harness (M15): long-running, so it is kept out of `npm test`.
export default defineConfig({
  define: { __GAME_VERSION__: JSON.stringify('sim') },
  test: { environment: 'node', include: ['tests/sim/**/*.sim.ts'], testTimeout: 1_800_000 },
});
