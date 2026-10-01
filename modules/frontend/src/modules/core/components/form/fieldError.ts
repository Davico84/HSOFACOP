import { get, type FieldErrors, type FieldValues } from "react-hook-form";

/** Mensaje de error de un campo (también anidado: `content.facial.facialType`). */
export function fieldError<T extends FieldValues>(errors: FieldErrors<T>, name: string): string | undefined {
  const error: unknown = get(errors, name);
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return undefined;
}

/** id de DOM estable a partir del nombre del campo (`content.facial.facialType` → `f-content-facial-facialType`). */
export function fieldId(name: string): string {
  return `f-${name.replace(/[^\w-]/g, "-")}`;
}
