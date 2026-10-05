import { Check, CircleAlert, Loader2 } from "lucide-react";
import { Button } from "@/modules/core/ui/button";
import type { AutosaveStatus } from "../hooks/useAutosave";

interface RecordSaveStatusProps {
  status: AutosaveStatus;
  /** Hay cambios sin guardar. */
  dirty: boolean;
  /** Ya se guardó algo en esta pantalla (para mostrar "Guardado"). */
  savedOnce: boolean;
  onRetry: () => void;
}

/**
 * Estado del guardado junto al título: "Guardando…", "Guardado", "Cambios sin guardar", o por
 * qué no se guardó. `aria-live` lo anuncia sin interrumpir.
 */
export function RecordSaveStatus({ status, dirty, savedOnce, onRetry }: RecordSaveStatusProps) {
  let content = null;
  if (status === "saving") {
    content = (
      <>
        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Guardando…
      </>
    );
  } else if (dirty && status === "invalid") {
    content = (
      <span className="inline-flex items-center gap-1.5 text-destructive">
        <CircleAlert className="size-3.5" aria-hidden="true" /> Sin guardar: corrige los campos marcados
      </span>
    );
  } else if (dirty && status === "failed") {
    content = (
      <>
        <span className="inline-flex items-center gap-1.5 text-destructive">
          <CircleAlert className="size-3.5" aria-hidden="true" /> No se pudo guardar
        </span>
        <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={onRetry}>
          Reintentar
        </Button>
      </>
    );
  } else if (dirty) {
    content = "Cambios sin guardar";
  } else if (savedOnce) {
    content = (
      <>
        <Check className="size-3.5" aria-hidden="true" /> Guardado
      </>
    );
  }
  return (
    <p aria-live="polite" className="flex min-h-5 items-center gap-1.5 text-sm text-muted-foreground">
      {content}
    </p>
  );
}
