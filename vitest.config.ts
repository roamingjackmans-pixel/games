import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    __GAME_VERSION__: JSON.stringify('test'),
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    testTimeout: 60000,
  },
});
