import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

const noMathRandom = {
  'no-restricted-properties': [
    'error',
    {
      object: 'Math',
      property: 'random',
      message: 'Use a seeded stream from src/engine/rng.ts (PROCGEN §1). Math.random is banned in src/game and src/data.',
    },
  ],
};

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, __GAME_VERSION__: 'readonly' },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' }],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      'no-constant-condition': ['error', { checkLoops: false }],
      'prefer-const': 'error',
      '@typescript-eslint/no-this-alias': 'off',
    },
  },
  {
    files: ['src/game/**/*.ts', 'src/data/**/*.ts'],
    rules: noMathRandom,
  },
);
