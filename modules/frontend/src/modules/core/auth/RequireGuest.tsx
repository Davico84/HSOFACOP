import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSessionStore } from "@/store/useSessionStore";
import { roleHome } from "./roleHome";

/**
 * Guard de rutas de solo-invitado (`/auth`): si ya hay sesión, redirige al
 * panel (a la ruta `next` original si venía de un guard, o al inicio por rol).
 */
export function RequireGuest() {
  const status = useSessionStore((s) => s.status);
  const user = useSessionStore((s) => s.user);
  const location = useLocation();

  if (status === "authenticated" && user) {
    const next = (location.state as { next?: string } | null)?.next;
    return <Navigate to={next ?? roleHome(user.role)} replace />;
  }
  return <Outlet />;
}
