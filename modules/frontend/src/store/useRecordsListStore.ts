import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { PATHS } from "@/routes/paths";

interface RecordsListState {
  /** Última URL del listado de historias (con búsqueda y página) vista en esta pestaña. */
  listUrl: string | null;
  /** Cuenta que la vio: otra cuenta en la misma pestaña no la hereda. */
  userId: number | null;
  setListUrl: (listUrl: string, userId: number) => void;
  clear: () => void;
}

/** Solo rutas del listado (`/historias` o `/historias?…`): el valor viene de `sessionStorage`. */
export function isRecordsListUrl(url: string): boolean {
  return url === PATHS.RECORDS || url.startsWith(`${PATHS.RECORDS}?`);
}

/**
 * Listado al que vuelve "← Historias clínicas" desde una historia. En `sessionStorage`: por
 * pestaña y sobrevive a recargar. Si el almacenamiento no está disponible, queda en memoria.
 */
export const useRecordsListStore = create<RecordsListState>()(
  persist(
    (set) => ({
      listUrl: null,
      userId: null,
      setListUrl: (listUrl, userId) => {
        if (isRecordsListUrl(listUrl)) set({ listUrl, userId });
      },
      clear: () => set({ listUrl: null, userId: null }),
    }),
    { name: "hsfacop.records-list", storage: createJSONStorage(() => sessionStorage) },
  ),
);
