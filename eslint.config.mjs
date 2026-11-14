import { fileURLToPath } from 'node:url';

import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

const tsconfigRootDir = fileURLToPath(new URL('.', import.meta.url));

export default [
  // Global ignores — generated folders never get linted.
  {
    ignores: [
      'node_modules/**',
      'test-results/**',
      'playwright-report/**',
      'allure-results/**',
      'allure-report/**',
      '.auth/**',
      '.blob-report/**',
    ],
  },

  // Base rule sets.
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked, // type-aware TypeScript rules
  playwright.configs['flat/recommended'], // Playwright-specific rules

  // Must come before our overrides, after presets: turns off stylistic
  // rules that would clash with Prettier.
  eslintConfigPrettier,

  // Project-wide settings + our stricter quality gates.
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
    },
    rules: {
      // ── Framework quality gates ──────────────────────────────
      // `any` is banned across the codebase — everything is typed.
      '@typescript-eslint/no-explicit-any': 'error',
      // Unused variables are bugs, except names prefixed with `_`.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // `import type { Foo }` when only types are imported — clearer intent.
      '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
      // Floating promises hide real test bugs.
      '@typescript-eslint/no-floating-promises': 'error',
      // Fixed sleeps are banned — rely on auto-waiting + web-first assertions.
      'playwright/no-wait-for-timeout': 'error',
      // Skipped tests rot silently — keep them visible.
      'playwright/no-skipped-test': 'warn',
    },
  },

  // Plain JS files (like this config) are not part of a TS project —
  // disable rules that need type information for them.
  {
    files: ['**/*.{js,mjs,cjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
];
