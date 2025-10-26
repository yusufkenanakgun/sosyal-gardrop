// eslint.config.mjs — Monorepo genel flat config (ESLint v9 uyumlu)
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  // Tüm paketler için ignore’lar
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '.turbo/**',
      'apps/web/.next/**'
    ],
  },

  // JS temel kurallar
  js.configs.recommended,

  // TypeScript için hızlı ve sorunsuz temel kurallar (type-check gerektirmez)
  ...tseslint.configs.recommended,

  // Ortak TS ayarları ve örnek kurallar
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        // type-aware değil; tsconfig araması şart değil
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      // İstersen ileride sıkılaştırırız
      'no-console': 'off'
    },
  },

  // Paket-bazlı küçük ortam farkları (gerekirse genişletiriz)
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: { globals: { console: true, process: true } },
    rules: {
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-floating-promises': ['warn', { ignoreVoid: true }],
    }
  },
  {
    files: ['workers/ai/**/*.ts'],
    languageOptions: { globals: { console: true, process: true } },
    rules: {
    '@typescript-eslint/no-explicit-any': 'off'  // Sprint 0: geçici
    }
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    // React plugin eklemedik; Next özel kurallarını Sprint 1'de ekleriz.
  },
];
