// apps/api/eslint.config.mjs
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default [
  // bu pakette lint dışı bırakılacaklar
  { ignores: ['dist/**', 'node_modules/**', 'eslint.config.*', '*.cjs', '*.js'] },

  // type-checked TS preset'leri
  ...tseslint.configs.recommendedTypeChecked,

  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        project: ['./tsconfig.eslint.json'],   // test/** dahil
        tsconfigRootDir: import.meta.dirname,
        allowDefaultProject: true
      },
      globals: { ...globals.node }
    },
    rules: {
      // paketine özgü kurallarını buraya ekleyebilirsin
    }
  }
];
