import { Button } from "@/modules/core/ui/button";
import { getUserFriendlyError } from "@/modules/core/utils/apiError";

interface DashboardErrorProps {
  error: unknown;
  onRetry: () => void;
}

/** Las métricas no se pudieron cargar: mensaje y "Reintentar". */
export function DashboardError({ error, onRetry }: DashboardErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <p className="text-destructive">{getUserFriendlyError(error)}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}
