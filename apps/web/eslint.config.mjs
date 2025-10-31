// apps/web/eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import next from "@next/eslint-plugin-next";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  // JS temel kurallar
  js.configs.recommended,

  // TS önerilen kurallar (flat config — dizi halinde gelir)
  ...tseslint.configs.recommended,

  // Next.js önerileri (flat uyumlu)
  next.configs.recommended,

  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,   // window, document vs.
        ...globals.node,      // process, __dirname vs.
      },
      parserOptions: {
        // Proje kökünde tsconfig varsa otomatik bulur; gerekirse aşağıyı açın:
        // project: ["./tsconfig.json"],
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    settings: {
      react: { version: "detect" },
      next: { rootDir: ["apps/web/"] },
    },
    rules: {
      // İstersen buraya özelleştirme ekleyebilirsin:
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];
