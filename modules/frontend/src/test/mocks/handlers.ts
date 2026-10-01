import type { RequestHandler } from "msw";

// Debe coincidir con el `BACKEND_URL` definido en vitest.config.ts.
export const API = "https://api.test";

// Handlers globales por defecto (vacío en scaffolding).
// Cada test añade los suyos con `server.use(http.get(...))`.
export const handlers: RequestHandler[] = [];
