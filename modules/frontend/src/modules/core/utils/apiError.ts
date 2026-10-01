import { AxiosError } from "axios";

import type { ApiProblem } from "@/modules/core/services/generated/model";

const GENERIC_ERROR = "Ocurrió un error inesperado. Inténtalo de nuevo.";

/**
 * ¿El cuerpo es un error de la API (RFC 9457, tipo `ApiProblem` generado desde el
 * contrato)? Solo exige un `detail` de texto: un error parcial de un proxy o un HTML
 * degradan al mensaje genérico en vez de romper.
 */
function isApiProblem(value: unknown): value is ApiProblem {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { detail?: unknown }).detail === "string"
  );
}

/** `type` del error de cuenta deshabilitada por un administrador (login y refresh). */
export const ACCOUNT_DISABLED_TYPE = "/errors/account-disabled";

/** Si el error es "cuenta deshabilitada", su mensaje (para avisar al cerrar la sesión); si no, `null`. */
export function accountDisabledMessage(error: unknown): string | null {
  if (!(error instanceof AxiosError)) return null;
  const data: unknown = error.response?.data;
  return isApiProblem(data) && data.type === ACCOUNT_DISABLED_TYPE ? data.detail : null;
}

/**
 * Extrae un mensaje legible del error. El backend responde `ApiProblem`: usamos su
 * `detail` (en español, apto para el usuario). Si no aplica, un mensaje genérico.
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof AxiosError) {
    const data: unknown = error.response?.data;
    if (isApiProblem(data)) return data.detail;
  }
  return GENERIC_ERROR;
}
