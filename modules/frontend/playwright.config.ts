import { defineConfig, devices } from "@playwright/test";

/**
 * E2E con Playwright (docs/testing.md §4). Specs en `e2e/`, excluidos de Vitest.
 * - Por defecto levanta el dev server de Vite (o reutiliza uno que ya esté corriendo).
 * - `E2E_BASE_URL=...` apunta a un entorno ya desplegado (no levanta servidor).
 * - Los specs que necesitan backend real (`*.backend.spec.ts`) solo corren con `E2E_BACKEND=1`
 *   y el backend + PostgreSQL levantados; en CI corre solo el smoke (sin API).
 */
const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  outputDir: "test-results",
  use: {
    baseURL,
    locale: "es-PE",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm dev --port 5173 --strictPort",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
