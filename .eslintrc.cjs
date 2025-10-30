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
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    // Next/Nest ekleri varsa buraya
  ],
  ignorePatterns: [
    '**/dist/**',
    '**/.turbo/**',
    '**/.next/**',
    '**/node_modules/**',
  ],
  rules: {
    // (3. bölümde gerekirse yumuşatacağız)
  },
};
