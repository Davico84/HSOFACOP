import { http, HttpResponse, type RequestHandler } from "msw";

// Host de la API en los tests (los handlers usan `*/…`, así que no depende de la URL base).
export const API = "https://api.test";

// Handlers globales por defecto. Cada test añade o reemplaza los suyos con `server.use(...)`.
export const handlers: RequestHandler[] = [
  // Cupo de historias: por defecto sin límite (los tests de cupo lo reemplazan).
  http.get("*/api/orthodontic-records/quota", () => HttpResponse.json({ limit: null, used: 0, reached: false })),
];
