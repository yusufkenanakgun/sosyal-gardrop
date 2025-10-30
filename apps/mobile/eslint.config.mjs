// apps/mobile/eslint.config.mjs
import expo from 'eslint-config-expo/flat.js';

export default [
  { ignores: ['.expo/**', 'dist/**', 'build/**'] },
  ...expo,
  {
    settings: {
      'import/resolver': {
        typescript: { project: './tsconfig.json' },
      },
    },
  },
];
