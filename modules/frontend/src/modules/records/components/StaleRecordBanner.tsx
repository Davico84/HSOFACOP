import { useEffect, useRef } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/modules/core/ui/button";

/** `save`: el servidor rechazó un guardado (409). `remote`: se vio al volver, antes de guardar. */
export type StaleReason = "save" | "remote";

interface StaleRecordBannerProps {
  reason: StaleReason;
  reloading: boolean;
  /** Recarga la historia del servidor y descarta lo escrito aquí. */
  onReload: () => void;
  /** Cierra el aviso para seguir editando (p. ej. copiar lo escrito antes de recargar). */
  onDismiss: () => void;
}

const MESSAGES: Record<StaleReason, string> = {
  save: "La historia cambió desde que la abriste (otra pestaña u otro usuario). Tus cambios no se guardaron.",
  remote:
    "La historia cambió en otro dispositivo mientras tenías cambios sin guardar aquí. Recárgala para ver la versión actual (perderás lo escrito aquí) o sigue editando para copiarlo.",
};

/**
 * La historia cambió en otra sesión desde que se abrió: no se sobrescribe en silencio. Al aparecer
 * lleva la vista hasta el aviso (se puede estar editando al final del formulario) y le da el foco,
 * así el siguiente Tab llega a sus botones.
 */
export function StaleRecordBanner({ reason, reloading, onReload, onDismiss }: StaleRecordBannerProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    ref.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    ref.current?.focus({ preventScroll: true });
  }, [reason]);
  return (
    <div ref={ref} tabIndex={-1} role="alert" className="flex outline-none flex-col gap-3 rounded-md border border-warning bg-warning/10 p-4 sm:flex-row sm:items-center">
      <TriangleAlert className="size-5 shrink-0 text-warning" aria-hidden="true" />
      <p className="flex-1 text-sm">{MESSAGES[reason]}</p>
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
