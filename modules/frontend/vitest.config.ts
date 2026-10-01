import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// Config dedicada para tests, separada de vite.config.ts.
export default defineConfig({
  plugins: [react()],
  define: {
    BACKEND_URL: JSON.stringify("https://api.test"),
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
