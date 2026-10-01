import { Button } from "@/modules/core/ui/button";
import { getUserFriendlyError } from "@/modules/core/utils/apiError";

interface RecordLoadErrorProps {
  error: unknown;
  onRetry: () => void;
}

/** No se pudo cargar la historia (error de red o del servidor que no es 404). */
export function RecordLoadError({ error, onRetry }: RecordLoadErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3">
      <p className="text-destructive">{getUserFriendlyError(error)}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}
