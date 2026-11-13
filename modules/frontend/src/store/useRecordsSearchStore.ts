import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface RecordsSearchState {
  /** Texto buscado en el listado de historias. Puede ser el nombre o el documento de un paciente. */
  text: string;
  /** Cuenta que lo escribió: otra cuenta en la misma pestaña no lo hereda. */
  userId: number | null;
  setText: (text: string, userId: number) => void;
  clear: () => void;
}

/**
 * Búsqueda del listado de historias, solo en esta pestaña (`sessionStorage`, clave aparte de la URL
 * guardada del listado). El texto no va en la dirección del navegador ni en la URL de la API: la
 * dirección la ve el sitio estático en cada recarga y la URL queda en los registros de acceso.
 * Se borra al cerrar sesión.
 */
export const useRecordsSearchStore = create<RecordsSearchState>()(
  persist(
    (set) => ({
      text: "",
      userId: null,
      setText: (text, userId) => set({ text, userId }),
      clear: () => set({ text: "", userId: null }),
    }),
    { name: "hsfacop.records-search", storage: createJSONStorage(() => sessionStorage) },
  ),
);
