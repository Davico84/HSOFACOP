import { describe, expect, it } from "vitest";
import { resolveApiBaseUrl } from "./apiBaseUrl";

describe("cloud-deployment — URL base por entorno", () => {
  it("sin VITE_API_URL: backend local en desarrollo y mismo origen en producción", () => {
    expect(resolveApiBaseUrl({ DEV: true })).toBe("http://localhost:8080");
    expect(resolveApiBaseUrl({ DEV: false })).toBe("");
    expect(resolveApiBaseUrl({ VITE_API_URL: "", DEV: false })).toBe("");
  });

  it("con VITE_API_URL se usa ese valor en ambos entornos", () => {
    expect(resolveApiBaseUrl({ VITE_API_URL: "https://api.ejemplo.pe", DEV: true })).toBe("https://api.ejemplo.pe");
    expect(resolveApiBaseUrl({ VITE_API_URL: "https://api.ejemplo.pe", DEV: false })).toBe("https://api.ejemplo.pe");
  });
});
