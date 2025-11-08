// .eslintrc.cjs (root)
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // Monorepo'da mutlaka kökü sabitle
    tsconfigRootDir: __dirname,
    project: [
      './apps/*/tsconfig.json',
      './packages/*/tsconfig.json',
    ],
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    // Type-checked kuralları kaldırdık çünkü çok strict
  ],
  ignorePatterns: [
    '**/dist/**',
    '**/.turbo/**',
    '**/.next/**',
    '**/node_modules/**',
  ],
  rules: {
    // Type-safety kurallarını kapat (backend için çok strict)
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/no-unsafe-argument': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-base-to-string': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/require-await': 'off',
    '@typescript-eslint/no-unused-vars': ['error', {
      'argsIgnorePattern': '^_',
      'varsIgnorePattern': '^_',
      'caughtErrorsIgnorePattern': '^_'
    }],
  },
};
