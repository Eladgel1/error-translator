import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // Global ignores
  globalIgnores(["dist", "build", "coverage", "node_modules"]),
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["node_modules"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    rules: {
      // Critical style rules
      semi: ["error", "always"],
      indent: ["error", 2, { SwitchCase: 1 }],

      // Naming conventions
      camelcase: ["warn", { properties: "always" }],
      "id-match": [
        "warn",
        "^(?:[a-z][a-zA-Z0-9]*|[A-Z][a-zA-Z0-9]*|[A-Z0-9_]+)$",
        { onlyDeclarations: true },
      ],
      "new-cap": ["warn", { newIsCap: true, capIsNew: false }],

      // React rules
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",

      // React Hooks rules
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/exhaustive-deps": "off",

      // Disable TS unused vars
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
    settings: {
      react: { version: "detect" },
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        vi: "readonly",
        global: "readonly",
      },
    },
    rules: {},
  },
]);
