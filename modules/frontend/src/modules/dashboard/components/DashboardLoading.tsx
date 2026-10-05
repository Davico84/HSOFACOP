import { Loader2 } from "lucide-react";

/** Mientras se calculan las métricas de Inicio. */
export function DashboardLoading() {
  return (
    <p className="flex items-center gap-2 text-muted-foreground" role="status">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Cargando métricas…
    </p>
  );
}
