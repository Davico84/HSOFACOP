/** Query keys del módulo records (docs/frontend.md §2.2): la clave incluye todo lo que cambia la respuesta. */
export const recordKeys = {
  all: ["records"] as const,
  lists: () => [...recordKeys.all, "list"] as const,
  list: (params: { q: string; page: number; size: number }) => [...recordKeys.lists(), params] as const,
  details: () => [...recordKeys.all, "detail"] as const,
  detail: (id: number) => [...recordKeys.details(), id] as const,
};

/** Tamaño de página del listado (el backend recorta a 100 como máximo). */
export const RECORDS_PAGE_SIZE = 20;

/** `type` del 409 por edición concurrente. */
export const STALE_RECORD_TYPE = "/errors/stale-record";
