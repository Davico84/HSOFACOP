import { AxiosError } from "axios";
import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";

import type { ApiProblem, FieldProblem } from "@/modules/core/services/generated/model";

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

/** `type` del problema (`/errors/<slug>`) si el error es un `ApiProblem`; si no, `null`. */
export function problemType(error: unknown): string | null {
  if (!(error instanceof AxiosError)) return null;
  const data: unknown = error.response?.data;
  return isApiProblem(data) && typeof data.type === "string" ? data.type : null;
}

/** Los `errors[{field, message}]` de un `400` de validación; `[]` si no los trae (p. ej. JSON malformado). */
export function getFieldErrors(error: unknown): FieldProblem[] {
  if (!(error instanceof AxiosError) || error.response?.status !== 400) return [];
  const data = error.response.data as { errors?: unknown };
  if (!Array.isArray(data?.errors)) return [];
  return data.errors.filter(
    (e): e is FieldProblem =>
      typeof e === "object" && e !== null && typeof (e as FieldProblem).field === "string" &&
      typeof (e as FieldProblem).message === "string",
  );
}

/**
 * Vuelca los errores de validación del servidor sobre los campos de react-hook-form (el servidor
 * es la autoridad). Las rutas con índice (`items[1]`) se pasan a la notación de RHF (`items.1`).
 * Devuelve cuántos campos marcó: 0 = no había errores por campo (mostrar un aviso general).
 */
export function applyServerFieldErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>): number {
  const fields = getFieldErrors(error);
  fields.forEach(({ field, message }, i) => {
    const path = field.replace(/\[(\d+)\]/g, ".$1") as FieldPath<T>;
    setError(path, { type: "server", message }, { shouldFocus: i === 0 });
  });
  return fields.length;
}
