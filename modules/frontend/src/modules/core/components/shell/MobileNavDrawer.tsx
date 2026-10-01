import { useEffect, useRef } from "react";
import { Sidebar } from "./Sidebar";
import { MOBILE_NAV_ID } from "./navItems";
import type { Role } from "@/store/useSessionStore";

interface MobileNavDrawerProps {
  role: Role;
  onClose: () => void;
  onLogout: () => void;
  isLoggingOut: boolean;
}

/**
 * Cajón de navegación móvil (se monta solo mientras está abierto). Se cierra al
 * navegar, con `Escape` o pulsando el fondo. Al abrir, lleva el foco al primer enlace.
 */
export function MobileNavDrawer({ role, onClose, onLogout, isLoggingOut }: MobileNavDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 sm:hidden">
      <button
        type="button"
        tabIndex={-1}
        aria-label="Cerrar menú de navegación"
        className="absolute inset-0 bg-foreground/40"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        id={MOBILE_NAV_ID}
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className="relative h-full w-fit shadow-lg"
      >
        <Sidebar variant="drawer" role={role} onNavigate={onClose} onLogout={onLogout} isLoggingOut={isLoggingOut} />
      </div>
    </div>
  );
}
