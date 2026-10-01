import { useEffect } from "react";
import { refreshSession } from "@/modules/core/config/httpClient";
import { useSessionStore, type SessionStatus } from "@/store/useSessionStore";

/**
 * Restaura la sesión al montar la app: intenta un refresh (la cookie HttpOnly
 * viaja sola). Usa el `refreshSession` single-flight compartido, de modo que el
 * doble montaje de StrictMode o un refresh simultáneo del interceptor no disparan
 * dos peticiones a la vez. Si hay sesión vigente → autenticado; si no → limpia.
 * Devuelve el `status` para mostrar un splash mientras resuelve.
 */
export function useSessionBootstrap(): SessionStatus {
  const status = useSessionStore((s) => s.status);
  const setStatus = useSessionStore((s) => s.setStatus);
  const clear = useSessionStore((s) => s.clear);

  useEffect(() => {
    setStatus("loading");
    refreshSession().catch(() => clear());
  }, [setStatus, clear]);

  return status;
}
