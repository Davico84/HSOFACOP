import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores([
    "dist",
    "coverage",
    "test-results",
    "playwright-report",
    "src/modules/core/services/generated", // código generado por orval (se valida con tsc, no con eslint)
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Un archivo = un componente en pantallas y componentes de módulo.
    // core/ui queda exento: una familia de primitivos comparte archivo (convención shadcn).
    files: ["src/screens/**/*.tsx", "src/modules/*/components/**/*.tsx"],
    ignores: ["**/*.test.tsx"],
    plugins: { react },
    // Versión explícita: "detect" usa context.getFilename(), eliminado en ESLint 10.
    settings: { react: { version: "19.2" } },
    rules: {
      "react/no-multi-comp": "error",
    },
  },
]);
