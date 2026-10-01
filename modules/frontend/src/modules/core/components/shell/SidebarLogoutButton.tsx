import { LogOut } from "lucide-react";
import { cn } from "@/modules/core/utils/cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/modules/core/ui/tooltip";

interface SidebarLogoutButtonProps {
  onLogout: () => void;
  isLoggingOut: boolean;
  /** Barra compacta (tablet): solo icono; la etiqueta queda para lectores de pantalla. */
  compact?: boolean;
}

/**
 * Acción de cerrar sesión al pie de la barra lateral (mismo aspecto que un ítem de navegación).
 * En la barra compacta muestra "Cerrar sesión" en un tooltip solo visual (ver NavItem).
 */
export function SidebarLogoutButton({ onLogout, isLoggingOut, compact = false }: SidebarLogoutButtonProps) {
  const button = (
    <button
      type="button"
      onClick={onLogout}
      disabled={isLoggingOut}
      aria-label="Cerrar sesión"
      aria-describedby={undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors",
        "hover:bg-destructive/10 hover:text-destructive",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        compact && "justify-center lg:justify-start",
      )}
    >
      <LogOut className="size-5 shrink-0" aria-hidden="true" />
      <span className={cn(compact && "sr-only lg:not-sr-only")}>
        {isLoggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
      </span>
    </button>
  );
  if (!compact) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="right" className="lg:hidden">
        Cerrar sesión
      </TooltipContent>
    </Tooltip>
  );
}
