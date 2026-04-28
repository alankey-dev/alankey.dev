import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "_site/**",
      "node_modules/**",
      "coverage/**",
      ".lighthouseci/**",
    ],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-console": "error",
      "no-unused-vars": "error",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
    },
  },
  {
    files: ["tests/**/*.mjs"],
    rules: {
      "no-console": "off",
    },
  },
];
