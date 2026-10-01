import { TriangleAlert } from "lucide-react";
import { Button } from "@/modules/core/ui/button";

interface StaleRecordBannerProps {
  reloading: boolean;
  /** Recarga la historia del servidor y descarta lo escrito aquí. */
  onReload: () => void;
  /** Cierra el aviso para seguir editando (p. ej. copiar lo escrito antes de recargar). */
  onDismiss: () => void;
}

/** La historia cambió en otra sesión desde que se abrió (409): no se sobrescribe en silencio. */
export function StaleRecordBanner({ reloading, onReload, onDismiss }: StaleRecordBannerProps) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-md border border-warning bg-warning/10 p-4 sm:flex-row sm:items-center">
      <TriangleAlert className="size-5 shrink-0 text-warning" aria-hidden="true" />
      <p className="flex-1 text-sm">
        La historia cambió desde que la abriste (otra pestaña u otro usuario). Tus cambios no se guardaron.
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={onDismiss}>
          Seguir editando
        </Button>
        <Button size="sm" onClick={onReload} disabled={reloading}>
          Recargar historia
        </Button>
      </div>
    </div>
  );
}
