import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SidebarState {
  /** Barra lateral contraída a solo íconos en escritorio (preferencia del usuario). */
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

/**
 * Preferencia de la barra lateral, recordada en el navegador. Si el almacenamiento no está
 * disponible (modo privado estricto o bloqueado), `persist` no falla y queda en memoria.
 * Es global: ninguna pantalla la cambia por su cuenta.
 */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
    }),
    { name: "hsfacop.sidebar", storage: createJSONStorage(() => localStorage) },
  ),
);
