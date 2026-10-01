import { Logo } from "@/modules/core/ui/logo";
import { cn } from "@/modules/core/utils/cn";
import { NavItem } from "./NavItem";
import { navItemsFor } from "./navItems";
import type { Role } from "@/store/useSessionStore";
import { SidebarLogoutButton } from "./SidebarLogoutButton";

interface SidebarProps {
  /**
   * `rail`: fija; solo iconos en tablet y expandida en escritorio.
   * `drawer`: contenido del cajón móvil, siempre expandida.
   */
  variant: "rail" | "drawer";
  /** Rol del usuario: solo se pintan las secciones que puede ver. */
  role: Role;
  onLogout: () => void;
  isLoggingOut: boolean;
  onNavigate?: () => void;
  className?: string;
}

/** Barra lateral del shell: logo, navegación filtrada por rol (`navItemsFor`) y cierre de sesión al pie. */
export function Sidebar({ variant, role, onLogout, isLoggingOut, onNavigate, className }: SidebarProps) {
  const compact = variant === "rail";
  return (
    <aside
      className={cn(
        "flex h-full flex-col gap-6 border-r border-border bg-card px-3 py-4",
        compact ? "w-16 lg:w-60" : "w-64",
        className,
      )}
    >
      <div className={cn("flex h-10 items-center px-2", compact && "hidden lg:flex")}>
        <Logo className="h-9 w-auto" />
      </div>
      <nav aria-label="Navegación principal" className="flex flex-col gap-1">
        {navItemsFor(role).map((item) => (
          <NavItem key={item.to} item={item} compact={compact} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="mt-auto border-t border-border pt-4">
        <SidebarLogoutButton onLogout={onLogout} isLoggingOut={isLoggingOut} compact={compact} />
      </div>
    </aside>
  );
}
