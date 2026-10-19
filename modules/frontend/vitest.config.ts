import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// Config dedicada para tests, separada de vite.config.ts.
export default defineConfig({
  plugins: [react()],
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@project-config": path.resolve(__dirname, "../../project.config.json"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: false,
    globals: false,
    // 'threads' es más estable que 'forks' (default) en Windows: evita
    // "Timeout waiting for worker to respond" al arrancar el worker.
    pool: "threads",
    // Con la suite entera en paralelo, los flujos completos (formulario de historia con router,
    // autoguardado, shell) encadenan varias esperas de `findBy…` (3 s cada una, ver setup.ts) y
    // pueden pasar de los 5 s por defecto aunque aislados tarden 1–2 s. Mismo límite que ya usaban
    // los describe del paso 5.
    testTimeout: 15_000,
    exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/*.d.ts",
        "src/test/**",
        "src/main.tsx",
        "src/**/types.ts",
        "src/**/*.types.ts",
      ],
    },
  },
});
