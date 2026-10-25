// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import security from "eslint-plugin-security";
import unusedImports from "eslint-plugin-unused-imports";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  security.configs.recommended,
  prettier,
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      // ── TypeScript ──────────────────────────────────────────────────────
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],

      // ── Unused Imports ──────────────────────────────────────────────────
      "unused-imports/no-unused-imports": "warn",

      // ── General ─────────────────────────────────────────────────────────
      "no-console": "warn",
      "no-nested-ternary": "warn",
      "no-eval": "error",

      // ── Security ────────────────────────────────────────────────────────
      "security/detect-object-injection": "off", // Too many false positives
      "security/detect-non-literal-regexp": "warn",
    },
  },
  {
    ignores: ["dist/", "node_modules/", "*.js", "scripts/"],
  },
);
