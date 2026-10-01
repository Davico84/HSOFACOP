/** Query keys del módulo users (docs/frontend.md §2.2): la clave incluye todo lo que cambia la respuesta. */
export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params: { page: number; size: number }) => [...userKeys.lists(), params] as const,
};

/** Tamaño de página del listado (el backend recorta a 100 como máximo). */
export const USERS_PAGE_SIZE = 20;
