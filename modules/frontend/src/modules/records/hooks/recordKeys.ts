/** Query keys del módulo records (docs/frontend.md §2.2): la clave incluye todo lo que cambia la respuesta. */
export const recordKeys = {
  all: ["records"] as const,
  lists: () => [...recordKeys.all, "list"] as const,
  list: (params: { q: string; page: number; size: number }) => [...recordKeys.lists(), params] as const,
  details: () => [...recordKeys.all, "detail"] as const,
  detail: (id: number) => [...recordKeys.details(), id] as const,
  quota: () => [...recordKeys.all, "quota"] as const,
};

/** `type` del 409 por cupo de historias lleno. */
export const RECORD_QUOTA_REACHED_TYPE = "/errors/record-quota-reached";

/** Tamaño de página del listado (el backend recorta a 100 como máximo). */
export const RECORDS_PAGE_SIZE = 20;

/** `type` del 409 por edición concurrente. */
export const STALE_RECORD_TYPE = "/errors/stale-record";

/** `type` del 409 por un número de historia que ya tiene otra historia. */
export const RECORD_NUMBER_TAKEN_TYPE = "/errors/record-number-taken";

/** `type` del 409 al cambiar datos del paciente fijados al imprimir. */
export const PATIENT_LOCKED_TYPE = "/errors/patient-locked";
