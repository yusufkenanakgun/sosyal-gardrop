import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  // 1) Tüm dist ve node_modules klasörlerini dışla (top-level ignore olmalı)
  { ignores: ["dist/**", "node_modules/**"] },

  // 2) Temel önerilen setler
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3) TS dosyaları için ayarlar
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      // Sprint 0'da hızlı geçiş için kapatıyoruz; Sprint 1'de yeniden açarız
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
];