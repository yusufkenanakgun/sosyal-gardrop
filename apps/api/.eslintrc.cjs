module.exports = {
  root: false, // kökte bir eslintrc varsa, burada root:false olabilir
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: ['./tsconfig.json'],   // <-- ÖNEMLİ: type-aware kurallar için
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    // type-aware kurallar
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/strict-type-checked',
  ],
  rules: {
    // CI’daki hataları görebilmek için bunlar açık kalmalı:
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-argument': 'error',
    '@typescript-eslint/require-await': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
  },
  ignorePatterns: [
    'dist/**',
    'node_modules/**',
  ],
};
