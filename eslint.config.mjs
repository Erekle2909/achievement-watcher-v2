import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  prettierConfig,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "packages/*/__tests__/*.ts",
            "plugins/*/__tests__/*.ts",
            "packages/*/src/__tests__/*.ts",
            "plugins/*/src/__tests__/*.ts",
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-non-null-assertion": "error",
    },
  },
  {
    ignores: [
      "**/dist/",
      "**/node_modules/",
      "**/*.js",
      "**/*.mjs",
      "**/*.d.ts",
      "**/vitest.config.ts",
      "**/vitest.workspace.ts",
      "**/drizzle.config.ts",
      "**/vite.config.ts",
    ],
  },
);
