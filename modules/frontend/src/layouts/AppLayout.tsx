import { useCallback, useState } from "react";
import { Outlet } from "react-router-dom";
import { useLogout } from "@/modules/auth/hooks/useAuth";
import { Header } from "@/modules/core/components/shell/Header";
import { MobileNavDrawer } from "@/modules/core/components/shell/MobileNavDrawer";
import { Sidebar } from "@/modules/core/components/shell/Sidebar";
import { useSessionStore } from "@/store/useSessionStore";

/**
 * Shell de la zona privada (anidado bajo `RequireAuth`): sidebar + cabecera +
 * contenido. Conecta la sesión y el logout de `modules/auth` con los componentes
 * de `core`, que no pueden depender de otros módulos.
 */
export function AppLayout() {
  const user = useSessionStore((s) => s.user);
  const logout = useLogout();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // RequireAuth garantiza la sesión; esto solo satisface el tipo.
  if (!user) return null;

  const onLogout = () => logout.mutate();

  return (
    <div className="flex min-h-screen">
      <Sidebar
        variant="rail"
        role={user.role}
        onLogout={onLogout}
        isLoggingOut={logout.isPending}
        className="sticky top-0 hidden h-screen sm:flex"
      />
      {menuOpen ? (
        <MobileNavDrawer role={user.role} onClose={closeMenu} onLogout={onLogout} isLoggingOut={logout.isPending} />
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} onMenuClick={() => setMenuOpen((open) => !open)} menuOpen={menuOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
