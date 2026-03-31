import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // 무시 대상
  { ignores: ['dist/', 'node_modules/'] },

  // TypeScript — Figma Sandbox (code.ts)
  {
    files: ['src/code.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      globals: {
        figma: 'readonly',
        ...globals.es2020,
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...prettierConfig.rules,
      // TypeScript가 타입 체크를 담당 — no-undef 비활성화
      'no-undef': 'off',
      // 빈 catch 블록 허용: Figma clientStorage 에러는 무시가 의도적
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-console': 'warn',
      // Figma API 타입 미지원 케이스 허용 (CLAUDE.md 예외 조항)
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },

  // JavaScript — UI 로직 (ui.js, converters/)
  {
    files: ['src/ui.js', 'src/converters/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: { ...globals.browser },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...prettierConfig.rules,
      'no-console': 'warn',
      'no-var': 'off',        // ui.js는 ES5 var 패턴 사용
      'prefer-const': 'off',  // var 패턴과 충돌
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  // Node — 빌드 스크립트 (build.mjs)
  {
    files: ['build.mjs'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...prettierConfig.rules,
    },
  },
];
