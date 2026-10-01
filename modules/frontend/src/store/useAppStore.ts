import { create } from "zustand";

// Store de cliente base (scaffolding). Cada capacidad añadirá sus propios stores.
interface AppState {
  ready: boolean;
  setReady: (ready: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  ready: false,
  setReady: (ready) => set({ ready }),
}));
