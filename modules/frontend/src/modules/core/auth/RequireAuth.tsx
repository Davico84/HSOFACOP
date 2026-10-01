import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSessionStore, type Role } from "@/store/useSessionStore";
import { PATHS } from "@/routes/paths";
import { AccessDenied } from "./AccessDenied";

interface RequireAuthProps {
  /** Si se indica, solo estos roles pueden entrar; el resto ve acceso denegado. */
  roles?: Role[];
}

/**
 * Guard de rutas privadas: sin sesión → redirige a login (guardando la ruta
 * destino); con sesión pero rol sin permiso → acceso denegado.
 */
export function RequireAuth({ roles }: RequireAuthProps) {
  const status = useSessionStore((s) => s.status);
  const user = useSessionStore((s) => s.user);
  const location = useLocation();

  if (status !== "authenticated" || !user) {
    return <Navigate to={PATHS.LOGIN} state={{ next: location.pathname }} replace />;
  }
  if (roles && !roles.includes(user.role)) {
    return <AccessDenied />;
  }
  return <Outlet />;
}
