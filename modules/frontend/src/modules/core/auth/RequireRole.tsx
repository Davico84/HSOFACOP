import { Outlet } from "react-router-dom";
import { useSessionStore, type Role } from "@/store/useSessionStore";
import { AccessDenied } from "./AccessDenied";

interface RequireRoleProps {
  roles: readonly Role[];
}

/**
 * Guard de rol DENTRO del shell (bajo `RequireAuth` → `AppLayout`): con un rol permitido
 * renderiza la sección y sus subrutas; si no, el acceso denegado integrado (sin otro `<main>`).
 * Solo evalúa con la sesión autenticada: nunca muestra "Acceso denegado" por un estado
 * transitorio (el bootstrap lo cubre `RootLayout`). Las queries de la sección viven en sus
 * hijos, así que sin permiso no se montan ni piden datos.
 */
export function RequireRole({ roles }: RequireRoleProps) {
  const status = useSessionStore((s) => s.status);
  const user = useSessionStore((s) => s.user);

  if (status !== "authenticated" || !user) return null;
  if (!roles.includes(user.role)) return <AccessDenied embedded />;
  return <Outlet />;
}
