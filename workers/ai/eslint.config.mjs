// workers/ai/eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    // Konfig dosyasını ve build klasörlerini lint dışı bırak
    ignores: [
      "eslint.config.*",
      "node_modules/**",
      "dist/**",
      "build/**",
      ".turbo/**",
    ],
  },

  // JS temel kurallar
  js.configs.recommended,

  // TS kuralları (parser + plugin)
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx,js,cjs,mjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // Node ortamı (URL dahil)
      globals: { ...globals.node, URL: "readonly" },
    },
    rules: {
      // İstersen burada proje seviyesi kurallar ekleyebilirsin
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
