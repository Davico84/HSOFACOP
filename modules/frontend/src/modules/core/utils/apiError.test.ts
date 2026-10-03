import { describe, it, expect, vi } from "vitest";
import { AxiosError, AxiosHeaders, type AxiosResponse } from "axios";
import type { ApiProblem } from "@/modules/core/services/generated/model";
import { applyServerFieldErrors, getFieldErrors, getUserFriendlyError, problemType } from "./apiError";

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

describe("apiError — errores de validación del servidor sobre los campos", () => {
  const validation400 = () =>
    new AxiosError("bad", "ERR_BAD_REQUEST", undefined, undefined, {
      status: 400,
      data: {
        type: "/errors/validation-error",
        detail: "Uno o más campos son inválidos.",
        errors: [
          { field: "documentNumber", message: "El DNI debe tener 8 dígitos." },
          { field: "content.functional.bruxismTeeth[1]", message: "Pieza dental inválida." },
        ],
      },
    } as never);

  it("getFieldErrors y problemType leen el ApiProblem", () => {
    expect(getFieldErrors(validation400())).toHaveLength(2);
    expect(problemType(validation400())).toBe("/errors/validation-error");
    expect(getFieldErrors(new Error("x"))).toEqual([]);
  });

  it("applyServerFieldErrors marca cada campo (índices en notación de react-hook-form)", () => {
    const setError = vi.fn();
    expect(applyServerFieldErrors(validation400(), setError)).toBe(2);
    expect(setError).toHaveBeenCalledWith("documentNumber", { type: "server", message: "El DNI debe tener 8 dígitos." }, { shouldFocus: true });
    expect(setError).toHaveBeenCalledWith("content.functional.bruxismTeeth.1", { type: "server", message: "Pieza dental inválida." }, { shouldFocus: false });
  });
});
