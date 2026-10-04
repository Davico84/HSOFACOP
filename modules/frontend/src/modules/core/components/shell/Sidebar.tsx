import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { project } from "@/config/project";
import { Logo } from "@/modules/core/ui/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/modules/core/ui/tooltip";
import { cn } from "@/modules/core/utils/cn";
import { NavItem } from "./NavItem";
import { navItemsFor } from "./navItems";
import type { Role } from "@/store/useSessionStore";
import { SidebarLogoutButton } from "./SidebarLogoutButton";

export const SIDEBAR_ID = "app-sidebar";

interface SidebarProps {
  /**
   * `rail`: fija; solo iconos en tablet y, en escritorio, expandida o contraída (`collapsed`).
   * `drawer`: contenido del cajón móvil, siempre expandida.
   */
  variant: "rail" | "drawer";
  /** Rol del usuario: solo se pintan las secciones que puede ver. */
  role: Role;
  onLogout: () => void;
  isLoggingOut: boolean;
  onNavigate?: () => void;
  /** Solo `rail`: barra contraída a solo íconos también en escritorio (preferencia del usuario). */
  collapsed?: boolean;
  /** Solo `rail`: alterna la preferencia (botón visible desde `lg`). */
  onToggleCollapsed?: () => void;
  className?: string;
}

/**
 * Barra lateral del shell: logo, navegación filtrada por rol (`navItemsFor`) y cierre de sesión al
 * pie. En escritorio se puede contraer a solo íconos (con el ícono de la marca en lugar del logo).
 */
export function Sidebar({ variant, role, onLogout, isLoggingOut, onNavigate, collapsed = false, onToggleCollapsed, className }: SidebarProps) {
  const rail = variant === "rail";
  const iconOnly = rail ? (collapsed ? "always" : "below-lg") : undefined;
  const toggleLabel = collapsed ? "Expandir barra lateral" : "Contraer barra lateral";
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <aside
      id={rail ? SIDEBAR_ID : undefined}
      className={cn(
        "flex h-full flex-col gap-6 overflow-x-hidden border-r border-border bg-card px-3 py-4",
        "transition-[width] duration-200 motion-reduce:transition-none",
        rail ? (collapsed ? "w-16" : "w-16 lg:w-60") : "w-64",
        className,
      )}
    >
      {/* Cabecera: en tablet no se muestra (barra de íconos); en escritorio, logo o ícono de marca + botón. */}
      <div
        className={cn(
          "flex items-center gap-2",
          rail && "hidden lg:flex",
          collapsed ? "flex-col" : "h-10 justify-between px-2",
        )}
      >
        {collapsed ? (
          <img src={project.brand.favicon} alt={project.name} className="size-8" />
        ) : (
          <Logo className="h-9 w-auto min-w-0" />
        )}
        {rail && onToggleCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onToggleCollapsed}
                aria-label={toggleLabel}
                aria-describedby={undefined}
                aria-expanded={!collapsed}
                aria-controls={SIDEBAR_ID}
                className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ToggleIcon className="size-4" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{toggleLabel}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
      <nav aria-label="Navegación principal" className="flex flex-col gap-1">
        {navItemsFor(role).map((item) => (
          <NavItem key={item.to} item={item} iconOnly={iconOnly} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="mt-auto border-t border-border pt-4">
        <SidebarLogoutButton onLogout={onLogout} isLoggingOut={isLoggingOut} iconOnly={iconOnly} />
      </div>
    </aside>
  );
}
