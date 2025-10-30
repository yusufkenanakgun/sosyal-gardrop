import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  // 0) ignore
  { ignores: ["dist/**", "node_modules/**", ".eslintrc.*", "eslint.config.*"] },

  // 1) Sadece JS dosyalarına JS öneriler
  { files: ["**/*.js", "**/*.mjs", "**/*.cjs"], ...js.configs.recommended },

  // 2) Sadece TS dosyalarına (genel) TS öneriler – type-check'siz
  ...tseslint.configs.recommended.map((cfg) => ({
    ...cfg,
    files: ["**/*.ts", "**/*.tsx"],
  })),

  // 3) TYPE-AWARE olan preset'i YALNIZCA src/** için uygula
  ...tseslint.configs.recommendedTypeChecked.map((cfg) => ({
    ...cfg,
    files: ["src/**/*.ts", "src/**/*.tsx"], // << test/** hariç
  })),

  // 4) src/** için type-aware parserOptions
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.eslint.json"],
      },
    },
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/no-redundant-type-constituents": "error",
    },
  },

  // 5) test/** için TYPE-AWARE kapalı (ve gerekirse kural kapatma)
  {
    files: ["test/**/*.ts", "test/**/*.tsx"],
    languageOptions: {
      parserOptions: { project: null }, // type info yok
    },
    rules: {
      // Güvenli olsun diye bu kuralı testlerde de kapatıyoruz
      "@typescript-eslint/await-thenable": "off",
    },
  },
];
