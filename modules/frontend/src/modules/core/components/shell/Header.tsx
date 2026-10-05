import { Menu, X } from "lucide-react";
import { Button } from "@/modules/core/ui/button";
import { ThemeToggle } from "@/modules/core/ui/theme-toggle";
import { roleLabel } from "@/modules/core/auth/roleLabel";
import type { SessionUser } from "@/store/useSessionStore";
import { MOBILE_NAV_ID } from "./navItems";

interface HeaderProps {
  user: SessionUser;
  onMenuClick: () => void;
  menuOpen: boolean;
}

/**
 * Cabecera del shell: menú (solo móvil), identidad y tema. El cierre de sesión
 * vive al pie de la barra lateral.
 */
export function Header({ user, onMenuClick, menuOpen }: HeaderProps) {
  const MenuIcon = menuOpen ? X : Menu;
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
      {/* El borde y el fondo van a todo el ancho; el contenido se alinea al ancho máximo del <main>. */}
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={onMenuClick}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
          aria-controls={MOBILE_NAV_ID}
        >
          <MenuIcon className="size-5" aria-hidden="true" />
        </Button>

        <div className="ml-auto flex min-w-0 items-center gap-3">
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-medium leading-tight">{user.fullName ?? user.email}</p>
            <p className="text-xs text-muted-foreground">{roleLabel(user.role)}</p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
