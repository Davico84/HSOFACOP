import { describe, it, expect } from "vitest";
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import type { ApiProblem } from "@/modules/core/services/generated/model";
import { getUserFriendlyError } from "./apiError";

const GENERIC = "Ocurrió un error inesperado. Inténtalo de nuevo.";

function axiosErrorWith(data: unknown): AxiosError {
  const response = {
    data,
    status: 409,
    statusText: "Conflict",
    headers: {},
    config: { headers: new AxiosHeaders() },
  } as AxiosResponse;
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, response);
}

describe("getUserFriendlyError — Frontend tipado desde el contrato", () => {
  it("muestra el detail de un ApiProblem (tipo generado desde el contrato)", () => {
    const problem: ApiProblem = {
      type: "/errors/email-already-exists",
      title: "Conflict",
      status: 409,
      detail: "El correo ya está registrado: ana@clinica.test",
      timestamp: "2026-09-29T12:00:00Z",
    };

    expect(getUserFriendlyError(axiosErrorWith(problem))).toBe(
      "El correo ya está registrado: ana@clinica.test",
    );
  });

  it.each([
    ["detail no textual", { detail: 42 }],
    ["cuerpo null", null],
    ["HTML de un proxy", "<html><body>502 Bad Gateway</body></html>"],
    ["objeto sin detail", { message: "algo" }],
  ])("con %s muestra el mensaje genérico", (_caso, data) => {
    expect(getUserFriendlyError(axiosErrorWith(data))).toBe(GENERIC);
  });

  it("sin respuesta (error de red) muestra el mensaje genérico", () => {
    expect(getUserFriendlyError(new AxiosError("Network Error", "ERR_NETWORK"))).toBe(GENERIC);
  });

  it("un error que no es de Axios muestra el mensaje genérico", () => {
    expect(getUserFriendlyError(new Error("boom"))).toBe(GENERIC);
  });
});
